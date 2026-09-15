from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.models import MaintenanceCategory
from app.schemas.schemas import CategoryCreate, CategoryResponse

router = APIRouter(prefix="/api/categories", tags=["Maintenance Categories"])

@router.get("/", response_model=List[CategoryResponse])
def get_all(type: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(MaintenanceCategory)
    if type:
        q = q.filter(MaintenanceCategory.type == type)
    return q.order_by(MaintenanceCategory.type, MaintenanceCategory.name).all()

@router.post("/", response_model=CategoryResponse, status_code=201)
def create(data: CategoryCreate, db: Session = Depends(get_db)):
    cat = MaintenanceCategory(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.delete("/{id}", status_code=204)
def delete(id: int, db: Session = Depends(get_db)):
    cat = db.query(MaintenanceCategory).filter(MaintenanceCategory.id == id).first()
    if not cat:
        raise HTTPException(404, "Category not found")
    db.delete(cat)
    db.commit()
