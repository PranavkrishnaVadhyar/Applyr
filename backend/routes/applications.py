from fastapi import APIRouter, HTTPException, Depends
from uuid import UUID, uuid4
from typing import List
from starlette.concurrency import run_in_threadpool
from db.database import get_supabase
from supabase import Client
from schemas.applications import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
    ExtensionExtractionRequest
)
from core.application_mgmt import extract_application_fields, create_application as core_create_application
from core.security import get_current_user

router = APIRouter()


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
