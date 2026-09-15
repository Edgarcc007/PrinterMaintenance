from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime
from enum import Enum

class MaintenanceTypeEnum(str, Enum):
    Preventive = "Preventive"
    Corrective = "Corrective"

class LocationBase(BaseModel):
    name: str
    description: Optional[str] = None

class LocationCreate(LocationBase):
    pass

class LocationResponse(LocationBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class PrinterBase(BaseModel):
    brand: str
    model: str
    serial_number: str
    asset_tag: Optional[str] = None
    ip_address: Optional[str] = None
    location_id: Optional[int] = None
    production_line: Optional[str] = None
    installation_date: Optional[date] = None
    status: Optional[str] = "Active"
    notes: Optional[str] = None

class PrinterCreate(PrinterBase):
    pass

class PrinterUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    asset_tag: Optional[str] = None
    ip_address: Optional[str] = None
    location_id: Optional[int] = None
    production_line: Optional[str] = None
    installation_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class PrinterResponse(PrinterBase):
    id: int
    location: Optional[LocationResponse] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class CategoryBase(BaseModel):
    name: str
    type: MaintenanceTypeEnum
    description: Optional[str] = None
    estimated_minutes: Optional[int] = 30
    frequency_days: Optional[int] = None
    applies_to: Optional[str] = "Both"

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class RecordBase(BaseModel):
    printer_id: int
    category_id: int
    type: MaintenanceTypeEnum
    performed_by: str
    performed_at: Optional[datetime] = None
    next_due_date: Optional[date] = None
    duration_minutes: Optional[int] = None
    findings: Optional[str] = None
    actions_taken: Optional[str] = None
    parts_replaced: Optional[str] = None
    status: Optional[str] = "Completed"

class RecordCreate(RecordBase):
    pass


class RecordUpdate(BaseModel):
    performed_by: Optional[str] = None
    performed_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    findings: Optional[str] = None
    actions_taken: Optional[str] = None
    parts_replaced: Optional[str] = None
    status: Optional[str] = None
    next_due_date: Optional[date] = None

class RecordResponse(RecordBase):
    id: int
    printer: Optional[PrinterResponse] = None
    category: Optional[CategoryResponse] = None
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class ScheduleBase(BaseModel):
    printer_id: int
    category_id: int
    frequency_days: int
    last_performed: Optional[date] = None
    next_due_date: date
    is_active: Optional[bool] = True

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleResponse(ScheduleBase):
    id: int
    printer: Optional[PrinterResponse] = None
    category: Optional[CategoryResponse] = None
    model_config = ConfigDict(from_attributes=True)

class DashboardStats(BaseModel):
    total_printers: int
    active_printers: int
    in_repair: int
    overdue_maintenance: int
    upcoming_7_days: int
    completed_this_month: int
    corrective_this_month: int

class OverduePrinter(BaseModel):
    printer_id: int
    brand: str
    model: str
    serial_number: str
    location: Optional[str] = None
    maintenance_task: str
    due_date: date
    days_overdue: int

