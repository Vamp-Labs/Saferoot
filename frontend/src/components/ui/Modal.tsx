"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  labelledById?: string;
}

export function Modal({ title, onClose, children }: ModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-lg border border-gray-200 bg-white p-6 shadow-none"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="modal-title" className="text-lg font-medium text-text-primary">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="focus-ring text-text-secondary hover:text-tribe-blue transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeWidth="1.75" />
            </svg>
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
