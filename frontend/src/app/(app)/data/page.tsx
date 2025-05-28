"use client";
import DataTable, { DataTableColumn } from "@/components/DataTable";

const columns: DataTableColumn<{ id: number; name: string; type: string; status: string }>[] = [
  { key: "id", label: "ID", sortable: true },
  { key: "name", label: "Name", sortable: true },
  { key: "type", label: "Type", sortable: true },
  { key: "status", label: "Status", sortable: true },
];

const data = [
  { id: 1, name: "Row 1", type: "Row", status: "Active" },
  { id: 2, name: "Rack 1", type: "Rack", status: "Active" },
  { id: 3, name: "Shelf 1", type: "Shelf", status: "Inactive" },
  { id: 4, name: "Sensor 1", type: "Sensor", status: "Active" },
];

export default function DataPage() {
  return (
    <div className="flex-1 p-8 animate-pop">
      <h1 className="text-4xl font-extrabold mb-8 text-green-900 dark:text-green-100 drop-shadow-lg border-b-2 border-green-200 dark:border-green-800 pb-4">Data Table</h1>
      <DataTable data={data} columns={columns} />
    </div>
  );
}
