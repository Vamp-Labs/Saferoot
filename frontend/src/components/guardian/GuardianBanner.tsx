import { Callout } from "@/components/ui/Feedback";
import { guardianPauseCopy } from "@/domain/copy";

export function GuardianBanner() {
  return (
    <Callout tone="danger" title={guardianPauseCopy.pausedBanner}>
      Completed actions were not reversed. Unused actions are unavailable on Creditcoin until a new Safe-approved policy is
      activated.
    </Callout>
  );
}
