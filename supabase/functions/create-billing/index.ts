import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ABACATEPAY_API = "https://api.abacatepay.com/v1";
const ABACATEPAY_KEY = Deno.env.get("ABACATEPAY_API_KEY") ?? "";
const SITE_URL = Deno.env.get("SITE_URL") ?? "http://localhost:5173";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const PLAN_PRODUCTS: Record<string, { name: string; price: number; externalId: string }> = {
  monthly: { name: "Plano Mensal", price: 990, externalId: "plan_monthly" },
  yearly:  { name: "Plano Anual",  price: 9990, externalId: "plan_yearly"  },
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

    const product = PLAN_PRODUCTS[planId];
    if (!product) {
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

    const payload = {
      frequency: "ONE_TIME",
      methods: ["PIX", "CREDIT_CARD"],
      products: [
        {
          externalId: product.externalId,
          name: product.name,
          quantity: 1,
          price: product.price,
        },
      ],
      returnUrl: `${SITE_URL}/planos`,
      completionUrl: `${SITE_URL}/pagamento-confirmado?plan=${planId}&profileId=${profileId}`,
      externalId: `${profileId}:${planId}`,
      customer: {
        name: customerName || "Cliente",
        email,
        cellphone: customerPhone || "11999999999",
        taxId: customerTaxId || "000.000.000-00",
      },
    };

    const response = await fetch(`${ABACATEPAY_API}/billing/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ABACATEPAY_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("AbacatePay error:", result);
      return new Response(JSON.stringify({ error: result?.error ?? "Erro ao criar cobrança" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url: result.data.url, billingId: result.data.id }), {
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
