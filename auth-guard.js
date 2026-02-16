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

async function guard() {
  if (PUBLIC_PAGES.has(currentPage())) return;

  const config = loadConfig();
  if (!config.url || !config.anonKey) {
    redirectToLogin();
    return;
  }

  try {
    const { data, error } = await supabase.auth.getSession();
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

    if (userChanged) {
      clearSyncedLocalState();
    }

    const hydration = await hydrateCloudState({ force: userChanged });
    setLastSyncedUserId(userId);

    if ((userChanged || hydration.restored) && !alreadyReloaded) {
      sessionStorage.setItem(reloadMarker, "1");
      location.reload();
      return;
    }

    sessionStorage.removeItem(reloadMarker);

    window.tsmsCloud = {
      backupNow: () => requestCloudBackup({ immediate: true }),
      backupDebounced: () => requestCloudBackup({ immediate: false }),
      setSyncPaused: (paused) => setCloudSyncPaused(paused)
    };
  } catch (_) {
    redirectToLogin();
  }
}

guard();
