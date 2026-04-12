import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const SITE_URL = Deno.env.get("SITE_URL") ?? "http://localhost:5173";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const PLAN_PRICES: Record<string, { name: string; amount: number; currency: string }> = {
  monthly: { name: "Plano Mensal - X Model Privê", amount: 990,  currency: "brl" },
  yearly:  { name: "Plano Anual - X Model Privê",  amount: 9990, currency: "brl" },
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { planId, profileId, customerName, customerEmail, customerPhone, customerTaxId } =
      await req.json();

    if (!planId || !profileId) {
      return new Response(JSON.stringify({ error: "planId e profileId são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const price = PLAN_PRICES[planId];
    if (!price) {
      return new Response(JSON.stringify({ error: "Plano inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Busca email do usuário autenticado se não veio no body
    let email = customerEmail;
    if (!email) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const authHeader = req.headers.get("Authorization") ?? "";
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      email = user?.email ?? "cliente@email.com";
    }

    // Cria Checkout Session no Stripe
    const params = new URLSearchParams({
      "payment_method_types[0]": "card",
      "line_items[0][price_data][currency]": price.currency,
      "line_items[0][price_data][product_data][name]": price.name,
      "line_items[0][price_data][unit_amount]": String(price.amount),
      "line_items[0][quantity]": "1",
      "mode": "payment",
      "customer_email": email,
      "success_url": `${SITE_URL}/pagamento-confirmado?plan=${planId}&profileId=${profileId}&session_id={CHECKOUT_SESSION_ID}`,
      "cancel_url": `${SITE_URL}/planos`,
      "metadata[profileId]": profileId,
      "metadata[planId]": planId,
    });

    if (customerName) params.set("customer_creation", "always");

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Stripe error:", result);
      return new Response(JSON.stringify({ error: result?.error?.message ?? "Erro ao criar sessão de pagamento" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url: result.url, sessionId: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
