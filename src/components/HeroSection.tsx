import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const cities = [
  "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba",
  "Brasília", "Salvador", "Fortaleza", "Recife"
];

const HeroSection = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (search.trim()) {
      navigate(`/busca?cidade=${encodeURIComponent(search)}`);
    }
  };

  return (
    <section className="relative bg-background py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Bem-vindo à sua nova{" "}
              <span className="text-primary">plataforma de modelos</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              A maior plataforma de divulgação de conteúdo. Encontre perfis
              verificados com fotos, vídeos e informações completas. Segurança
              e discrição garantidas.
            </p>
            <Button
              size="lg"
              className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8"
              onClick={() => navigate("/cadastro")}
            >
              Anuncie gratuitamente
            </Button>
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
              <div className="relative">
                <Input
                  placeholder="Buscar por cidade..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pr-12 h-12 text-base"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground p-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5">
                <p className="text-sm font-semibold text-primary mb-3">
                  Cidades populares:
                </p>
                <div className="space-y-1">
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => navigate(`/busca?cidade=${encodeURIComponent(city)}`)}
                      className="flex items-center justify-between w-full py-2.5 px-3 rounded-lg hover:bg-muted transition-colors group"
                    >
                      <span className="flex items-center gap-2 text-sm text-foreground">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {city}
                      </span>
                      <span className="text-muted-foreground group-hover:text-primary transition-colors">›</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
