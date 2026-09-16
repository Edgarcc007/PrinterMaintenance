from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date, datetime, timedelta
from app.database import get_db
from app.models.models import MaintenanceRecord, MaintenanceSchedule, MaintenanceCategory, Printer
from app.schemas.schemas import RecordCreate, RecordUpdate, RecordResponse

router = APIRouter(prefix="/api/maintenance", tags=["Maintenance Records"])

@router.get("/", response_model=List[RecordResponse])
def get_all(
    printer_id: Optional[int] = None,
    type: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db)
):
    q = db.query(MaintenanceRecord).options(
        joinedload(MaintenanceRecord.printer).joinedload(Printer.location),
        joinedload(MaintenanceRecord.category)
    )
    if printer_id:
        q = q.filter(MaintenanceRecord.printer_id == printer_id)
    if type:
        q = q.filter(MaintenanceRecord.type == type)
    if from_date:
        q = q.filter(MaintenanceRecord.performed_at >= datetime.combine(from_date, datetime.min.time()))
    if to_date:
        q = q.filter(MaintenanceRecord.performed_at <= datetime.combine(to_date, datetime.max.time()))
    return q.order_by(MaintenanceRecord.performed_at.desc()).limit(limit).all()

@router.get("/{id}", response_model=RecordResponse)
def get_one(id: int, db: Session = Depends(get_db)):
    r = db.query(MaintenanceRecord).options(
        joinedload(MaintenanceRecord.printer),
        joinedload(MaintenanceRecord.category)
    ).filter(MaintenanceRecord.id == id).first()
    if not r:
        raise HTTPException(404, "Record not found")
    return r



@router.put("/{id}", response_model=RecordResponse)
def update_record(id: int, data: RecordUpdate, db: Session = Depends(get_db)):
    record = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == id).first()
    if not record:
        raise HTTPException(404, "Record not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(record, key, value)

    # If completing, update the related schedule
    if data.status == "Completed":
        schedule = db.query(MaintenanceSchedule).filter(
            MaintenanceSchedule.printer_id == record.printer_id,
            MaintenanceSchedule.category_id == record.category_id,
            MaintenanceSchedule.is_active == True
        ).first()
        if schedule:
            today = date.today()
            schedule.last_performed = today
            if schedule.frequency_days:
                schedule.next_due_date = today + timedelta(days=schedule.frequency_days)

    db.commit()
    db.refresh(record)

    return db.query(MaintenanceRecord).options(
        joinedload(MaintenanceRecord.printer).joinedload(Printer.location),
        joinedload(MaintenanceRecord.category)
    ).filter(MaintenanceRecord.id == record.id).first()

@router.post("/", response_model=RecordResponse, status_code=201)
def create(data: RecordCreate, db: Session = Depends(get_db)):
    printer = db.query(Printer).filter(Printer.id == data.printer_id).first()
    if not printer:
        raise HTTPException(404, "Printer not found")
    category = db.query(MaintenanceCategory).filter(MaintenanceCategory.id == data.category_id).first()
    if not category:
        raise HTTPException(404, "Category not found")

    record = MaintenanceRecord(**data.model_dump())

    if data.type == "Preventive" and category.frequency_days and not data.next_due_date:
        performed = data.performed_at or datetime.now()
        if isinstance(performed, datetime):
            record.next_due_date = (performed + timedelta(days=category.frequency_days)).date()

    db.add(record)

    schedule = db.query(MaintenanceSchedule).filter(
        MaintenanceSchedule.printer_id == data.printer_id,
        MaintenanceSchedule.category_id == data.category_id,
        MaintenanceSchedule.is_active == True
    ).first()

    if schedule:
        today = date.today()
        schedule.last_performed = today
        if schedule.frequency_days:
            schedule.next_due_date = today + timedelta(days=schedule.frequency_days)

    db.commit()
    db.refresh(record)

    return db.query(MaintenanceRecord).options(
        joinedload(MaintenanceRecord.printer).joinedload(Printer.location),
        joinedload(MaintenanceRecord.category)
    ).filter(MaintenanceRecord.id == record.id).first()

