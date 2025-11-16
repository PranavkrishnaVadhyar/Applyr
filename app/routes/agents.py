# agents_router.py
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import ValidationError
from typing import List, Dict, Union
from services.agent_service import answer_sql_questions
from schemas.agents import ResumeCreate, ResumeOut, ResumeUpdate, QuestionRequest
from services.agent_service import (
    create_resume,
    get_resume,
    get_all_resumes,
    update_resume,
    delete_resume
)
from sqlalchemy.orm import Session
from typing import List
from db.database import get_db
from db.models import Users
from routes.auth import get_current_user
from fastapi import APIRouter, Depends, HTTPException


router = APIRouter()


async def retry_call(func, retries=3, delay=1.0, *args, **kwargs):
    """
    Generic async retry function with exponential backoff.
    Retries on ANY exception silently.
    """
    attempt = 0
    retries: int = 3  
    delay: float = 1.0            

    while attempt < retries:
        try:
            return await func(*args, **kwargs)

        except Exception:
            attempt += 1

            if attempt == retries:
                raise  # rethrow final error

            await asyncio.sleep(delay)
            delay *= 2  # exponential backoff



@router.post("/answer_question")
async def answer_question(payload: QuestionRequest) -> Dict[str, Union[bool, Dict, str]]:
    """API endpoint to answer resume/job questions using SQL + LLM tool-calling with retries."""

    try:
        if isinstance(payload.questions, list):
            questions_text = "\n".join(payload.questions)
        else:
            questions_text = payload.questions

        if not questions_text.strip():
            raise HTTPException(status_code=400, detail="Questions cannot be empty.")

    except ValidationError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        result = await asyncio.wait_for(
            retry_call(
                answer_sql_questions,
                user_id=payload.user_id,
                questions=questions_text
            ),
            timeout=30  # global timeout for entire operation
        )

        return {
            "success": True,
            "answers": result
        }

    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail="The model timed out after multiple retries."
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed after retries: {str(e)}"
        )


@router.post("/", response_model=ResumeOut)
def create_new_resume(
    payload: ResumeCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    return create_resume(db, current_user, payload)



@router.get("/", response_model=List[ResumeOut])
def list_my_resumes(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    return get_all_resumes(db, current_user)


@router.get("/{resume_id}", response_model=ResumeOut)
def fetch_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    return get_resume(db, resume_id, current_user)


@router.put("/{resume_id}", response_model=ResumeOut)
def modify_resume(
    resume_id: int,
    payload: ResumeUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    return update_resume(db, resume_id, current_user, payload)


@router.delete("/{resume_id}")
def remove_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    delete_resume(db, resume_id, current_user)
    return {"detail": "Resume deleted successfully"}
