from fastapi import APIRouter, HTTPException
from uuid import UUID, uuid4
from typing import List
import uuid
from db.database import supabase
from schemas.applications import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
)

router = APIRouter()


def serialize_uuid(data: dict):
    for key, value in data.items():
        if isinstance(value, uuid.UUID):
            data[key] = str(value)
    return data


@router.post("/", response_model=ApplicationResponse)
async def create_application(payload: ApplicationCreate):

    data = payload.model_dump(mode="json")
    data["id"] = str(uuid4())

    response = supabase.table("applications").insert(data).execute()

    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create application")

    return response.data[0]


# ✅ READ ALL (for a user)
@router.get("/user/{user_id}", response_model=List[ApplicationResponse])
async def get_user_applications(user_id: UUID):
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
async def get_application(application_id: UUID):
    response = (
        supabase
        .table("applications")
        .select("*")
        .eq("id", str(application_id))
        .single()
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Application not found")

    return response.data


# ✅ UPDATE
@router.put("/{application_id}", response_model=ApplicationResponse)
async def update_application(application_id: UUID, payload: ApplicationUpdate):
    update_data = payload.model_dump(exclude_unset=True)

    response = (
        supabase
        .table("applications")
        .update(update_data)
        .eq("id", str(application_id))
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Application not found")

    return response.data[0]


# ✅ DELETE
@router.delete("/{application_id}")
async def delete_application(application_id: UUID):
    response = (
        supabase
        .table("applications")
        .delete()
        .eq("id", str(application_id))
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Application not found")

    return {"message": "Application deleted successfully"}
