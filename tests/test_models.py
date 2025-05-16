import unittest
from custom_components.vertical_farm.models import Farm, Row, Rack, Shelf

class TestModels(unittest.TestCase):
    def test_shelf(self):
        shelf = Shelf(id="s1", name="Shelf 1", capacity=10, notes="Top shelf")
        self.assertEqual(shelf.id, "s1")
        self.assertEqual(shelf.name, "Shelf 1")
        self.assertEqual(shelf.capacity, 10)
        self.assertEqual(shelf.notes, "Top shelf")

    def test_rack(self):
        shelf1 = Shelf(id="s1", name="Shelf 1")
        shelf2 = Shelf(id="s2", name="Shelf 2")
        rack = Rack(id="r1", name="Rack 1", shelves=[shelf1, shelf2], notes="Main rack")
        self.assertEqual(rack.id, "r1")
        self.assertEqual(len(rack.shelves), 2)
        self.assertEqual(rack.shelves[0].name, "Shelf 1")
        self.assertEqual(rack.notes, "Main rack")

    def test_row(self):
        rack = Rack(id="r1", name="Rack 1")
        row = Row(id="row1", name="Row 1", racks=[rack], notes="First row")
        self.assertEqual(row.id, "row1")
        self.assertEqual(len(row.racks), 1)
        self.assertEqual(row.racks[0].name, "Rack 1")
        self.assertEqual(row.notes, "First row")

    def test_farm(self):
        row = Row(id="row1", name="Row 1")
        farm = Farm(id="farm1", name="Main Farm", rows=[row], location="Greenhouse", notes="Test farm")
        self.assertEqual(farm.id, "farm1")
        self.assertEqual(len(farm.rows), 1)
        self.assertEqual(farm.rows[0].name, "Row 1")
        self.assertEqual(farm.location, "Greenhouse")
        self.assertEqual(farm.notes, "Test farm")

if __name__ == "__main__":
    unittest.main()
