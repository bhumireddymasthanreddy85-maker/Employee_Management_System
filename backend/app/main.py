from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.employees import router as employee_router
from app.core.config import settings
from app.db.mongo import db_manager

app = FastAPI(title="Employee Management System API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list({settings.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"}),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(employee_router)
app.include_router(dashboard_router)


@app.on_event("startup")
def startup_event() -> None:
    db_manager.connect()


@app.get("/")
def health_check() -> dict[str, str]:
    return {"message": "Employee Management System API is running"}
