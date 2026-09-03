import { journeyStages, type JourneyStage } from "@/domain/statusLanguage";
import { cn } from "@/lib/cn";

interface JourneyIndicatorProps {
  current: JourneyStage;
}

export function JourneyIndicator({ current }: JourneyIndicatorProps) {
  const currentIndex = journeyStages.indexOf(current);
  return (
    <div className="border-b border-gray-200 bg-tribe-gray/40">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-6 py-3 text-xs font-semibold uppercase tracking-wider lg:px-12">
        {journeyStages.map((stage, index) => {
          const isCurrent = index === currentIndex;
          const isComplete = index < currentIndex;
          return (
            <span key={stage} className="flex items-center gap-3">
              <span
                className={cn(
                  isCurrent
                    ? "text-tribe-blue"
                    : isComplete
                      ? "text-text-primary"
                      : "text-text-secondary/60",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {stage}
              </span>
              {index < journeyStages.length - 1 && <span className="text-text-secondary/40">→</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}
