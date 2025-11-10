import os
from langchain_groq import ChatGroq
from langchain_classic.agents import create_react_agent, AgentExecutor
from langchain_classic.tools import tool
from langchain_classic.prompts import PromptTemplate
from typing import Optional
from qdrant_setup import ResumeVectorStore
from dotenv import load_dotenv

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
    """
    Search through resume content to find relevant information.
    Use this when you need to answer questions about skills, experience, education, or any resume information.
    
    Args:
        query: The search query (e.g., 'Python skills', 'work experience', 'education')
        user_id: Optional user ID to search a specific user's resume (leave empty to search all)
    
    Returns:
        Relevant resume information
    """
    uid = user_id if user_id else None
    results = resume_store.search_resume(query=query, user_id=uid, limit=5)
    
    if not results:
        return "No relevant resume information found."
    
    response = "Found relevant resume information:\n\n"
    for i, result in enumerate(results, 1):
        user_id_info = result.payload.get("metadata", {}).get("user_id", "Unknown")
        text = result.payload.get("text", "")
        score = result.score
        
        response += f"[Result {i}] (Relevance: {score:.2f}, User: {user_id_info})\n"
        response += f"{text}\n\n"
    
    return response


def create_resume_agent():
    """Create and return a LangChain agent with Groq LLM and resume search tool."""
    
    # Initialize Groq LLM
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.3,
        api_key=os.getenv("GROQ_API_KEY")
    )
    
    # Define tools
    tools = [search_resume]
    
    # Create prompt template
    template = """You are a helpful assistant that answers questions about resumes.

You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought: {agent_scratchpad}"""

    prompt = PromptTemplate.from_template(template)
    
    # Create agent
    agent = create_react_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True, handle_parsing_errors=True)
    
    return agent_executor


# Example usage
if __name__ == "__main__":
    
    # Check environment variables
    if not os.getenv("GROQ_API_KEY"):
        print("ERROR: Set GROQ_API_KEY environment variable")
        exit(1)
    
    print("Initializing Resume QA Agent...\n")
    
    # Create the agent
    agent = create_resume_agent()
    
    print("✓ Agent ready!\n")
    print("=" * 60)
    
    # Example 1: Ask about a specific user's resume
    print("Example 1: Question about specific user")
    print("=" * 60)
    
    response = agent.invoke({
        "input": "What programming languages does user_12345 know? Search with user_id: user_12345"
    })
    print(f"\nAnswer: {response['output']}\n")
    
    