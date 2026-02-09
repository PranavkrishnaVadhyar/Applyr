from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

class ApplicationExtract(BaseModel):
    job_role: str = Field(description="Job title or role")
    job_description: str = Field(description="Full job description text")
    company_name: str = Field(description="Company name")
    company_description: Optional[str] = Field(default=None)
    final_date: Optional[date] = Field(
        default=None,
        description="Last application date if mentioned"
    )
