import { loadConfig, supabase } from "./supabase-client.js";
import {
  clearSyncedLocalState,
  ensureCloudSyncRuntime,
  getLastSyncedUserId,
  hydrateCloudState,
  requestCloudBackup,
  setCloudSyncPaused,
  setLastSyncedUserId
} from "./cloud-store.js";

const PUBLIC_PAGES = new Set(["login.html", "signup.html", "auth-callback.html"]);
const IDLE_LOGOUT_MS = 60 * 60 * 1000;
const SESSION_RETRY_COUNT = 5;
const SESSION_RETRY_DELAY_MS = 350;
const OPS_KEY = "ops";

function currentPage() {
  const p = location.pathname.split("/").pop();
  return p || "index.html";
}

function redirectToLogin() {
  const loginUrl = new URL("login.html", location.href);
  const next = location.pathname + location.search + location.hash;
  loginUrl.searchParams.set("next", next || "/index.html");
  location.replace(loginUrl.toString());
}

export { supabase };

function lockErrorMessage(err) {
  const msg = (err && err.message) ? String(err.message) : "";
  if (!msg) return "";
  if (msg.includes("LockManager") || msg.includes("lock") || msg.includes("timed out")) {
    return "クラウド同期の認証ロックが競合しています。別タブ/別端末の同時操作を止めて再試行してください。";
  }
  return msg;
}

function hasActiveLocalOpsState() {
  try {
    const raw = localStorage.getItem(OPS_KEY);
    if (!raw) return false;
    const ops = JSON.parse(raw);
    if (!ops || typeof ops !== "object") return false;
    const hasDepart = !!ops.departAt;
    const hasReturn = !!ops.returnAt;
    const shiftClosed = !!ops.shiftClosed;
    const breakActive = !!ops.breakActive;
    return !!((hasDepart && !hasReturn && !shiftClosed) || breakActive);
  } catch (_) {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getSessionWithRetry() {
  let last = { data: null, error: null, attempts: 0 };
  for (let i = 0; i < SESSION_RETRY_COUNT; i++) {
    const result = await supabase.auth.getSession();
    const session = result?.data?.session;
    const userId = session?.user?.id || "";
    last = { ...result, attempts: i + 1 };
    if (!result?.error && session && userId) return last;
    if (i < SESSION_RETRY_COUNT - 1) {
      await sleep(SESSION_RETRY_DELAY_MS);
    }
  }
  return last;
}

function installIdleLogout() {
  if (window.__tsmsIdleLogoutInstalled) return;
  window.__tsmsIdleLogoutInstalled = true;

  let timer = null;
  let firing = false;

  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      if (firing) return;
      firing = true;
      try {
        if (window.tsmsCloud && typeof window.tsmsCloud.safeLogoutWithBackup === "function") {
          await window.tsmsCloud.safeLogoutWithBackup();
          return;
        }
      } catch (e) {
        const msg = lockErrorMessage(e) || "自動ログアウト前のクラウド保存に失敗しました。ログイン状態を維持します。";
        try { alert(msg); } catch (_) {}
      } finally {
        firing = false;
        schedule();
      }
    }, IDLE_LOGOUT_MS);
  };

  const onActivity = () => {
    if (firing) return;
    schedule();
  };

  ["pointerdown", "keydown", "touchstart", "scroll"].forEach((ev) => {
    window.addEventListener(ev, onActivity, { passive: true });
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") onActivity();
  });

  schedule();
}

async function guard() {
  if (PUBLIC_PAGES.has(currentPage())) return;

  const config = loadConfig();
  if (!config.url || !config.anonKey) {
    redirectToLogin();
    return;
  }

  try {
    const { data, error, attempts } = await getSessionWithRetry();
    const session = data?.session;
    const userId = session?.user?.id || "";

    if (error || !session || !userId) {
      redirectToLogin();
      return;
    }

    ensureCloudSyncRuntime();

    const reloadMarker = `tsms_hydrated:${userId}:${location.pathname}`;
    const alreadyReloaded = sessionStorage.getItem(reloadMarker) === "1";
    const previousUserId = getLastSyncedUserId();
    const userChanged = !!previousUserId && previousUserId !== userId;
    const shouldForceHydration = !hasActiveLocalOpsState();

    if (userChanged) {
      clearSyncedLocalState();
    }
    // Avoid a forced network write on every page navigation (notably unstable on iPhone/Safari during transitions).
    let hydration = { restored: false, reason: "skipped" };
    try {
      hydration = await hydrateCloudState({ force: shouldForceHydration });
      setLastSyncedUserId(userId);
    } catch (e) {
      setLastSyncedUserId(userId);
      const msg = lockErrorMessage(e) || "クラウド同期に失敗したため、自動復元を中止しました。設定画面から再試行してください。";
      try { alert(msg); } catch (_) {}
      sessionStorage.removeItem(reloadMarker);
      window.tsmsCloud = {
        backupNow: () => requestCloudBackup({ immediate: true }),
        backupDebounced: () => requestCloudBackup({ immediate: false }),
        setSyncPaused: (paused) => setCloudSyncPaused(paused),
        logout: async () => { await supabase.auth.signOut(); redirectToLogin(); },
        safeLogoutWithBackup: async () => {
          await requestCloudBackup({ immediate: true });
          await supabase.auth.signOut();
          redirectToLogin();
        }
      };
      installIdleLogout();
      return;
    }

    if (hydration.restored && !alreadyReloaded) {
      sessionStorage.setItem(reloadMarker, "1");
      location.reload();
      return;
    }

    sessionStorage.removeItem(reloadMarker);

    window.tsmsCloud = {
      backupNow: () => requestCloudBackup({ immediate: true }),
      backupDebounced: () => requestCloudBackup({ immediate: false }),
      setSyncPaused: (paused) => setCloudSyncPaused(paused),
      logout: async () => {
        await supabase.auth.signOut();
        redirectToLogin();
      },
      safeLogoutWithBackup: async () => {
        await requestCloudBackup({ immediate: true });
        await supabase.auth.signOut();
        redirectToLogin();
      }
    };
    installIdleLogout();
  } catch (_) {
    redirectToLogin();
  }
}

guard();
