import os
import time
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from llama_cloud import LlamaCloud
import uuid

from supabase import Client


# ==========================================
# LOAD ENV
# ==========================================
load_dotenv()

LLAMA_CLOUD_API_KEY = os.getenv("LLAMA_CLOUD_API_KEY")



DEFAULT_EXPERIENCE_ITEM = { "company": None, "role": None, "duration": None, "description": None, "technologies": [] } 
DEFAULT_EDUCATION_ITEM = { "institution": None, "degree": None, "field": None, "year": None, "grade": None } 
DEFAULT_PROJECT_ITEM = { "title": None, "description": None, "technologies": [], "github": None, "live_link": None } 
DEFAULT_CERTIFICATION_ITEM = { "name": None, "issuer": None, "year": None }


# ==========================================
# EXPERIENCE MODEL
# ==========================================
class ExperienceItem(BaseModel):

    company: Optional[str] = Field(
        default=None,
        description="Company name"
    )

    role: Optional[str] = Field(
        default=None,
        description="Job role/title"
    )

    duration: Optional[str] = Field(
        default=None,
        description="Employment duration"
    )

    description: Optional[str] = Field(
        default=None,
        description="Work description"
    )

    technologies: List[str] = Field(
        default_factory=list,
        description="Technologies used"
    )


# ==========================================
# EDUCATION MODEL
# ==========================================
class EducationItem(BaseModel):

    institution: Optional[str] = Field(
        default=None,
        description="Institution name"
    )

    degree: Optional[str] = Field(
        default=None,
        description="Degree name"
    )

    field: Optional[str] = Field(
        default=None,
        description="Field of study"
    )

    year: Optional[str] = Field(
        default=None,
        description="Graduation year"
    )

    grade: Optional[str] = Field(
        default=None,
        description="CGPA/Percentage/Grade"
    )


# ==========================================
# PROJECT MODEL
# ==========================================
class ProjectItem(BaseModel):

    title: Optional[str] = Field(
        default=None,
        description="Project title"
    )

    description: Optional[str] = Field(
        default=None,
        description="Project description"
    )

    technologies: List[str] = Field(
        default_factory=list,
        description="Technologies used"
    )

    github: Optional[str] = Field(
        default=None,
        description="GitHub repository link"
    )

    live_link: Optional[str] = Field(
        default=None,
        description="Live project link"
    )


# ==========================================
# CERTIFICATION MODEL
# ==========================================
class CertificationItem(BaseModel):

    name: Optional[str] = Field(
        default=None,
        description="Certification name"
    )

    issuer: Optional[str] = Field(
        default=None,
        description="Issuing organization"
    )

    year: Optional[str] = Field(
        default=None,
        description="Certification year"
    )


# ==========================================
# STRUCTURED RESUME SCHEMA
# ==========================================
class ResumeExtractSchema(BaseModel):

    # ======================================
    # BASIC INFO
    # ======================================
    name: Optional[str] = Field(
        default=None,
        description="Full name of candidate"
    )

    email: Optional[str] = Field(
        default=None,
        description="Candidate email address"
    )

    phone_number: Optional[str] = Field(
        default=None,
        description="Candidate phone number"
    )

    location: Optional[str] = Field(
        default=None,
        description="Candidate location"
    )

    # ======================================
    # MAIN DETAILS
    # ======================================
    summary: Optional[str] = Field(
        default=None,
        description="Professional summary"
    )

    skills: List[str] = Field(
        default_factory=list,
        description="Technical and soft skills"
    )

    # ======================================
    # EXPERIENCE
    # ======================================
    experience: List[ExperienceItem] = Field(
        default_factory=lambda: [ExperienceItem()],
        description="Work experience details"
    )

    # ======================================
    # EDUCATION
    # ======================================
    education: List[EducationItem] = Field(
        default_factory=lambda: [EducationItem()],
        description="Education details"
    )

    # ======================================
    # PROJECTS
    # ======================================
    projects: List[ProjectItem] = Field(
        default_factory=lambda: [ProjectItem()],
        description="Projects worked on"
    )

    # ======================================
    # CERTIFICATIONS
    # ======================================
    certifications: List[CertificationItem] = Field(
        default_factory=lambda: [CertificationItem()],
        description="Certifications list"
    )

    # ======================================
    # ACHIEVEMENTS
    # ======================================
    achievements: List[str] = Field(
        default_factory=list,
        description="Achievements and awards"
    )

    # ======================================
    # LANGUAGES
    # ======================================
    languages: List[str] = Field(
        default_factory=list,
        description="Languages known"
    )


# Resume content is normalized before storage and at the API boundary.
CONTENT_LISTS = ("skills", "experience", "education", "projects", "certifications",
                 "achievements", "languages")
SUPABASE_BUCKET = "resumes"
MAX_RESUME_BYTES = 10 * 1024 * 1024


class ResumeProcessingError(RuntimeError):
    pass


def ensure_json_structure(data: dict) -> dict:
    data = dict(data)
    for key in CONTENT_LISTS:
        data[key] = data.get(key) or []
    for key in ("experience", "projects"):
        data[key] = [{**item, "technologies": item.get("technologies") or []}
                     for item in data[key]]
    return ResumeExtractSchema.model_validate(data).model_dump(mode="json")


def normalize_content(data: dict) -> dict:
    normalized = ensure_json_structure(data)
    return {**data, **{key: normalized[key] for key in ("summary", *CONTENT_LISTS)}}


def normalize_resume(data: dict) -> dict:
    content = data.get("resume_content")
    if isinstance(content, dict):
        content = [content]
    return {**data, "file_url": None,
            "resume_content": [normalize_content(item) for item in (content or [])]}


def extract_resume_details(file_path: str) -> dict:
    from pathlib import Path
    import logging

    client = LlamaCloud(api_key=os.environ["LLAMA_CLOUD_API_KEY"], timeout=30, max_retries=0)
    file_obj = job = None
    try:
        file_obj = client.files.create(file=Path(file_path), purpose="extract")
        job = client.extract.create(
            file_input=file_obj.id,
            configuration={"data_schema": ResumeExtractSchema.model_json_schema(),
                           "extraction_target": "per_doc", "tier": "agentic"},
        )
        deadline = time.monotonic() + 120
        while job.status not in ("COMPLETED", "FAILED", "CANCELLED"):
            if time.monotonic() >= deadline:
                raise TimeoutError("Resume extraction timed out")
            time.sleep(2)
            job = client.extract.get(job.id)
        if job.status != "COMPLETED":
            raise ResumeProcessingError("Resume extraction failed")
        return ensure_json_structure(job.extract_result)
    finally:
        failed = False
        # These are only the provider resources created by this invocation.
        for resource, identifier in ((client.extract, job.id if job else None),
                                     (client.files, file_obj.id if file_obj else None)):
            if identifier:
                try:
                    resource.delete(identifier)
                except Exception:
                    failed = True
                    logging.getLogger(__name__).error("Resume provider cleanup failed for %s", identifier)
        client.close()
        if failed:
            raise ResumeProcessingError("Resume processing could not finish cleanup. Please contact support.")


def storage_path_for_resume(resume: dict, user_id: str) -> str | None:
    from urllib.parse import urlparse, unquote

    value = resume.get("file_url")
    if not value:
        return None
    parsed = urlparse(value)
    if parsed.scheme == "storage" and parsed.netloc == SUPABASE_BUCKET:
        path = unquote(parsed.path.lstrip("/"))
    else:
        # Backward compatibility for rows created before private downloads.
        expected = urlparse(os.environ["SUPABASE_URL"])
        prefix = f"/storage/v1/object/public/{SUPABASE_BUCKET}/"
        if parsed.netloc != expected.netloc or not parsed.path.startswith(prefix):
            raise ResumeProcessingError("Invalid resume storage reference")
        path = unquote(parsed.path[len(prefix):])
    if not path.startswith(f"{user_id}/") or any(part in ("", ".", "..") for part in path.split("/")):
        raise ResumeProcessingError("Invalid resume storage owner")
    return path


def remove_storage_file(bucket, path: str):
    from storage3.exceptions import StorageApiError

    removed = bucket.remove([path])
    if removed:
        return
    # Storage can return an empty deletion result without raising an error.
    # Distinguish an already-missing file (retry) from an unsuccessful deletion.
    try:
        bucket.info(path)
    except StorageApiError as exc:
        if str(exc.status) == "404" or exc.code in ("NoSuchKey", "Object not found", "not_found"):
            return
        raise
    raise ResumeProcessingError("Storage did not confirm file deletion")


def process_resume_upload(supabase: Client, file_path: str, user_id: str,
                          original_filename: str) -> Dict[str, Any]:
    import logging

    # Extract first: provider failures must not leave Supabase objects behind.
    extracted = extract_resume_details(file_path)
    filename = original_filename.replace("\\", "/").split("/")[-1]
    extension = filename.rsplit(".", 1)[-1].lower()
    resume_id = str(uuid.uuid4())
    storage_path = f"{user_id}/{resume_id}.{extension}"
    bucket = supabase.storage.from_(SUPABASE_BUCKET)
    storage_attempted = record_attempted = False
    phase = "storage upload"
    try:
        storage_attempted = True
        with open(file_path, "rb") as file:
            bucket.upload(path=storage_path, file=file.read(), file_options={
                "content-type": {"pdf": "application/pdf", "doc": "application/msword",
                                "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}[extension]
            })
        record_attempted = True
        phase = "resume record insert"
        result = supabase.table("resumes").insert({
            "id": resume_id, "user_id": user_id, "filename": filename,
            "file_url": f"storage://{SUPABASE_BUCKET}/{storage_path}",
            "filetype": extension, "is_generated": False, "active": True,
        }).execute()
        if not result.data:
            raise ResumeProcessingError("Failed to save resume")
        phase = "resume content insert"
        content = supabase.table("resume_content").insert({
            "resume_id": resume_id,
            **{key: extracted[key] for key in ("summary", *CONTENT_LISTS)},
        }).execute()
        if not content.data:
            raise ResumeProcessingError("Failed to save resume content")
        return {"resume": normalize_resume({**result.data[0], "resume_content": content.data}),
                "content": normalize_content(content.data[0])}
    except Exception as error:
        logging.getLogger(__name__).error("Resume processing failed at %s (%s, code=%s)",
                                         phase, type(error).__name__, getattr(error, "code", None))
        cleanup_errors = []
        # Include uncertain writes: generated IDs/paths are known before any request.
        if record_attempted:
            for table, column in (("resume_content", "resume_id"), ("resumes", "id")):
                try:
                    query = supabase.table(table).delete().eq(column, resume_id)
                    if table == "resumes":
                        query = query.eq("user_id", user_id)
                    query.execute()
                except Exception:
                    cleanup_errors.append(table)
        if storage_attempted:
            try:
                remove_storage_file(bucket, storage_path)
            except Exception:
                cleanup_errors.append("storage")
        if cleanup_errors:
            logging.getLogger(__name__).error("Resume cleanup incomplete: %s (%s)", resume_id, cleanup_errors)
            raise ResumeProcessingError("Upload failed and cleanup is incomplete. Please contact support.") from error
        raise ResumeProcessingError("Resume processing failed. Please try again.") from error
