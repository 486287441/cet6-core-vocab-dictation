/** @typedef {{ word: string, meaning: string }} Word */

const BATCH_SIZE = 50;
const WORDS_CACHE_BUSTER = "20260528-1";

/**
 * @param {string} text
 * @returns {string[][]}
 */
function parseCSV(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  const rows = [];

  for (const line of lines) {
    if (line.trim() === "") continue;
    rows.push(parseCSVLine(line));
  }

  return rows;
}

/**
 * @param {string} line
 * @returns {string[]}
 */
function parseCSVLine(line) {
  const fields = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(field);
      field = "";
    } else {
      field += ch;
    }
  }

  fields.push(field);
  return fields;
}

/**
 * @returns {Promise<Word[]>}
 */
export async function loadWords() {
  const response = await fetch(`words.csv?v=${WORDS_CACHE_BUSTER}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`无法加载词库：${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  const rows = parseCSV(text);

  if (rows.length === 0) {
    return [];
  }

  const [firstCol] = rows[0];
  const dataRows =
    firstCol?.toLowerCase() === "word" ? rows.slice(1) : rows;

  return dataRows
    .filter((row) => row.length >= 2 && row[0].trim() !== "")
    .map(([word, meaning]) => ({
      word: word.trim(),
      meaning: meaning.trim(),
    }));
}

/**
 * @param {Word[]} words
 * @param {number} batchIndex
 * @returns {Word[]}
 */
export function getBatch(words, batchIndex) {
  const start = batchIndex * BATCH_SIZE;
  return words.slice(start, start + BATCH_SIZE);
}

/**
 * @param {Word[]} words
 * @returns {number}
 */
export function getTotalBatches(words) {
  if (words.length === 0) return 0;
  return Math.ceil(words.length / BATCH_SIZE);
}

export { BATCH_SIZE };
