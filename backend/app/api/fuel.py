from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_active_user, require_role
from app.models import User, FuelLog, Vehicle
from app.schemas import (
    FuelLogCreate,
    FuelLogResponse,
    FuelAnalysisResult
)

router = APIRouter(prefix="/fuel", tags=["fuel"])


@router.get("", response_model=List[FuelLogResponse])
async def get_fuel_logs(
    vehicle_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of fuel logs."""
    query = select(FuelLog).options(selectinload(FuelLog.vehicle))
    
    if vehicle_id:
        query = query.where(FuelLog.vehicle_id == vehicle_id)
    
    query = query.order_by(FuelLog.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()
    
    response = []
    for log in logs:
        log_dict = {
            **{c.name: getattr(log, c.name) for c in FuelLog.__table__.columns},
            "vehicle": log.vehicle if log.vehicle else None
        }
        response.append(FuelLogResponse(**log_dict))
    
    return response


@router.get("/{log_id}", response_model=FuelLogResponse)
async def get_fuel_log(
    log_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get fuel log by ID."""
    result = await db.execute(
        select(FuelLog)
        .options(selectinload(FuelLog.vehicle))
        .where(FuelLog.id == log_id)
    )
    log = result.scalar_one_or_none()
    
    if not log:
        raise HTTPException(status_code=404, detail="Fuel log not found")
    
    log_dict = {
        **{c.name: getattr(log, c.name) for c in FuelLog.__table__.columns},
        "vehicle": log.vehicle if log.vehicle else None
    }
    return FuelLogResponse(**log_dict)


@router.post("", response_model=FuelLogResponse, status_code=status.HTTP_201_CREATED)
async def create_fuel_log(
    log_data: FuelLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new fuel log entry."""
    # Verify vehicle exists
    vehicle_result = await db.execute(select(Vehicle).where(Vehicle.id == log_data.vehicle_id))
    vehicle = vehicle_result.scalar_one_or_none()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    new_log = FuelLog(
        vehicle_id=log_data.vehicle_id,
        liters=log_data.liters,
        cost=log_data.cost,
        mileage=log_data.mileage,
        location=log_data.location
    )
    
    # Update vehicle mileage and fuel level
    if log_data.mileage > vehicle.mileage:
        vehicle.mileage = log_data.mileage
    
    db.add(new_log)
    await db.commit()
    await db.refresh(new_log)
    await db.refresh(new_log, ["vehicle"])
    
    log_dict = {
        **{c.name: getattr(new_log, c.name) for c in FuelLog.__table__.columns},
        "vehicle": new_log.vehicle if new_log.vehicle else None
    }
    return FuelLogResponse(**log_dict)


@router.get("/analytics/overconsumption", response_model=List[FuelAnalysisResult])
async def get_fuel_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "DISPATCHER"]))
):
    """Calculate fuel overconsumption analysis."""
    # Get all vehicles with fuel logs
    vehicles_result = await db.execute(
        select(Vehicle).options(selectinload(Vehicle.fuel_logs))
    )
    vehicles = vehicles_result.scalars().all()
    
    analysis_results = []
    
    for vehicle in vehicles:
        logs = sorted(vehicle.fuel_logs, key=lambda x: x.mileage)
        
        if len(logs) < 2:
            continue  # Need at least 2 logs to calculate
        
        # Calculate total distance
        start_log = logs[0]
        end_log = logs[-1]
        total_distance = end_log.mileage - start_log.mileage
        
        if total_distance <= 0:
            continue
        
        # Calculate total fuel used (sum of all fills)
        total_fuel_used = sum(log.liters for log in logs)
        
        # Expected fuel based on norm
        expected_fuel = (total_distance / 100) * vehicle.norm_consumption
        
        # Calculate difference
        difference = total_fuel_used - expected_fuel
        deviation_percent = (difference / expected_fuel * 100) if expected_fuel > 0 else 0
        
        # Determine status
        if deviation_percent > 20:
            status = "CRITICAL"
        elif deviation_percent > 10:
            status = "WARNING"
        else:
            status = "NORMAL"
        
        analysis_results.append(FuelAnalysisResult(
            vehicle_id=vehicle.id,
            plate_number=vehicle.plate_number,
            make=vehicle.make,
            model=vehicle.model,
            total_distance=total_distance,
            total_fuel_used=total_fuel_used,
            expected_fuel=expected_fuel,
            difference=difference,
            deviation_percent=deviation_percent,
            status=status
        ))
    
    return analysis_results

