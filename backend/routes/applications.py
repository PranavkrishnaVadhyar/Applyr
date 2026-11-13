from fastapi import APIRouter, HTTPException, Depends
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import List
import logging
from starlette.concurrency import run_in_threadpool
from db.database import get_supabase
from supabase import Client
from postgrest.exceptions import APIError
from schemas.applications import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
    ExtensionExtractionRequest,
    ApplicationDraft,
    ApplicationExtract,
)
from core.application_mgmt import ExtractionConfigurationError, extract_application_fields, create_application as core_create_application
from core.security import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


def owned_application(db, application_id, user_id):
    rows = db.table("applications").select("*").eq("id", str(application_id)).eq("user_id", str(user_id)).limit(1).execute().data
    if not rows:
        raise HTTPException(404, "Application not found")
    return rows[0]


@router.get("/owned", response_model=List[ApplicationResponse])
def list_owned(current_user: UUID = Depends(get_current_user), supabase: Client = Depends(get_supabase)):
    def query(column):
        return supabase.table("applications").select("*").eq("user_id", str(current_user)).order(column, desc=True).execute().data

    try:
        return query("created_at")
    except APIError as error:
        # Older deployed schemas have applied_at but no creation timestamp.
        # Retry only this known schema mismatch, retaining the owner filter.
        if error.code != "42703" or "applications.created_at" not in error.message:
            raise
        return query("applied_at")


@router.put("/drafts/{application_id}", response_model=ApplicationResponse)
def save_draft(application_id: UUID, payload: ApplicationDraft,
               current_user: UUID = Depends(get_current_user), supabase: Client = Depends(get_supabase)):
    resume = supabase.table("resumes").select("id, filename").eq("id", str(payload.resume_id)).eq("user_id", str(current_user)).limit(1).execute().data if payload.resume_id else []
    if payload.resume_id and not resume:
        raise HTTPException(404, "Resume not found")
    if payload.answers and not payload.resume_id:
        raise HTTPException(422, "Select a resume before saving answers")
    existing = supabase.table("applications").select("*").eq("id", str(application_id)).eq("user_id", str(current_user)).limit(1).execute().data
    if existing and existing[0]["status"] != "draft":
        raise HTTPException(409, "Submitted applications cannot be overwritten by a draft")
    data = {"resume_id": str(payload.resume_id) if payload.resume_id else None, "job_role": payload.job_role,
            "company_name": payload.company_name, "job_description": payload.job_description,
            "status": "draft", "applied_at": None,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "response": {"version": 1, "job_url": str(payload.job_url),
                         "resume_filename": resume[0].get("filename") if resume else None,
                         "answers": [answer.model_dump(mode="json", exclude_none=True) for answer in payload.answers]}}
    for key in ("company_description", "final_date"):
        if key in payload.model_fields_set:
            data[key] = payload.model_dump(mode="json")[key]
    if existing:
        result = supabase.table("applications").update(data).eq("id", str(application_id)).eq("user_id", str(current_user)).eq("status", "draft").execute()
    else:
        try:
            result = supabase.table("applications").insert({**data, "id": str(application_id), "user_id": str(current_user)}).execute()
        except Exception:
            # A retry uses the same UUID. Never create another record after an uncertain write.
            raise HTTPException(409, "Could not create draft. Refresh saved applications before retrying.")
    if not result.data:
        raise HTTPException(409, "Application changed. Reload before saving.")
    return result.data[0]


@router.post("/{application_id}/confirm-submission", response_model=ApplicationResponse)
def confirm_submission(application_id: UUID, current_user: UUID = Depends(get_current_user),
                       supabase: Client = Depends(get_supabase)):
    existing = owned_application(supabase, application_id, current_user)
    if existing["status"] != "draft":
        return existing
    if not existing.get("resume_id"):
        raise HTTPException(409, "Save a draft with a selected resume first")
    now = datetime.now(timezone.utc).isoformat()
    result = supabase.table("applications").update({"status": "applied", "applied_at": now, "updated_at": now}).eq("id", str(application_id)).eq("user_id", str(current_user)).eq("status", "draft").execute()
    return result.data[0] if result.data else owned_application(supabase, application_id, current_user)


def verify_resume_owner(supabase: Client, resume_id: UUID | None, user_id: UUID):
    if resume_id is None:
        return
    result = (supabase.table("resumes").select("id")
              .eq("id", str(resume_id)).eq("user_id", str(user_id)).limit(1).execute())
    if not result.data:
        raise HTTPException(404, "Resume not found")


@router.post("/", response_model=ApplicationResponse)
def create_application(
    payload: ApplicationCreate,
    current_user: UUID = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):

    data = payload.model_dump(mode="json")
    data["id"] = str(uuid4())
    data["user_id"] = str(current_user)
    verify_resume_owner(supabase, payload.resume_id, current_user)

    response = supabase.table("applications").insert(data).execute()

    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create application")

    return response.data[0]


@router.post("/structure", response_model=ApplicationExtract)
async def structure_application(
    payload: ExtensionExtractionRequest,
    current_user: UUID = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    try:
        extracted_data = await extract_application_fields(payload.text)
    except ExtractionConfigurationError:
        logger.error("Job extraction failed: GROQ_API_KEY is not configured")
        raise HTTPException(503, "Job extraction is not configured. Set GROQ_API_KEY on the backend and restart it.") from None
    except Exception as error:
        # Provider exceptions can contain prompts and credentials: never log their text.
        status = getattr(error, "status_code", None)
        status = status if isinstance(status, int) else None
        logger.error("Job extraction failed: stage=ai type=%s provider_status=%s", type(error).__name__, status)
        if status in (401, 403):
            detail = "The AI provider rejected the backend credentials. Check the backend Groq configuration."
        elif status == 429:
            detail = "The AI provider is rate-limited or out of quota. Check usage and try again later."
        elif type(error).__name__ in ("OutputParserException", "ValidationError"):
            detail = "The AI response could not be read as job details. Open the full job posting and try again, or enter a draft manually."
        else:
            detail = "The AI extraction service failed. Try again later or enter a draft manually."
        raise HTTPException(502, detail) from None

    return extracted_data


@router.post("/extract", response_model=ApplicationResponse)
async def extract_and_create_application(
    payload: ExtensionExtractionRequest,
    current_user: UUID = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    extracted_data = await structure_application(payload, current_user, supabase)
    try:
        application = await run_in_threadpool(core_create_application,
            user_id=current_user,
            supabase=supabase,
            extracted=extracted_data
        )
        return application
    except Exception as error:
        code = getattr(error, "code", None)
        code = code if isinstance(code, str) and code.isalnum() and len(code) <= 12 else None
        logger.error("Job extraction failed: stage=database type=%s code=%s", type(error).__name__, code)
        raise HTTPException(502, "Job details were extracted, but saving failed. Check the application tracker before retrying; the save may have completed. Ask the backend operator to check the database error code.") from None


# ✅ READ ALL (for a user)
@router.get("/user/{user_id}", response_model=List[ApplicationResponse])
def get_user_applications(
    user_id: UUID,
    current_user: UUID = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized to access these applications")

    response = (
        supabase
        .table("applications")
        .select("*")
        .eq("user_id", str(user_id))
        .order("applied_at", desc=True)
        .execute()
    )

    return response.data


# ✅ READ ONE
@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: UUID,
    current_user: UUID = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    response = (
        supabase
        .table("applications")
        .select("*")
        .eq("id", str(application_id))
        .eq("user_id", str(current_user)) # Added security check
        .single()
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Application not found")

    return response.data


# ✅ UPDATE
@router.put("/{application_id}", response_model=ApplicationResponse)
def update_application(
    application_id: UUID,
    payload: ApplicationUpdate,
    current_user: UUID = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    update_data = payload.model_dump(exclude_unset=True, mode="json")
    if "status" in update_data or "resume_id" in update_data:
        if "status" in update_data and payload.status is None:
            raise HTTPException(422, "Status cannot be empty")
        existing = owned_application(supabase, application_id, current_user)
        next_status = update_data.get("status", existing["status"])
        if next_status != "draft" and not update_data.get("resume_id", existing.get("resume_id")):
            raise HTTPException(409, "Link a resume before recording a submitted application")
        if "status" in update_data:
            update_data["applied_at"] = None if payload.status == "draft" else (existing.get("applied_at") or datetime.now(timezone.utc).isoformat())
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    verify_resume_owner(supabase, payload.resume_id, current_user)

    response = (
        supabase
        .table("applications")
        .update(update_data)
        .eq("id", str(application_id))
        .eq("user_id", str(current_user)) # Added security check
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Application not found")

    return response.data[0]


# ✅ DELETE
@router.delete("/{application_id}")
def delete_application(
    application_id: UUID,
    current_user: UUID = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    response = (
        supabase
        .table("applications")
        .delete()
        .eq("id", str(application_id))
        .eq("user_id", str(current_user)) # Added security check
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Application not found")

    return {"message": "Application deleted successfully"}
