from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum


# Enums matching frontend types
class UserRole(str, Enum):
    ADMIN = "ADMIN"
    DISPATCHER = "DISPATCHER"
    DRIVER = "DRIVER"
    CLIENT = "CLIENT"


class VehicleStatus(str, Enum):
    ACTIVE = "ACTIVE"
    MAINTENANCE = "MAINTENANCE"
    IDLE = "IDLE"
    SOS = "SOS"
    IN_PROGRESS = "IN_PROGRESS"


class OrderStatus(str, Enum):
    NEW = "NEW"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class MaintenanceStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"


# Coordinates helper
class Coordinates(BaseModel):
    lat: float
    lng: float


# ============ AUTH SCHEMAS ============
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole = UserRole.CLIENT


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)


# ============ DRIVER SCHEMAS ============
class DriverCreate(BaseModel):
    user_id: int
    license_number: Optional[str] = None
    avatar_url: Optional[str] = None


class DriverCreateWithUser(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    avatar_url: Optional[str] = None


class DriverResponse(BaseModel):
    id: int
    user_id: int
    license_number: Optional[str] = None
    rating: float
    avatar_url: Optional[str] = None
    user: Optional[UserResponse] = None
    
    model_config = ConfigDict(from_attributes=True)


# ============ VEHICLE SCHEMAS ============
class VehicleCreate(BaseModel):
    vin: str
    plate_number: str
    make: str
    model: str
    norm_consumption: float = Field(..., description="Liters per 100km")
    status: VehicleStatus = VehicleStatus.IDLE
    driver_id: Optional[int] = None


class VehicleUpdate(BaseModel):
    vin: Optional[str] = None
    plate_number: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    status: Optional[VehicleStatus] = None
    driver_id: Optional[int] = None
    norm_consumption: Optional[float] = None
    fuel_level: Optional[float] = None
    current_location: Optional[Coordinates] = None


class VehicleResponse(BaseModel):
    id: int
    vin: str
    plate_number: str
    make: str
    model: str
    status: VehicleStatus
    driver_id: Optional[int] = None
    current_location: Optional[Coordinates] = None
    fuel_level: Optional[float] = None
    norm_consumption: float
    current_speed: Optional[float] = None
    mileage: Optional[float] = None
    driver: Optional[DriverResponse] = None
    created_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# ============ ORDER & CALCULATOR SCHEMAS ============

# Схема для запроса расчета цены
class OrderCalculateRequest(BaseModel):
    pickup_location: Coordinates
    delivery_location: Coordinates
    weight: float = Field(gt=0, description="Вес в кг")
    length: float = Field(gt=0, description="Длина в см")
    width: float = Field(gt=0, description="Ширина в см")
    height: float = Field(gt=0, description="Высота в см")

# Схема ответа калькулятора
class OrderCalculateResponse(BaseModel):
    price: float
    distance_km: float
    volume_m3: float
    chargeable_weight: float

# Схема для назначения водителя
class OrderAssignRequest(BaseModel):
    vehicle_id: int

class OrderCreate(BaseModel):
    customer_name: str
    pickup_address: str
    delivery_address: str
    price: float
    
    # Геоданные
    pickup_location: Optional[Coordinates] = None
    delivery_location: Optional[Coordinates] = None
    
    # Новые логистические поля (обязательные)
    weight: float
    length: float
    width: float
    height: float
    distance_km: float
    
    delivery_date: Optional[datetime] = None


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    vehicle_id: Optional[int] = None
    customer_name: Optional[str] = None
    price: Optional[float] = None


class OrderResponse(BaseModel):
    id: int
    customer_id: int
    vehicle_id: Optional[int] = None
    customer_name: str
    pickup_address: str
    delivery_address: str
    status: OrderStatus
    price: float
    
    # Новые поля в ответе
    weight: float = 0.0
    volume: float = 0.0
    dimensions: Optional[str] = None
    distance_km: float = 0.0
    
    created_at: datetime
    delivery_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    vehicle: Optional[VehicleResponse] = None
    
    model_config = ConfigDict(from_attributes=True)


# ============ FUEL LOG SCHEMAS ============
class FuelLogCreate(BaseModel):
    vehicle_id: int
    liters: float
    cost: float
    mileage: float
    location: Optional[str] = None


class FuelLogResponse(BaseModel):
    id: int
    vehicle_id: int
    liters: float
    cost: float
    mileage: float
    location: Optional[str] = None
    created_at: datetime
    vehicle: Optional[VehicleResponse] = None
    
    model_config = ConfigDict(from_attributes=True)


# ============ MAINTENANCE SCHEMAS ============
class MaintenanceRecordCreate(BaseModel):
    vehicle_id: int
    type: str
    description: Optional[str] = None
    cost: float
    scheduled_date: datetime
    status: MaintenanceStatus = MaintenanceStatus.SCHEDULED


class MaintenanceRecordUpdate(BaseModel):
    type: Optional[str] = None
    description: Optional[str] = None
    cost: Optional[float] = None
    status: Optional[MaintenanceStatus] = None
    completed_date: Optional[datetime] = None


class MaintenanceRecordResponse(BaseModel):
    id: int
    vehicle_id: int
    type: str
    description: Optional[str] = None
    cost: float
    status: MaintenanceStatus
    scheduled_date: datetime
    completed_date: Optional[datetime] = None
    created_at: datetime
    vehicle: Optional[VehicleResponse] = None
    
    model_config = ConfigDict(from_attributes=True)


# ============ TRACKING SCHEMAS ============
class TrackingPointCreate(BaseModel):
    vehicle_id: int
    location: Coordinates
    speed: float = 0.0
    fuel_level: Optional[float] = None
    heading: Optional[float] = None


class TrackingPointResponse(BaseModel):
    id: int
    vehicle_id: int
    location: Coordinates
    speed: float
    fuel_level: Optional[float] = None
    heading: Optional[float] = None
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============ ANALYTICS SCHEMAS ============
class FuelAnalysisResult(BaseModel):
    vehicle_id: int
    plate_number: str
    make: str
    model: str
    total_distance: float
    total_fuel_used: float
    expected_fuel: float
    difference: float
    deviation_percent: float
    status: str  # NORMAL, WARNING, CRITICAL


class DashboardStats(BaseModel):
    total_vehicles: int
    active_vehicles: int
    total_orders: int
    active_orders: int
    total_revenue: float
    issues_count: int