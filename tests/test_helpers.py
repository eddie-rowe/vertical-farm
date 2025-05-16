import unittest
from custom_components.vertical_farm.helpers import dict_to_farm

class TestHelpers(unittest.TestCase):
    def test_dict_to_farm(self):
        config = {
            "id": "farm1",
            "name": "Main Farm",
            "location": "Greenhouse",
            "notes": "Test farm",
            "rows": [
                {
                    "id": "row1",
                    "name": "Row 1",
                    "notes": "First row",
                    "racks": [
                        {
                            "id": "rack1",
                            "name": "Rack 1",
                            "notes": "Main rack",
                            "shelves": [
                                {"id": "shelf1", "name": "Shelf 1", "capacity": 10, "notes": "Top shelf"},
                                {"id": "shelf2", "name": "Shelf 2"}
                            ]
                        }
                    ]
                }
            ]
        }
        farm = dict_to_farm(config)
        self.assertEqual(farm.id, "farm1")
        self.assertEqual(farm.name, "Main Farm")
        self.assertEqual(farm.location, "Greenhouse")
        self.assertEqual(len(farm.rows), 1)
        row = farm.rows[0]
        self.assertEqual(row.id, "row1")
        self.assertEqual(len(row.racks), 1)
        rack = row.racks[0]
        self.assertEqual(rack.id, "rack1")
        self.assertEqual(len(rack.shelves), 2)
        shelf1 = rack.shelves[0]
        self.assertEqual(shelf1.id, "shelf1")
        self.assertEqual(shelf1.capacity, 10)
        self.assertEqual(shelf1.notes, "Top shelf")
        shelf2 = rack.shelves[1]
        self.assertEqual(shelf2.id, "shelf2")
        self.assertEqual(shelf2.name, "Shelf 2")

if __name__ == "__main__":
    unittest.main()
