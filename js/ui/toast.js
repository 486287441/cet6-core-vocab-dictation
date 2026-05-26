const TOAST_DURATION_MS = 2200;

/** @type {HTMLElement | null} */
let toastEl = null;
/** @type {number | undefined} */
let hideTimer;

function ensureToastEl() {
  if (toastEl) return toastEl;
  toastEl = document.getElementById("toast");
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.id = "toast";
    toastEl.className = "toast";
    toastEl.setAttribute("role", "status");
    toastEl.hidden = true;
    document.body.appendChild(toastEl);
  }
  return toastEl;
}

/**
 * @param {string} message
 */
export function showToast(message) {
  const el = ensureToastEl();
  el.textContent = message;
  el.hidden = false;
  el.classList.add("toast--visible");

  if (hideTimer) window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    el.classList.remove("toast--visible");
    el.hidden = true;
  }, TOAST_DURATION_MS);
}
