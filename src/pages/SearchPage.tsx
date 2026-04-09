import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileCard from "@/components/ProfileCard";
import { fetchProfiles } from "@/lib/profiles";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const cidadeParam = searchParams.get("cidade") || "";
  const [search, setSearch] = useState(cidadeParam);

  const { data: allProfiles = [], isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchProfiles,
  });

  const filtered = allProfiles.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.city.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              {cidadeParam ? `Modelos em ${cidadeParam}` : "Buscar modelos"}
            </h1>
            <div className="relative max-w-md">
              <Input
                placeholder="Buscar por cidade, nome ou tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10 h-12"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filtered.map((profile) => (
                <ProfileCard key={profile.id} {...profile} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">
                Nenhum perfil encontrado para "{search}"
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchPage;
