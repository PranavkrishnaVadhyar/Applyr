from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import date, datetime
from uuid import UUID

class ApplicationExtract(BaseModel):
    job_role: str = Field(description="Job title or role")
    job_description: str = Field(description="Full job description text")
    company_name: str = Field(description="Company name")
    company_description: Optional[str] = Field(default=None)
    final_date: Optional[date] = Field(
        default=None,
        description="Last application date if mentioned"
    )

class ExtensionExtractionRequest(BaseModel):
    user_id: UUID
    text: str




class ApplicationCreate(BaseModel):
    user_id: UUID
    resume_id: Optional[UUID] = None
    job_role: str
    job_description: str
    company_name: str
    company_description: Optional[str] = None
    final_date: Optional[date] = None
    response: Optional[Dict] = None
    status: str = "applied"


class ApplicationResponse(BaseModel):
    id: UUID
    user_id: UUID
    resume_id: Optional[UUID] = None
    job_role: str
    job_description: str
    company_name: str
    company_description: Optional[str] = None
    final_date: Optional[date] = None
    response: Optional[Dict] = None
    status: str
    applied_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None



class ApplicationUpdate(BaseModel):
    resume_id: Optional[UUID] = None
    status: Optional[str] = None
    response: Optional[Dict] = None


