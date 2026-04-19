from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from routes import applications, auth, analytics


# Initialize FastAPI app
app = FastAPI(
    title="Agent-Based Application API",
    description="A FastAPI backend powered by Supabase",
    version="2.0.0"
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
# app.include_router(users.user_router, prefix="/api/users", tags=["users"])
# app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(applications.router, prefix="/api/applications", tags=["applications"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])


@app.get("/")
async def root():
    return {"message": "Agent-Based Application API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "agent-api"}


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
