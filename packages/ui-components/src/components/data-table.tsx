import * as React from "react";
import { cn } from "../lib/utils";

// ============== DataTable 组件接口 ==============

export interface Column<T> {
  key: keyof T | string;
  title: string | ((t?: (key: string, options?: any) => string) => string);
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string | number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  empty?: React.ReactNode;
  onSort?: (key: string, direction: "asc" | "desc") => void;
  className?: string;
  rowKey?: keyof T | ((record: T) => string);
  onRowClick?: (record: T, index: number) => void;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  t?: (key: string, options?: any) => string;
}

// ============== DataTable 组件实现 ==============

function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  empty,
  onSort,
  className,
  rowKey = "id" as keyof T,
  onRowClick,
  pagination,
  t,
}: DataTableProps<T>) {
  // 默认的翻译函数，如果未提供则使用默认值
  const tDashboard = t ;
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");

  const handleSort = (columnKey: string) => {
    if (!onSort) return;

    let direction: "asc" | "desc" = "asc";
    
    if (sortColumn === columnKey && sortDirection === "asc") {
      direction = "desc";
    }

    setSortColumn(columnKey);
    setSortDirection(direction);
    onSort(columnKey, direction);
  };

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === "function") {
      return rowKey(record);
    }
    return String(record[rowKey] || index);
  };

  const renderCell = (column: Column<T>, record: T, index: number): React.ReactNode => {
    // 如果 key 为 'thisObj'，传递整个对象给 render 函数
    const value = String(column.key).startsWith('thisObj') ? record : record[column.key as keyof T];
    
    if (column.render) {
      return column.render(value, record, index);
    }
    
    // 如果没有 render 函数且 key 为 'thisObj'，返回对象的字符串表示
    if (String(column.key).startsWith('thisObj')) {
      return JSON.stringify(value);
    }
    
    return String(value ?? '');
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return (
        <svg className="ml-1 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === "asc" ? (
      <svg className="ml-1 h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="ml-1 h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const renderPagination = () => {
    if (!pagination) return null;

    const { current, pageSize, total, onChange } = pagination;
    const totalPages = Math.ceil(total / pageSize);

    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-gray-700">
          {tDashboard('dataTable.pagination.show')} {(current - 1) * pageSize + 1} {tDashboard('dataTable.pagination.to')} {Math.min(current * pageSize, total)} {tDashboard('dataTable.pagination.of')} {total} {tDashboard('dataTable.pagination.items')}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onChange(current - 1, pageSize)}
            disabled={current <= 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {tDashboard('dataTable.pagination.previous')}
          </button>
          <span className="text-sm">
            {tDashboard('dataTable.pagination.page')} {current} {tDashboard('dataTable.pagination.totalPages', { totalPages })}
          </span>
          <button
            onClick={() => onChange(current + 1, pageSize)}
            disabled={current >= totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {tDashboard('dataTable.pagination.next')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={cn(
                      "px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right",
                      column.sortable && "cursor-pointer hover:bg-gray-100",
                      column.width && "overflow-hidden"
                    )}
                    style={{ 
                      width: column.width,
                      minWidth: column.width,
                      maxWidth: column.width
                    }}
                    onClick={() => column.sortable && handleSort(String(column.key))}
                  >
                    <div className={cn(
                      "flex items-center",
                      column.width && "overflow-hidden"
                    )}>
                      <span className={cn(
                        column.width && "truncate"
                      )}>
                        {typeof column.title === 'function' ? column.title(t) : column.title}
                      </span>
                      {column.sortable && renderSortIcon(String(column.key))}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-blue border-t-transparent"></div>
                      <span className="ml-2">{tDashboard('dataTable.loading')}</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                    {empty || tDashboard('dataTable.noData')}
                  </td>
                </tr>
              ) : (
                data.map((record, index) => (
                  <tr
                    key={getRowKey(record, index)}
                    className={cn(
                      "hover:bg-gray-50",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(record, index)}
                  >
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={cn(
                          "px-6 py-4 text-sm text-gray-900",
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right",
                          column.width ? "overflow-hidden" : "whitespace-nowrap"
                        )}
                        style={{
                          width: column.width,
                          minWidth: column.width,
                          maxWidth: column.width
                        }}
                      >
                        <div className={cn(
                          column.width && "truncate",
                          !column.width && "whitespace-nowrap"
                        )}>
                          {renderCell(column, record, index)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {renderPagination()}
    </div>
  );
}

export { DataTable };