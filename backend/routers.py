from fastapi import APIRouter, HTTPException, Depends, Request
from models import Item
from auth import get_current_user

router = APIRouter(
    prefix="/items",
    tags=["items"],
)

items_db = {}

@router.post("/", response_model=Item)
def create_item(item: Item, user=Depends(get_current_user)):
    if item.name in items_db:
        raise HTTPException(status_code=400, detail="Item already exists")
    items_db[item.name] = item
    return item

@router.get("/{item_name}", response_model=Item)
def read_item(item_name: str, user=Depends(get_current_user)):
    item = items_db.get(item_name)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item 