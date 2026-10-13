import logging
import os
from tempfile import NamedTemporaryFile
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Response
from supabase import Client

from core.security import get_current_user
from core.resume_mgmt import (
    MAX_RESUME_BYTES, SUPABASE_BUCKET, ResumeProcessingError,
    normalize_content, normalize_resume, process_resume_upload, storage_path_for_resume, remove_storage_file,
)
from db.database import get_supabase
from schemas.resumes import ResumeContentUpdate, ResumeResponse, ResumeUploadResponse, ResumeUpdateResponse

router = APIRouter()
logger = logging.getLogger(__name__)


def owned_resume(supabase: Client, resume_id: UUID, user_id: UUID):
    result = (supabase.table("resumes").select("*, resume_content(*)")
              .eq("id", str(resume_id)).eq("user_id", str(user_id)).limit(1).execute())
    if not result.data:
        raise HTTPException(404, "Resume not found")
    return result.data[0]


@router.post("/", response_model=ResumeUploadResponse)
def upload_resume(file: UploadFile = File(...),
                  current_user: UUID = Depends(get_current_user),
                  supabase: Client = Depends(get_supabase)):
    filename = (file.filename or "").replace("\\", "/").split("/")[-1]
    extension = filename.rsplit(".", 1)[-1].lower()
    if "." not in filename or extension not in ("pdf", "doc", "docx"):
        raise HTTPException(400, "Only PDF, DOC and DOCX files are supported")
    temp_path = None
    try:
        with NamedTemporaryFile(delete=False, suffix=f".{extension}") as temp:
            temp_path = temp.name
            size = 0
            while chunk := file.file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_RESUME_BYTES:
                    raise HTTPException(413, "Resume must be 10 MB or smaller")
                temp.write(chunk)
            if not size:
                raise HTTPException(400, "Resume file is empty")
        result = process_resume_upload(supabase, temp_path, str(current_user), filename)
        return {"message": "Resume uploaded successfully", "data": result}
    except HTTPException:
        raise
    except ResumeProcessingError as exc:
        raise HTTPException(502, str(exc)) from exc
    except Exception as exc:
        logger.error("Resume upload failed (%s)", type(exc).__name__)
        raise HTTPException(502, "Resume processing failed. Please try again.")
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


@router.get("/", response_model=list[ResumeResponse])
def get_user_resumes(current_user: UUID = Depends(get_current_user),
                     supabase: Client = Depends(get_supabase)):
    result = (supabase.table("resumes").select("*, resume_content(*)")
              .eq("user_id", str(current_user)).eq("active", True)
              .order("created_at", desc=True).execute())
    return [normalize_resume(row) for row in (result.data or [])]


@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(resume_id: UUID, current_user: UUID = Depends(get_current_user),
               supabase: Client = Depends(get_supabase)):
    return normalize_resume(owned_resume(supabase, resume_id, current_user))


@router.get("/{resume_id}/download")
def download_resume(resume_id: UUID, response: Response, current_user: UUID = Depends(get_current_user),
                    supabase: Client = Depends(get_supabase)):
    resume = owned_resume(supabase, resume_id, current_user)
    try:
        path = storage_path_for_resume(resume, str(current_user))
        if not path:
            raise HTTPException(404, "Original resume file is unavailable")
        result = supabase.storage.from_(SUPABASE_BUCKET).create_signed_url(
            path, 60, {"download": resume["filename"]})
        if not result.get("signedURL"):
            raise RuntimeError("Missing signed URL")
        response.headers["Cache-Control"] = "no-store"
        return {"url": result["signedURL"], "expires_in": 60}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(502, "Could not open the resume file. Please try again.")


@router.put("/{resume_id}", response_model=ResumeUpdateResponse)
def update_resume(resume_id: UUID, payload: ResumeContentUpdate,
                  current_user: UUID = Depends(get_current_user),
                  supabase: Client = Depends(get_supabase)):
    owned_resume(supabase, resume_id, current_user)
    data = payload.model_dump(exclude_unset=True, mode="json")
    if not data:
        raise HTTPException(400, "No resume changes provided")
    result = supabase.table("resume_content").update(data).eq("resume_id", str(resume_id)).execute()
    if not result.data:
        raise HTTPException(404, "Resume content not found. Upload the resume again.")
    return {"message": "Resume updated successfully", "data": normalize_content(result.data[0])}


@router.delete("/{resume_id}")
def delete_resume(resume_id: UUID, current_user: UUID = Depends(get_current_user),
                  supabase: Client = Depends(get_supabase)):
    resume = owned_resume(supabase, resume_id, current_user)
    linked = (supabase.table("applications").select("id").eq("resume_id", str(resume_id))
              .eq("user_id", str(current_user)).limit(1).execute())
    if linked.data:
        raise HTTPException(409, "This resume is linked to an application. Unlink it before deleting.")
    try:
        path = storage_path_for_resume(resume, str(current_user))
        if path:
            remove_storage_file(supabase.storage.from_(SUPABASE_BUCKET), path)
    except Exception:
        # Preserve the record so storage deletion can be retried.
        raise HTTPException(502, "Could not delete the resume file. Your record was kept; please retry.")
    try:
        result = (supabase.table("resumes").delete().eq("id", str(resume_id))
                  .eq("user_id", str(current_user)).execute())
        if not result.data:
            raise RuntimeError("Resume deletion was not confirmed")
    except Exception:
        raise HTTPException(502, "The file was removed, but the resume record could not be deleted. Please retry.")
    return {"message": "Resume deleted successfully"}
