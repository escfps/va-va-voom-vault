import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { profileId, plan, status } = await req.json();

    if (!profileId || (!plan && !status)) {
      return new Response(JSON.stringify({ error: "profileId e plan ou status são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Usa service role key — bypassa PostgREST e RLS completamente
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    let updatePayload: Record<string, any> = {};

    if (status) {
      updatePayload = { status };
    } else {
      const expiresAt = plan === "free"
        ? null
        : (() => {
            const d = new Date();
            if (plan === "monthly") d.setDate(d.getDate() + 30);
            if (plan === "yearly") d.setFullYear(d.getFullYear() + 1);
            return d.toISOString();
          })();
      updatePayload = { plan, plan_expires_at: expiresAt, verified: plan !== "free" };
    }

    const { error } = await admin
      .from("profiles")
      .update(updatePayload)
      .eq("id", profileId);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
