from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.models import Supply, StockMovement
from app.schemas.stock_schemas import (
    SupplyCreate, SupplyUpdate, SupplyOut,
    MovementCreate, MovementOut, StockAlert
)

router = APIRouter(prefix="/api/stock", tags=["Stock"])


@router.get("/supplies/", response_model=List[SupplyOut])
def get_supplies(category: Optional[str] = None, brand: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Supply)
    if category:
        q = q.filter(Supply.category == category)
    if brand:
        q = q.filter(Supply.compatible_brand == brand)
    return q.order_by(Supply.name).all()


@router.get("/supplies/{supply_id}", response_model=SupplyOut)
def get_supply(supply_id: int, db: Session = Depends(get_db)):
    s = db.query(Supply).filter(Supply.id == supply_id).first()
    if not s:
        raise HTTPException(404, "Supply not found")
    return s


@router.post("/supplies/", response_model=SupplyOut)
def create_supply(data: SupplyCreate, db: Session = Depends(get_db)):
    s = Supply(**data.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.put("/supplies/{supply_id}", response_model=SupplyOut)
def update_supply(supply_id: int, data: SupplyUpdate, db: Session = Depends(get_db)):
    s = db.query(Supply).filter(Supply.id == supply_id).first()
    if not s:
        raise HTTPException(404, "Supply not found")
    for k, v in data.model_dump().items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s


@router.delete("/supplies/{supply_id}", status_code=204)
def delete_supply(supply_id: int, db: Session = Depends(get_db)):
    s = db.query(Supply).filter(Supply.id == supply_id).first()
    if not s:
        raise HTTPException(404, "Supply not found")
    db.delete(s)
    db.commit()


@router.get("/alerts/", response_model=List[StockAlert])
def get_stock_alerts(db: Session = Depends(get_db)):
    supplies = db.query(Supply).filter(Supply.current_stock <= Supply.min_stock).all()
    return [
        StockAlert(
            id=s.id, name=s.name, category=s.category,
            compatible_brand=s.compatible_brand,
            current_stock=s.current_stock, min_stock=s.min_stock,
            deficit=s.min_stock - s.current_stock
        ) for s in supplies
    ]


@router.post("/supplies/{supply_id}/movements/", response_model=MovementOut)
def create_movement(supply_id: int, data: MovementCreate, db: Session = Depends(get_db)):
    s = db.query(Supply).filter(Supply.id == supply_id).first()
    if not s:
        raise HTTPException(404, "Supply not found")
    if data.movement_type == "IN":
        s.current_stock += data.quantity
    elif data.movement_type == "OUT":
        if s.current_stock < data.quantity:
            raise HTTPException(400, f"Insufficient stock. Current: {s.current_stock}")
        s.current_stock -= data.quantity
    else:
        raise HTTPException(400, "movement_type must be IN or OUT")
    m = StockMovement(supply_id=supply_id, **data.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@router.get("/supplies/{supply_id}/movements/", response_model=List[MovementOut])
def get_movements(supply_id: int, db: Session = Depends(get_db)):
    return db.query(StockMovement).filter(
        StockMovement.supply_id == supply_id
    ).order_by(StockMovement.created_at.desc()).all()


@router.get("/movements/recent/", response_model=List[MovementOut])
def get_recent_movements(limit: int = 10, db: Session = Depends(get_db)):
    return db.query(StockMovement).order_by(
        StockMovement.created_at.desc()
    ).limit(limit).all()
