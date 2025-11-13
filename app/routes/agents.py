# agents_router.py
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError
from typing import List, Dict, Union
from services.agent_service import answer_sql_questions


router = APIRouter(tags=["agents"])


# =============================
#   REQUEST MODEL
# =============================
class QuestionRequest(BaseModel):
    user_id: str
    questions: Union[str, List[str]]


# =============================
#   RETRY WRAPPER (NO LOGGING)
# =============================
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


# =============================
#   API ENDPOINT
# =============================
@router.post("/answer_question")
async def answer_question(payload: QuestionRequest) -> Dict[str, Union[bool, Dict, str]]:
    """API endpoint to answer resume/job questions using SQL + LLM tool-calling with retries."""

    # ---------------------------
    # Validate input
    # ---------------------------
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

    # ---------------------------
    # Retry + Timeout wrapped execution
    # ---------------------------
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
