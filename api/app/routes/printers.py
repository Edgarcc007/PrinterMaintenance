from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db
from app.models.models import Printer
from app.schemas.schemas import PrinterCreate, PrinterUpdate, PrinterResponse

router = APIRouter(prefix="/api/printers", tags=["Printers"])

@router.get("/", response_model=List[PrinterResponse])
def get_all(
    brand: Optional[str] = None,
    status: Optional[str] = None,
    location_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Printer).options(joinedload(Printer.location))
    if brand:
        q = q.filter(Printer.brand == brand)
    if status:
        q = q.filter(Printer.status == status)
    if location_id:
        q = q.filter(Printer.location_id == location_id)
    if search:
        pattern = f"%{search}%"
        q = q.filter(
            (Printer.serial_number.ilike(pattern)) |
            (Printer.model.ilike(pattern)) |
            (Printer.asset_tag.ilike(pattern))
        )
    return q.order_by(Printer.brand, Printer.model).all()

@router.get("/{id}", response_model=PrinterResponse)
def get_one(id: int, db: Session = Depends(get_db)):
    p = db.query(Printer).options(joinedload(Printer.location)).filter(Printer.id == id).first()
    if not p:
        raise HTTPException(404, "Printer not found")
    return p

@router.post("/", response_model=PrinterResponse, status_code=201)
def create(data: PrinterCreate, db: Session = Depends(get_db)):
    existing = db.query(Printer).filter(Printer.serial_number == data.serial_number).first()
    if existing:
        raise HTTPException(409, f"Serial {data.serial_number} already exists")
    printer = Printer(**data.model_dump())
    db.add(printer)
    db.commit()
    db.refresh(printer)
    return db.query(Printer).options(joinedload(Printer.location)).filter(Printer.id == printer.id).first()

@router.put("/{id}", response_model=PrinterResponse)
def update(id: int, data: PrinterUpdate, db: Session = Depends(get_db)):
    printer = db.query(Printer).filter(Printer.id == id).first()
    if not printer:
        raise HTTPException(404, "Printer not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(printer, k, v)
    db.commit()
    db.refresh(printer)
    return db.query(Printer).options(joinedload(Printer.location)).filter(Printer.id == printer.id).first()

@router.delete("/{id}", status_code=204)
def delete(id: int, db: Session = Depends(get_db)):
    printer = db.query(Printer).filter(Printer.id == id).first()
    if not printer:
        raise HTTPException(404, "Printer not found")
    db.delete(printer)
    db.commit()
