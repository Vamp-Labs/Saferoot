"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConnection } from "wagmi";
import type { SafeInfo } from "@/domain/types";
import { fetchSafeInfo } from "@/lib/api/safes";
import { ApiUnavailableError } from "@/lib/api/client";
import { useAppState } from "@/context/AppStateContext";
import { Button, TextLink } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Feedback";
import { Card } from "@/components/ui/Surfaces";
import { CopyableAddress } from "@/components/ui/CopyableAddress";
import { NetworkBadge } from "@/components/layout/NetworkBadge";

type LookupStatus = "idle" | "loading" | "found" | "error";

function isValidAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value.trim());
}

export function SelectSafeForm() {
  const router = useRouter();
  const connection = useConnection();
  const { setSelectedSafe } = useAppState();
  const [addressInput, setAddressInput] = useState("");
  const [status, setStatus] = useState<LookupStatus>("idle");
  const [safe, setSafe] = useState<SafeInfo | null>(null);
  const [showOwners, setShowOwners] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [usedFixture, setUsedFixture] = useState(false);

  async function handleLookup() {
    if (!isValidAddress(addressInput)) {
      setStatus("error");
      setErrorMessage("Enter a valid Ethereum address to look up its Safe configuration.");
      return;
    }
    setStatus("loading");
    setErrorMessage(null);
    try {
      const result = await fetchSafeInfo(addressInput.trim());
      if (!result.data.owners.length) {
        setStatus("error");
        setErrorMessage("This address is not a Safe, or SafeRoot could not read its owner configuration.");
        return;
      }
      setSafe(result.data);
      setUsedFixture(!result.isLive);
      setStatus("found");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof ApiUnavailableError
          ? "SafeRoot could not reach the Safe Transaction Service right now."
          : "Unable to read this Safe's configuration.",
      );
    }
  }

  function handleReset() {
    setSafe(null);
    setStatus("idle");
    setAddressInput("");
    setErrorMessage(null);
  }

  function handleContinue() {
    if (!safe) return;
    setSelectedSafe(safe);
    router.push("/policies/new");
  }

  const walletIsOwner =
    connection.isConnected && safe ? safe.owners.some((owner) => owner.toLowerCase() === connection.address?.toLowerCase()) : true;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 lg:px-0">
      <NetworkBadge network="ethereum-sepolia" className="mb-6" />
      <h1 className="max-w-xl text-3xl font-medium leading-tight text-text-primary md:text-4xl">Select Safe</h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-text-secondary">
        Use your existing Safe authority. SafeRoot does not create a new signer system — the Safe you choose here stays the source
        of authority for every Creditcoin policy you build.
      </p>

      {!safe && (
        <Card className="mt-10">
          <label htmlFor="safe-address" className="text-sm font-medium text-text-primary">
            Safe address on Ethereum Sepolia
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="safe-address"
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              value={addressInput}
              onChange={(event) => setAddressInput(event.target.value)}
              placeholder="0x…"
              className="focus-ring w-full flex-1 border border-gray-300 px-3 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-secondary/60"
            />
            <Button type="button" onClick={handleLookup} disabled={status === "loading"} className="!px-5 !py-2.5">
              {status === "loading" ? "Looking up…" : "Look up Safe"}
            </Button>
          </div>
          {status === "error" && errorMessage && (
            <div className="mt-4">
              <Callout tone="danger" title="Could not confirm this Safe">
                {errorMessage}
              </Callout>
            </div>
          )}
        </Card>
      )}

      {safe && (
        <Card className="mt-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Authority Safe</p>
              <h2 className="mt-1 text-xl font-medium text-text-primary">{safe.name ?? "Unnamed Safe"}</h2>
              <div className="mt-2">
                <CopyableAddress address={safe.address} />
              </div>
            </div>
            <NetworkBadge network="ethereum-sepolia" />
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-6 sm:grid-cols-3">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Owners</dt>
              <dd className="mt-1 text-lg font-medium text-text-primary">{safe.owners.length}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Threshold</dt>
              <dd className="mt-1 text-lg font-medium text-text-primary">
                {safe.threshold}-of-{safe.owners.length}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Network</dt>
              <dd className="mt-1 text-lg font-medium text-text-primary">Sepolia</dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={() => setShowOwners((value) => !value)}
            className="focus-ring mt-4 text-sm font-medium text-text-primary hover:text-tribe-blue transition-colors"
          >
            {showOwners ? "Hide owners" : "View owners"}
          </button>
          {showOwners && (
            <ul className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
              {safe.owners.map((owner) => (
                <li key={owner}>
                  <CopyableAddress address={owner} full />
                </li>
              ))}
            </ul>
          )}

          {usedFixture && (
            <p className="mt-4 text-xs text-text-secondary">
              Showing example data — connect the SafeRoot API to look up a live Safe.
            </p>
          )}

          {!walletIsOwner && (
            <div className="mt-6">
              <Callout tone="warning" title="Connected wallet is not an owner of this Safe">
                You can still prepare a policy for review. Only a Safe owner can sign the eventual approval.
              </Callout>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Button type="button" onClick={handleContinue} withArrow>
              Continue with this Safe
            </Button>
            <TextLink onClick={handleReset} type="button">
              Select a different Safe
            </TextLink>
          </div>
        </Card>
      )}
    </div>
  );
}
