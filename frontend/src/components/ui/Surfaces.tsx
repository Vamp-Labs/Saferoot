import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}

export function Card({ children, className, as = "div" }: CardProps) {
  const Component = as;
  return <Component className={cn("border border-gray-200 bg-white p-6", className)}>{children}</Component>;
}

interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  className?: string;
}

export function Table<T>({ columns, rows, getRowKey, className }: TableProps<T>) {
  return (
    <div className={cn("overflow-x-auto border border-gray-200", className)}>
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-secondary",
                  column.align === "right" ? "text-right" : "text-left",
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="border-b border-gray-100 last:border-0">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn("px-4 py-3 align-top text-text-primary", column.align === "right" ? "text-right" : "text-left")}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
