import sys
import os

# Ensure backend module is resolvable
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import get_settings
from backend.db.firestore import init_db
from backend.api.v1.router import api_router

settings = get_settings()

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup
@app.on_event("startup")
async def startup_event():
    init_db()

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"status": "SonicStream API Running", "version": settings.VERSION}

if __name__ == "__main__":
    import uvicorn
    # Hugging Face and other platforms use the PORT env var
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port)
