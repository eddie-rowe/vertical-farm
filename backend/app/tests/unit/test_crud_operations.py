"""
Unit tests for CRUD operations.
Tests individual CRUD functions in isolation with mocked dependencies.
"""

from datetime import datetime
from unittest.mock import MagicMock, patch, AsyncMock
from uuid import uuid4

import pytest

from app.crud.crud_farm import CRUDFarm
from app.crud.crud_user import CRUDUser


class TestFarmCRUD:
    """Unit tests for Farm CRUD operations."""

    @pytest.fixture
    def mock_supabase_client(self):
        """Create a mock Supabase client."""
        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_response = MagicMock()

        # Mock the table chaining with proper return values
        mock_client.table.return_value = mock_table
        mock_table.insert.return_value = mock_table
        mock_table.select.return_value = mock_table
        mock_table.update.return_value = mock_table
        mock_table.delete.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.single.return_value = mock_table
        mock_table.order.return_value = mock_table
        mock_table.range.return_value = mock_table
        
        # Make execute() return the mock_response
        mock_table.execute = AsyncMock(return_value=mock_response)

        return mock_client, mock_table, mock_response

    @pytest.fixture
    def farm_crud(self):
        """Create FarmCRUD instance."""
        return CRUDFarm()

    @pytest.mark.asyncio
    async def test_create_farm_success(self, farm_crud, mock_supabase_client) -> None:
        """Test successful farm creation."""
        from app.schemas.farm import FarmCreate
        
        mock_client, mock_table, mock_response = mock_supabase_client

        # Mock successful response using proper Pydantic model
        farm_data = FarmCreate(
            name="Test Farm",
            location="Test Location"
        )
        
        created_farm = {
            "id": str(uuid4()),
            "name": "Test Farm",
            "location": "Test Location",
            "user_id": str(uuid4()),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        mock_response.data = [created_farm]

        # Mock crud_row.get_multi_by_farm_with_racks to return empty list
        with patch("app.crud.crud_farm.crud_row.get_multi_by_farm_with_racks", return_value=[]):
            result = await farm_crud.create_with_owner(mock_client, obj_in=farm_data, owner_id=uuid4())

            assert result is not None
            # Verify the correct table was called
            mock_client.table.assert_called_with("farms")

    @pytest.mark.asyncio
    async def test_get_farm_by_id(self, farm_crud, mock_supabase_client) -> None:
        """Test retrieving farm by ID."""
        mock_client, mock_table, mock_response = mock_supabase_client

        farm_id = uuid4()
        farm_data = {
            "id": str(farm_id),
            "name": "Test Farm",
            "location": "Test Location",
            "manager_id": str(uuid4()),
        }

        mock_response.data = farm_data

        # Mock crud_row.get_multi_by_farm_with_racks to return empty list
        with patch("app.crud.crud_farm.crud_row.get_multi_by_farm_with_racks", return_value=[]):
            result = await farm_crud.get(mock_client, id=farm_id)

            assert result is not None
            # Compare as strings since the result.id is a UUID object
            assert str(result.id) == str(farm_id)
            assert result.name == "Test Farm"

            # Verify the correct query was made
            mock_table.eq.assert_called_with("id", str(farm_id))

    @pytest.mark.asyncio
    async def test_get_farm_not_found(self, farm_crud, mock_supabase_client) -> None:
        """Test retrieving non-existent farm."""
        mock_client, mock_table, mock_response = mock_supabase_client

        # Mock empty response
        mock_response.data = None

        result = await farm_crud.get(mock_client, id=uuid4())

        assert result is None

    @pytest.mark.asyncio
    async def test_update_farm_success(self, farm_crud, mock_supabase_client) -> None:
        """Test successful farm update."""
        from app.schemas.farm import FarmUpdate
        
        mock_client, mock_table, mock_response = mock_supabase_client

        farm_id = uuid4()
        # Use proper Pydantic model instead of dict
        update_data = FarmUpdate(name="Updated Farm Name")
        
        # Mock the update response - should be a list with the updated item
        updated_farm_data = {
            "id": str(farm_id),
            "name": "Updated Farm Name",
            "location": "Test Location",
            "manager_id": str(uuid4()),
            "updated_at": datetime.utcnow().isoformat(),
        }

        # Set up multiple responses - one for update, one for the get() call after update
        mock_responses = [
            MagicMock(data=[updated_farm_data]),  # For the update() call
            MagicMock(data=updated_farm_data)      # For the get() call after update
        ]
        mock_table.execute = AsyncMock(side_effect=mock_responses)

        # Mock crud_row.get_multi_by_farm_with_racks to return empty list for the get() call after update
        with patch("app.crud.crud_farm.crud_row.get_multi_by_farm_with_racks", return_value=[]):
            result = await farm_crud.update(mock_client, id=farm_id, obj_in=update_data)

            assert result is not None
            assert result.name == "Updated Farm Name"
            # Verify update was called correctly
            mock_table.update.assert_called_once()
            mock_table.eq.assert_called_with("id", str(farm_id))

    @pytest.mark.asyncio
    async def test_delete_farm_success(self, farm_crud, mock_supabase_client) -> None:
        """Test successful farm deletion."""
        mock_client, mock_table, mock_response = mock_supabase_client

        farm_id = uuid4()
        
        # Mock the farm data for the initial get() call in remove()
        farm_data = {
            "id": str(farm_id),
            "name": "Test Farm",
            "location": "Test Location",
            "manager_id": str(uuid4()),
        }

        # Set up different responses for get() and delete() calls
        mock_responses = [
            MagicMock(data=farm_data),  # For the get() call
            MagicMock(data=[{"id": str(farm_id)}])  # For the delete() call
        ]
        mock_table.execute = AsyncMock(side_effect=mock_responses)

        # Mock crud_row.get_multi_by_farm_with_racks to return empty list for the get() call
        with patch("app.crud.crud_farm.crud_row.get_multi_by_farm_with_racks", return_value=[]):
            result = await farm_crud.remove(mock_client, id=farm_id)

            assert result is not None
            assert str(result.id) == str(farm_id)

            # Verify delete was called correctly
            mock_table.delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_user_farms(self, farm_crud, mock_supabase_client) -> None:
        """Test retrieving farms for a specific user."""
        mock_client, mock_table, mock_response = mock_supabase_client

        user_id = uuid4()
        farms_data = [
            {"id": str(uuid4()), "name": "Farm 1", "manager_id": str(user_id)},
            {"id": str(uuid4()), "name": "Farm 2", "manager_id": str(user_id)},
        ]

        mock_response.data = farms_data

        result = await farm_crud.get_multi_by_owner(mock_client, owner_id=user_id)

        assert len(result) == 2
        assert all(farm["manager_id"] == str(user_id) for farm in result)

        # Verify filter by manager_id was applied (not user_id)
        mock_table.eq.assert_called_with("manager_id", str(user_id))


class TestUserCRUD:
    """Unit tests for User CRUD operations."""

    @pytest.fixture
    def mock_supabase_client(self):
        """Create a mock Supabase client."""
        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_response = MagicMock()
        mock_auth = MagicMock()

        mock_client.table.return_value = mock_table
        mock_client.auth = mock_auth
        mock_table.insert.return_value = mock_table
        mock_table.select.return_value = mock_table
        mock_table.update.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.single.return_value = mock_table
        
        # Make execute() return the mock_response
        mock_table.execute = AsyncMock(return_value=mock_response)
        
        # Mock auth.sign_up method
        mock_auth.sign_up = AsyncMock()

        return mock_client, mock_table, mock_response, mock_auth

    @pytest.fixture
    def user_crud(self):
        """Create UserCRUD instance."""
        return CRUDUser()

    @pytest.mark.asyncio
    async def test_get_user_by_email(self, user_crud, mock_supabase_client) -> None:
        """Test retrieving user by email."""
        mock_client, mock_table, mock_response, mock_auth = mock_supabase_client

        user_data = {"id": str(uuid4()), "email": "test@example.com", "is_active": True}

        mock_response.data = user_data

        result = await user_crud.get_by_email(mock_client, email="test@example.com")

        assert result is not None
        assert result["email"] == "test@example.com"

        # Verify email filter was applied
        mock_table.eq.assert_called_with("email", "test@example.com")

    @pytest.mark.asyncio
    async def test_create_user_success(self, user_crud, mock_supabase_client) -> None:
        """Test successful user creation."""
        from app.schemas.user import UserCreate
        
        mock_client, mock_table, mock_response, mock_auth = mock_supabase_client

        # Include required password field
        user_data = UserCreate(
            email="newuser@example.com",
            password="securepassword123",
            is_active=True,
        )
        
        # Mock auth response
        mock_auth_user = MagicMock()
        mock_auth_user.id = str(uuid4())
        mock_auth_user.email = "newuser@example.com"
        mock_auth_user.model_dump.return_value = {
            "id": mock_auth_user.id,
            "email": mock_auth_user.email
        }
        
        mock_auth_response = MagicMock()
        mock_auth_response.user = mock_auth_user
        mock_auth.sign_up.return_value = mock_auth_response
        
        # Mock profile creation response
        created_profile = {
            "id": mock_auth_user.id,
            "email": "newuser@example.com",
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
        }

        mock_response.data = [created_profile]

        result = await user_crud.create(mock_client, obj_in=user_data)

        assert result is not None
        # The method might return different structure, adjust as needed
        mock_auth.sign_up.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_user_activity_status(self, user_crud, mock_supabase_client) -> None:
        """Test updating user activity status."""
        from app.schemas.user import UserUpdate
        
        mock_client, mock_table, mock_response, mock_auth = mock_supabase_client

        user_id = uuid4()
        updated_user = {
            "id": str(user_id),
            "email": "test@example.com",
            "is_active": False,
            "updated_at": datetime.utcnow().isoformat(),
        }

        # Mock the get() method call that happens when nothing to update in auth
        mock_response.data = updated_user

        # Use correct parameter name and Pydantic model
        update_data = UserUpdate(is_active=False)
        result = await user_crud.update(mock_client, user_id=user_id, obj_in=update_data)

        assert result is not None
        assert result["is_active"] is False
