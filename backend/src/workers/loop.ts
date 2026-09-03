import { childLogger } from "../logger";

export interface PollingLoopHandle {
  stop: () => void;
}

export function startPollingLoop(name: string, intervalMs: number, tick: () => Promise<void>): PollingLoopHandle {
  const log = childLogger(name);
  let stopped = false;
  let running = false;

  const timer = setInterval(() => {
    void runTick();
  }, intervalMs);

  async function runTick(): Promise<void> {
    if (stopped || running) return;
    running = true;
    try {
      await tick();
    } catch (error) {
      log.error({ err: error }, "Worker tick failed");
    } finally {
      running = false;
    }
  }

  void runTick();

  return {
    stop: () => {
      stopped = true;
      clearInterval(timer);
    },
  };
}
