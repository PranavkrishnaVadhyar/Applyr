from langchain_groq import ChatGroq
from langchain_classic.output_parsers import PydanticOutputParser
from langchain_classic.prompts import PromptTemplate
from schemas.applications import ApplicationExtract
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession
from models.applications import Application
from schemas.applications import ApplicationExtract
from uuid import UUID

load_dotenv()

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0
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
    db: AsyncSession,
    user_id: UUID,
    extracted: ApplicationExtract
) -> Application:
    application = Application(
        user_id=user_id,
        resume_id=None,
        job_role=extracted.job_role,
        job_description=extracted.job_description,
        company_name=extracted.company_name,
        company_description=extracted.company_description,
        final_date=extracted.final_date,
        status="draft",
        response=None
    )

    db.add(application)
    await db.commit()
    await db.refresh(application)

    return application
