import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Trophy, Crown, Star, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type TopProfile = {
  id: string;
  name: string;
  city: string;
  state: string;
  image: string;
  plan: string;
  view_count: number;
};

type TopReferrer = {
  referrer_id: string;
  name: string;
  city: string;
  image: string;
  plan: string;
  total: number;
};

async function fetchTopViewed(): Promise<TopProfile[]> {
  const { data, error } = await (supabase
    .from("profiles")
    .select("id, name, city, state, image, plan, view_count") as any)
    .eq("status", "approved")
    .eq("is_active", true)
    .order("view_count", { ascending: false })
    .limit(20);
  if (error) return [];
  return data ?? [];
}

async function fetchTopReferrers(): Promise<TopReferrer[]> {
  // Busca as transações agrupadas por referrer
  const { data: txs, error } = await (supabase
    .from("referral_transactions")
    .select("referrer_id, amount") as any)
    .eq("status", "paid");
  if (error || !txs) return [];

  // Agrupa por referrer_id
  const totals: Record<string, number> = {};
  for (const tx of txs) {
    totals[tx.referrer_id] = (totals[tx.referrer_id] || 0) + 1;
  }
  const sorted = Object.entries(totals)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 20);

  if (sorted.length === 0) return [];

  const ids = sorted.map(([id]) => id);
  const { data: profiles } = await (supabase
    .from("profiles")
    .select("id, name, city, image, plan") as any)
    .in("id", ids);

  const profileMap: Record<string, any> = {};
  for (const p of profiles ?? []) profileMap[p.id] = p;

  return sorted.map(([id, total]) => ({
    referrer_id: id,
    total: total as number,
    name: profileMap[id]?.name ?? "—",
    city: profileMap[id]?.city ?? "",
    image: profileMap[id]?.image ?? "",
    plan: profileMap[id]?.plan ?? "free",
  }));
}

const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
const medalIcons = [Crown, Trophy, Medal];

function PlanBadge({ plan }: { plan: string }) {
  if (plan === "yearly")
    return (
      <Badge className="text-xs font-bold border-0" style={{ background: "linear-gradient(135deg,#b8860b,#ffd700,#b8860b)", color: "#1a0a00" }}>
        <Crown className="h-3 w-3 mr-1" />PREMIUM
      </Badge>
    );
  if (plan === "monthly")
    return (
      <Badge className="bg-red-500 text-white text-xs font-bold">
        <Star className="h-3 w-3 mr-1 fill-white" />VIP
      </Badge>
    );
  return null;
}

function RankRow({ position, image, name, city, plan, value, label, id }: {
  position: number; image: string; name: string; city: string; plan: string;
  value: number; label: string; id: string;
}) {
  const isTop3 = position <= 3;
  const MedalIcon = isTop3 ? medalIcons[position - 1] : null;
  const color = isTop3 ? medalColors[position - 1] : undefined;

  return (
    <Link
      to={`/perfil/${id}`}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
    >
      <div className="w-8 text-center font-bold text-lg shrink-0" style={{ color }}>
        {isTop3 && MedalIcon ? <MedalIcon className="h-6 w-6 mx-auto" style={{ color }} /> : position}
      </div>
      <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2" style={{ borderColor: color ?? "transparent" }}>
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">?</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold truncate">{name}</span>
          <PlanBadge plan={plan} />
        </div>
        <span className="text-xs text-muted-foreground">{city}</span>
      </div>
      <div className="text-right shrink-0">
        <span className="font-bold text-primary">{value.toLocaleString("pt-BR")}</span>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Link>
  );
}

export default function RankingPage() {
  const [tab, setTab] = useState<"views" | "referrals">("views");

  const { data: topViewed = [], isLoading: loadingViews } = useQuery({
    queryKey: ["ranking-views"],
    queryFn: fetchTopViewed,
    staleTime: 1000 * 60 * 5,
  });

  const { data: topReferrers = [], isLoading: loadingReferrals } = useQuery({
    queryKey: ["ranking-referrals"],
    queryFn: fetchTopReferrers,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = tab === "views" ? loadingViews : loadingReferrals;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-1">🏆 Ranking</h1>
          <p className="text-muted-foreground text-sm">As melhores do XMODELPRIVE</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-border mb-6">
          <button
            onClick={() => setTab("views")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${tab === "views" ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"}`}
          >
            <Eye className="h-4 w-4" />
            Mais Visualizadas
          </button>
          <button
            onClick={() => setTab("referrals")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${tab === "referrals" ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"}`}
          >
            <Trophy className="h-4 w-4" />
            Top Indicadoras
          </button>
        </div>

        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {isLoading && (
            <div className="py-16 text-center text-muted-foreground">Carregando...</div>
          )}

          {!isLoading && tab === "views" && (
            topViewed.length === 0
              ? <div className="py-16 text-center text-muted-foreground">Nenhuma visualização ainda.</div>
              : topViewed.map((p, i) => (
                <RankRow
                  key={p.id}
                  id={p.id}
                  position={i + 1}
                  image={p.image}
                  name={p.name}
                  city={`${p.city}${p.state ? ` - ${p.state}` : ""}`}
                  plan={p.plan}
                  value={p.view_count}
                  label="visualizações"
                />
              ))
          )}

          {!isLoading && tab === "referrals" && (
            topReferrers.length === 0
              ? <div className="py-16 text-center text-muted-foreground">Nenhuma indicação ainda.</div>
              : topReferrers.map((r, i) => (
                <RankRow
                  key={r.referrer_id}
                  id={r.referrer_id}
                  position={i + 1}
                  image={r.image}
                  name={r.name}
                  city={r.city}
                  plan={r.plan}
                  value={r.total}
                  label="indicações"
                />
              ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
