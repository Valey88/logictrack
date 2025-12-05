from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from geoalchemy2.shape import to_shape
from geoalchemy2.elements import WKTElement  # Используем WKTElement для записи
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.security import get_current_active_user, require_role
from app.core.email import email_service
from app.core.config import settings
from app.models import User, Order, OrderStatus, Vehicle, Driver, VehicleStatus
from app.schemas import (
    OrderCreate,
    OrderUpdate,
    OrderResponse,
    Coordinates,
    OrderCalculateRequest,
    OrderCalculateResponse,
    OrderAssignRequest
)
from app.services.pricing import calculate_haversine_distance, calculate_order_price

router = APIRouter(prefix="/orders", tags=["orders"])


def point_to_coords(point) -> Optional[Coordinates]:
    """Convert GeoAlchemy2 POINT to Coordinates safe."""
    if point is None:
        return None
    try:
        # GeoAlchemy2 возвращает WKBElement, преобразуем в shapely для чтения
        shape = to_shape(point)
        return Coordinates(lat=shape.y, lng=shape.x)
    except Exception:
        return None


def coords_to_geom(coords: Coordinates) -> WKTElement:
    """Convert Coordinates to WKTElement for DB insertion."""
    # SRID 4326 is standard GPS (WGS 84)
    return WKTElement(f"POINT({coords.lng} {coords.lat})", srid=4326)


@router.post("/calculate", response_model=OrderCalculateResponse)
async def calculate_price(data: OrderCalculateRequest):
    dist_km = calculate_haversine_distance(
        data.pickup_location.lat, data.pickup_location.lng,
        data.delivery_location.lat, data.delivery_location.lng
    )
    
    result = calculate_order_price(
        dist_km=dist_km,
        weight_kg=data.weight,
        length_cm=data.length,
        width_cm=data.width,
        height_cm=data.height
    )
    
    return OrderCalculateResponse(**result)


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # 1. Dimensions string
    dimensions_str = f"{order_data.length}x{order_data.width}x{order_data.height}"
    
    # 2. Volume (m3)
    volume = (order_data.length * order_data.width * order_data.height) / 1_000_000

    # 3. Prepare geometry
    pickup_geom = coords_to_geom(order_data.pickup_location) if order_data.pickup_location else None
    delivery_geom = coords_to_geom(order_data.delivery_location) if order_data.delivery_location else None

    # 4. Create Order
    new_order = Order(
        customer_id=current_user.id,
        customer_name=order_data.customer_name,
        pickup_address=order_data.pickup_address,
        delivery_address=order_data.delivery_address,
        pickup_location=pickup_geom,
        delivery_location=delivery_geom,
        weight=order_data.weight,
        dimensions=dimensions_str,
        volume=volume,
        distance_km=order_data.distance_km,
        price=order_data.price,
        delivery_date=order_data.delivery_date,
        status=OrderStatus.NEW
    )
    
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)
    
    return OrderResponse(
        id=new_order.id,
        customer_id=new_order.customer_id,
        customer_name=new_order.customer_name,
        pickup_address=new_order.pickup_address,
        delivery_address=new_order.delivery_address,
        status=new_order.status,
        price=new_order.price,
        weight=new_order.weight,
        volume=new_order.volume,
        dimensions=new_order.dimensions,
        distance_km=new_order.distance_km,
        created_at=new_order.created_at,
        delivery_date=new_order.delivery_date,
        vehicle=None,
        pickup_location=order_data.pickup_location,
        delivery_location=order_data.delivery_location
    )


@router.get("", response_model=List[OrderResponse])
async def get_orders(
    status_filter: Optional[OrderStatus] = Query(None, alias="status"),
    customer_id: Optional[int] = Query(None),
    vehicle_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = select(Order).options(
        selectinload(Order.vehicle).selectinload(Vehicle.driver).selectinload(Driver.user)
    )
    
    # Client isolation
    if current_user.role.value == "CLIENT":
        query = query.where(Order.customer_id == current_user.id)
    elif customer_id:
        query = query.where(Order.customer_id == customer_id)
    
    if status_filter:
        query = query.where(Order.status == status_filter)
    
    query = query.order_by(Order.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    orders = result.scalars().all()
    
    response = []
    for order in orders:
        response.append(OrderResponse(
            id=order.id,
            customer_id=order.customer_id,
            customer_name=order.customer_name,
            pickup_address=order.pickup_address,
            delivery_address=order.delivery_address,
            status=order.status,
            price=order.price,
            weight=order.weight,
            volume=order.volume,
            dimensions=order.dimensions,
            distance_km=order.distance_km,
            created_at=order.created_at,
            delivery_date=order.delivery_date,
            completed_at=order.completed_at,
            vehicle=order.vehicle,
            pickup_location=point_to_coords(order.pickup_location),
            delivery_location=point_to_coords(order.delivery_location)
        ))
    
    return response


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = select(Order).options(
        selectinload(Order.vehicle).selectinload(Vehicle.driver).selectinload(Driver.user)
    ).where(Order.id == order_id)
    
    if current_user.role.value == "CLIENT":
        query = query.where(Order.customer_id == current_user.id)
    
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer_name,
        pickup_address=order.pickup_address,
        delivery_address=order.delivery_address,
        status=order.status,
        price=order.price,
        weight=order.weight,
        volume=order.volume,
        dimensions=order.dimensions,
        distance_km=order.distance_km,
        created_at=order.created_at,
        delivery_date=order.delivery_date,
        completed_at=order.completed_at,
        vehicle=order.vehicle,
        pickup_location=point_to_coords(order.pickup_location),
        delivery_location=point_to_coords(order.delivery_location)
    )


@router.patch("/{order_id}/assign", response_model=OrderResponse)
async def assign_order(
    order_id: int,
    assign_data: OrderAssignRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "DISPATCHER"]))
):
    result = await db.execute(select(Order).options(selectinload(Order.customer)).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    v_result = await db.execute(select(Vehicle).options(selectinload(Vehicle.driver).selectinload(Driver.user)).where(Vehicle.id == assign_data.vehicle_id))
    vehicle = v_result.scalar_one_or_none()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    order.vehicle_id = vehicle.id
    order.status = OrderStatus.IN_PROGRESS
    vehicle.status = VehicleStatus.IN_PROGRESS
    
    await db.commit()
    await db.refresh(order)
    
    if order.customer and order.customer.email:
        tracking_url = f"{settings.FRONTEND_URL}/track/{order.id}"
        background_tasks.add_task(
            email_service.send_tracking_code,
            to_email=order.customer.email,
            order_id=order.id,
            customer_name=order.customer_name,
            tracking_url=tracking_url
        )
    
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer_name,
        pickup_address=order.pickup_address,
        delivery_address=order.delivery_address,
        status=order.status,
        price=order.price,
        weight=order.weight,
        volume=order.volume,
        dimensions=order.dimensions,
        distance_km=order.distance_km,
        created_at=order.created_at,
        delivery_date=order.delivery_date,
        completed_at=order.completed_at,
        vehicle=vehicle,
        pickup_location=point_to_coords(order.pickup_location),
        delivery_location=point_to_coords(order.delivery_location)
    )