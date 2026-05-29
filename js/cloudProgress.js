import { CLOUDBASE } from "./cloudbase-config.js?v=20260529-2";
import { getCloudApp, getCurrentUser } from "./auth/client.js?v=20260529-2";
import { createDefaultState, normalizeStateFromCloud } from "./storage.js";

/** @typedef {import('./storage.js').PersistedState} PersistedState */

let pushTimer = null;

/**
 * @returns {Promise<string | null>}
 */
async function getUserDocId() {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

/**
 * @returns {Promise<PersistedState | null>}
 */
export async function pullProgressFromCloud() {
  const uid = await getUserDocId();
  if (!uid) return null;

  const { db } = await getCloudApp();
  const res = await db.collection(CLOUDBASE.progressCollection).doc(uid).get();

  /** @type {Record<string, unknown> | null} */
  let doc = null;
  if (Array.isArray(res.data) && res.data.length > 0) {
    doc = /** @type {Record<string, unknown>} */ (res.data[0]);
  } else if (res.data && typeof res.data === "object" && !Array.isArray(res.data)) {
    doc = /** @type {Record<string, unknown>} */ (res.data);
  }

  if (!doc) return null;
  return normalizeStateFromCloud(doc);
}

/**
 * @param {PersistedState} state
 */
export async function pushProgressToCloud(state) {
  const uid = await getUserDocId();
  if (!uid) return;

  const { db } = await getCloudApp();
  const payload = {
    version: state.version,
    currentBatchIndex: state.currentBatchIndex,
    view: state.view,
    batchSession: state.batchSession,
    completedBatches: state.completedBatches,
    totalStudyMs: state.totalStudyMs,
    firstStudyAt: state.firstStudyAt,
    libraryCompletedAt: state.libraryCompletedAt,
    playthrough: state.playthrough,
    updatedAt: Date.now(),
  };

  await db.collection(CLOUDBASE.progressCollection).doc(uid).set(payload);
}

/**
 * @param {PersistedState} state
 * @param {number} [delayMs]
 */
export function scheduleCloudPush(state, delayMs = 800) {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushProgressToCloud(state).catch((err) => {
      console.warn("[云同步] 保存失败", err);
    });
  }, delayMs);
}

/**
 * 合并云端与本地：取 updatedAt 较新者；无时间戳则优先云端。
 * @param {PersistedState} local
 * @param {PersistedState | null} cloud
 * @returns {PersistedState}
 */
export function mergeProgress(local, cloud) {
  if (!cloud) return local;
  const cloudTs = cloud.updatedAt ?? 0;
  const localTs = local.updatedAt ?? 0;
  if (cloudTs > localTs) return cloud;
  if (localTs > cloudTs) return local;
  if ((cloud.totalStudyMs ?? 0) > (local.totalStudyMs ?? 0)) return cloud;
  return local;
}

/**
 * @param {PersistedState} fallback
 * @returns {Promise<PersistedState>}
 */
export async function hydrateProgress(fallback) {
  try {
    const cloud = await pullProgressFromCloud();
    return mergeProgress(fallback, cloud);
  } catch (err) {
    console.warn("[云同步] 拉取失败，使用本地进度", err);
    return fallback;
  }
}

export { createDefaultState };
