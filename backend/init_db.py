"""
Database initialization script.
Run this to create tables and optionally seed initial data.
"""
import asyncio
from sqlalchemy import text
from app.core.database import engine, AsyncSessionLocal, Base
from app.core.config import settings
from app.models import User, UserRole
from app.core.security import get_password_hash


async def init_db():
    """Initialize database - create tables."""
    print("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✓ Tables created successfully!")


async def seed_initial_data():
    """Seed database with initial admin user."""
    print("Seeding initial data...")
    
    async with AsyncSessionLocal() as session:
        # Check if admin user exists
        from sqlalchemy import select
        result = await session.execute(
            select(User).where(User.email == "admin@logitrack.com")
        )
        admin = result.scalar_one_or_none()
        
        if not admin:
            admin_user = User(
                email="admin@logitrack.com",
                hashed_password=get_password_hash("admin123"),
                full_name="System Administrator",
                role=UserRole.ADMIN,
                is_active=True
            )
            session.add(admin_user)
            await session.commit()
            print("✓ Admin user created: admin@logitrack.com / admin123")
        else:
            print("✓ Admin user already exists")
    
    print("✓ Initial data seeded!")


async def main():
    """Main initialization function."""
    print(f"Initializing database: {settings.DATABASE_URL}")
    await init_db()
    await seed_initial_data()
    print("\n✓ Database initialization complete!")
    print("\nDefault admin credentials:")
    print("  Email: admin@logitrack.com")
    print("  Password: admin123")
    print("\n⚠️  Please change the default password in production!")


if __name__ == "__main__":
    asyncio.run(main())

