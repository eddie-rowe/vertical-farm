from . import crud_farm
from . import crud_user
from . import crud_user_permission

from .crud_row import get_row, get_rows_by_farm, create_row, update_row, delete_row
from .crud_rack import get_rack, get_racks_by_row, create_rack, update_rack, delete_rack
from .crud_shelf import get_shelf, get_shelves_by_rack, create_shelf, update_shelf, delete_shelf

# For a cleaner import, you could also group them under a namespace if preferred
# from . import crud_row
# from . import crud_rack
# from . import crud_shelf

__all__ = [
    "crud_farm",
    "crud_user",
    "crud_user_permission",
    # Row CRUD functions
    "get_row",
    "get_rows_by_farm",
    "create_row",
    "update_row",
    "delete_row",
    # Rack CRUD functions
    "get_rack",
    "get_racks_by_row",
    "create_rack",
    "update_rack",
    "delete_rack",
    # Shelf CRUD functions
    "get_shelf",
    "get_shelves_by_rack",
    "create_shelf",
    "update_shelf",
    "delete_shelf",
]
