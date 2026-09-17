from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SupplyBase(BaseModel):
    name: str
    category: str
    unit: Optional[str] = "units"
    compatible_brand: Optional[str] = None
    compatible_model: Optional[str] = None
    part_number: Optional[str] = None
    current_stock: Optional[int] = 0
    min_stock: Optional[int] = 0
    max_stock: Optional[int] = 0
    notes: Optional[str] = None

class SupplyCreate(SupplyBase):
    pass

class SupplyUpdate(SupplyBase):
    pass

class SupplyOut(SupplyBase):
    id: int
    stock_status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class MovementBase(BaseModel):
    movement_type: str
    quantity: int
    reference: Optional[str] = None
    notes: Optional[str] = None

class MovementCreate(MovementBase):
    pass

class MovementOut(MovementBase):
    id: int
    supply_id: int
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class StockAlert(BaseModel):
    id: int
    name: str
    category: str
    compatible_brand: Optional[str] = None
    current_stock: int
    min_stock: int
    deficit: int
