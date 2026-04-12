import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function planExpiresAt(planId: string): string {
  const date = new Date();
  if (planId === "monthly") date.setDate(date.getDate() + 30);
  if (planId === "yearly") date.setFullYear(date.getFullYear() + 1);
  return date.toISOString();
}

serve(async (req) => {
  try {
    const body = await req.json();
    const event = body?.event;
    const data = body?.data;

    console.log("AbacatePay webhook:", event, JSON.stringify(data));

    if (event !== "billing.completed" && event !== "checkout.completed") {
      return new Response("ok", { status: 200 });
    }

    // externalId formato: "profileId:planId"
    const externalId: string = data?.billing?.externalId ?? data?.externalId ?? "";
    const [profileId, planId] = externalId.split(":");

    if (!profileId || !planId) {
      console.error("externalId inválido:", externalId);
      return new Response("externalId inválido", { status: 400 });
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
