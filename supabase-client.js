import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const PROD_SUPABASE_URL = "https://gsvehqeywmjqlvuzwvuo.supabase.co";
const PROD_SUPABASE_ANON_KEY = "sb_publishable_PCpsmoo77V5L0YQfT2yKnA_QCEFpARJ";
const STG_SUPABASE_URL = "https://ksjbfnzyyopslnucauwu.supabase.co";
const STG_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzamJmbnp5eW9wc2xudWNhdXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NzE2MTgsImV4cCI6MjA4ODA0NzYxOH0.d9KHwsdCLEtlbQPOjtzDp5LdZxiuxhu1U0vkCzaLZWY";
const STG_PATH_PREFIX = "/tsmsp-stg/";
const CONFIG_KEY = "tsms_supabase_config";
const PROD_CONFIG = Object.freeze({ url: PROD_SUPABASE_URL, anonKey: PROD_SUPABASE_ANON_KEY });
const STG_CONFIG = Object.freeze({ url: STG_SUPABASE_URL, anonKey: STG_SUPABASE_ANON_KEY });
const DEFAULT_CONFIG = PROD_CONFIG;

function sanitize(v) {
  return String(v || "").trim().replace(/[\r\n]/g, "");
}

function inferConfigByLocation() {
  const host = String(location && location.hostname ? location.hostname : "").toLowerCase();
  const path = String(location && location.pathname ? location.pathname : "");
  if (host === "taxi-sms.github.io" && path.indexOf(STG_PATH_PREFIX) === 0) {
    return STG_CONFIG;
  }
  return PROD_CONFIG;
}

function loadConfig() {
  const inferred = inferConfigByLocation();
  let cfg = {};
  try {
    cfg = JSON.parse(localStorage.getItem(CONFIG_KEY) || "null") || {};
  } catch (_) {
    cfg = {};
  }

  const loaded = {
    url: sanitize(cfg.url || inferred.url),
    anonKey: sanitize(cfg.anonKey || inferred.anonKey)
  };
  const shouldForceInferred = loaded.url !== inferred.url || loaded.anonKey !== inferred.anonKey;
  if (shouldForceInferred) {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(inferred));
    } catch (_) {}
    return { ...inferred };
  }
  return loaded;
}

const config = loadConfig();
const supabase = createClient(config.url, config.anonKey);

export {
  CONFIG_KEY,
  DEFAULT_CONFIG,
  PROD_SUPABASE_URL,
  PROD_SUPABASE_ANON_KEY,
  STG_SUPABASE_URL,
  STG_SUPABASE_ANON_KEY,
  loadConfig,
  sanitize,
  supabase
};
