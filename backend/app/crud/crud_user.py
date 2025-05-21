from supabase import Client, AsyncClient
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.password_utils import get_password_hash, verify_password
from typing import Optional
import uuid

async def get_user(db: AsyncClient, user_id: uuid.UUID) -> Optional[User]:
    # Placeholder implementation
    print(f"CRUD: Attempting to get user with ID: {user_id}")
    # response = await db.table('users').select("*").eq('id', str(user_id)).maybe_single().execute()
    # if response and response.data:
    #     return User(**response.data)
    return None

async def get_user_by_email(db: AsyncClient, email: str) -> Optional[User]:
    print(f"CRUD: Attempting to get user with email: {email}")
    # response = await db.table('users').select("*").eq('email', email).maybe_single().execute()
    # if response and response.data:
    #     return User(**response.data)
    return None

async def create_user(db: AsyncClient, user_in: UserCreate) -> User:
    print(f"CRUD: Creating user with email: {user_in.email}")
    hashed_password = get_password_hash(user_in.password)
    # In a real scenario, you would not include the plain password in the user_data to be stored.
    # db_user = UserInDBBase(**user_in.model_dump(exclude={"password"}), hashed_password=hashed_password, id=uuid.uuid4())
    # response = await db.table('users').insert(db_user.model_dump()).execute()
    # if response.data:
    #     return User(**response.data[0])
    # Placeholder return, ensure all required fields for User are present
    return User(id=uuid.uuid4(), email=user_in.email, hashed_password=hashed_password, is_active=True, role=user_in.role)

async def authenticate_user(db: AsyncClient, email: str, password: str) -> Optional[User]:
    user = await get_user_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

async def update_user(): # Placeholder for update_user
    pass

def is_superuser(user: User) -> bool:
    return user.is_superuser 