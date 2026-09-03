import type { ActivityEvent } from "@/domain/types";
import { ActivityRow } from "./ActivityRow";
import { EmptyState } from "@/components/ui/Feedback";

interface ActivityListProps {
  events: ActivityEvent[];
}

export function ActivityList({ events }: ActivityListProps) {
  if (events.length === 0) {
    return <EmptyState message="No activity yet for this policy." />;
  }
  return (
    <div className="flex flex-col gap-3">
      {events.map((event) => (
        <ActivityRow key={event.id} event={event} />
      ))}
    </div>
  );
}
