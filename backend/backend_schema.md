# Backend Architecture & Database Schema

Since the environment is strictly Frontend (React), this document serves as the architectural blueprint for the Python/FastAPI backend.

## Step 1: Database Schema (SQLAlchemy + GeoAlchemy2)

```python
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from database import Base
import enum

class Role(enum.Enum):
    ADMIN = "ADMIN"
    DISPATCHER = "DISPATCHER"
    DRIVER = "DRIVER"
    CLIENT = "CLIENT"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(Role))
    driver_profile = relationship("Driver", back_populates="user", uselist=False)

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True)
    vin = Column(String, unique=True, index=True)
    plate_number = Column(String, unique=True)
    make = Column(String)
    model = Column(String)
    # GeoAlchemy2 for spatial queries
    current_location = Column(Geometry('POINT', srid=4326)) 
    fuel_norm = Column(Float) # L/100km
    orders = relationship("Order", back_populates="vehicle")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("users.id"))
    pickup_geom = Column(Geometry('POINT', srid=4326))
    delivery_geom = Column(Geometry('POINT', srid=4326))
    price = Column(Float)
    status = Column(String) # NEW, IN_PROGRESS, etc.
    vehicle = relationship("Vehicle", back_populates="orders")

class FuelLog(Base):
    __tablename__ = "fuel_logs"
    id = Column(Integer, primary_key=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    liters = Column(Float)
    mileage_odometer = Column(Integer)
    timestamp = Column(DateTime)
```

## Step 2: FastAPI Structure

```
/app
  /api
    /v1
      auth.py       # Login (JWT), Me
      vehicles.py   # CRUD, Assign Driver
      orders.py     # Create, Drag & Drop Update
      tracking.py   # WebSocket endpoint
  /core
    config.py
    security.py
  /models
  /schemas
  main.py
```

### WebSocket Endpoint Logic (app/api/v1/tracking.py)

```python
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws/tracking")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # In a real app, this consumes from Redis/Kafka or a background task
            # pushing GPS updates from drivers
            data = await websocket.receive_text() 
            await manager.broadcast(f"Update: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
```
