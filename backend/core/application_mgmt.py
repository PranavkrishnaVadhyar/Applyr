from langchain_groq import ChatGroq
from langchain.output_parsers import PydanticOutputParser
from langchain.prompts import PromptTemplate
from schemas.applications import ApplicationExtract
import os
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import Application
from uuid import UUID
from uuid import uuid4, UUID
from db.database import supabase
from schemas.applications import ApplicationExtract

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

llm = ChatGroq(
    model="llama3-70b-8192",
    temperature=0,
    groq_api_key=GROQ_API_KEY
)

parser = PydanticOutputParser(pydantic_object=ApplicationExtract)

prompt = PromptTemplate(
    template="""
You are an information extraction system.

Extract the following fields from the input text:

- job_role
- job_description
- company_name
- company_description
- final_date

Rules:
- Respond ONLY in valid JSON
- Do NOT guess missing values
- If a field is not present, return null
- job_description should contain the full JD text
- final_date must be in ISO format (YYYY-MM-DD)

{format_instructions}

INPUT TEXT:
{input_text}
""",
    input_variables=["input_text"],
    partial_variables={
        "format_instructions": parser.get_format_instructions()
    }
)


async def extract_application_fields(input_text: str) -> ApplicationExtract:
    """
    Takes raw job text and returns structured application fields
    """
    chain = prompt | llm | parser
    return await chain.ainvoke({"input_text": input_text})




async def create_application(
    user_id: UUID,
    extracted: ApplicationExtract
):
    data = {
        "id": str(uuid4()),
        "user_id": str(user_id),
        "resume_id": None,
        "job_role": extracted.job_role,
        "job_description": extracted.job_description,
        "company_name": extracted.company_name,
        "company_description": extracted.company_description,
        "final_date": extracted.final_date.isoformat() if extracted.final_date else None,
        "status": "draft",
        "response": None,
    }

    response = supabase.table("applications").insert(data).execute()

    if not response.data:
        raise Exception("Failed to create application")

    return response.data[0]

