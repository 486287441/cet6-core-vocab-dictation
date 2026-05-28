/** @typedef {{ word: string, meaning: string }} Word */

import { formatMeaningHtml } from "../ui/formatMeaning.js";
import { iconArrowRight, iconBookOpen, iconCheckCircle } from "../ui/icons.js";

/**
 * @param {HTMLElement} container
 * @param {Object} data
 * @param {number} data.batchIndex
 * @param {number} data.totalBatches
 * @param {Word[]} data.forgottenList
 * @param {number} data.batchStartedAt
 * @param {number} [data.batchStudyMs]
 * @param {() => void} data.onNextBatch
 * @returns {{ destroy: () => void }}
 */
export function renderBatchStats(container, data) {
  const { batchIndex, totalBatches, forgottenList, batchStartedAt, batchStudyMs, onNextBatch } =
    data;
  const elapsedMs =
    typeof batchStudyMs === "number" ? Math.max(0, batchStudyMs) : Math.max(0, Date.now() - batchStartedAt);
  const isLastBatch = batchIndex + 1 >= totalBatches;
  container.innerHTML = `
    <section class="batch-stats">
      <header class="batch-stats__hero">
        <div class="batch-stats__icon" aria-hidden="true">${iconCheckCircle}</div>
        <h2 class="batch-stats__title">本批完成</h2>
        <p class="batch-stats__meta">第 ${batchIndex + 1} / ${totalBatches} 批</p>
      </header>

      <hr class="rule rule--wide" aria-hidden="true" />
      <div class="metrics-row" role="group" aria-label="本批摘要">
        <div class="metrics-row__item">
          <span class="metrics-row__label">用时</span>
          <span class="metrics-row__value">${formatDuration(elapsedMs)}</span>
        </div>
        <div class="metrics-row__item">
          <span class="metrics-row__label">需复习</span>
          <span class="metrics-row__value${forgottenList.length > 0 ? " metrics-row__value--emph" : ""}">${forgottenList.length}</span>
        </div>
        <div class="metrics-row__item">
          <span class="metrics-row__label">状态</span>
          <span class="metrics-row__value">${forgottenList.length === 0 ? "全掌握" : "待巩固"}</span>
        </div>
      </div>
      <hr class="rule rule--wide" aria-hidden="true" />

      <div class="batch-stats__body" data-list></div>

      <button type="button" class="batch-stats__btn" data-next>
        <span>${isLastBatch ? "完成全库" : "开始下一批"}</span>
        <span class="batch-stats__btn-icon" aria-hidden="true">${iconArrowRight}</span>
      </button>
    </section>
  `;

  const listEl = container.querySelector("[data-list]");
  const nextBtn = container.querySelector("[data-next]");

  if (listEl) {
    if (forgottenList.length === 0) {
      listEl.innerHTML = `
        <div class="batch-stats__empty">
          <span class="batch-stats__empty-icon" aria-hidden="true">${iconBookOpen}</span>
          <p class="batch-stats__empty-title">本轮一次全记住，太棒了</p>
          <p class="batch-stats__empty-desc">${isLastBatch ? "即将进入全库庆祝。" : "继续保持，进入下一批巩固记忆。"}</p>
        </div>
      `;
    } else {
      listEl.innerHTML = `
        <h3 class="batch-stats__section-title">本批需复习（${forgottenList.length}）</h3>
        <ul class="batch-stats__words"></ul>
      `;
      const ul = listEl.querySelector(".batch-stats__words");
      if (ul) {
        for (const item of forgottenList) {
          const li = document.createElement("li");
          li.innerHTML = `<span class="batch-stats__en">${escapeHtml(item.word)}</span><div class="batch-stats__zh">${formatMeaningHtml(item.meaning)}</div>`;
          ul.appendChild(li);
        }
      }
    }
  }

  nextBtn?.addEventListener("click", onNextBatch);

  return {
    destroy() {
      container.innerHTML = "";
    },
  };
}

/**
 * @param {number} ms
 */
function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

/**
 * @param {string} text
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
