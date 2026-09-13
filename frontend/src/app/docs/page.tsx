import type { Metadata } from "next";
import { Card } from "@/components/ui/Surfaces";

export const metadata: Metadata = {
  title: "Docs — SafeRoot Policy",
};

const PDF_PATH = "/docs/saferoot-whitepaper.pdf";
const YOUTUBE_URL = "https://youtu.be/6N_fVw4CcgM";

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12 lg:px-0">
      <h1 className="text-3xl font-medium leading-tight text-text-primary md:text-4xl">Docs</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary">
        The SafeRoot Policy whitepaper — problem, solution, architecture, security model, and live
        deployment evidence, in one document. For the recorded walkthrough, watch the demo video.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <a
          href={PDF_PATH}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-tribe-blue px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-tribe-blue/90 focus-ring"
        >
          Open PDF in new tab
        </a>
        <a
          href={PDF_PATH}
          download="SafeRoot-Policy-Whitepaper.pdf"
          className="inline-flex items-center justify-center gap-2 border border-text-primary px-6 py-3 text-xs font-semibold uppercase tracking-wider text-text-primary transition-colors hover:border-tribe-blue hover:text-tribe-blue focus-ring"
        >
          Download PDF
        </a>
        <a
          href={YOUTUBE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 border-b border-text-primary pb-1 text-sm font-medium text-text-primary transition-colors hover:border-tribe-blue hover:text-tribe-blue focus-ring"
        >
          Watch the 3-minute demo video
          <svg
            className="h-4 w-4 transform transition-transform group-hover:translate-x-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </a>
      </div>

      <Card className="mt-8 !p-0 overflow-hidden">
        <object data={PDF_PATH} type="application/pdf" className="h-[80vh] w-full">
          <div className="flex h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-sm text-text-secondary">
              Your browser can&apos;t preview PDFs inline. Use one of the links above instead.
            </p>
          </div>
        </object>
      </Card>
    </div>
  );
}
