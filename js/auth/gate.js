import { getCurrentUser } from "./client.js?v=20260529-2";

const LOGIN_PATH = "login.html";
const APP_PATH = "index.html";

/**
 * 未登录则跳转登录页；已登录返回当前用户。
 * @returns {Promise<import("@cloudbase/js-sdk").ICurrentUser>}
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    const next = encodeURIComponent(window.location.pathname.split("/").pop() || APP_PATH);
    window.location.replace(`${LOGIN_PATH}?next=${next}`);
    throw new Error("redirect-login");
  }
  return user;
}

/**
 * 登录页用：已登录则进入应用。
 * @param {string} [nextPath]
 */
export async function redirectIfAuthed(nextPath = APP_PATH) {
  const user = await getCurrentUser();
  if (user) {
    window.location.replace(nextPath);
  }
}
