import { supabase } from "./supabase-client.js";

const CLOUD_KEY = "localStorage_dump_v1";
const LAST_SYNC_USER_KEY = "tsms_last_sync_user_id";
const SYNC_KEYS = [
  "tsms_reports",
  "ops",
  "tsms_settings",
  "tsms_sales_plan",
  "tsms_report_current_day",
  "tsms_holidays_jp_v1",
  "tsms_theme"
];

let autoSyncInstalled = false;
let debounceMs = 5000;
let debounceTimer = null;
let inFlight = false;
let pendingAfterFlight = false;
let dirtySinceLastBackup = false;

function shouldIncludeKey(key, prefix = "") {
  if (!key) return false;
  if (prefix) return key.startsWith(prefix);
  return SYNC_KEYS.includes(key);
}

export function dumpLocalStorage(prefix = "") {
  const obj = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (shouldIncludeKey(k, prefix)) obj[k] = localStorage.getItem(k);
  }
  return obj;
}

export function restoreLocalStorage(obj, prefix = "") {
  if (prefix) {
    const remove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) remove.push(k);
    }
    remove.forEach((k) => localStorage.removeItem(k));
  } else {
    SYNC_KEYS.forEach((k) => localStorage.removeItem(k));
  }

  for (const [k, v] of Object.entries(obj || {})) {
    if (!shouldIncludeKey(k, prefix)) continue;
    localStorage.setItem(k, v == null ? "" : String(v));
  }
}

export async function cloudBackup(prefix = "") {
  const payload = dumpLocalStorage(prefix);

  const { error } = await supabase
    .from("app_state")
    .upsert(
      { key: CLOUD_KEY, value: payload, updated_at: new Date().toISOString() },
      { onConflict: "user_id,key" }
    );

  if (error) throw error;
}

export async function cloudRestore(prefix = "") {
  const { data, error } = await supabase
    .from("app_state")
    .select("value")
    .eq("key", CLOUD_KEY)
    .maybeSingle();

  if (error) throw error;
  if (!data?.value) throw new Error("クラウドにバックアップがありません。先にバックアップしてね。");

  restoreLocalStorage(data.value, prefix);
}

export function clearSyncedLocalState(prefix = "") {
  restoreLocalStorage({}, prefix);
}

function hasLocalSyncedKeys(prefix = "") {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (shouldIncludeKey(key, prefix)) return true;
  }
  return false;
}

export async function hydrateCloudState({ force = false, prefix = "" } = {}) {
  if (!force && hasLocalSyncedKeys(prefix)) {
    return { restored: false, reason: "local_data_exists" };
  }
  const { data, error } = await supabase
    .from("app_state")
    .select("value")
    .eq("key", CLOUD_KEY)
    .maybeSingle();

  if (error) throw error;
  if (!data?.value || typeof data.value !== "object") {
    return { restored: false, reason: "cloud_data_missing" };
  }

  restoreLocalStorage(data.value, prefix);
  return { restored: true, reason: "restored" };
}

export function getLastSyncedUserId() {
  return localStorage.getItem(LAST_SYNC_USER_KEY) || "";
}

export function setLastSyncedUserId(userId) {
  if (!userId) {
    localStorage.removeItem(LAST_SYNC_USER_KEY);
    return;
  }
  localStorage.setItem(LAST_SYNC_USER_KEY, String(userId));
}

async function runBackup() {
  if (inFlight) {
    pendingAfterFlight = true;
    return;
  }

  inFlight = true;
  try {
    await cloudBackup();
    dirtySinceLastBackup = false;
  } catch (_) {
    // Non-blocking autosave: silently ignore transient errors.
  } finally {
    inFlight = false;
    if (pendingAfterFlight) {
      pendingAfterFlight = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        runBackup();
      }, debounceMs);
    }
  }
}

export function requestCloudBackup({ immediate = false } = {}) {
  if (immediate) {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    return runBackup();
  }

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    runBackup();
  }, debounceMs);

  return Promise.resolve();
}

export function ensureCloudSyncRuntime({ debounce = 5000 } = {}) {
  debounceMs = Math.max(1000, Number(debounce) || 5000);
  if (autoSyncInstalled) return;

  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;
  const originalClear = Storage.prototype.clear;

  Storage.prototype.setItem = function patchedSetItem(key, value) {
    const result = originalSetItem.call(this, key, value);
    if (this === localStorage && shouldIncludeKey(String(key || ""))) {
      dirtySinceLastBackup = true;
      requestCloudBackup({ immediate: false });
    }
    return result;
  };

  Storage.prototype.removeItem = function patchedRemoveItem(key) {
    const result = originalRemoveItem.call(this, key);
    if (this === localStorage && shouldIncludeKey(String(key || ""))) {
      dirtySinceLastBackup = true;
      requestCloudBackup({ immediate: false });
    }
    return result;
  };

  Storage.prototype.clear = function patchedClear() {
    const hadAny = SYNC_KEYS.some((k) => this.getItem(k) !== null);
    const result = originalClear.call(this);
    if (this === localStorage && hadAny) {
      dirtySinceLastBackup = true;
      requestCloudBackup({ immediate: false });
    }
    return result;
  };

  const flushIfNeeded = () => {
    if (!dirtySinceLastBackup) return;
    requestCloudBackup({ immediate: true });
  };
  window.addEventListener("pagehide", flushIfNeeded);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushIfNeeded();
  });

  autoSyncInstalled = true;
}
