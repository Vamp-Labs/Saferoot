import type { ReactNode } from "react";
import type { Policy } from "@/domain/types";
import { PolicyRow } from "./PolicyRow";

interface PolicySectionProps {
  title: string;
  description?: string;
  policies: Policy[];
  emptyLabel: string;
  action?: ReactNode;
}

export function PolicySection({ title, description, policies, emptyLabel, action }: PolicySectionProps) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-text-primary">{title}</h2>
          {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {policies.length === 0 ? (
          <p className="border border-dashed border-gray-300 px-5 py-6 text-sm text-text-secondary">{emptyLabel}</p>
        ) : (
          policies.map((policy) => <PolicyRow key={policy.id} policy={policy} />)
        )}
      </div>
    </section>
  );
}
