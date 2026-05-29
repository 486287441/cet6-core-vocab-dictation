import { CLOUDBASE } from "../cloudbase-config.js?v=20260529-2";
import { getCloudApp } from "./client.js?v=20260529-2";
import { redirectIfAuthed } from "./gate.js?v=20260529-2";

const form = document.getElementById("auth-form");
const modeTabs = document.querySelectorAll("[data-auth-mode]");
const usernameInput = document.getElementById("auth-username");
const passwordInput = document.getElementById("auth-password");
const submitBtn = document.getElementById("auth-submit");
const messageEl = document.getElementById("auth-message");
const titleEl = document.getElementById("auth-title");

/** @type {"login" | "register"} */
let mode = "login";

function getNextPath() {
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  if (next && !next.includes("://") && !next.startsWith("//")) {
    return next.startsWith("/") ? next.slice(1) : next;
  }
  return "index.html";
}

/**
 * @param {string} text
 * @param {"error" | "info"} [kind]
 */
function setMessage(text, kind = "error") {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.hidden = !text;
  messageEl.classList.toggle("auth-message--error", kind === "error");
  messageEl.classList.toggle("auth-message--info", kind === "info");
}

function setBusy(busy) {
  if (submitBtn) submitBtn.disabled = busy;
  if (usernameInput) usernameInput.disabled = busy;
  if (passwordInput) passwordInput.disabled = busy;
}

/**
 * @param {"login" | "register"} nextMode
 */
function setMode(nextMode) {
  mode = nextMode;
  for (const tab of modeTabs) {
    const isActive = tab.getAttribute("data-auth-mode") === mode;
    tab.classList.toggle("auth-tabs__btn--active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  }
  if (titleEl) {
    titleEl.textContent = mode === "login" ? "登录" : "注册";
  }
  if (submitBtn) {
    submitBtn.textContent = mode === "login" ? "登录" : "注册并登录";
  }
  setMessage("");
}

/**
 * @param {string} username
 * @param {string} password
 */
function validateCredentials(username, password) {
  if (!/^[a-zA-Z0-9_]{5,24}$/.test(username)) {
    return "用户名须为 5–24 位字母、数字、下划线";
  }
  if (password.length < 8) {
    return "密码至少 8 位";
  }
  return "";
}

/**
 * @param {string} username
 * @param {string} password
 */
async function registerViaFunction(username, password) {
  const { app } = await getCloudApp();
  const res = await app.callFunction({
    name: CLOUDBASE.registerFunction,
    data: { username, password },
  });
  const result = res?.result;
  if (!result?.ok) {
    const message = result?.message || "注册失败";
    if (/配额|quota/i.test(message)) {
      throw new Error(
        "环境授权用户配额已满，无法注册新账号。请用已有账号登录，或在控制台删除无用用户后重试。",
      );
    }
    throw new Error(message);
  }
}

/**
 * @param {string} username
 * @param {string} password
 */
async function handleLogin(username, password) {
  const { auth } = await getCloudApp();
  const { data, error } = await auth.signInWithPassword({ username, password });
  if (error) {
    throw new Error(error.message || "登录失败，请检查用户名和密码");
  }
  if (!data?.session) {
    throw new Error("登录未建立会话，请重试");
  }
}

/**
 * @param {string} username
 * @param {string} password
 */
async function handleRegister(username, password) {
  try {
    await registerViaFunction(username, password);
  } catch (fnErr) {
    const fnMsg = fnErr instanceof Error ? fnErr.message : String(fnErr);
    if (/exist|已存在|duplicate/i.test(fnMsg)) {
      await handleLogin(username, password);
      return;
    }
    const { auth } = await getCloudApp();
    const { error } = await auth.signUp({
      username,
      password,
      nickname: username,
    });
    if (error) {
      throw new Error(fnMsg || error.message || "注册失败");
    }
  }
  await handleLogin(username, password);
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = usernameInput?.value.trim() ?? "";
  const password = passwordInput?.value ?? "";
  const validationError = validateCredentials(username, password);
  if (validationError) {
    setMessage(validationError);
    return;
  }

  setBusy(true);
  setMessage("处理中…", "info");
  try {
    if (mode === "login") {
      await handleLogin(username, password);
    } else {
      await handleRegister(username, password);
    }
    setMessage("成功，正在进入…", "info");
    window.location.replace(getNextPath());
  } catch (err) {
    const message = err instanceof Error ? err.message : "操作失败，请稍后重试";
    setMessage(message);
  } finally {
    setBusy(false);
  }
});

for (const tab of modeTabs) {
  tab.addEventListener("click", () => {
    const next = tab.getAttribute("data-auth-mode");
    if (next === "login" || next === "register") {
      setMode(next);
    }
  });
}

function ensureSdkReady() {
  try {
    if (!globalThis.cloudbase?.init && !globalThis.tcb?.init) {
      setMessage("CloudBase SDK 加载失败，请刷新页面或稍后重试");
      if (submitBtn) submitBtn.disabled = true;
      return false;
    }
    return true;
  } catch {
    setMessage("初始化失败，请刷新页面");
    return false;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!ensureSdkReady()) return;
  try {
    await redirectIfAuthed(getNextPath());
  } catch (err) {
    console.warn("[登录页] 会话检查", err);
  }
  setMode("login");
});
