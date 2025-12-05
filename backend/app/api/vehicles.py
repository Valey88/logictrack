from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from geoalchemy2.shape import to_shape
from geoalchemy2.elements import WKTElement

from app.core.database import get_db
from app.core.security import get_current_active_user, require_role
from app.models import User, Vehicle, VehicleStatus, Driver
from app.schemas import (
    VehicleCreate,
    VehicleUpdate,
    VehicleResponse,
    Coordinates
)

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


def point_to_coords(point) -> Optional[Coordinates]:
    if point is None:
        return None
    try:
        shape = to_shape(point)
        return Coordinates(lat=shape.y, lng=shape.x)
    except Exception:
        return None


def coords_to_geom(coords: Coordinates) -> WKTElement:
    return WKTElement(f"POINT({coords.lng} {coords.lat})", srid=4326)


@router.get("", response_model=List[VehicleResponse])
async def get_vehicles(
    status_filter: Optional[VehicleStatus] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = select(Vehicle).options(
        selectinload(Vehicle.driver).selectinload(Driver.user)
    )
    
    if status_filter:
        query = query.where(Vehicle.status == status_filter)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            (Vehicle.plate_number.ilike(search_term)) |
            (Vehicle.make.ilike(search_term)) |
            (Vehicle.model.ilike(search_term)) |
            (Vehicle.vin.ilike(search_term))
        )
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    vehicles = result.scalars().all()
    
    response = []
    for vehicle in vehicles:
        response.append(VehicleResponse(
            id=vehicle.id,
            vin=vehicle.vin,
            plate_number=vehicle.plate_number,
            make=vehicle.make,
            model=vehicle.model,
            status=vehicle.status,
            driver_id=vehicle.driver_id,
            current_location=point_to_coords(vehicle.current_location),
            fuel_level=vehicle.fuel_level,
            norm_consumption=vehicle.norm_consumption,
            current_speed=vehicle.current_speed,
            mileage=vehicle.mileage,
            driver=vehicle.driver,
            created_at=vehicle.created_at
        ))
    
    return response


@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Vehicle)
        .options(selectinload(Vehicle.driver).selectinload(Driver.user))
        .where(Vehicle.id == vehicle_id)
    )
    vehicle = result.scalar_one_or_none()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    return VehicleResponse(
        id=vehicle.id,
        vin=vehicle.vin,
        plate_number=vehicle.plate_number,
        make=vehicle.make,
        model=vehicle.model,
        status=vehicle.status,
        driver_id=vehicle.driver_id,
        current_location=point_to_coords(vehicle.current_location),
        fuel_level=vehicle.fuel_level,
        norm_consumption=vehicle.norm_consumption,
        current_speed=vehicle.current_speed,
        mileage=vehicle.mileage,
        driver=vehicle.driver,
        created_at=vehicle.created_at
    )


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    vehicle_data: VehicleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "DISPATCHER"]))
):
    existing = await db.execute(
        select(Vehicle).where(
            (Vehicle.vin == vehicle_data.vin) |
            (Vehicle.plate_number == vehicle_data.plate_number)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Vehicle with this VIN or plate number already exists"
        )
    
    new_vehicle = Vehicle(
        vin=vehicle_data.vin,
        plate_number=vehicle_data.plate_number,
        make=vehicle_data.make,
        model=vehicle_data.model,
        status=vehicle_data.status,
        driver_id=vehicle_data.driver_id,
        norm_consumption=vehicle_data.norm_consumption,
        fuel_level=100.0,
        current_speed=0.0,
        mileage=0.0,
        current_location=None 
    )
    
    db.add(new_vehicle)
    await db.commit()
    await db.refresh(new_vehicle)
    
    await db.refresh(new_vehicle, ["driver"])
    if new_vehicle.driver:
        await db.refresh(new_vehicle.driver, ["user"])
    
    return VehicleResponse(
        id=new_vehicle.id,
        vin=new_vehicle.vin,
        plate_number=new_vehicle.plate_number,
        make=new_vehicle.make,
        model=new_vehicle.model,
        status=new_vehicle.status,
        driver_id=new_vehicle.driver_id,
        current_location=point_to_coords(new_vehicle.current_location),
        fuel_level=new_vehicle.fuel_level,
        norm_consumption=new_vehicle.norm_consumption,
        current_speed=new_vehicle.current_speed,
        mileage=new_vehicle.mileage,
        driver=new_vehicle.driver,
        created_at=new_vehicle.created_at
    )


@router.patch("/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(
    vehicle_id: int,
    vehicle_data: VehicleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "DISPATCHER"]))
):
    """Update vehicle information (assign driver, update status, etc)."""
    # 1. Находим транспорт
    result = await db.execute(
        select(Vehicle)
        .options(selectinload(Vehicle.driver).selectinload(Driver.user))
        .where(Vehicle.id == vehicle_id)
    )
    vehicle = result.scalar_one_or_none()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    update_data = vehicle_data.model_dump(exclude_unset=True)
    
    # 2. Если обновляем водителя, проверяем его существование
    if "driver_id" in update_data:
        new_driver_id = update_data["driver_id"]
        if new_driver_id is not None:
            driver_result = await db.execute(select(Driver).where(Driver.id == new_driver_id))
            if not driver_result.scalar_one_or_none():
                raise HTTPException(status_code=404, detail=f"Driver with id {new_driver_id} not found")
            
            # Опционально: Можно снять водителя с других машин, если он может вести только одну
            # await db.execute(
            #     update(Vehicle).where(Vehicle.driver_id == new_driver_id).values(driver_id=None)
            # )

    # 3. Обработка координат (если есть)
    if "current_location" in update_data and update_data["current_location"]:
        coords = update_data.pop("current_location")
        vehicle.current_location = coords_to_geom(coords)
    
    # 4. Применяем изменения
    for field, value in update_data.items():
        setattr(vehicle, field, value)
    
    await db.commit()
    
    # 5. Обновляем данные для ответа
    await db.refresh(vehicle)
    await db.refresh(vehicle, ["driver"])
    if vehicle.driver:
        await db.refresh(vehicle.driver, ["user"])
    
    return VehicleResponse(
        id=vehicle.id,
        vin=vehicle.vin,
        plate_number=vehicle.plate_number,
        make=vehicle.make,
        model=vehicle.model,
        status=vehicle.status,
        driver_id=vehicle.driver_id,
        current_location=point_to_coords(vehicle.current_location),
        fuel_level=vehicle.fuel_level,
        norm_consumption=vehicle.norm_consumption,
        current_speed=vehicle.current_speed,
        mileage=vehicle.mileage,
        driver=vehicle.driver,
        created_at=vehicle.created_at
    )


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    await db.delete(vehicle)
    await db.commit()
    return None