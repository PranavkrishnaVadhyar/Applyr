from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Response
from supabase import Client
from starlette.concurrency import run_in_threadpool
from core.security import get_current_user
from core.autofill import resolve_fields
from db.database import get_supabase
from routes.resumes import owned_resume
from schemas.autofill import ResolveRequest, ResolveResponse

router = APIRouter()


@router.post("/resolve", response_model=ResolveResponse)
async def resolve(request: ResolveRequest, response: Response,
                  current_user: UUID = Depends(get_current_user),
                  supabase: Client = Depends(get_supabase)):
    resume = await run_in_threadpool(owned_resume, supabase, request.resume_id, current_user)
    if not resume.get("active"):
        raise HTTPException(404, "Resume not found")
    content = resume.get("resume_content") or []
    if isinstance(content, list):
        content = content[0] if content else {}
    response.headers["Cache-Control"] = "no-store"
    return ResolveResponse(resume_id=request.resume_id,
                           results=await resolve_fields(content, request.fields, request.generate_drafts))
