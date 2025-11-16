# schemas/resume.py
from pydantic import BaseModel
from typing import Optional, Union, List

# =============================
#   REQUEST MODEL
# =============================
class QuestionRequest(BaseModel):
    user_id: str
    questions: Union[str, List[str]]

class ResumeBase(BaseModel):
    skills: Optional[str] = None
    experience: Optional[str] = None
    knowledge: Optional[str] = None
    education: Optional[str] = None
    projects: Optional[str] = None
    certifications: Optional[str] = None


class ResumeCreate(ResumeBase):
    pass


class ResumeUpdate(ResumeBase):
    pass


class ResumeOut(ResumeBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True
