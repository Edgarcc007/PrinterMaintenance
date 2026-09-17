from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, SessionLocal
from app.models.models import (
    Location, Printer, MaintenanceCategory, MaintenanceRecord,
    MaintenanceSchedule, Supply, StockMovement, User, AuditLog, UserRole
)
from app.routes import locations, printers, categories, maintenance, schedule, dashboard, export, stock
from app.routes.auth import router as auth_router, hash_password
import logging

logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Printer Maintenance Control System",
    description="API for managing preventive and corrective maintenance of Zebra and Honeywell printers",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(printers.router)
app.include_router(locations.router)
app.include_router(categories.router)
app.include_router(maintenance.router)
app.include_router(schedule.router)
app.include_router(export.router)
app.include_router(stock.router)
app.include_router(auth_router)


@app.on_event("startup")
def seed_admin():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == "admin").first()
        if not existing:
            admin = User(
                username="admin",
                full_name="Administrador",
                password_hash=hash_password("Admin123!"),
                role=UserRole.admin,
                is_active=True
            )
            db.add(admin)
            db.commit()
            logger.info("Admin user seeded successfully")
        else:
            logger.info("Admin user already exists")
    except Exception as e:
        logger.error(f"Error seeding admin: {e}")
        db.rollback()
    finally:
        db.close()


@app.get("/")
def root():
    return {"status": "running", "system": "Printer Maintenance Control"}


@app.get("/health")
def health():
    return {"status": "healthy"}
