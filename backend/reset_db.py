import asyncio
from app.core.database import engine
from app.models import Base
# Импортируем все модели, чтобы SQLAlchemy их видела
from app.models import User, Vehicle, Order, FuelLog, MaintenanceRecord, Driver, RoutePoint, TrackingPoint
from app.core.security import get_password_hash
from app.models import UserRole
from app.core.database import AsyncSessionLocal

async def reset_database():
    print("⏳ Подключение к БД...")
    async with engine.begin() as conn:
        print("💥 Удаление всех таблиц...")
        await conn.run_sync(Base.metadata.drop_all)
        print("✅ Таблицы удалены.")
        
        print("🏗️  Создание новых таблиц...")
        await conn.run_sync(Base.metadata.create_all)
        print("✅ Новые таблицы созданы.")

async def create_admin():
    print("👤 Создание администратора...")
    async with AsyncSessionLocal() as session:
        admin = User(
            email="admin@logitrack.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Super Admin",
            role=UserRole.ADMIN,
            is_active=True
        )
        session.add(admin)
        await session.commit()
        print(f"✅ Администратор создан: {admin.email} / admin123")

async def main():
    await reset_database()
    await create_admin()

if __name__ == "__main__":
    asyncio.run(main())