import { CLOUDBASE } from "../cloudbase-config.js?v=20260529-2";

/**
 * @returns {typeof cloudbase}
 */
function getCloudbaseSdk() {
  const sdk = globalThis.cloudbase ?? globalThis.tcb;
  if (!sdk?.init) {
    throw new Error("CloudBase SDK 未加载，请刷新页面或检查网络");
  }
  return sdk;
}

/** @type {ReturnType<typeof cloudbase.init> | null} */
let app = null;
/** @type {ReturnType<ReturnType<typeof cloudbase.init>["auth"]> | null} */
let auth = null;
/** @type {ReturnType<ReturnType<typeof cloudbase.init>["database"]> | null} */
let database = null;

/**
 * @returns {Promise<{ app: NonNullable<typeof app>, auth: NonNullable<typeof auth>, db: NonNullable<typeof database> }>}
 */
export async function getCloudApp() {
  if (app && auth && database) {
    return { app, auth, db: database };
  }

  const cloudbase = getCloudbaseSdk();
  app = cloudbase.init({
    env: CLOUDBASE.envId,
    region: CLOUDBASE.region,
    accessKey: CLOUDBASE.accessKey,
    auth: { detectSessionInUrl: true },
  });

  auth = app.auth({ persistence: "local" });
  database = app.database();
  return { app, auth, db: database };
}

/**
 * @returns {Promise<{ id?: string, user_metadata?: { username?: string, nickname?: string }, email?: string, phone?: string, is_anonymous?: boolean } | null>}
 */
export async function getCurrentUser() {
  const { auth: cloudAuth } = await getCloudApp();
  const { data, error } = await cloudAuth.getSession();
  if (error || !data?.session) return null;
  if (data.session.user?.is_anonymous) return null;
  return data.session.user;
}
