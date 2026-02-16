import { supabase } from "./supabase-client.js";

const CLOUD_KEY = "localStorage_dump_v1";
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

async function runBackup() {
  if (inFlight) {
    pendingAfterFlight = true;
    return;
  }

  inFlight = true;
  try {
    await cloudBackup();
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
      requestCloudBackup({ immediate: false });
    }
    return result;
  };

  Storage.prototype.removeItem = function patchedRemoveItem(key) {
    const result = originalRemoveItem.call(this, key);
    if (this === localStorage && shouldIncludeKey(String(key || ""))) {
      requestCloudBackup({ immediate: false });
    }
    return result;
  };

  Storage.prototype.clear = function patchedClear() {
    const hadAny = SYNC_KEYS.some((k) => this.getItem(k) !== null);
    const result = originalClear.call(this);
    if (this === localStorage && hadAny) {
      requestCloudBackup({ immediate: false });
    }
    return result;
  };

  autoSyncInstalled = true;
}
