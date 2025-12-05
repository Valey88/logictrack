from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import User, Vehicle, Order, VehicleStatus, OrderStatus
from app.schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get dashboard statistics."""
    # Total vehicles
    total_vehicles_result = await db.execute(select(func.count(Vehicle.id)))
    total_vehicles = total_vehicles_result.scalar() or 0
    
    # Active vehicles (ACTIVE or IN_PROGRESS)
    active_vehicles_result = await db.execute(
        select(func.count(Vehicle.id)).where(
            (Vehicle.status == VehicleStatus.ACTIVE) |
            (Vehicle.status == VehicleStatus.IN_PROGRESS)
        )
    )
    active_vehicles = active_vehicles_result.scalar() or 0
    
    # Active orders
    active_orders_result = await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.IN_PROGRESS)
    )
    active_orders = active_orders_result.scalar() or 0
    
    # Total revenue (sum of all completed orders)
    total_revenue_result = await db.execute(
        select(func.coalesce(func.sum(Order.price), 0)).where(
            Order.status == OrderStatus.COMPLETED
        )
    )
    total_revenue = float(total_revenue_result.scalar() or 0)
    
    # Issues/SOS count
    issues_result = await db.execute(
        select(func.count(Vehicle.id)).where(Vehicle.status == VehicleStatus.SOS)
    )
    issues_count = issues_result.scalar() or 0
    
    # Total orders count
    total_orders_result = await db.execute(select(func.count(Order.id)))
    total_orders = total_orders_result.scalar() or 0
    
    return DashboardStats(
        total_vehicles=total_vehicles,
        active_vehicles=active_vehicles,
        total_orders=total_orders,
        active_orders=active_orders,
        total_revenue=total_revenue,
        issues_count=issues_count
    )

