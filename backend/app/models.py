from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from app.core.database import Base
import enum
from datetime import datetime


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    DISPATCHER = "DISPATCHER"
    DRIVER = "DRIVER"
    CLIENT = "CLIENT"


class VehicleStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    MAINTENANCE = "MAINTENANCE"
    IDLE = "IDLE"
    SOS = "SOS"
    IN_PROGRESS = "IN_PROGRESS"


class OrderStatus(str, enum.Enum):
    NEW = "NEW"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class MaintenanceStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.CLIENT)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    driver_profile = relationship("Driver", back_populates="user", uselist=False, cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="customer", foreign_keys="Order.customer_id")


class Driver(Base):
    __tablename__ = "drivers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    license_number = Column(String, unique=True, nullable=True)
    rating = Column(Float, default=0.0)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="driver_profile")
    vehicle_assignments = relationship("Vehicle", back_populates="driver", foreign_keys="Vehicle.driver_id")


class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    vin = Column(String, unique=True, index=True, nullable=False)
    plate_number = Column(String, unique=True, index=True, nullable=False)
    make = Column(String, nullable=False)
    model = Column(String, nullable=False)
    status = Column(Enum(VehicleStatus), default=VehicleStatus.IDLE, nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    
    # GeoAlchemy2 for spatial queries (POINT: lat, lng)
    current_location = Column(Geometry('POINT', srid=4326), nullable=True)
    fuel_level = Column(Float, default=100.0)  # Percentage
    norm_consumption = Column(Float, nullable=False)  # L/100km
    current_speed = Column(Float, default=0.0)  # km/h
    mileage = Column(Float, default=0.0)  # Total km
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    driver = relationship("Driver", back_populates="vehicle_assignments")
    orders = relationship("Order", back_populates="vehicle")
    fuel_logs = relationship("FuelLog", back_populates="vehicle", cascade="all, delete-orphan")
    maintenance_records = relationship("MaintenanceRecord", back_populates="vehicle", cascade="all, delete-orphan")
    tracking_points = relationship("TrackingPoint", back_populates="vehicle", cascade="all, delete-orphan")


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    
    customer_name = Column(String, nullable=False)
    pickup_address = Column(String, nullable=False)
    delivery_address = Column(String, nullable=False)
    
    # GeoAlchemy2 for spatial queries
    pickup_location = Column(Geometry('POINT', srid=4326), nullable=True)
    delivery_location = Column(Geometry('POINT', srid=4326), nullable=True)
    
    # === НОВЫЕ ПОЛЯ ===
    weight = Column(Float, nullable=False, default=0.0)  # кг
    volume = Column(Float, nullable=False, default=0.0)  # м3
    dimensions = Column(String, nullable=True)  # формат "ДxШxВ"
    distance_km = Column(Float, nullable=False, default=0.0)
    # ==================

    status = Column(Enum(OrderStatus), default=OrderStatus.NEW, nullable=False)
    price = Column(Float, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    delivery_date = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    customer = relationship("User", back_populates="orders", foreign_keys=[customer_id])
    vehicle = relationship("Vehicle", back_populates="orders")
    route_points = relationship("RoutePoint", back_populates="order", cascade="all, delete-orphan")


class RoutePoint(Base):
    __tablename__ = "route_points"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    sequence = Column(Integer, nullable=False)  # Order in route
    address = Column(String, nullable=False)
    location = Column(Geometry('POINT', srid=4326), nullable=True)
    
    # Relationships
    order = relationship("Order", back_populates="route_points")


class FuelLog(Base):
    __tablename__ = "fuel_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    
    liters = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)
    mileage = Column(Float, nullable=False)  # Odometer reading
    location = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="fuel_logs")


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    
    type = Column(String, nullable=False)  # e.g., "Oil Change", "Tire Replacement"
    description = Column(Text, nullable=True)
    cost = Column(Float, nullable=False)
    status = Column(Enum(MaintenanceStatus), default=MaintenanceStatus.SCHEDULED, nullable=False)
    
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    completed_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="maintenance_records")


class TrackingPoint(Base):
    __tablename__ = "tracking_points"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    
    location = Column(Geometry('POINT', srid=4326), nullable=False)
    speed = Column(Float, default=0.0)
    fuel_level = Column(Float, nullable=True)
    heading = Column(Float, nullable=True)  # Direction in degrees
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="tracking_points")