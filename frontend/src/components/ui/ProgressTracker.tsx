import { cn } from "@/lib/cn";

export type TrackerStepStatus = "complete" | "current" | "pending" | "failed";

export interface TrackerStep {
  label: string;
  status: TrackerStepStatus;
  detail?: string;
}

interface ProgressTrackerProps {
  steps: TrackerStep[];
}

function StepIcon({ status }: { status: TrackerStepStatus }) {
  if (status === "complete") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
      </svg>
    );
  }
  if (status === "failed") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeWidth="2.5" />
      </svg>
    );
  }
  return <span className="h-2 w-2 rounded-full bg-current" />;
}

export function ProgressTracker({ steps }: ProgressTrackerProps) {
  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const circleTone =
          step.status === "complete"
            ? "bg-tribe-blue text-white"
            : step.status === "current"
              ? "border-2 border-tribe-blue text-tribe-blue bg-white"
              : step.status === "failed"
                ? "bg-danger text-white"
                : "border-2 border-gray-300 text-gray-300 bg-white";
        const lineTone = step.status === "complete" || step.status === "failed" ? "bg-tribe-blue" : "bg-gray-200";
        const labelTone =
          step.status === "pending" ? "text-text-secondary" : step.status === "failed" ? "text-danger" : "text-text-primary";
        return (
          <li key={step.label} className="flex flex-1 flex-col sm:flex-row sm:items-start">
            <div className="flex items-center sm:flex-col sm:items-center">
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", circleTone)}>
                <StepIcon status={step.status} />
              </span>
              {!isLast && (
                <span
                  className={cn(
                    "mx-3 h-px flex-1 sm:mx-0 sm:my-2 sm:h-10 sm:w-px",
                    step.status === "complete" ? lineTone : "bg-gray-200",
                  )}
                  aria-hidden="true"
                />
              )}
            </div>
            <div className="pb-6 pl-3 sm:pl-0 sm:pt-1 sm:text-center">
              <p className={cn("text-sm font-medium", labelTone)}>{step.label}</p>
              {step.detail && <p className="mt-0.5 max-w-[10rem] text-xs text-text-secondary sm:mx-auto">{step.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
