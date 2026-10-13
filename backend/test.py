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

if not LLAMA_CLOUD_API_KEY:
    raise ValueError("LLAMA_CLOUD_API_KEY missing")

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

# ==========================================
# LLAMA CLOUD CLIENT
# ==========================================
client = LlamaCloud(
    api_key=LLAMA_CLOUD_API_KEY
)


# ==========================================
# HELPER FUNCTION
# ENSURE JSONB STRUCTURE CONSISTENCY
# ==========================================
def ensure_json_structure(data: dict) -> dict:

    # EXPERIENCE
    if not data.get("experience"):
        data["experience"] = [DEFAULT_EXPERIENCE_ITEM.copy()]
    else:
        normalized = []

        for item in data["experience"]:
            normalized.append({
                "company": item.get("company"),
                "role": item.get("role"),
                "duration": item.get("duration"),
                "description": item.get("description"),
                "technologies": item.get("technologies", [])
            })

        data["experience"] = normalized

    # EDUCATION
    if not data.get("education"):
        data["education"] = [DEFAULT_EDUCATION_ITEM.copy()]
    else:
        normalized = []

        for item in data["education"]:
            normalized.append({
                "institution": item.get("institution"),
                "degree": item.get("degree"),
                "field": item.get("field"),
                "year": item.get("year"),
                "grade": item.get("grade")
            })

        data["education"] = normalized

    # PROJECTS
    if not data.get("projects"):
        data["projects"] = [DEFAULT_PROJECT_ITEM.copy()]
    else:
        normalized = []

        for item in data["projects"]:
            normalized.append({
                "title": item.get("title"),
                "description": item.get("description"),
                "technologies": item.get("technologies", []),
                "github": item.get("github"),
                "live_link": item.get("live_link")
            })

        data["projects"] = normalized

    # CERTIFICATIONS
    if not data.get("certifications"):
        data["certifications"] = [DEFAULT_CERTIFICATION_ITEM.copy()]
    else:
        normalized = []

        for item in data["certifications"]:
            normalized.append({
                "name": item.get("name"),
                "issuer": item.get("issuer"),
                "year": item.get("year")
            })

        data["certifications"] = normalized

    return data


# ==========================================
# RESUME EXTRACTION FUNCTION
# ==========================================
def extract_resume_details(file_path: str) -> dict:

    try:

        # ==================================
        # UPLOAD FILE
        # ==================================
        file_obj = client.files.create(
            file=file_path,
            purpose="extract"
        )

        # ==================================
        # CREATE EXTRACTION JOB
        # ==================================
        job = client.extract.create(
            file_input=file_obj.id,
            configuration={
                "data_schema": ResumeExtractSchema.model_json_schema(),
                "extraction_target": "per_doc",
                "tier": "agentic",
            },
        )

        # ==================================
        # POLL UNTIL COMPLETE
        # ==================================
        while job.status not in (
            "COMPLETED",
            "FAILED",
            "CANCELLED"
        ):
            time.sleep(2)
            job = client.extract.get(job.id)

        # ==================================
        # HANDLE FAILURE
        # ==================================
        if job.status != "COMPLETED":
            raise Exception(
                f"Extraction failed with status: {job.status}"
            )

        # ==================================
        # GET EXTRACTED DATA
        # ==================================
        extracted_data = job.extract_result

        # ==================================
        # ENSURE JSONB STRUCTURE
        # ==================================
        extracted_data = ensure_json_structure(
            extracted_data
        )

        return extracted_data

    except Exception as e:
        raise Exception(
            f"Resume extraction failed: {str(e)}"
        )




# =========================================================
# CONFIG
# =========================================================
SUPABASE_BUCKET = "resumes"


# =========================================================
# 1. UPLOAD FILE TO SUPABASE STORAGE
# =========================================================
def upload_resume_to_storage(
    supabase: Client,
    file_path: str,
    user_id: str
) -> Dict[str, Any]:

    """
    Upload resume file to Supabase Storage
    and return file metadata.
    """

    file_name = os.path.basename(file_path)

    file_extension = file_name.split(".")[-1]

    unique_filename = (
        f"{user_id}/{uuid.uuid4()}.{file_extension}"
    )

    # Read file bytes
    with open(file_path, "rb") as f:
        file_bytes = f.read()

    # Upload to bucket
    supabase.storage.from_(SUPABASE_BUCKET).upload(
        path=unique_filename,
        file=file_bytes,
        file_options={
            "content-type": (
                "application/pdf"
                if file_extension == "pdf"
                else "application/octet-stream"
            )
        }
    )

    # Get public URL
    file_url = (
        supabase
        .storage
        .from_(SUPABASE_BUCKET)
        .get_public_url(unique_filename)
    )

    return {
        "filename": file_name,
        "file_url": file_url,
        "filetype": file_extension,
        "storage_path": unique_filename
    }


# =========================================================
# 2. STORE RESUME FILE DETAILS
# =========================================================
def create_resume_record(
    supabase: Client,
    user_id: str,
    file_metadata: Dict[str, Any],
    is_generated: bool = False
) -> Dict[str, Any]:

    """
    Create record in resumes table.
    """

    payload = {
        "user_id": user_id,
        "filename": file_metadata["filename"],
        "file_url": file_metadata["file_url"],
        "filetype": file_metadata["filetype"],
        "is_generated": is_generated,
        "active": True
    }

    response = (
        supabase
        .table("resumes")
        .insert(payload)
        .execute()
    )

    if not response.data:
        raise Exception(
            "Failed to create resume record"
        )

    return response.data[0]


# =========================================================
# 3. STORE STRUCTURED RESUME CONTENT
# =========================================================
def create_resume_content_record(
    supabase: Client,
    resume_id: str,
    extracted_data: Dict[str, Any]
) -> Dict[str, Any]:

    """
    Store extracted structured resume details
    into resume_content table.
    """

    payload = {
        "resume_id": resume_id,

        "summary": extracted_data.get("summary"),

        "skills": extracted_data.get(
            "skills",
            []
        ),

        "experience": extracted_data.get(
            "experience",
            []
        ),

        "education": extracted_data.get(
            "education",
            []
        ),

        "projects": extracted_data.get(
            "projects",
            []
        ),

        "certifications": extracted_data.get(
            "certifications",
            []
        ),

        "achievements": extracted_data.get(
            "achievements",
            []
        ),

        "languages": extracted_data.get(
            "languages",
            []
        )
    }

    response = (
        supabase
        .table("resume_content")
        .insert(payload)
        .execute()
    )

    if not response.data:
        raise Exception(
            "Failed to create resume content"
        )

    return response.data[0]


# =========================================================
# 4. COMPLETE PIPELINE
# =========================================================
def process_resume_upload(
    supabase: Client,
    file_path: str,
    user_id: str
) -> Dict[str, Any]:

    """
    Complete Resume Upload Pipeline

    Steps:
    1. Upload file to Supabase Storage
    2. Extract structured resume data
    3. Create resumes table record
    4. Create resume_content record
    """

    # =====================================
    # STEP 1 → UPLOAD FILE
    # =====================================
    file_metadata = upload_resume_to_storage(
        supabase=supabase,
        file_path=file_path,
        user_id=user_id
    )

    # =====================================
    # STEP 2 → EXTRACT RESUME DATA
    # =====================================
    extracted_data = extract_resume_details(
        file_path=file_path
    )

    # =====================================
    # STEP 3 → CREATE RESUME RECORD
    # =====================================
    resume_record = create_resume_record(
        supabase=supabase,
        user_id=user_id,
        file_metadata=file_metadata
    )

    resume_id = resume_record["id"]

    # =====================================
    # STEP 4 → CREATE CONTENT RECORD
    # =====================================
    content_record = create_resume_content_record(
        supabase=supabase,
        resume_id=resume_id,
        extracted_data=extracted_data
    )

    return {
        "resume": resume_record,
        "content": content_record
    }


# ==========================================
# EXAMPLE USAGE
# ==========================================
if __name__ == "__main__":

    result = extract_resume_details(
        "Pranavkrishna_Software-Engineer _1 page.pdf"
    )

    print(result)