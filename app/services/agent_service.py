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
from create_table import initialize_database


# ============================
#   ENVIRONMENT VARIABLES
# ============================
load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("❌ GOOGLE_API_KEY missing in .env")


# ============================
#   ENSURE DATABASE EXISTS
# ============================
initialize_database()

DB_PATH = "./resumes.db"


# ============================
#   LLM (Gemini)
# ============================
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    temperature=0.3,
    google_api_key=GOOGLE_API_KEY
)


# ============================
#   SQL TOOLKIT (Tools Only)
# ============================
engine = create_engine(f"sqlite:///{DB_PATH}")
db = SQLDatabase(engine)

toolkit = SQLDatabaseToolkit(db=db, llm=llm)
sql_tools = toolkit.get_tools()


# ============================
#   ENABLE LLM TOOL CALLING
# ============================
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


# ============================
#   EXAMPLE USAGE
# ============================
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
