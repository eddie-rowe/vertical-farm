"use client";
import { useState } from "react";

export interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  onRowSelect?: (row: T) => void;
}

export default function DataTable<T extends { id: string | number }>({ data, columns, onRowSelect }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());

  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        if (a[sortKey] < b[sortKey]) return sortAsc ? -1 : 1;
        if (a[sortKey] > b[sortKey]) return sortAsc ? 1 : -1;
        return 0;
      })
    : data;

  const toggleRow = (id: string | number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    const row = data.find((r) => r.id === id);
    if (onRowSelect && row) {
      onRowSelect(row);
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-900">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            <th className="px-4 py-2">
              <input
                type="checkbox"
                checked={selectedRows.size === data.length}
                onChange={() => {
                  if (selectedRows.size === data.length) setSelectedRows(new Set());
                  else setSelectedRows(new Set(data.map((row) => row.id)));
                }}
                aria-label="Select all rows"
              />
            </th>
            {columns.map((col) => (
              <th
                key={col.key as string}
                className="px-4 py-2 cursor-pointer select-none"
                onClick={() => {
                  if (col.sortable) {
                    if (sortKey === col.key) setSortAsc((asc) => !asc);
                    else {
                      setSortKey(col.key);
                      setSortAsc(true);
                    }
                  }
                }}
              >
                {col.label}
                {col.sortable && sortKey === col.key && (sortAsc ? " ▲" : " ▼")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => (
            <tr key={row.id} className={selectedRows.has(row.id) ? "bg-green-50 dark:bg-green-900/30" : ""}>
              <td className="px-4 py-2">
                <input
                  type="checkbox"
                  checked={selectedRows.has(row.id)}
                  onChange={() => toggleRow(row.id)}
                  aria-label={`Select row ${row.id}`}
                />
              </td>
              {columns.map((col) => (
                <td key={col.key as string} className="px-4 py-2">
                  {row[col.key] as string | number}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Bulk actions example */}
      {selectedRows.size > 0 && (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-4 items-center">
          <span>{selectedRows.size} selected</span>
          <button className="btn-animated bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded" onClick={() => setSelectedRows(new Set())}>Clear</button>
          {/* Add more bulk actions here */}
        </div>
      )}
    </div>
  );
}
