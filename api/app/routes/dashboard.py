from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from datetime import date, timedelta, datetime
from typing import List
from app.database import get_db
from app.models.models import Printer, MaintenanceRecord, MaintenanceSchedule
from app.schemas.schemas import DashboardStats, OverduePrinter

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    today = date.today()
    first_of_month = today.replace(day=1)
    week_ahead = today + timedelta(days=7)

    total = db.query(Printer).count()
    active = db.query(Printer).filter(Printer.status == "Active").count()
    in_repair = db.query(Printer).filter(Printer.status == "In Repair").count()

    overdue = db.query(MaintenanceSchedule).filter(
        MaintenanceSchedule.is_active == True,
        MaintenanceSchedule.next_due_date < today
    ).count()

    upcoming = db.query(MaintenanceSchedule).filter(
        MaintenanceSchedule.is_active == True,
        MaintenanceSchedule.next_due_date >= today,
        MaintenanceSchedule.next_due_date <= week_ahead
    ).count()

    completed = db.query(MaintenanceRecord).filter(
        MaintenanceRecord.status == "Completed",
        MaintenanceRecord.performed_at >= datetime.combine(first_of_month, datetime.min.time())
    ).count()

    corrective = db.query(MaintenanceRecord).filter(
        MaintenanceRecord.type == "Corrective",
        MaintenanceRecord.performed_at >= datetime.combine(first_of_month, datetime.min.time())
    ).count()

    return DashboardStats(
        total_printers=total,
        active_printers=active,
        in_repair=in_repair,
        overdue_maintenance=overdue,
        upcoming_7_days=upcoming,
        completed_this_month=completed,
        corrective_this_month=corrective
    )

@router.get("/overdue", response_model=List[OverduePrinter])
def get_overdue(db: Session = Depends(get_db)):
    today = date.today()
    results = db.query(MaintenanceSchedule).options(
        joinedload(MaintenanceSchedule.printer).joinedload(Printer.location),
        joinedload(MaintenanceSchedule.category)
    ).filter(
        MaintenanceSchedule.is_active == True,
        MaintenanceSchedule.next_due_date < today
    ).order_by(MaintenanceSchedule.next_due_date).all()

    return [
        OverduePrinter(
            printer_id=s.printer.id,
            brand=s.printer.brand,
            model=s.printer.model,
            serial_number=s.printer.serial_number,
            location=s.printer.location.name if s.printer.location else None,
            maintenance_task=s.category.name,
            due_date=s.next_due_date,
            days_overdue=(today - s.next_due_date).days
        ) for s in results
    ]
