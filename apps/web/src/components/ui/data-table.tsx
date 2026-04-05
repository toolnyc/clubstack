"use client";

import { useBreakpoint } from "@/lib/hooks/use-breakpoint";

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

function DataTable<T>({
  columns,
  data,
  keyField,
  onRowClick,
  emptyMessage = "No data",
  className = "",
}: DataTableProps<T>) {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";

  if (data.length === 0) {
    return (
      <div className={`data-table data-table--empty ${className}`}>
        <p className="data-table__empty">{emptyMessage}</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className={`data-table data-table--cards ${className}`}>
        {data.map((item) => (
          <button
            key={String(item[keyField])}
            type="button"
            className="data-table__card"
            onClick={() => onRowClick?.(item)}
          >
            {columns.map((col) => (
              <div key={col.key} className="data-table__card-field">
                <span className="data-table__card-label">{col.header}</span>
                <span className="data-table__card-value">
                  {col.render(item)}
                </span>
              </div>
            ))}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`data-table ${className}`}>
      <table className="data-table__table">
        <thead>
          <tr className="data-table__header-row">
            {columns.map((col) => (
              <th key={col.key} className="data-table__header-cell">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={String(item[keyField])}
              className="data-table__row"
              onClick={() => onRowClick?.(item)}
              style={onRowClick ? { cursor: "pointer" } : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className="data-table__cell">
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { DataTable };
export type { DataTableProps, Column };
