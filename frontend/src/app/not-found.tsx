import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-2xl font-medium text-text-primary">Not found</h1>
      <p className="mt-3 text-sm text-text-secondary">
        This page, policy, or action does not exist or is no longer available.
      </p>
      <div className="mt-8">
        <ButtonLink href="/policies" withArrow>
          Back to policies
        </ButtonLink>
      </div>
    </div>
  );
}
