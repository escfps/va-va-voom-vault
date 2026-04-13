import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileCard from "@/components/ProfileCard";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const FavoritesPage = () => {
  const { user } = useAuth();
  const { favoriteIds, isLoading: loadingFavs } = useFavorites();

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ["favorite-profiles", favoriteIds],
    queryFn: async () => {
      if (favoriteIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", favoriteIds);
      if (error) throw error;
      return data;
    },
    enabled: favoriteIds.length > 0,
  });

  const loading = loadingFavs || loadingProfiles;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 px-4">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Faça login para ver seus favoritos</h2>
            <Link to="/login">
              <Button>Fazer login</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <h1 className="text-2xl font-bold text-foreground">Meus Favoritos</h1>
            <span className="text-muted-foreground">({profiles.length})</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <Heart className="h-16 w-16 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground">Nenhum favorito ainda</h2>
              <p className="text-muted-foreground">Explore os perfis e toque no ❤️ para salvar seus favoritos.</p>
              <Link to="/busca">
                <Button>Explorar perfis</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {profiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  id={profile.id}
                  name={profile.name}
                  age={profile.age}
                  city={profile.city}
                  image={profile.image || "/placeholder.svg"}
                  price={profile.price}
                  verified={profile.verified || false}
                  rating={Number(profile.rating) || 0}
                  tags={profile.tags || []}
                  plan={(profile as any).plan || "free"}
                  referralBonusUntil={(profile as any).referral_bonus_until ?? (profile as any).referralBonusUntil ?? null}
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

export default FavoritesPage;
