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
const IDLE_LOGOUT_MS = 30 * 60 * 1000;
const AUTH_GUARD_VERSION = "20260222-diag-1";
const SESSION_RETRY_COUNT = 5;
const SESSION_RETRY_DELAY_MS = 350;

function currentPage() {
  const p = location.pathname.split("/").pop();
  return p || "index.html";
}

function redirectToLogin() {
  try {
    console.log("[tsms-auth-guard] redirectToLogin", {
      version: AUTH_GUARD_VERSION,
      at: new Date().toISOString(),
      href: location.href
    });
  } catch (_) {}
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

function renderDiag(message) {
  try {
    let el = document.getElementById("tsmsAuthGuardDiag");
    if (!el) {
      el = document.createElement("div");
      el.id = "tsmsAuthGuardDiag";
      el.style.cssText = [
        "position:fixed",
        "right:8px",
        "bottom:8px",
        "z-index:99999",
        "max-width:88vw",
        "background:rgba(0,0,0,.78)",
        "color:#fff",
        "font:11px/1.35 monospace",
        "padding:6px 8px",
        "border-radius:6px",
        "white-space:pre-wrap",
        "pointer-events:none"
      ].join(";");
      document.addEventListener("DOMContentLoaded", () => {
        if (!document.body.contains(el)) document.body.appendChild(el);
      }, { once: true });
      if (document.body) document.body.appendChild(el);
    }
    el.textContent = message;
  } catch (_) {}
}

function updateDiag(extra = "") {
  const now = new Date();
  const msg = [
    `auth-guard:${AUTH_GUARD_VERSION}`,
    `idle_ms:${IDLE_LOGOUT_MS}`,
    `now:${now.toLocaleTimeString()}`,
    extra
  ].filter(Boolean).join("\n");
  renderDiag(msg);
  try { console.log("[tsms-auth-guard] diag", msg); } catch (_) {}
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
      updateDiag(`guard:session-retry ${i + 1}/${SESSION_RETRY_COUNT}`);
      await sleep(SESSION_RETRY_DELAY_MS);
    }
  }
  return last;
}

function shouldEnableIdleLogout() {
  try {
    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";
    const touchPoints = Number(navigator.maxTouchPoints || 0);
    const isIPhone = /iPhone/i.test(ua);
    const isIPad = /iPad/i.test(ua) || (platform === "MacIntel" && touchPoints > 1);
    return !(isIPhone || isIPad);
  } catch (_) {
    return true;
  }
}

function installIdleLogout() {
  if (!shouldEnableIdleLogout()) {
    updateDiag("idle:disabled(iOS)");
    return;
  }
  if (window.__tsmsIdleLogoutInstalled) return;
  window.__tsmsIdleLogoutInstalled = true;

  let timer = null;
  let firing = false;

  const schedule = () => {
    if (timer) clearTimeout(timer);
    const fireAt = new Date(Date.now() + IDLE_LOGOUT_MS);
    updateDiag(`idle:scheduled\nfire_at:${fireAt.toLocaleTimeString()}`);
    timer = setTimeout(async () => {
      if (firing) return;
      firing = true;
      updateDiag(`idle:firing\nfired_at:${new Date().toLocaleTimeString()}`);
      try {
        if (window.tsmsCloud && typeof window.tsmsCloud.safeLogoutWithBackup === "function") {
          try { console.log("[tsms-auth-guard] logout via safeLogoutWithBackup"); } catch (_) {}
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
  updateDiag(`guard:start\npage:${currentPage()}`);
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
    if (attempts) updateDiag(`guard:session-ok attempts=${attempts}`);

    if (error || !session || !userId) {
      updateDiag(`guard:no-session attempts=${attempts || 0}`);
      redirectToLogin();
      return;
    }

    ensureCloudSyncRuntime();

    const reloadMarker = `tsms_hydrated:${userId}:${location.pathname}`;
    const alreadyReloaded = sessionStorage.getItem(reloadMarker) === "1";
    const previousUserId = getLastSyncedUserId();
    const userChanged = !!previousUserId && previousUserId !== userId;
    const shouldForceHydration = true;

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
        try { console.log("[tsms-auth-guard] manual logout() called"); } catch (_) {}
        updateDiag("logout:manual");
        await supabase.auth.signOut();
        redirectToLogin();
      },
      safeLogoutWithBackup: async () => {
        try { console.log("[tsms-auth-guard] safeLogoutWithBackup() called"); } catch (_) {}
        updateDiag("logout:safe-with-backup");
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
