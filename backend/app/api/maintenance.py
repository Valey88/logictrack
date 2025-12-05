from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_active_user, require_role
from app.models import User, MaintenanceRecord, MaintenanceStatus
from app.schemas import (
    MaintenanceRecordCreate,
    MaintenanceRecordUpdate,
    MaintenanceRecordResponse
)

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


@router.get("", response_model=List[MaintenanceRecordResponse])
async def get_maintenance_records(
    vehicle_id: Optional[int] = Query(None),
    status_filter: Optional[MaintenanceStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of maintenance records."""
    query = select(MaintenanceRecord).options(selectinload(MaintenanceRecord.vehicle))
    
    if vehicle_id:
        query = query.where(MaintenanceRecord.vehicle_id == vehicle_id)
    
    if status_filter:
        query = query.where(MaintenanceRecord.status == status_filter)
    
    query = query.order_by(MaintenanceRecord.scheduled_date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    records = result.scalars().all()
    
    response = []
    for record in records:
        record_dict = {
            **{c.name: getattr(record, c.name) for c in MaintenanceRecord.__table__.columns},
            "vehicle": record.vehicle if record.vehicle else None
        }
        response.append(MaintenanceRecordResponse(**record_dict))
    
    return response


@router.get("/{record_id}", response_model=MaintenanceRecordResponse)
async def get_maintenance_record(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get maintenance record by ID."""
    result = await db.execute(
        select(MaintenanceRecord)
        .options(selectinload(MaintenanceRecord.vehicle))
        .where(MaintenanceRecord.id == record_id)
    )
    record = result.scalar_one_or_none()
    
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    
    record_dict = {
        **{c.name: getattr(record, c.name) for c in MaintenanceRecord.__table__.columns},
        "vehicle": record.vehicle if record.vehicle else None
    }
    return MaintenanceRecordResponse(**record_dict)


@router.post("", response_model=MaintenanceRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_maintenance_record(
    record_data: MaintenanceRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "DISPATCHER"]))
):
    """Create a new maintenance record."""
    new_record = MaintenanceRecord(
        vehicle_id=record_data.vehicle_id,
        type=record_data.type,
        description=record_data.description,
        cost=record_data.cost,
        scheduled_date=record_data.scheduled_date,
        status=record_data.status
    )
    
    db.add(new_record)
    await db.commit()
    await db.refresh(new_record)
    await db.refresh(new_record, ["vehicle"])
    
    record_dict = {
        **{c.name: getattr(new_record, c.name) for c in MaintenanceRecord.__table__.columns},
        "vehicle": new_record.vehicle if new_record.vehicle else None
    }
    return MaintenanceRecordResponse(**record_dict)


@router.patch("/{record_id}", response_model=MaintenanceRecordResponse)
async def update_maintenance_record(
    record_id: int,
    record_data: MaintenanceRecordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "DISPATCHER"]))
):
    """Update maintenance record."""
    result = await db.execute(
        select(MaintenanceRecord)
        .options(selectinload(MaintenanceRecord.vehicle))
        .where(MaintenanceRecord.id == record_id)
    )
    record = result.scalar_one_or_none()
    
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    
    # Update fields
    update_data = record_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if value is not None:
            setattr(record, field, value)
    
    # If status changed to COMPLETED, set completed_date
    if record_data.status == MaintenanceStatus.COMPLETED and record.status != MaintenanceStatus.COMPLETED:
        record.completed_date = datetime.utcnow()
    
    await db.commit()
    await db.refresh(record)
    await db.refresh(record, ["vehicle"])
    
    record_dict = {
        **{c.name: getattr(record, c.name) for c in MaintenanceRecord.__table__.columns},
        "vehicle": record.vehicle if record.vehicle else None
    }
    return MaintenanceRecordResponse(**record_dict)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_maintenance_record(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Delete a maintenance record."""
    result = await db.execute(select(MaintenanceRecord).where(MaintenanceRecord.id == record_id))
    record = result.scalar_one_or_none()
    
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    
    await db.delete(record)
    await db.commit()
    return None

