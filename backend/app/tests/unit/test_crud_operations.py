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
        mock_client = MagicMock()
        mock_table = MagicMock()

        # Mock the table chaining
        mock_client.table.return_value = mock_table
        mock_table.insert.return_value = mock_table
        mock_table.select.return_value = mock_table
        mock_table.update.return_value = mock_table
        mock_table.delete.return_value = mock_table
        mock_table.eq.return_value = mock_table

        return mock_client, mock_table

    @pytest.fixture
    def farm_crud(self):
        """Create FarmCRUD instance."""
        return CRUDFarm()

    @pytest.mark.asyncio
    async def test_create_farm_success(self, farm_crud, mock_supabase_client):
        """Test successful farm creation."""
        mock_client, mock_table = mock_supabase_client

        # Mock successful response
        farm_data = {
            "id": str(uuid4()),
            "name": "Test Farm",
            "location": "Test Location",
            "user_id": str(uuid4()),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        mock_table.execute.return_value.data = [farm_data]

        with patch("app.crud.crud_farm.get_supabase_client", return_value=mock_client):
            result = await farm_crud.create(farm_data)

            assert result is not None
            assert result["name"] == "Test Farm"
            assert result["location"] == "Test Location"

            # Verify the correct table was called
            mock_client.table.assert_called_with("farms")

    @pytest.mark.asyncio
    async def test_get_farm_by_id(self, farm_crud, mock_supabase_client):
        """Test retrieving farm by ID."""
        mock_client, mock_table = mock_supabase_client

        farm_id = str(uuid4())
        farm_data = {
            "id": farm_id,
            "name": "Test Farm",
            "location": "Test Location",
            "user_id": str(uuid4()),
        }

        mock_table.execute.return_value.data = [farm_data]

        with patch("app.crud.crud_farm.get_supabase_client", return_value=mock_client):
            result = await farm_crud.get(farm_id)

            assert result is not None
            assert result["id"] == farm_id
            assert result["name"] == "Test Farm"

            # Verify the correct query was made
            mock_table.eq.assert_called_with("id", farm_id)

    @pytest.mark.asyncio
    async def test_get_farm_not_found(self, farm_crud, mock_supabase_client):
        """Test retrieving non-existent farm."""
        mock_client, mock_table = mock_supabase_client

        # Mock empty response
        mock_table.execute.return_value.data = []

        with patch("app.crud.crud_farm.get_supabase_client", return_value=mock_client):
            result = await farm_crud.get("nonexistent-id")

            assert result is None

    @pytest.mark.asyncio
    async def test_update_farm_success(self, farm_crud, mock_supabase_client):
        """Test successful farm update."""
        mock_client, mock_table = mock_supabase_client

        farm_id = str(uuid4())
        update_data = {"name": "Updated Farm Name"}
        updated_farm = {
            "id": farm_id,
            "name": "Updated Farm Name",
            "location": "Test Location",
            "updated_at": datetime.utcnow().isoformat(),
        }

        mock_table.execute.return_value.data = [updated_farm]

        with patch("app.crud.crud_farm.get_supabase_client", return_value=mock_client):
            result = await farm_crud.update(farm_id, update_data)

            assert result is not None
            assert result["name"] == "Updated Farm Name"

            # Verify update was called correctly
            mock_table.update.assert_called_once()
            mock_table.eq.assert_called_with("id", farm_id)

    @pytest.mark.asyncio
    async def test_delete_farm_success(self, farm_crud, mock_supabase_client):
        """Test successful farm deletion."""
        mock_client, mock_table = mock_supabase_client

        farm_id = str(uuid4())

        # Mock successful deletion
        mock_table.execute.return_value.data = [{"id": farm_id}]

        with patch("app.crud.crud_farm.get_supabase_client", return_value=mock_client):
            result = await farm_crud.delete(farm_id)

            assert result is True

            # Verify delete was called correctly
            mock_table.delete.assert_called_once()
            mock_table.eq.assert_called_with("id", farm_id)

    @pytest.mark.asyncio
    async def test_get_user_farms(self, farm_crud, mock_supabase_client):
        """Test retrieving farms for a specific user."""
        mock_client, mock_table = mock_supabase_client

        user_id = str(uuid4())
        farms_data = [
            {"id": str(uuid4()), "name": "Farm 1", "user_id": user_id},
            {"id": str(uuid4()), "name": "Farm 2", "user_id": user_id},
        ]

        mock_table.execute.return_value.data = farms_data

        with patch("app.crud.crud_farm.get_supabase_client", return_value=mock_client):
            result = await farm_crud.get_multi_by_user(user_id)

            assert len(result) == 2
            assert all(farm["user_id"] == user_id for farm in result)

            # Verify filter by user_id was applied
            mock_table.eq.assert_called_with("user_id", user_id)


class TestUserCRUD:
    """Unit tests for User CRUD operations."""

    @pytest.fixture
    def mock_supabase_client(self):
        """Create a mock Supabase client."""
        mock_client = MagicMock()
        mock_table = MagicMock()

        mock_client.table.return_value = mock_table
        mock_table.insert.return_value = mock_table
        mock_table.select.return_value = mock_table
        mock_table.update.return_value = mock_table
        mock_table.eq.return_value = mock_table

        return mock_client, mock_table

    @pytest.fixture
    def user_crud(self):
        """Create UserCRUD instance."""
        return CRUDUser()

    @pytest.mark.asyncio
    async def test_get_user_by_email(self, user_crud, mock_supabase_client):
        """Test retrieving user by email."""
        mock_client, mock_table = mock_supabase_client

        user_data = {"id": str(uuid4()), "email": "test@example.com", "is_active": True}

        mock_table.execute.return_value.data = [user_data]

        with patch("app.crud.crud_user.get_supabase_client", return_value=mock_client):
            result = await user_crud.get_by_email("test@example.com")

            assert result is not None
            assert result["email"] == "test@example.com"

            # Verify email filter was applied
            mock_table.eq.assert_called_with("email", "test@example.com")

    @pytest.mark.asyncio
    async def test_create_user_success(self, user_crud, mock_supabase_client):
        """Test successful user creation."""
        mock_client, mock_table = mock_supabase_client

        user_data = {
            "id": str(uuid4()),
            "email": "newuser@example.com",
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
        }

        mock_table.execute.return_value.data = [user_data]

        with patch("app.crud.crud_user.get_supabase_client", return_value=mock_client):
            result = await user_crud.create(user_data)

            assert result is not None
            assert result["email"] == "newuser@example.com"
            assert result["is_active"] is True

    @pytest.mark.asyncio
    async def test_update_user_activity_status(self, user_crud, mock_supabase_client):
        """Test updating user activity status."""
        mock_client, mock_table = mock_supabase_client

        user_id = str(uuid4())
        updated_user = {
            "id": user_id,
            "email": "test@example.com",
            "is_active": False,
            "updated_at": datetime.utcnow().isoformat(),
        }

        mock_table.execute.return_value.data = [updated_user]

        with patch("app.crud.crud_user.get_supabase_client", return_value=mock_client):
            result = await user_crud.update(user_id, {"is_active": False})

            assert result is not None
            assert result["is_active"] is False
