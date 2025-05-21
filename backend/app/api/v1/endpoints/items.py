from fastapi import APIRouter, HTTPException, Depends, Request
from app.models.item import Item
from app.core.security import get_current_active_user
from app.models.user import User as UserModel

router = APIRouter()

items_db = {} # In-memory DB for example purposes

@router.post("/", response_model=Item)
async def create_item(item: Item, current_user: UserModel = Depends(get_current_active_user)):
    if item.name in items_db:
        raise HTTPException(status_code=400, detail="Item already exists")
    items_db[item.name] = item
    return item

@router.get("/{item_name}", response_model=Item)
async def read_item(item_name: str, current_user: UserModel = Depends(get_current_active_user)):
    item = items_db.get(item_name)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
