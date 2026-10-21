from pydantic import BaseModel, ConfigDict, Field, field_validator
from uuid import UUID
from datetime import datetime
from core.resume_mgmt import ExperienceItem, EducationItem, ProjectItem, CertificationItem


class ResumeContact(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    name: str | None = Field(default=None, max_length=300)
    first_name: str | None = Field(default=None, max_length=300)
    last_name: str | None = Field(default=None, max_length=300)
    email: str | None = Field(default=None, max_length=300)
    phone_number: str | None = Field(default=None, max_length=100)
    location: str | None = Field(default=None, max_length=300)
    linkedin: str | None = Field(default=None, max_length=1000)
    github: str | None = Field(default=None, max_length=1000)
    portfolio: str | None = Field(default=None, max_length=1000)


class ResumeContentUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    summary: str | None = None
    contact: ResumeContact = Field(default_factory=ResumeContact)
    skills: list[str] | None = None
    experience: list[ExperienceItem] | None = None
    education: list[EducationItem] | None = None
    projects: list[ProjectItem] | None = None
    certifications: list[CertificationItem] | None = None
    achievements: list[str] | None = None
    languages: list[str] | None = None

    @field_validator("skills", "experience", "education", "projects", "certifications", "achievements", "languages", mode="before")
    @classmethod
    def normalize_null_lists(cls, value):
        return [] if value is None else value


class ResumeContentResponse(BaseModel):
    contact: ResumeContact = Field(default_factory=ResumeContact)
    id: UUID
    resume_id: UUID
    summary: str | None = None
    skills: list[str] = Field(default_factory=list)
    experience: list[ExperienceItem] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    projects: list[ProjectItem] = Field(default_factory=list)
    certifications: list[CertificationItem] = Field(default_factory=list)
    achievements: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)


class ResumeResponse(BaseModel):
    id: UUID
    user_id: UUID
    filename: str
    file_url: None = None
    filetype: str
    is_generated: bool
    active: bool
    created_at: datetime
    resume_content: list[ResumeContentResponse] = Field(default_factory=list)


class ResumeUploadData(BaseModel):
    resume: ResumeResponse
    content: ResumeContentResponse


class ResumeUploadResponse(BaseModel):
    message: str
    data: ResumeUploadData


class ResumeUpdateResponse(BaseModel):
    message: str
    data: ResumeContentResponse
