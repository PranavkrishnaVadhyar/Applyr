from pydantic import BaseModel, Field, ConfigDict, HttpUrl
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
    text: str = Field(min_length=1, max_length=30000)




class ApplicationCreate(BaseModel):
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


class ReviewedAnswer(BaseModel):
    model_config = ConfigDict(extra="forbid")
    label: str = Field(min_length=1, max_length=500)
    value: str = Field(min_length=1, max_length=10000)
    field_type: str = Field(max_length=30)
    page_url: HttpUrl


class ApplicationDraft(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    resume_id: UUID
    job_role: str = Field(min_length=1, max_length=300)
    company_name: str = Field(min_length=1, max_length=300)
    job_description: str = Field(default="", max_length=30000)
    job_url: HttpUrl
    answers: list[ReviewedAnswer] = Field(default_factory=list, max_length=100)


