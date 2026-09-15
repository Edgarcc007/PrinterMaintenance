from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import locations, printers, categories, maintenance, schedule, dashboard, export

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

@app.get("/")
def root():
    return {"status": "running", "system": "Printer Maintenance Control"}

@app.get("/health")
def health():
    return {"status": "healthy"}
