"""
Development server runner for the FastAPI application
"""

import uvicorn
# from config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
    )
