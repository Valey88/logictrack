import json
from typing import List, Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from geoalchemy2.shape import to_shape
from geoalchemy2.elements import WKTElement

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import User, Vehicle, TrackingPoint
from app.schemas import Coordinates, TrackingPointCreate, TrackingPointResponse

router = APIRouter(prefix="/tracking", tags=["tracking"])


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.vehicle_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, vehicle_id: int = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if vehicle_id:
            if vehicle_id not in self.vehicle_connections:
                self.vehicle_connections[vehicle_id] = []
            self.vehicle_connections[vehicle_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, vehicle_id: int = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if vehicle_id and vehicle_id in self.vehicle_connections:
            if websocket in self.vehicle_connections[vehicle_id]:
                self.vehicle_connections[vehicle_id].remove(websocket)
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
    
    async def broadcast(self, message: str):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                self.disconnect(connection)
    
    async def broadcast_to_vehicle(self, vehicle_id: int, message: str):
        if vehicle_id not in self.vehicle_connections:
            return
        for connection in list(self.vehicle_connections[vehicle_id]):
            try:
                await connection.send_text(message)
            except Exception:
                self.disconnect(connection, vehicle_id)


manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                message_type = message.get("type")
                
                if message_type == "subscribe":
                    vehicle_id = message.get("vehicle_id")
                    if vehicle_id:
                        await manager.connect(websocket, vehicle_id)
                        await manager.send_personal_message(
                            json.dumps({"type": "subscribed", "vehicle_id": vehicle_id}),
                            websocket
                        )
                
                elif message_type == "ping":
                    await manager.send_personal_message(
                        json.dumps({"type": "pong"}),
                        websocket
                    )
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.post("/points", response_model=TrackingPointResponse)
async def create_tracking_point(
    point_data: TrackingPointCreate,
    db: AsyncSession = Depends(get_db)
):
    vehicle_result = await db.execute(select(Vehicle).where(Vehicle.id == point_data.vehicle_id))
    vehicle = vehicle_result.scalar_one_or_none()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Use WKTElement for insertion
    point_geom = WKTElement(f"POINT({point_data.location.lng} {point_data.location.lat})", srid=4326)
    
    new_point = TrackingPoint(
        vehicle_id=point_data.vehicle_id,
        location=point_geom,
        speed=point_data.speed,
        fuel_level=point_data.fuel_level,
        heading=point_data.heading
    )
    
    vehicle.current_location = point_geom
    vehicle.current_speed = point_data.speed
    if point_data.fuel_level is not None:
        vehicle.fuel_level = point_data.fuel_level
    
    db.add(new_point)
    await db.commit()
    await db.refresh(new_point)
    
    update_message = json.dumps({
        "type": "vehicle_update",
        "vehicle_id": vehicle.id,
        "data": {
            "id": vehicle.id,
            "plate_number": vehicle.plate_number,
            "current_location": {
                "lat": point_data.location.lat,
                "lng": point_data.location.lng
            },
            "speed": point_data.speed,
            "fuel_level": point_data.fuel_level,
            "status": vehicle.status.value
        }
    })
    
    await manager.broadcast(update_message)
    await manager.broadcast_to_vehicle(vehicle.id, update_message)
    
    point_dict = {
        **{c.name: getattr(new_point, c.name) for c in TrackingPoint.__table__.columns},
        "location": point_data.location
    }
    return TrackingPointResponse(**point_dict)


@router.get("/vehicles/{vehicle_id}/history", response_model=List[TrackingPointResponse])
async def get_vehicle_tracking_history(
    vehicle_id: int,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(TrackingPoint)
        .where(TrackingPoint.vehicle_id == vehicle_id)
        .order_by(TrackingPoint.timestamp.desc())
        .limit(limit)
    )
    points = result.scalars().all()
    
    response = []
    for point in points:
        shape = to_shape(point.location)
        point_dict = {
            **{c.name: getattr(point, c.name) for c in TrackingPoint.__table__.columns},
            "location": Coordinates(lat=shape.y, lng=shape.x)
        }
        response.append(TrackingPointResponse(**point_dict))
    
    return response