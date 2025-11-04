from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
#from database.database import engine, Base
from routes import auth, agents, users
import uvicorn

# Create database tables
#Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Agent-Based Application API",
    description="A FastAPI backend for agent-based applications with authentication",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
# app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.user_router, prefix="/api/users", tags=["users"])
# app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
# app.include_router(tools.router, prefix="/api/tools", tags=["tools"])

@app.get("/")
async def root():
    return {"message": "Agent-Based Application API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "agent-api"}


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
    )