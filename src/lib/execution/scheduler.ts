import { processDue } from "./engine";

let started = false;

export function startScheduler() {
  if (started) return;
  started = true;

  const tick = async () => {
    try {
      await processDue(30);
    } catch (error) {
      console.error("Scheduler tick failed", error);
    }
  };

  setInterval(tick, 4000);
  void tick();
}
