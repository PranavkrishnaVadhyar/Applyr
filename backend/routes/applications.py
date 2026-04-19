from fastapi import APIRouter, HTTPException, Depends
from uuid import UUID, uuid4
from typing import List
import uuid
from db.database import supabase
from schemas.applications import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
    ExtensionExtractionRequest
)
from core.application_mgmt import extract_application_fields, create_application as core_create_application
from core.security import get_current_user

router = APIRouter()


def serialize_uuid(data: dict):
    for key, value in data.items():
        if isinstance(value, uuid.UUID):
            data[key] = str(value)
    return data


@router.post("/", response_model=ApplicationResponse)
async def create_application(
    payload: ApplicationCreate,
    current_user: UUID = Depends(get_current_user)
):

    data = payload.model_dump(mode="json")
    data["id"] = str(uuid4())
    # Ensure the user_id in the payload matches the current_user if necessary,
    # or override depending on your requirements.
    data["user_id"] = str(current_user)

    response = supabase.table("applications").insert(data).execute()

    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create application")

    return response.data[0]


@router.post("/extract", response_model=ApplicationResponse)
async def extract_and_create_application(payload: ExtensionExtractionRequest):
    try:
        extracted_data = await extract_application_fields(payload.text)
        
        application = await core_create_application(
            user_id=payload.user_id,
            extracted=extracted_data
        )
        return application
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")


# ✅ READ ALL (for a user)
@router.get("/user/{user_id}", response_model=List[ApplicationResponse])
async def get_user_applications(
    user_id: UUID,
    current_user: UUID = Depends(get_current_user)
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
async def get_application(
    application_id: UUID,
    current_user: UUID = Depends(get_current_user)
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
async def update_application(
    application_id: UUID,
    payload: ApplicationUpdate,
    current_user: UUID = Depends(get_current_user)
):
    update_data = payload.model_dump(exclude_unset=True)

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
async def delete_application(
    application_id: UUID,
    current_user: UUID = Depends(get_current_user)
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
