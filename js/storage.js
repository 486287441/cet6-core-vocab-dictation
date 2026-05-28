/** @typedef {import('./state.js').BatchSessionSnapshot} BatchSessionSnapshot */

export const STORAGE_KEY = "cet6_vocab_state";
export const STORAGE_VERSION = 1;

/**
 * @typedef {'flashcard' | 'batchStats' | 'celebrate'} AppView
 */

/**
 * @typedef {Object} PersistedState
 * @property {number} version
 * @property {number} currentBatchIndex
 * @property {AppView} view
 * @property {BatchSessionSnapshot | null} batchSession
 * @property {number[]} completedBatches
 * @property {number} totalStudyMs
 * @property {number | null} firstStudyAt
 * @property {number | null} libraryCompletedAt
 * @property {number} playthrough
 */

/**
 * @returns {PersistedState}
 */
export function createDefaultState() {
  return {
    version: STORAGE_VERSION,
    currentBatchIndex: 0,
    view: "flashcard",
    batchSession: null,
    completedBatches: [],
    totalStudyMs: 0,
    firstStudyAt: null,
    libraryCompletedAt: null,
    playthrough: 1,
  };
}

/**
 * @returns {PersistedState}
 */
export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch {
    return createDefaultState();
  }
}

/**
 * @param {Partial<PersistedState>} patch
 * @returns {PersistedState}
 */
export function save(patch) {
  const current = load();
  const next = normalizeState({ ...current, ...patch, version: STORAGE_VERSION });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

/**
 * @returns {PersistedState}
 */
export function resetLibrary() {
  const prev = load();
  const next = createDefaultState();
  next.playthrough = prev.playthrough + 1;
  next.firstStudyAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

/**
 * @param {unknown} raw
 * @returns {PersistedState}
 */
function normalizeState(raw) {
  const base = createDefaultState();
  if (!raw || typeof raw !== "object") return base;

  const o = /** @type {Record<string, unknown>} */ (raw);
  const view = o.view;
  const validView =
    view === "flashcard" || view === "batchStats" || view === "celebrate"
      ? view
      : base.view;

  return {
    version: STORAGE_VERSION,
    currentBatchIndex: clampInt(o.currentBatchIndex, 0, 9999, 0),
    view: validView,
    batchSession: normalizeBatchSession(o.batchSession),
    completedBatches: normalizeBatchList(o.completedBatches),
    totalStudyMs: clampInt(o.totalStudyMs, 0, Number.MAX_SAFE_INTEGER, 0),
    firstStudyAt: typeof o.firstStudyAt === "number" ? o.firstStudyAt : null,
    libraryCompletedAt:
      typeof o.libraryCompletedAt === "number" ? o.libraryCompletedAt : null,
    playthrough: clampInt(o.playthrough, 1, 9999, 1),
  };
}

/**
 * @param {unknown} value
 * @returns {BatchSessionSnapshot | null}
 */
function normalizeBatchSession(value) {
  if (!value || typeof value !== "object") return null;
  const s = /** @type {Record<string, unknown>} */ (value);
  if (!Array.isArray(s.queue) || typeof s.batchStartedAt !== "number") return null;

  return {
    round: clampInt(s.round, 1, 999, 1),
    queue: s.queue.map((i) => clampInt(i, 0, 9999, 0)),
    position: clampInt(s.position, 0, 9999, 0),
    revealed: Boolean(s.revealed),
    completed: Boolean(s.completed),
    batchStartedAt: s.batchStartedAt,
    batchStudyMs: clampInt(s.batchStudyMs, 0, Number.MAX_SAFE_INTEGER, 0),
    everForgotten: Array.isArray(s.everForgotten)
      ? s.everForgotten
          .filter((x) => x && typeof x === "object")
          .map((x) => {
            const w = /** @type {Record<string, unknown>} */ (x);
            return {
              word: String(w.word ?? ""),
              meaning: String(w.meaning ?? ""),
            };
          })
          .filter((w) => w.word)
      : [],
    roundForgotten: Array.isArray(s.roundForgotten)
      ? s.roundForgotten.map((w) => String(w)).filter(Boolean)
      : [],
  };
}

/**
 * @param {unknown} value
 * @returns {number[]}
 */
function normalizeBatchList(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((n) => clampInt(n, 0, 9999, -1)).filter((n) => n >= 0))].sort(
    (a, b) => a - b,
  );
}

/**
 * @param {unknown} value
 * @param {number} min
 * @param {number} max
 * @param {number} fallback
 */
function clampInt(value, min, max, fallback) {
  const n = typeof value === "number" ? Math.floor(value) : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * @param {number} ms
 */
export function formatStudyDuration(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;

  if (h > 0) {
    return `${h} 小时 ${min} 分 ${String(sec).padStart(2, "0")} 秒`;
  }
  if (min > 0) {
    return `${min} 分 ${String(sec).padStart(2, "0")} 秒`;
  }
  return `${sec} 秒`;
}
