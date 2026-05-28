import { getBatch, getTotalBatches, loadWords } from "./words.js";
import { createBatchSession } from "./state.js";
import { showToast } from "./ui/toast.js";
import { createFlashcardView } from "./views/flashcard.js";
import { renderBatchStats } from "./views/batchStats.js";
import { renderCelebrate } from "./views/celebrate.js";
import { load, save, resetLibrary } from "./storage.js";
import { flushStudyTimer, startStudyTimer, stopStudyTimer } from "./studyTimer.js";

/** @typedef {import('./state.js').BatchSession} BatchSession */
/** @typedef {import('./storage.js').PersistedState} PersistedState */
/** @typedef {import('./storage.js').AppView} AppView */

const views = {
  flashcard: document.getElementById("view-flashcard"),
  batchStats: document.getElementById("view-batch-stats"),
  celebrate: document.getElementById("view-celebrate"),
};
const headerEl = document.querySelector(".site-header");
const debugEl = document.getElementById("words-debug");

/** @type {import('./words.js').Word[]} */
let words = [];
let totalBatches = 0;
let currentBatchIndex = 0;
/** @type {BatchSession | null} */
let session = null;
/** @type {ReturnType<typeof createFlashcardView> | null} */
let flashcardView = null;
/** @type {{ destroy: () => void } | null} */
let batchStatsView = null;
/** @type {{ destroy: () => void } | null} */
let celebrateView = null;
/** @type {PersistedState} */
let appState = load();

/**
 * @param {AppView} name
 */
function showView(name) {
  for (const [key, el] of Object.entries(views)) {
    if (!el) continue;
    el.hidden = key !== name;
  }
  if (headerEl) headerEl.hidden = name === "flashcard";
  const colophon = document.querySelector(".site-colophon");
  if (colophon) colophon.hidden = name === "flashcard";

  if (name === "flashcard") {
    startStudyTimer(() => !views.flashcard?.hidden && Boolean(session));
  } else {
    stopStudyTimer();
  }
}

function teardownViews() {
  flashcardView?.destroy();
  flashcardView = null;
  batchStatsView?.destroy();
  batchStatsView = null;
  celebrateView?.destroy();
  celebrateView = null;
}

function persistNow(patch = {}) {
  appState = save({
    currentBatchIndex,
    batchSession: session?.toSnapshot() ?? null,
    ...patch,
  });
}

function markBatchCompleted(batchIndex) {
  const set = new Set(appState.completedBatches);
  set.add(batchIndex);
  appState = save({
    completedBatches: [...set].sort((a, b) => a - b),
  });
}

/**
 * @param {number} batchIndex
 * @param {import('./state.js').BatchSessionSnapshot | null | undefined} [snapshot]
 */
function startBatch(batchIndex, snapshot) {
  teardownViews();
  currentBatchIndex = batchIndex;
  const batchWords = getBatch(words, batchIndex);
  session = createBatchSession(batchWords, snapshot);

  if (!appState.firstStudyAt) {
    appState = save({ firstStudyAt: Date.now() });
  }

  const container = views.flashcard;
  if (!container) return;

  flashcardView = createFlashcardView(container, {
    session,
    batchIndex,
    totalBatches,
    onBatchComplete: handleBatchComplete,
    onSessionChange: persistProgress,
  });

  appState = save({
    view: "flashcard",
    currentBatchIndex,
    batchSession: session.toSnapshot(),
    libraryCompletedAt: null,
  });

  showView("flashcard");
}

function persistProgress() {
  if (!session) return;
  persistNow({ view: "flashcard", batchSession: session.toSnapshot() });
}

function showBatchStatsFor(batchIndex) {
  teardownViews();
  currentBatchIndex = batchIndex;
  session = null;

  const snapshot = appState.batchSession;
  const container = views.batchStats;
  if (!container) return;

  batchStatsView = renderBatchStats(container, {
    batchIndex,
    totalBatches,
    forgottenList: snapshot?.everForgotten ?? [],
    batchStartedAt: snapshot?.batchStartedAt ?? Date.now(),
    onNextBatch: handleNextBatch,
  });

  appState = save({
    view: "batchStats",
    currentBatchIndex: batchIndex,
  });

  showView("batchStats");
}

function handleBatchComplete() {
  if (!session) return;

  markBatchCompleted(currentBatchIndex);

  const snapshot = session.toSnapshot();
  flashcardView?.destroy();
  flashcardView = null;
  session = null;

  appState = save({
    view: "batchStats",
    currentBatchIndex,
    batchSession: snapshot,
  });

  showBatchStatsFor(currentBatchIndex);
}

function handleNextBatch() {
  batchStatsView?.destroy();
  batchStatsView = null;
  session = null;
  appState = save({ batchSession: null });

  if (currentBatchIndex + 1 >= totalBatches) {
    completeLibrary();
    return;
  }

  startBatch(currentBatchIndex + 1);
}

function completeLibrary() {
  appState = save({
    libraryCompletedAt: Date.now(),
    view: "celebrate",
    batchSession: null,
    completedBatches: Array.from({ length: totalBatches }, (_, i) => i),
  });
  showCelebrate();
}

/**
 * @param {{ testMode?: boolean }} [options]
 */
function showCelebrate(options = {}) {
  teardownViews();
  session = null;

  const container = views.celebrate;
  if (!container) return;

  const state = load();
  const totalStudyMs = options.testMode ? Math.max(state.totalStudyMs, 125000) : state.totalStudyMs;

  celebrateView = renderCelebrate(container, {
    totalStudyMs,
    playthrough: state.playthrough,
    onReplay: handleReplay,
  });

  if (!options.testMode) {
    appState = save({ view: "celebrate", batchSession: null });
  }

  showView("celebrate");
}

function handleReplay() {
  celebrateView?.destroy();
  celebrateView = null;
  appState = resetLibrary();
  currentBatchIndex = 0;
  session = null;
  startBatch(0);
}

function restoreFromStorage() {
  appState = load();
  currentBatchIndex = Math.min(appState.currentBatchIndex, Math.max(0, totalBatches - 1));

  if (appState.libraryCompletedAt && appState.view === "celebrate") {
    showCelebrate();
    return;
  }

  if (appState.view === "batchStats") {
    showBatchStatsFor(currentBatchIndex);
    return;
  }

  if (appState.batchSession && !appState.batchSession.completed) {
    startBatch(currentBatchIndex, appState.batchSession);
    return;
  }

  if (appState.libraryCompletedAt) {
    showCelebrate();
    return;
  }

  startBatch(currentBatchIndex);
}

/**
 * @param {KeyboardEvent} event
 */
function handleKeydown(event) {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return;
  }

  if (event.shiftKey && event.key === ".") {
    event.preventDefault();
    showCelebrate({ testMode: true });
    showToast("测试：庆祝页预览");
    return;
  }

  if (!flashcardView || !session || views.flashcard?.hidden) return;
  if (event.repeat) return;

  const key = event.key;

  if (key === "a" || key === "A" || key === "ArrowLeft") {
    event.preventDefault();
    flashcardView.judge(false);
    persistProgress();
    return;
  }

  if (key === "d" || key === "D" || key === "ArrowRight") {
    event.preventDefault();
    flashcardView.judge(true);
    persistProgress();
    return;
  }

  if (key === " " || key === "Spacebar") {
    event.preventDefault();
    if (!session.isRevealed()) {
      showToast("先按 A 或 D");
      return;
    }
    flashcardView.tryAdvance();
    persistProgress();
  }
}

/**
 * @param {MouseEvent} event
 */
function handleFlashcardActionClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const actionButton = target.closest("[data-study-action]");
  if (!(actionButton instanceof HTMLButtonElement)) return;
  if (!flashcardView || !session || views.flashcard?.hidden) return;

  const action = actionButton.dataset.studyAction;
  if (action === "forgot") {
    flashcardView.judge(false);
    persistProgress();
    return;
  }

  if (action === "remember") {
    flashcardView.judge(true);
    persistProgress();
    return;
  }

  if (action === "next") {
    if (!session.isRevealed()) {
      showToast("先按 A 或 D");
      return;
    }
    flashcardView.tryAdvance();
    persistProgress();
  }
}

function setDebugMessage(text, isError = false) {
  if (!debugEl) return;
  const textEl = debugEl.querySelector(".words-debug__text");
  const skeleton = debugEl.querySelector(".words-debug__skeleton");
  if (textEl) textEl.textContent = text;
  else debugEl.textContent = text;
  debugEl.classList.toggle("words-debug--error", isError);
  debugEl.classList.toggle("words-debug--loaded", !isError && Boolean(text));
  if (skeleton) skeleton.hidden = true;
}

window.addEventListener("beforeunload", () => {
  flushStudyTimer();
  if (session) persistProgress();
});

document.addEventListener("DOMContentLoaded", async () => {
  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("click", handleFlashcardActionClick);

  try {
    words = await loadWords();
    totalBatches = getTotalBatches(words);
    setDebugMessage(`共 ${words.length} 词 · ${totalBatches} 批 · Shift+. 测庆祝`);
    restoreFromStorage();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "词库加载失败，请使用本地 HTTP 服务打开页面。";
    console.error("[启动]", err);
    setDebugMessage(message, true);
  }
});
