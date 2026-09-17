from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Date,
    DateTime, Enum as PgEnum, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class MaintenanceTypeEnum(str, enum.Enum):
    Preventive = "Preventive"
    Corrective = "Corrective"


class UserRole(str, enum.Enum):
    admin = "admin"
    technician = "technician"
    viewer = "viewer"


class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())
    printers = relationship("Printer", back_populates="location")


class Printer(Base):
    __tablename__ = "printers"
    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String(50), nullable=False)
    model = Column(String(100), nullable=False)
    serial_number = Column(String(100), unique=True, nullable=False)
    asset_tag = Column(String(50))
    ip_address = Column(String(45))
    location_id = Column(Integer, ForeignKey("locations.id"))
    production_line = Column(String(100))
    installation_date = Column(Date)
    status = Column(String(20), default="Active")
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    location = relationship("Location", back_populates="printers")
    maintenance_records = relationship("MaintenanceRecord", back_populates="printer")
    schedules = relationship("MaintenanceSchedule", back_populates="printer")


class MaintenanceCategory(Base):
    __tablename__ = "maintenance_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(PgEnum(MaintenanceTypeEnum, name="maintenance_type", create_type=False), nullable=False)
    description = Column(String(255))
    estimated_minutes = Column(Integer, default=30)
    frequency_days = Column(Integer)
    applies_to = Column(String(50), default="Both")
    records = relationship("MaintenanceRecord", back_populates="category")
    schedules = relationship("MaintenanceSchedule", back_populates="category")


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"
    id = Column(Integer, primary_key=True, index=True)
    printer_id = Column(Integer, ForeignKey("printers.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("maintenance_categories.id"), nullable=False)
    type = Column(PgEnum(MaintenanceTypeEnum, name="maintenance_type", create_type=False), nullable=False)
    performed_by = Column(String(100), nullable=False)
    performed_at = Column(DateTime, server_default=func.now())
    next_due_date = Column(Date)
    duration_minutes = Column(Integer)
    findings = Column(Text)
    actions_taken = Column(Text)
    parts_replaced = Column(Text)
    status = Column(String(20), default="Completed")
    created_at = Column(DateTime, server_default=func.now())
    printer = relationship("Printer", back_populates="maintenance_records")
    category = relationship("MaintenanceCategory", back_populates="records")


class MaintenanceSchedule(Base):
    __tablename__ = "maintenance_schedule"
    id = Column(Integer, primary_key=True, index=True)
    printer_id = Column(Integer, ForeignKey("printers.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("maintenance_categories.id"), nullable=False)
    frequency_days = Column(Integer, nullable=False)
    last_performed = Column(Date)
    next_due_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    printer = relationship("Printer", back_populates="schedules")
    category = relationship("MaintenanceCategory", back_populates="schedules")


class Supply(Base):
    __tablename__ = "supplies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)
    unit = Column(String(20), default="units")
    compatible_brand = Column(String(50))
    compatible_model = Column(String(100))
    part_number = Column(String(100))
    current_stock = Column(Integer, default=0)
    min_stock = Column(Integer, default=0)
    max_stock = Column(Integer, default=0)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    movements = relationship("StockMovement", back_populates="supply", cascade="all, delete-orphan")

    @property
    def stock_status(self):
        if self.current_stock <= self.min_stock:
            return "Low"
        if self.max_stock > 0 and self.current_stock >= self.max_stock:
            return "Overstock"
        return "OK"


class StockMovement(Base):
    __tablename__ = "stock_movements"
    id = Column(Integer, primary_key=True, index=True)
    supply_id = Column(Integer, ForeignKey("supplies.id"), nullable=False)
    movement_type = Column(String(10), nullable=False)
    quantity = Column(Integer, nullable=False)
    reference = Column(String(200))
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    supply = relationship("Supply", back_populates="movements")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    password_hash = Column(String(64), nullable=False)
    role = Column(PgEnum(UserRole, name="user_role", create_type=False), default=UserRole.technician)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    audit_logs = relationship("AuditLog", back_populates="user")


class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False)
    detail = Column(Text)
    ip_address = Column(String(45))
    created_at = Column(DateTime, server_default=func.now())
    user = relationship("User", back_populates="audit_logs")
