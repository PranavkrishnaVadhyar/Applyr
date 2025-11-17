# agent_service.py
import os
import json
import asyncio
from typing import Dict

from dotenv import load_dotenv
from sqlalchemy import create_engine

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits.sql.toolkit import SQLDatabaseToolkit

# Import DB initializer
from db.create_table import initialize_database
from sqlalchemy.orm import Session
from fastapi import HTTPException
from db.models import Resume, Users
from schemas.agents import ResumeCreate, ResumeUpdate

import os
from llama_cloud_services import LlamaExtract
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from db.models import Resume, Users

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("❌ GOOGLE_API_KEY missing in .env")



initialize_database()

DB_PATH = "./resumes.db"


llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    temperature=0.3,
    google_api_key=GOOGLE_API_KEY
)


engine = create_engine(f"sqlite:///{DB_PATH}")
db = SQLDatabase(engine)

toolkit = SQLDatabaseToolkit(db=db, llm=llm)
sql_tools = toolkit.get_tools()


llm_with_tools = llm.bind_tools(sql_tools)


# ============================
#   MULTI-QUESTION RUNNER
# ============================
async def answer_sql_questions(user_id: str, questions: str) -> Dict[str, str]:
    question_list = [q.strip() for q in questions.split("\n") if q.strip()]

    async def process(q):
        prompt = f"""
You are a resume analysis assistant with access to SQL tools.

Below is the database schema you MUST use:

TABLE resumes (
    user_id TEXT PRIMARY KEY,
    name TEXT,
    skills TEXT,
    experience TEXT,
    knowledge TEXT,
    education TEXT,
    projects TEXT,
    certifications TEXT
);

User ID: {user_id}
Question: {q}

You MUST:
- Use SQL tools to answer the question.
- Only use SQL queries based on the schema above.
- Never guess column names or data.
- Query only rows WHERE user_id = '{user_id}' unless asked otherwise.
- If a question cannot be answered from the table, say so.
"""


        # First pass: LLM decides tool usage
        result = await llm_with_tools.ainvoke(prompt)

        # If LLM used a tool
        if result.tool_calls:
            tool_call = result.tool_calls[0]
            tool = next(t for t in sql_tools if t.name == tool_call["name"])

            # Run the SQL query
            sql_output = tool.invoke(tool_call["args"])

            # Final LLM answer after tool result
            final_response = llm.invoke(
                f"SQL result: {sql_output}\n\nAnswer the question: {q}"
            )
            return q, final_response.content

        # If no tool call
        return q, result.content

    results = await asyncio.gather(*(process(q) for q in question_list))
    return dict(results)


def create_resume(db: Session, user: Users, data: ResumeCreate):
    resume = Resume(
        user_id=user.id,
        skills=data.skills,
        experience=data.experience,
        knowledge=data.knowledge,
        education=data.education,
        projects=data.projects,
        certifications=data.certifications
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


def get_resume(db: Session, resume_id: int, user: Users):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


def get_all_resumes(db: Session, user: Users):
    return db.query(Resume).filter(Resume.user_id == user.id).all()


def update_resume(db: Session, resume_id: int, user: Users, data: ResumeUpdate):
    resume = get_resume(db, resume_id, user)

    for field, value in data.dict(exclude_unset=True).items():
        setattr(resume, field, value)

    db.commit()
    db.refresh(resume)
    return resume


def delete_resume(db: Session, resume_id: int, user: Users):
    resume = get_resume(db, resume_id, user)
    db.delete(resume)
    db.commit()
    return True



class ParsedResume(BaseModel):
    name: str = Field(description="Full name of candidate")
    email: str = Field(description="Email address")
    skills: list[str] = Field(description="Technical skills and technologies")
    experience: str | None = Field(default=None)
    education: str | None = Field(default=None)
    projects: str | None = Field(default=None)
    certifications: str | None = Field(default=None)


extractor = LlamaExtract()


def parse_and_store_resume(file_path: str, db: Session, user: Users) -> Resume:
    

    # Create extraction agent
    agent = extractor.create_agent(
        name="resume-parser",
        data_schema=ParsedResume
    )

    # Run extraction
    result = agent.extract(file_path)

    if not result or not result.data:
        raise ValueError("Failed to extract data from resume")

    parsed: ParsedResume = result.data

    # Convert list → comma-separated string
    skills_str = ", ".join(parsed.skills)

    # Insert into DB
    resume = Resume(
        user_id=user.id,
        skills=skills_str,
        experience=parsed.experience,
        knowledge=None,
        education=parsed.education,
        projects=parsed.projects,
        certifications=parsed.certifications
    )

    db.add(resume)
    db.commit()
    db.refresh(resume)

    return resume


if __name__ == "__main__":
    job_questions = """
    What programming languages does user_12345 know?
    Describe their NLP experience.
    What projects have they done?
    What certifications do they have?
    """

    print("\n🚀 Running SQL-powered Gemini LLM Tool Calling...\n")

    answers = asyncio.run(answer_sql_questions("user_12345", job_questions))
    print(json.dumps(answers, indent=4))
