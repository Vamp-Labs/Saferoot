"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { SafeInfo } from "@/domain/types";

const STORAGE_KEY = "saferoot:selectedSafe";
const DRAFT_STORAGE_KEY = "saferoot:policyDraft";
const STORAGE_EVENT = "saferoot:storage-changed";

interface AppState {
  selectedSafe: SafeInfo | null;
  setSelectedSafe: (safe: SafeInfo | null) => void;
  draftPolicyJson: string | null;
  saveDraftPolicyJson: (json: string) => void;
  clearDraftPolicyJson: () => void;
}

const AppStateContext = createContext<AppState | null>(null);

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(STORAGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(STORAGE_EVENT, onStoreChange);
  };
}

function notifyLocalChange() {
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function readSelectedSafe(): SafeInfo | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SafeInfo;
  } catch {
    return null;
  }
}

function readDraftPolicyJson(): string | null {
  return window.localStorage.getItem(DRAFT_STORAGE_KEY);
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const selectedSafe = useSyncExternalStore(subscribe, readSelectedSafe, () => null);
  const draftPolicyJson = useSyncExternalStore(subscribe, readDraftPolicyJson, () => null);

  const setSelectedSafe = useCallback((safe: SafeInfo | null) => {
    if (safe) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    notifyLocalChange();
  }, []);

  const saveDraftPolicyJson = useCallback((json: string) => {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, json);
    notifyLocalChange();
  }, []);

  const clearDraftPolicyJson = useCallback(() => {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    notifyLocalChange();
  }, []);

  const value = useMemo(
    () => ({ selectedSafe, setSelectedSafe, draftPolicyJson, saveDraftPolicyJson, clearDraftPolicyJson }),
    [selectedSafe, setSelectedSafe, draftPolicyJson, saveDraftPolicyJson, clearDraftPolicyJson],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used within AppStateProvider");
  return context;
}
