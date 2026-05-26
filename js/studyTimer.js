import { load, save } from "./storage.js";

/** @type {number | null} */
let rafId = null;
/** @type {number | null} */
let lastTick = null;
/** @type {boolean} */
let running = false;

/**
 * @param {() => boolean} isActive
 */
export function startStudyTimer(isActive) {
  stopStudyTimer();
  running = true;
  lastTick = performance.now();

  const tick = (now) => {
    if (!running) return;

    if (document.hidden || !isActive()) {
      lastTick = now;
      rafId = requestAnimationFrame(tick);
      return;
    }

    if (lastTick !== null) {
      const delta = now - lastTick;
      if (delta > 0 && delta < 5000) {
        const state = load();
        save({ totalStudyMs: state.totalStudyMs + delta });
      }
    }
    lastTick = now;
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
}

export function stopStudyTimer() {
  running = false;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  lastTick = null;
}

/** 关页前刷盘 */
export function flushStudyTimer() {
  stopStudyTimer();
}
