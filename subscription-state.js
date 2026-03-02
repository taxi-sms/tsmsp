import { supabase } from "./supabase-client.js";

const ACTIVE_STATUSES = new Set(["trialing", "active"]);

export async function fetchCurrentSubscriptionState() {
  const { data, error } = await supabase.rpc("current_subscription_state");
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row || {
    user_id: null,
    plan_code: "starter_monthly",
    status: "inactive",
    is_active: false,
    trial_ends_at: null,
    current_period_end: null,
    cancel_at_period_end: false
  };
}

export function isSubscriptionActive(state) {
  if (!state || typeof state !== "object") return false;
  if (typeof state.is_active === "boolean") return state.is_active;
  return ACTIVE_STATUSES.has(String(state.status || ""));
}

