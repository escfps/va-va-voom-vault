import { supabase } from "@/integrations/supabase/client";

function planExpiresAt(plan: string): string | null {
  if (plan === "free") return null;
  const d = new Date();
  if (plan === "monthly") d.setDate(d.getDate() + 30);
  if (plan === "yearly") d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

export async function updatePlan(profileId: string, plan: string): Promise<void> {
  const expiresAt = planExpiresAt(plan);

  // Tentativa 1: RPC (função SQL no banco, não depende do cache de colunas)
  const { error: rpcError } = await (supabase as any).rpc("set_profile_plan", {
    profile_id: profileId,
    new_plan: plan,
    new_expires_at: expiresAt,
  });

  if (!rpcError) return;

  console.warn("RPC falhou, tentando Edge Function:", rpcError.message);

  // Tentativa 2: Edge Function (bypassa PostgREST completamente)
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-plan`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`,
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ profileId, plan }),
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `RPC: ${rpcError.message}`);
  }
}
