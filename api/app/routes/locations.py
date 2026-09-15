from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Location
from app.schemas.schemas import LocationCreate, LocationResponse

router = APIRouter(prefix="/api/locations", tags=["Locations"])

@router.get("/", response_model=List[LocationResponse])
def get_all(db: Session = Depends(get_db)):
    return db.query(Location).order_by(Location.name).all()

@router.post("/", response_model=LocationResponse, status_code=201)
def create(data: LocationCreate, db: Session = Depends(get_db)):
    loc = Location(**data.model_dump())
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc

@router.put("/{id}", response_model=LocationResponse)
def update(id: int, data: LocationCreate, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == id).first()
    if not loc:
        raise HTTPException(404, "Location not found")
    for k, v in data.model_dump().items():
        setattr(loc, k, v)
    db.commit()
    db.refresh(loc)
    return loc

@router.delete("/{id}", status_code=204)
def delete(id: int, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == id).first()
    if not loc:
        raise HTTPException(404, "Location not found")
    db.delete(loc)
    db.commit()
