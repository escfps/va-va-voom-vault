import { useQuery } from "@tanstack/react-query";
import ProfileCard from "./ProfileCard";
import { fetchProfiles } from "@/lib/profiles";
import { Skeleton } from "@/components/ui/skeleton";

const FeaturedProfiles = () => {
  const { data: allProfiles = [], isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchProfiles,
    staleTime: 1000 * 60 * 5, // cache por 5 minutos
  });

  const profiles = allProfiles.slice(0, 12); // mostra só 12 na home

  return (
    <section className="py-16 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground">
            Perfis em <span className="text-primary">destaque</span>
          </h2>
          <p className="mt-2 text-muted-foreground">
            Confira os perfis mais populares da plataforma
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {profiles.map((profile) => (
              <ProfileCard key={profile.id} {...profile} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProfiles;
