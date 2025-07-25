"""
Unit tests for CRUD operations.
Tests individual CRUD functions in isolation with mocked dependencies.
"""

from datetime import datetime
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from app.crud.crud_farm import CRUDFarm
from app.crud.crud_user import CRUDUser


class TestFarmCRUD:
    """Unit tests for Farm CRUD operations."""

    @pytest.fixture
    def mock_supabase_client(self):
        """Create a mock Supabase client."""
        from unittest.mock import AsyncMock
        
        mock_client = AsyncMock()
        mock_table = AsyncMock()
        mock_response = AsyncMock()

        # Mock the table chaining
        mock_client.table.return_value = mock_table
        mock_table.insert.return_value = mock_table
        mock_table.select.return_value = mock_table
        mock_table.update.return_value = mock_table
        mock_table.delete.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.single.return_value = mock_table
        mock_table.execute.return_value = mock_response

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
            "user_id": str(uuid4()),
        }

        mock_response.data = farm_data

        # Mock crud_row.get_multi_by_farm_with_racks to return empty list
        with patch("app.crud.crud_farm.crud_row.get_multi_by_farm_with_racks", return_value=[]):
            result = await farm_crud.get(mock_client, id=farm_id)

            assert result is not None
            assert result.id == str(farm_id)
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
        mock_client, mock_table, mock_response = mock_supabase_client

        farm_id = uuid4()
        update_data = {"name": "Updated Farm Name"}
        updated_farm = {
            "id": str(farm_id),
            "name": "Updated Farm Name",
            "location": "Test Location",
            "updated_at": datetime.utcnow().isoformat(),
        }

        mock_response.data = [updated_farm]

        # Mock crud_row.get_multi_by_farm_with_racks to return empty list
        with patch("app.crud.crud_farm.crud_row.get_multi_by_farm_with_racks", return_value=[]):
            result = await farm_crud.update(mock_client, id=farm_id, obj_in=update_data)

            assert result is not None
            # Verify update was called correctly
            mock_table.update.assert_called_once()
            mock_table.eq.assert_called_with("id", str(farm_id))

    @pytest.mark.asyncio
    async def test_delete_farm_success(self, farm_crud, mock_supabase_client) -> None:
        """Test successful farm deletion."""
        mock_client, mock_table, mock_response = mock_supabase_client

        farm_id = uuid4()

        # Mock successful deletion
        mock_response.data = [{"id": str(farm_id)}]

        result = await farm_crud.remove(mock_client, id=farm_id)

        assert result is True

        # Verify delete was called correctly
        mock_table.delete.assert_called_once()
        mock_table.eq.assert_called_with("id", str(farm_id))

    @pytest.mark.asyncio
    async def test_get_user_farms(self, farm_crud, mock_supabase_client) -> None:
        """Test retrieving farms for a specific user."""
        mock_client, mock_table, mock_response = mock_supabase_client

        user_id = uuid4()
        farms_data = [
            {"id": str(uuid4()), "name": "Farm 1", "user_id": str(user_id)},
            {"id": str(uuid4()), "name": "Farm 2", "user_id": str(user_id)},
        ]

        mock_response.data = farms_data

        result = await farm_crud.get_multi_by_owner(mock_client, owner_id=user_id)

        assert len(result) == 2
        assert all(farm["user_id"] == str(user_id) for farm in result)

        # Verify filter by user_id was applied
        mock_table.eq.assert_called_with("user_id", str(user_id))


class TestUserCRUD:
    """Unit tests for User CRUD operations."""

    @pytest.fixture
    def mock_supabase_client(self):
        """Create a mock Supabase client."""
        from unittest.mock import AsyncMock
        
        mock_client = AsyncMock()
        mock_table = AsyncMock()
        mock_response = AsyncMock()

        mock_client.table.return_value = mock_table
        mock_table.insert.return_value = mock_table
        mock_table.select.return_value = mock_table
        mock_table.update.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.single.return_value = mock_table
        mock_table.execute.return_value = mock_response

        return mock_client, mock_table, mock_response

    @pytest.fixture
    def user_crud(self):
        """Create UserCRUD instance."""
        return CRUDUser()

    @pytest.mark.asyncio
    async def test_get_user_by_email(self, user_crud, mock_supabase_client) -> None:
        """Test retrieving user by email."""
        mock_client, mock_table, mock_response = mock_supabase_client

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
        mock_client, mock_table, mock_response = mock_supabase_client

        user_data = {
            "email": "newuser@example.com",
            "is_active": True,
        }
        
        created_user = {
            "id": str(uuid4()),
            "email": "newuser@example.com",
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
        }

        mock_response.data = [created_user]

        result = await user_crud.create(mock_client, obj_in=user_data)

        assert result is not None
        assert result["email"] == "newuser@example.com"
        assert result["is_active"] is True

    @pytest.mark.asyncio
    async def test_update_user_activity_status(self, user_crud, mock_supabase_client) -> None:
        """Test updating user activity status."""
        mock_client, mock_table, mock_response = mock_supabase_client

        user_id = uuid4()
        updated_user = {
            "id": str(user_id),
            "email": "test@example.com",
            "is_active": False,
            "updated_at": datetime.utcnow().isoformat(),
        }

        mock_response.data = [updated_user]

        result = await user_crud.update(mock_client, id=user_id, obj_in={"is_active": False})

        assert result is not None
        assert result["is_active"] is False
