import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=denonext";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ ok: false, error: "missing_env" }, 500);
  }

  const authHeader = String(req.headers.get("authorization") || "").trim();
  if (!authHeader) {
    return json({ ok: false, error: "missing_authorization" }, 401);
  }

  const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) {
    return json({ ok: false, error: "invalid_authorization" }, 401);
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch (_) {
    body = {};
  }

  if (String(body.confirmText || "").trim() !== "DELETE") {
    return json({ ok: false, error: "confirm_text_required" }, 400);
  }

  const serviceSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: authData, error: authError } = await serviceSupabase.auth.getUser(accessToken);
  const user = authData?.user;
  if (authError || !user?.id) {
    return json({ ok: false, error: "invalid_session" }, 401);
  }

  const { error: deleteError } = await serviceSupabase.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error("delete_account_failed", { userId: user.id, message: deleteError.message });
    return json({ ok: false, error: "delete_account_failed", detail: { message: deleteError.message } }, 500);
  }

  return json({ ok: true }, 200);
});
