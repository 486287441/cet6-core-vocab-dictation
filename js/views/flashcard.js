/** @typedef {import('../state.js').BatchSession} BatchSession */

import { renderProgress } from "../ui/progress.js";
import { renderMeaningInto } from "../ui/formatMeaning.js";

/**
 * @typedef {Object} FlashcardView
 * @property {() => void} render
 * @property {(remember: boolean) => void} judge
 * @property {() => boolean} tryAdvance
 * @property {() => void} destroy
 */

/**
 * @param {HTMLElement} container
 * @param {Object} options
 * @param {BatchSession} options.session
 * @param {number} options.batchIndex
 * @param {number} options.totalBatches
 * @param {() => void} options.onBatchComplete
 * @param {() => void} [options.onSessionChange]
 * @returns {FlashcardView}
 */
export function createFlashcardView(container, options) {
  const { session, batchIndex, totalBatches, onBatchComplete, onSessionChange } = options;

  container.innerHTML = `
    <div class="flashcard">
      <header class="flashcard__bar">
        <p class="flashcard__folio">
          <span class="flashcard__folio-label">Batch</span>
          <span class="flashcard__folio-num">${String(batchIndex + 1).padStart(2, "0")}</span>
          <span class="flashcard__folio-of">/ ${String(totalBatches).padStart(2, "0")}</span>
        </p>
        <p class="flashcard__mode">闪卡</p>
      </header>
      <hr class="rule rule--short" aria-hidden="true" />
      <div class="study-progress" data-progress></div>
      <article class="flashcard__card" data-card>
        <div class="flashcard__content" data-content>
          <p class="flashcard__kicker">English</p>
          <p class="flashcard__en" data-en lang="en"></p>
          <div class="flashcard__zh" data-zh hidden></div>
          <p class="flashcard__verdict" data-verdict hidden aria-live="polite"></p>
        </div>
      </article>
      <hr class="rule rule--short" aria-hidden="true" />
      <nav class="flashcard__keys" aria-label="键盘快捷键">
        <div class="flashcard__key">
          <kbd class="kbd">A</kbd>
          <span class="flashcard__key-label">不记得</span>
        </div>
        <span class="flashcard__key-rule" aria-hidden="true"></span>
        <div class="flashcard__key">
          <kbd class="kbd kbd--wide">空格</kbd>
          <span class="flashcard__key-label">下一张</span>
        </div>
        <span class="flashcard__key-rule" aria-hidden="true"></span>
        <div class="flashcard__key flashcard__key--accent">
          <kbd class="kbd">D</kbd>
          <span class="flashcard__key-label">记得</span>
        </div>
      </nav>
      <p class="flashcard__hints">← → 与 A / D 等效 · 先判词再按空格</p>
      <nav class="flashcard__actions" aria-label="触控操作">
        <button type="button" class="flashcard__action-btn" data-study-action="forgot">不记得</button>
        <button type="button" class="flashcard__action-btn flashcard__action-btn--primary" data-study-action="next">
          下一张
        </button>
        <button type="button" class="flashcard__action-btn" data-study-action="remember">
          记得
        </button>
      </nav>
    </div>
  `;

  const progressEl = container.querySelector("[data-progress]");
  const cardEl = container.querySelector("[data-card]");
  const enEl = container.querySelector("[data-en]");
  const zhEl = container.querySelector("[data-zh]");
  const verdictEl = container.querySelector("[data-verdict]");

  if (!progressEl || !cardEl || !enEl || !zhEl || !verdictEl) {
    throw new Error("闪卡视图结构初始化失败");
  }

  function syncCardState() {
    const revealed = session.isRevealed();
    const forgot = revealed && session.isCurrentForgotten();
    const remember = revealed && !session.isCurrentForgotten();

    cardEl.classList.toggle("flashcard__card--forgot", forgot);
    cardEl.classList.toggle("flashcard__card--remember", remember);

    if (revealed) {
      verdictEl.hidden = false;
      verdictEl.textContent = forgot ? "需巩固" : "已记住";
      verdictEl.className = `flashcard__verdict flashcard__verdict--${forgot ? "forgot" : "remember"}`;
    } else {
      verdictEl.hidden = true;
      verdictEl.textContent = "";
      verdictEl.className = "flashcard__verdict";
    }
  }

  function hideMeaning() {
    zhEl.classList.remove("flashcard__zh--visible");
    zhEl.hidden = true;
    zhEl.innerHTML = "";
  }

  function render() {
    if (session.isBatchComplete()) {
      onBatchComplete();
      return;
    }

    const word = session.getCurrentWord();
    if (!word) {
      onBatchComplete();
      return;
    }

    renderProgress(progressEl, session, batchIndex, totalBatches);

    const revealed = session.isRevealed();
    enEl.textContent = word.word;

    if (revealed) {
      renderMeaningInto(zhEl, word.meaning);
      zhEl.hidden = false;
      if (!zhEl.classList.contains("flashcard__zh--visible")) {
        requestAnimationFrame(() => {
          zhEl.classList.add("flashcard__zh--visible");
        });
      }
    } else {
      hideMeaning();
    }

    syncCardState();
  }

  function judge(remember) {
    session.judge(remember);
    onSessionChange?.();
    render();
  }

  const CROSSFADE_MS = 200;

  function tryAdvance() {
    if (!session.canAdvance()) return false;
    hideMeaning();
    session.advance();
    onSessionChange?.();
    if (session.isBatchComplete()) {
      onBatchComplete();
      return true;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      render();
      return true;
    }

    cardEl.classList.add("flashcard__card--fade-out");
    window.setTimeout(() => {
      render();
      cardEl.classList.remove("flashcard__card--fade-out");
      cardEl.classList.add("flashcard__card--fade-in");
      window.requestAnimationFrame(() => {
        cardEl.classList.add("flashcard__card--fade-in-active");
        window.setTimeout(() => {
          cardEl.classList.remove("flashcard__card--fade-in", "flashcard__card--fade-in-active");
        }, CROSSFADE_MS);
      });
    }, CROSSFADE_MS);
    return true;
  }

  function destroy() {
    container.innerHTML = "";
  }

  render();

  return { render, judge, tryAdvance, destroy };
}
