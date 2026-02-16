const PUBLIC_PAGES = new Set(["login.html", "signup.html", "auth-callback.html"]);
const DEFAULT_SUPABASE_URL = "https://gsvehqeywmjqlvuzwvuo.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_PCpsmoo77V5L0YQfT2yKnA_QCEFpARJ";
const CONFIG_KEY = "tsms_supabase_config";

function currentPage() {
  const p = location.pathname.split('/').pop();
  return p || "index.html";
}

function sanitize(v) {
  return String(v || "").trim().replace(/[\r\n]/g, "");
}

function redirectToLogin() {
  const loginUrl = new URL("login.html", location.href);
  const next = location.pathname + location.search + location.hash;
  loginUrl.searchParams.set("next", next || "/index.html");
  location.replace(loginUrl.toString());
}

async function guard() {
  if (PUBLIC_PAGES.has(currentPage())) return;

  let cfg = {};
  try {
    cfg = JSON.parse(localStorage.getItem(CONFIG_KEY) || "null") || {};
  } catch (_) {
    cfg = {};
  }

  const url = sanitize(cfg.url || DEFAULT_SUPABASE_URL);
  const anonKey = sanitize(cfg.anonKey || DEFAULT_SUPABASE_ANON_KEY);
  if (!url || !anonKey) {
    redirectToLogin();
    return;
  }

  try {
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    const supabase = createClient(url, anonKey);
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session) {
      redirectToLogin();
    }
  } catch (_) {
    redirectToLogin();
  }
}

guard();
