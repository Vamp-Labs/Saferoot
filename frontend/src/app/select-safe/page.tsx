import type { Metadata } from "next";
import { SelectSafeForm } from "@/components/safe/SelectSafeForm";

export const metadata: Metadata = {
  title: "Select Safe — SafeRoot Policy",
};

export default function SelectSafePage() {
  return <SelectSafeForm />;
}
