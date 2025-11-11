import os
import json
from typing import Dict, List, Optional
from langchain_groq import ChatGroq
from langchain_classic.agents import create_react_agent, AgentExecutor
from langchain_classic.tools import tool
from langchain_classic.prompts import PromptTemplate
from dotenv import load_dotenv
from qdrant_setup import ResumeVectorStore
from langchain_classic.output_parsers import ResponseSchema, StructuredOutputParser

load_dotenv()

# Initialize the vector store globally
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_ENDPOINT = os.getenv("QDRANT_ENDPOINT")

resume_store = ResumeVectorStore(
    api_key=QDRANT_API_KEY,
    endpoint=QDRANT_ENDPOINT,
    collection_name="user_resumes"
)


@tool
def search_resume(query: str, user_id: str = "") -> str:
    """Search through resume content to find relevant information."""
    uid = user_id if user_id else None
    results = resume_store.search_resume(query=query, user_id=uid, limit=5)
    
    if not results:
        return "No relevant resume information found."
    
    response = ""
    for i, result in enumerate(results, 1):
        user_id_info = result.payload.get("metadata", {}).get("user_id", "Unknown")
        text = result.payload.get("text", "")
        score = result.score
        
        response += f"[Result {i}] (Relevance: {score:.2f}, User: {user_id_info})\n{text}\n\n"
    
    return response.strip()


def create_resume_agent():
    """Create and return a LangChain agent with Groq LLM and resume search tool."""
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.3,
        api_key=os.getenv("GROQ_API_KEY")
    )

    tools = [search_resume]

    template = """You are a helpful assistant that answers questions about resumes.

You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Observation can repeat)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought: {agent_scratchpad}
"""

    prompt = PromptTemplate.from_template(template)
    agent = create_react_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=False, handle_parsing_errors=True)
    return agent_executor


def answer_job_questions(agent, questions: str, user_id: Optional[str] = "") -> Dict[str, str]:
    """Split multiple questions and return JSON answers for each."""
    
    # Split questions line-by-line or numbered
    question_list = [
        q.strip() for q in questions.split("\n") 
        if q.strip() and not q.strip().lower().startswith("q")
    ]

    answers = {}
    for q in question_list:
        query = f"{q} (user_id: {user_id})" if user_id else q
        try:
            response = agent.invoke({"input": query})
            answers[q] = response.get("output", "No response generated.")
        except Exception as e:
            answers[q] = f"Error: {str(e)}"

    return answers


# Example Usage
if __name__ == "__main__":
    if not os.getenv("GROQ_API_KEY"):
        print("ERROR: Set GROQ_API_KEY environment variable")
        exit(1)

    print("Initializing Resume QA Agent...\n")
    agent = create_resume_agent()
    print("✓ Agent ready!\n")

    job_questions = """
    1. What programming languages does user_12345 know?
    2. What is their highest qualification?
    3. Describe their experience with NLP.
    4. What projects have they worked on recently?
    5. Does the candidate have experience with Flask or FastAPI?
    """

    print("Answering job application questions...\n")
    result_json = answer_job_questions(agent, job_questions, user_id="user_12345")

    # Format as structured JSON
    print(json.dumps(result_json, indent=4))
