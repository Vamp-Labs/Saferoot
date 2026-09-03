import { Table } from "@/components/ui/Surfaces";
import { Badge } from "@/components/ui/Feedback";

export interface ComparisonRow {
  field: string;
  approved: string;
  submitted: string;
  differs: boolean;
}

interface ComparisonTableProps {
  rows: ComparisonRow[];
  result: "Executed" | "Blocked";
}

export function ComparisonTable({ rows, result }: ComparisonTableProps) {
  return (
    <Table
      columns={[
        { key: "field", header: "Field", render: (row: ComparisonRow) => row.field },
        {
          key: "approved",
          header: "Approved",
          render: (row: ComparisonRow) => <span className="font-mono">{row.approved}</span>,
        },
        {
          key: "submitted",
          header: "Submitted",
          render: (row: ComparisonRow) => (
            <span className={row.differs ? "font-mono font-semibold text-danger" : "font-mono"}>{row.submitted}</span>
          ),
        },
        {
          key: "result",
          header: "Result",
          render: () => <Badge tone={result === "Executed" ? "success" : "danger"} label={result} />,
        },
      ]}
      rows={rows}
      getRowKey={(row) => row.field}
    />
  );
}
