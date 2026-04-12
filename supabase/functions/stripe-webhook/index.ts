import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_SECRET_KEY     = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL          = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function planExpiresAt(planId: string): string {
  const date = new Date();
  if (planId === "monthly") date.setDate(date.getDate() + 30);
  if (planId === "yearly")  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString();
}

// Verifica assinatura do Stripe usando Web Crypto API (disponível no Deno)
async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string,
): Promise<boolean> {
  try {
    const parts = sigHeader.split(",").reduce<Record<string, string>>((acc, part) => {
      const [k, v] = part.split("=");
      acc[k] = v;
      return acc;
    }, {});

    const timestamp = parts["t"];
    const signature = parts["v1"];
    if (!timestamp || !signature) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
    const expected = Array.from(new Uint8Array(mac))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return expected === signature;
  } catch {
    return false;
  }
}

serve(async (req) => {
  try {
    const payload   = await req.text();
    const sigHeader = req.headers.get("stripe-signature") ?? "";

    // Verifica assinatura apenas se o secret estiver configurado
    if (STRIPE_WEBHOOK_SECRET) {
      const valid = await verifyStripeSignature(payload, sigHeader, STRIPE_WEBHOOK_SECRET);
      if (!valid) {
        console.error("Assinatura do webhook inválida");
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const event = JSON.parse(payload);
    console.log("Stripe webhook:", event.type);

    if (event.type !== "checkout.session.completed") {
      return new Response("ok", { status: 200 });
    }

    const session  = event.data?.object;
    const profileId = session?.metadata?.profileId;
    const planId    = session?.metadata?.planId;

    if (!profileId || !planId) {
      console.error("metadata inválido:", session?.metadata);
      return new Response("metadata inválido", { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { error } = await supabase
      .from("profiles")
      .update({
        plan: planId,
        plan_expires_at: planExpiresAt(planId),
        verified: true,
      })
      .eq("id", profileId);

    if (error) {
      console.error("Erro ao atualizar plano:", error);
      return new Response("Erro ao atualizar plano", { status: 500 });
    }

    console.log(`Plano ${planId} ativado para perfil ${profileId}`);
    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Erro interno", { status: 500 });
  }
});
