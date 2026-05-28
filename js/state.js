/** @typedef {{ word: string, meaning: string }} Word */

/**
 * @typedef {Object} BatchSessionSnapshot
 * @property {number} round
 * @property {number[]} queue
 * @property {number} position
 * @property {boolean} revealed
 * @property {boolean} completed
 * @property {number} batchStartedAt
 * @property {number} batchStudyMs
 * @property {Word[]} everForgotten
 * @property {string[]} roundForgotten
 */

/**
 * @typedef {Object} BatchSession
 * @property {() => Word | null} getCurrentWord
 * @property {(remember: boolean) => void} judge
 * @property {() => boolean} canAdvance
 * @property {() => boolean} advance
 * @property {() => boolean} isBatchComplete
 * @property {() => Word[]} getEverForgottenList
 * @property {() => number} getRound
 * @property {() => number} getQueueRemaining
 * @property {() => number} getForgottenThisRoundCount
 * @property {() => number} getRoundQueueLength
 * @property {() => number} getRoundPosition
 * @property {() => boolean} isRevealed
 * @property {() => boolean} isCurrentForgotten
 * @property {() => number} getBatchStartedAt
 * @property {() => number} getBatchStudyMs
 * @property {(ms: number) => void} addStudyMs
 * @property {() => BatchSessionSnapshot} toSnapshot
 */

/**
 * @param {Word[]} batchWords
 * @param {BatchSessionSnapshot | null | undefined} [snapshot]
 * @returns {BatchSession}
 */
export function createBatchSession(batchWords, snapshot) {
  const words = batchWords.map((w) => ({ word: w.word, meaning: w.meaning }));
  const wordOrder = words.map((w) => w.word);

  let round = 1;
  /** @type {number[]} */
  let queue = words.map((_, index) => index);
  let position = 0;
  let revealed = false;
  let completed = false;
  let batchStartedAt = Date.now();
  let batchStudyMs = 0;

  /** @type {Map<string, Word>} */
  const everForgotten = new Map();
  /** @type {Set<string>} */
  const roundForgotten = new Set();

  if (snapshot) {
    round = snapshot.round;
    queue = snapshot.queue.filter((i) => i >= 0 && i < words.length);
    position = snapshot.position;
    revealed = snapshot.revealed;
    completed = snapshot.completed;
    batchStartedAt = snapshot.batchStartedAt;
    batchStudyMs = Number.isFinite(snapshot.batchStudyMs) ? Math.max(0, snapshot.batchStudyMs) : 0;
    for (const item of snapshot.everForgotten) {
      if (item?.word) everForgotten.set(item.word, { word: item.word, meaning: item.meaning });
    }
    for (const word of snapshot.roundForgotten) {
      if (wordOrder.includes(word)) roundForgotten.add(word);
    }
    if (queue.length === 0 && !completed) {
      queue = words.map((_, index) => index);
      position = 0;
    }
  }

  function getCurrentWord() {
    if (completed || position >= queue.length) return null;
    return words[queue[position]];
  }

  function judge(remember) {
    const current = getCurrentWord();
    if (!current || completed) return;

    revealed = true;

    if (remember) {
      roundForgotten.delete(current.word);
    } else {
      everForgotten.set(current.word, {
        word: current.word,
        meaning: current.meaning,
      });
      roundForgotten.add(current.word);
    }
  }

  function canAdvance() {
    return revealed && !completed && getCurrentWord() !== null;
  }

  function startNextRound() {
    queue = wordOrder
      .map((word, index) => ({ word, index }))
      .filter(({ word }) => roundForgotten.has(word))
      .map(({ index }) => index);
    roundForgotten.clear();
    position = 0;
    revealed = false;
    round += 1;
  }

  function advance() {
    if (!canAdvance()) return false;

    position += 1;
    revealed = false;

    if (position < queue.length) return true;

    if (roundForgotten.size === 0) {
      completed = true;
      return true;
    }

    startNextRound();
    return true;
  }

  function isBatchComplete() {
    return completed;
  }

  function getEverForgottenList() {
    return wordOrder
      .filter((word) => everForgotten.has(word))
      .map((word) => everForgotten.get(word));
  }

  function getRound() {
    return round;
  }

  function getQueueRemaining() {
    if (completed) return 0;
    return Math.max(0, queue.length - position);
  }

  function getForgottenThisRoundCount() {
    return roundForgotten.size;
  }

  function getRoundQueueLength() {
    if (completed) return 0;
    return queue.length;
  }

  function getRoundPosition() {
    if (completed || position >= queue.length) return 0;
    return position + 1;
  }

  function isRevealed() {
    return revealed;
  }

  function isCurrentForgotten() {
    const current = getCurrentWord();
    if (!current || !revealed) return false;
    return roundForgotten.has(current.word);
  }

  function getBatchStartedAt() {
    return batchStartedAt;
  }

  function getBatchStudyMs() {
    return batchStudyMs;
  }

  /**
   * @param {number} ms
   */
  function addStudyMs(ms) {
    if (!Number.isFinite(ms) || ms <= 0 || ms >= 5000) return;
    batchStudyMs += ms;
  }

  function toSnapshot() {
    return {
      round,
      queue: [...queue],
      position,
      revealed,
      completed,
      batchStartedAt,
      batchStudyMs,
      everForgotten: getEverForgottenList(),
      roundForgotten: [...roundForgotten],
    };
  }

  return {
    getCurrentWord,
    judge,
    canAdvance,
    advance,
    isBatchComplete,
    getEverForgottenList,
    getRound,
    getQueueRemaining,
    getForgottenThisRoundCount,
    getRoundQueueLength,
    getRoundPosition,
    isRevealed,
    isCurrentForgotten,
    getBatchStartedAt,
    getBatchStudyMs,
    addStudyMs,
    toSnapshot,
  };
}
