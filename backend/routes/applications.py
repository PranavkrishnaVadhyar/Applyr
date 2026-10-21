from fastapi import APIRouter, HTTPException, Depends
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import List
from starlette.concurrency import run_in_threadpool
from db.database import get_supabase
from supabase import Client
from schemas.applications import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
    ExtensionExtractionRequest,
    ApplicationDraft,
)
from core.application_mgmt import extract_application_fields, create_application as core_create_application
from core.security import get_current_user

router = APIRouter()


def owned_application(db, application_id, user_id):
    rows = db.table("applications").select("*").eq("id", str(application_id)).eq("user_id", str(user_id)).limit(1).execute().data
    if not rows:
        raise HTTPException(404, "Application not found")
    return rows[0]


@router.get("/owned", response_model=List[ApplicationResponse])
def list_owned(current_user: UUID = Depends(get_current_user), supabase: Client = Depends(get_supabase)):
    return supabase.table("applications").select("*").eq("user_id", str(current_user)).order("created_at", desc=True).execute().data


@router.put("/drafts/{application_id}", response_model=ApplicationResponse)
def save_draft(application_id: UUID, payload: ApplicationDraft,
               current_user: UUID = Depends(get_current_user), supabase: Client = Depends(get_supabase)):
    resume = supabase.table("resumes").select("id, filename").eq("id", str(payload.resume_id)).eq("user_id", str(current_user)).limit(1).execute().data
    if not resume:
        raise HTTPException(404, "Resume not found")
    existing = supabase.table("applications").select("*").eq("id", str(application_id)).eq("user_id", str(current_user)).limit(1).execute().data
    if existing and existing[0]["status"] != "draft":
        raise HTTPException(409, "Submitted applications cannot be overwritten by a draft")
    data = {"resume_id": str(payload.resume_id), "job_role": payload.job_role,
            "company_name": payload.company_name, "job_description": payload.job_description,
            "status": "draft", "applied_at": None,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "response": {"version": 1, "job_url": str(payload.job_url),
                         "resume_filename": resume[0].get("filename"),
                         "answers": [answer.model_dump(mode="json") for answer in payload.answers]}}
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


@router.post("/extract", response_model=ApplicationResponse)
async def extract_and_create_application(
    payload: ExtensionExtractionRequest,
    current_user: UUID = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    try:
        extracted_data = await extract_application_fields(payload.text)
        
        application = await run_in_threadpool(core_create_application,
            user_id=current_user,
            supabase=supabase,
            extracted=extracted_data
        )
        return application
    except Exception as e:
        raise HTTPException(status_code=500, detail="Job extraction failed. Please try again.")


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
