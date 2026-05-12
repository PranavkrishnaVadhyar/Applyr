from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Depends
)

from uuid import UUID
from tempfile import NamedTemporaryFile
import shutil
import os

from db.database import supabase
from core.security import get_current_user

from core.resume_mgmt import (
    process_resume_upload
)

router = APIRouter()


# =========================================================
# CREATE / UPLOAD RESUME
# =========================================================
@router.post("/")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: UUID = Depends(get_current_user)
):

    allowed_extensions = [
        "pdf",
        "doc",
        "docx"
    ]

    file_extension = file.filename.split(".")[-1].lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type"
        )

    temp_file_path = None

    try:

        # =====================================
        # SAVE TEMP FILE
        # =====================================
        with NamedTemporaryFile(
            delete=False,
            suffix=f".{file_extension}"
        ) as temp_file:

            shutil.copyfileobj(
                file.file,
                temp_file
            )

            temp_file_path = temp_file.name

        # =====================================
        # PROCESS COMPLETE PIPELINE
        # =====================================
        result = process_resume_upload(
            supabase=supabase,
            file_path=temp_file_path,
            user_id=str(current_user)
        )

        return {
            "message": "Resume uploaded successfully",
            "data": result
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        # Cleanup temp file
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)


# =========================================================
# GET ALL USER RESUMES
# =========================================================
@router.get("/")
async def get_user_resumes(
    current_user: UUID = Depends(get_current_user)
):

    response = (
        supabase
        .table("resumes")
        .select("""
            *,
            resume_content(*)
        """)
        .eq("user_id", str(current_user))
        .eq("active", True)
        .order("created_at", desc=True)
        .execute()
    )

    return response.data


# =========================================================
# GET SINGLE RESUME
# =========================================================
@router.get("/{resume_id}")
async def get_resume(
    resume_id: UUID,
    current_user: UUID = Depends(get_current_user)
):

    response = (
        supabase
        .table("resumes")
        .select("""
            *,
            resume_content(*)
        """)
        .eq("id", str(resume_id))
        .eq("user_id", str(current_user))
        .single()
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    return response.data


# =========================================================
# UPDATE RESUME CONTENT
# =========================================================
@router.put("/{resume_id}")
async def update_resume(
    resume_id: UUID,
    payload: dict,
    current_user: UUID = Depends(get_current_user)
):

    # =====================================
    # VERIFY OWNERSHIP
    # =====================================
    resume_response = (
        supabase
        .table("resumes")
        .select("id")
        .eq("id", str(resume_id))
        .eq("user_id", str(current_user))
        .single()
        .execute()
    )

    if not resume_response.data:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    # =====================================
    # UPDATE CONTENT
    # =====================================
    response = (
        supabase
        .table("resume_content")
        .update(payload)
        .eq("resume_id", str(resume_id))
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=400,
            detail="Failed to update resume"
        )

    return {
        "message": "Resume updated successfully",
        "data": response.data[0]
    }


# =========================================================
# DELETE RESUME
# =========================================================
@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: UUID,
    current_user: UUID = Depends(get_current_user)
):

    # =====================================
    # FETCH RESUME
    # =====================================
    response = (
        supabase
        .table("resumes")
        .select("*")
        .eq("id", str(resume_id))
        .eq("user_id", str(current_user))
        .single()
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    resume = response.data

    # =====================================
    # DELETE FILE FROM STORAGE
    # =====================================
    try:

        file_url = resume.get("file_url")

        if file_url:

            # Extract path from URL
            # Example:
            # resumes/userid/file.pdf

            split_text = "/storage/v1/object/public/resumes/"

            if split_text in file_url:

                storage_path = file_url.split(
                    split_text
                )[1]

                supabase.storage.from_("resumes").remove(
                    [storage_path]
                )

    except Exception:
        pass

    # =====================================
    # DELETE DB RECORD
    # CASCADE deletes resume_content
    # =====================================
    delete_response = (
        supabase
        .table("resumes")
        .delete()
        .eq("id", str(resume_id))
        .execute()
    )

    if not delete_response.data:
        raise HTTPException(
            status_code=400,
            detail="Failed to delete resume"
        )

    return {
        "message": "Resume deleted successfully"
    }