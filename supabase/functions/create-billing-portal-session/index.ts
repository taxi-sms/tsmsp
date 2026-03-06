import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=denonext";
import Stripe from "https://esm.sh/stripe@14.25.0?target=denonext";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "";

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS"
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "content-type": "application/json; charset=utf-8"
    }
  });
}

function safeHttpUrl(value: unknown, fallback: string) {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  try {
    const u = new URL(raw);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  } catch (_) {
    // ignore and fallback
  }
  return fallback;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY || !STRIPE_SECRET_KEY) {
    return json({ ok: false, error: "missing_env" }, 500);
  }

  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader) {
    return json({ ok: false, error: "missing_authorization" }, 401);
  }

  const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const serviceSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: authData, error: authError } = await userSupabase.auth.getUser();
  const user = authData?.user;
  if (authError || !user?.id) {
    return json({ ok: false, error: "invalid_session" }, 401);
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch (_) {
    body = {};
  }

  const origin = req.headers.get("origin") || "";
  const base = APP_BASE_URL || origin || "https://example.com";
  const returnDefault = new URL("settings.html", base).toString();
  const returnUrl = safeHttpUrl(body.returnUrl, returnDefault);

  try {
    const { data: existing, error } = await serviceSupabase
      .from("billing_subscriptions")
      .select("stripe_customer_id,status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    const customerId = String(existing?.stripe_customer_id || "").trim();
    if (!customerId) {
      return json({ ok: false, error: "billing_customer_not_found", status: String(existing?.status || "") }, 400);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });

    if (!session.url) {
      return json({ ok: false, error: "portal_url_missing" }, 500);
    }

    return json({ ok: true, url: session.url }, 200);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("create_billing_portal_failed", { userId: user.id, message });
    return json({ ok: false, error: "create_billing_portal_failed", detail: { message } }, 500);
  }
});
