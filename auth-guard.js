import { loadConfig, supabase } from "./supabase-client.js";
import { ensureCloudSyncRuntime, requestCloudBackup } from "./cloud-store.js";

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
    if (error || !data?.session) {
      redirectToLogin();
      return;
    }

    ensureCloudSyncRuntime();

    window.tsmsCloud = {
      backupNow: () => requestCloudBackup({ immediate: true }),
      backupDebounced: () => requestCloudBackup({ immediate: false })
    };
  } catch (_) {
    redirectToLogin();
  }
}

guard();
