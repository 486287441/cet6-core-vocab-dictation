/** @typedef {{ pos: string | null, senses: { num: string | null, text: string }[] }} MeaningBlock */

const POS_RE = /(n|v|adj|adv|prep|conj|pron|int)\./gi;
const SENSE_RE = /(\d+)\.?\s*([^0-9]+?)(?=\d+\.?\s*|$)/g;

/**
 * @param {string} raw
 * @returns {MeaningBlock[]}
 */
export function parseMeaning(raw) {
  const text = raw.trim();
  if (!text) return [];

  /** @type {{ pos: string, index: number; end: number }[]} */
  const markers = [];
  POS_RE.lastIndex = 0;
  let match;
  while ((match = POS_RE.exec(text)) !== null) {
    markers.push({
      pos: match[1].toLowerCase(),
      index: match.index,
      end: match.index + match[0].length,
    });
  }

  if (markers.length === 0) {
    return [{ pos: null, senses: splitPlainLines(text) }];
  }

  return markers.map((marker, i) => {
    const body = text.slice(marker.end, markers[i + 1]?.index ?? text.length).trim();
    return {
      pos: marker.pos,
      senses: splitSenses(body),
    };
  });
}

/**
 * @param {string} body
 * @returns {{ num: string | null, text: string }[]}
 */
function splitSenses(body) {
  if (!body) return [{ num: null, text: "" }];

  const numbered = [];
  SENSE_RE.lastIndex = 0;
  let match;
  while ((match = SENSE_RE.exec(body)) !== null) {
    numbered.push({
      num: match[1],
      text: cleanSenseText(match[2]),
    });
  }

  if (numbered.length > 0) return numbered;
  return splitPlainLines(body);
}

/**
 * @param {string} body
 */
function splitPlainLines(body) {
  const parts = body
    .split(/[;；]/)
    .map((s) => cleanSenseText(s))
    .filter(Boolean);

  if (parts.length <= 1) {
    return [{ num: null, text: cleanSenseText(body) }];
  }

  return parts.map((text) => ({ num: null, text }));
}

/**
 * @param {string} text
 */
function cleanSenseText(text) {
  return text
    .replace(/^[\s,，;；]+|[\s,，;；]+$/g, "")
    .trim()
    .replace(/,/g, "，");
}

/**
 * @typedef {{ pos: string | null, num: string | null, text: string, showPos: boolean }} MeaningLine
 */

/**
 * @param {MeaningBlock[]} blocks
 * @returns {MeaningLine[]}
 */
function flattenBlocks(blocks) {
  /** @type {MeaningLine[]} */
  const lines = [];

  for (const block of blocks) {
    const senses = block.senses.filter((s) => s.text);
    senses.forEach((sense, index) => {
      lines.push({
        pos: block.pos,
        num: sense.num,
        text: sense.text,
        showPos: index === 0,
      });
    });
  }

  return lines;
}

/**
 * @param {string} meaning
 * @returns {string}
 */
export function formatMeaningHtml(meaning) {
  const blocks = parseMeaning(meaning);
  if (blocks.length === 0) return "";

  const groups = blocks
    .map((block) => {
      const senses = block.senses.filter((s) => s.text);
      if (senses.length === 0) return "";

      const lines = senses
        .map((sense, index) => {
          const posCell = index === 0 && block.pos ? escapeHtml(block.pos) : "";
          const numCell = sense.num ? `${escapeHtml(sense.num)}.` : "";
          const cont = index > 0 ? " meaning-line--cont" : "";

          return `
            <div class="meaning-line${cont}">
              <span class="meaning-line__pos" aria-hidden="${index > 0 ? "true" : "false"}">${posCell}</span>
              <span class="meaning-line__num">${numCell}</span>
              <span class="meaning-line__def">${escapeHtml(sense.text)}</span>
            </div>`;
        })
        .join("");

      return `<div class="meaning-group">${lines}</div>`;
    })
    .filter(Boolean)
    .join("");

  return `<div class="meaning">${groups}</div>`;
}

/**
 * @param {HTMLElement} el
 * @param {string} meaning
 */
export function renderMeaningInto(el, meaning) {
  el.innerHTML = formatMeaningHtml(meaning);
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
