/** @typedef {import('../state.js').BatchSession} BatchSession */

/**
 * @param {HTMLElement} container
 * @param {BatchSession} session
 * @param {number} batchIndex
 * @param {number} totalBatches
 */
export function renderProgress(container, session, batchIndex, totalBatches) {
  const batchNo = batchIndex + 1;
  const position = session.getRoundPosition();
  const roundLen = session.getRoundQueueLength();
  const forgotten = session.getForgottenThisRoundCount();
  const round = session.getRound();

  const batchPct = totalBatches > 0 ? Math.round((batchNo / totalBatches) * 100) : 0;
  const cardPct = roundLen > 0 ? Math.round((position / roundLen) * 100) : 0;

  container.innerHTML = `
    <div class="study-progress__flow">
      <div class="study-progress__row">
        <div class="study-progress__head">
          <span class="study-progress__label">批次</span>
          <span class="study-progress__value">第 ${batchNo} / ${totalBatches} 批</span>
        </div>
        <div class="study-progress__track" role="progressbar" aria-valuenow="${batchNo}" aria-valuemin="1" aria-valuemax="${totalBatches}" aria-label="批次进度">
          <div class="study-progress__fill" style="width: ${batchPct}%"></div>
        </div>
      </div>
      <div class="study-progress__row">
        <div class="study-progress__head">
          <span class="study-progress__label">本轮</span>
          <span class="study-progress__value">第 ${round} 轮 · ${position} / ${roundLen}</span>
        </div>
        <div class="study-progress__track" role="progressbar" aria-valuenow="${position}" aria-valuemin="1" aria-valuemax="${roundLen}" aria-label="本轮卡片进度">
          <div class="study-progress__fill study-progress__fill--light" style="width: ${cardPct}%"></div>
        </div>
      </div>
      <p class="study-progress__meta${forgotten > 0 ? " study-progress__meta--emph" : ""}">本轮不熟 ${forgotten}</p>
    </div>
  `;
}
