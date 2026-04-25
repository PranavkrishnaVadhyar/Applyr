from fastapi import APIRouter, HTTPException, Depends
from uuid import UUID

from db.database import supabase
from core.security import get_current_user
from schemas.users import UserUpdateRequest, UserResponse

user_router = APIRouter()


# ========================================
# GET CURRENT USER DETAILS
# ========================================
@user_router.get(
    "/me",
    response_model=UserResponse
)
async def get_user_details(
    current_user: UUID = Depends(get_current_user)
):
    user_id = current_user

    response = (
        supabase
        .table("users")
        .select("""
            id,
            first_name,
            last_name,
            email,
            role,
            active,
            created_at,
            phone_number,
            location,
            headline,
            bio,
            skills
        """)
        .eq("id", str(user_id))
        .single()
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return response.data


# ========================================
# UPDATE CURRENT USER DETAILS
# ========================================
@user_router.put("/me")
async def update_user_details(
    payload: UserUpdateRequest,
    current_user: UUID = Depends(get_current_user)
):
    user_id = current_user

    update_data = payload.model_dump(
        exclude_unset=True,
        exclude_none=True
    )

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No valid fields provided for update"
        )

    response = (
        supabase
        .table("users")
        .update(update_data)
        .eq("id", str(user_id))
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "message": "User details updated successfully",
        "data": response.data[0]
    }