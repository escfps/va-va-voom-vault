import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileCard from "@/components/ProfileCard";
import { fetchProfiles } from "@/lib/profiles";
import { Skeleton } from "@/components/ui/skeleton";
import { useSeo } from "@/lib/useSeo";

// "sao-paulo-sp" → { city: "São Paulo", state: "SP" }
function parseSlug(slug: string): { citySlug: string; state: string } {
  const parts = slug.split("-");
  const state = parts[parts.length - 1].toUpperCase();
  const citySlug = parts.slice(0, -1).join("-");
  return { citySlug, state };
}

function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

const CityPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { citySlug, state } = parseSlug(slug ?? "");
  const cityName = slugToName(citySlug);

  useSeo({
    title: `Acompanhantes em ${cityName} - ${state}`,
    description: `Encontre acompanhantes verificadas em ${cityName} - ${state}. Perfis reais com fotos exclusivas, avaliações e contato direto via WhatsApp. Discreção total.`,
    keywords: `acompanhante ${cityName}, acompanhantes em ${cityName}, acompanhante ${state}, modelos ${cityName}, garotas de programa ${cityName}`,
    canonical: `https://xmodelprive.com/acompanhantes/${slug}`,
  });

  const { data: allProfiles = [], isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchProfiles,
    staleTime: 1000 * 60 * 5,
  });

  const PLAN_RANK: Record<string, number> = { yearly: 0, monthly: 1, free: 2 };

  const profiles = allProfiles
    .filter((p) =>
      normalizeStr(p.city) === citySlug &&
      p.state.toLowerCase() === state.toLowerCase()
    )
    .sort((a, b) => (PLAN_RANK[a.plan] ?? 2) - (PLAN_RANK[b.plan] ?? 2));

  const topViewIds = [...allProfiles].filter(p => (p.viewCount ?? 0) > 0).sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)).slice(0, 3).map(p => p.id);
  const topReferralIds = [...allProfiles].filter(p => (p.referralCount ?? 0) > 0).sort((a, b) => (b.referralCount ?? 0) - (a.referralCount ?? 0)).slice(0, 3).map(p => p.id);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Acompanhantes em <span className="text-primary">{cityName}</span> - {state}
          </h1>
          <p className="text-muted-foreground mb-8">
            Perfis verificados de acompanhantes em {cityName}, {state}.
          </p>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-20">
              Nenhum perfil encontrado em {cityName} - {state}.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {profiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  {...profile}
                  referralBonusUntil={(profile as any).referralBonusUntil}
                  viewRank={topViewIds.indexOf(profile.id) !== -1 ? topViewIds.indexOf(profile.id) + 1 : undefined}
                  referralRank={topReferralIds.indexOf(profile.id) !== -1 ? topReferralIds.indexOf(profile.id) + 1 : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CityPage;
