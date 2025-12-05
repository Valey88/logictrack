from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_active_user, require_role, get_password_hash, get_user_by_email
from app.models import User, Driver, UserRole
from app.schemas import DriverCreate, DriverCreateWithUser, DriverResponse

router = APIRouter(prefix="/drivers", tags=["drivers"])


@router.get("", response_model=List[DriverResponse])
async def get_drivers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of drivers."""
    query = select(Driver).options(selectinload(Driver.user))
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    drivers = result.scalars().all()
    
    response = []
    for driver in drivers:
        # Проверяем, загружен ли пользователь
        if not driver.user:
            # Если пользователь не загружен, пытаемся загрузить его явно
            await db.refresh(driver, ["user"])
        
        driver_dict = {
            **{c.name: getattr(driver, c.name) for c in Driver.__table__.columns},
            "user": driver.user if driver.user else None
        }
        response.append(DriverResponse(**driver_dict))
    
    return response


@router.get("/{driver_id}", response_model=DriverResponse)
async def get_driver(
    driver_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get driver by ID."""
    result = await db.execute(
        select(Driver)
        .options(selectinload(Driver.user))
        .where(Driver.id == driver_id)
    )
    driver = result.scalar_one_or_none()
    
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    driver_dict = {
        **{c.name: getattr(driver, c.name) for c in Driver.__table__.columns},
        "user": driver.user if driver.user else None
    }
    return DriverResponse(**driver_dict)


@router.post("", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
async def create_driver(
    driver_data: DriverCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "DISPATCHER"]))
):
    """Create a new driver profile for existing user."""
    # Verify user exists
    user_result = await db.execute(select(User).where(User.id == driver_data.user_id))
    user = user_result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if driver profile already exists
    existing = await db.execute(select(Driver).where(Driver.user_id == driver_data.user_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Driver profile already exists for this user")
    
    new_driver = Driver(
        user_id=driver_data.user_id,
        license_number=driver_data.license_number,
        avatar_url=driver_data.avatar_url
    )
    
    db.add(new_driver)
    await db.commit()
    await db.refresh(new_driver)
    await db.refresh(new_driver, ["user"])
    
    driver_dict = {
        **{c.name: getattr(new_driver, c.name) for c in Driver.__table__.columns},
        "user": new_driver.user if new_driver.user else None
    }
    return DriverResponse(**driver_dict)


@router.post("/with-user", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
async def create_driver_with_user(
    driver_data: DriverCreateWithUser,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "DISPATCHER"]))
):
    """Create a new driver profile with a new user account."""
    # Check if user with this email already exists
    existing_user = await get_user_by_email(db, driver_data.email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )
    
    # Check if license number is unique (if provided)
    if driver_data.license_number:
        existing_license = await db.execute(
            select(Driver).where(Driver.license_number == driver_data.license_number)
        )
        if existing_license.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Driver with this license number already exists"
            )
    
    # Create new user
    hashed_password = get_password_hash(driver_data.password)
    new_user = User(
        email=driver_data.email,
        hashed_password=hashed_password,
        full_name=driver_data.full_name,
        phone=driver_data.phone,
        role=UserRole.DRIVER
    )
    
    db.add(new_user)
    await db.flush()  # Flush to get the user ID
    
    # Create driver profile
    new_driver = Driver(
        user_id=new_user.id,
        license_number=driver_data.license_number,
        avatar_url=driver_data.avatar_url
    )
    
    db.add(new_driver)
    await db.commit()
    await db.refresh(new_driver)
    await db.refresh(new_driver, ["user"])
    
    driver_dict = {
        **{c.name: getattr(new_driver, c.name) for c in Driver.__table__.columns},
        "user": new_driver.user if new_driver.user else None
    }
    return DriverResponse(**driver_dict)

