import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const REFERRAL_AMOUNT      = 5;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { profileId } = await req.json();
    if (!profileId) return new Response(JSON.stringify({ error: "profileId obrigatório" }), { status: 400, headers: corsHeaders });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Busca o perfil que acabou de pagar
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, referred_by")
      .eq("id", profileId)
      .single();

    if (!profile?.referred_by) {
      return new Response(JSON.stringify({ ok: true, message: "Sem indicação" }), { status: 200, headers: corsHeaders });
    }

    // Busca o perfil que indicou pelo referral_code
    const { data: referrer } = await supabase
      .from("profiles")
      .select("id, name, referral_balance, phone")
      .eq("referral_code", profile.referred_by)
      .single();

    if (!referrer) {
      return new Response(JSON.stringify({ ok: true, message: "Indicador não encontrado" }), { status: 200, headers: corsHeaders });
    }

    // Verifica se já creditou antes para esse par
    const { data: existing } = await supabase
      .from("referral_transactions")
      .select("id")
      .eq("referrer_id", referrer.id)
      .eq("referred_id", profileId)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ ok: true, message: "Já creditado" }), { status: 200, headers: corsHeaders });
    }

    // Registra a transação
    await supabase.from("referral_transactions").insert({
      referrer_id: referrer.id,
      referred_id: profileId,
      amount: REFERRAL_AMOUNT,
      status: "pending",
    });

    // Atualiza o saldo da indicadora
    const newBalance = (referrer.referral_balance ?? 0) + REFERRAL_AMOUNT;
    await supabase
      .from("profiles")
      .update({ referral_balance: newBalance } as any)
      .eq("id", referrer.id);

    console.log(`R$${REFERRAL_AMOUNT} creditado para ${referrer.name} (indicou ${profile.name})`);

    return new Response(JSON.stringify({ ok: true, credited: REFERRAL_AMOUNT, referrer: referrer.name }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("referral-credit error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), { status: 500, headers: corsHeaders });
  }
});
