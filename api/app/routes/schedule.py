from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import date
from app.database import get_db
from app.models.models import MaintenanceSchedule, Printer
from app.schemas.schemas import ScheduleCreate, ScheduleResponse

router = APIRouter(prefix="/api/schedules", tags=["Maintenance Schedule"])

@router.get("/", response_model=List[ScheduleResponse])
def get_all(db: Session = Depends(get_db)):
    return db.query(MaintenanceSchedule).options(
        joinedload(MaintenanceSchedule.printer).joinedload(Printer.location),
        joinedload(MaintenanceSchedule.category)
    ).filter(
        MaintenanceSchedule.is_active == True
    ).order_by(MaintenanceSchedule.next_due_date).all()

@router.get("/overdue", response_model=List[ScheduleResponse])
def get_overdue(db: Session = Depends(get_db)):
    return db.query(MaintenanceSchedule).options(
        joinedload(MaintenanceSchedule.printer).joinedload(Printer.location),
        joinedload(MaintenanceSchedule.category)
    ).filter(
        MaintenanceSchedule.is_active == True,
        MaintenanceSchedule.next_due_date < date.today()
    ).order_by(MaintenanceSchedule.next_due_date).all()

@router.post("/", response_model=ScheduleResponse, status_code=201)
def create(data: ScheduleCreate, db: Session = Depends(get_db)):
    schedule = MaintenanceSchedule(**data.model_dump())
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return db.query(MaintenanceSchedule).options(
        joinedload(MaintenanceSchedule.printer).joinedload(Printer.location),
        joinedload(MaintenanceSchedule.category)
    ).filter(MaintenanceSchedule.id == schedule.id).first()

@router.delete("/{id}", status_code=204)
def delete(id: int, db: Session = Depends(get_db)):
    s = db.query(MaintenanceSchedule).filter(MaintenanceSchedule.id == id).first()
    if not s:
        raise HTTPException(404, "Schedule not found")
    s.is_active = False
    db.commit()
