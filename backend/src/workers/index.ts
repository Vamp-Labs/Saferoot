import { childLogger } from "../logger";
import { startSafeWatcher } from "./safeWatcher";
import { startAttestcoinWorker } from "./attestcoinWorker";
import { startChainIndexer } from "./chainIndexer";
import type { PollingLoopHandle } from "./loop";

const log = childLogger("workers");

export function startAllWorkers(): PollingLoopHandle {
  log.info("Starting Safe watcher, Attestcoin proof worker, and Creditcoin CC3 chain indexer");
  const handles = [startSafeWatcher(), startAttestcoinWorker(), startChainIndexer()];
  return {
    stop: () => {
      for (const handle of handles) handle.stop();
    },
  };
}
