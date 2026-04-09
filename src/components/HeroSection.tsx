import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const popularCities = [
  "São Paulo",
  "Rio de Janeiro",
  "Belo Horizonte",
  "Curitiba",
  "Brasília",
  "Salvador",
  "Fortaleza",
  "Recife",
];

const HeroSection = () => {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  // Fecha sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Busca cidades na API do IBGE com debounce
  useEffect(() => {
    if (search.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome`);
        const data = await res.json();

        const normalized = (str) =>
          str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

        const filtered = data
          .filter((m) => normalized(m.nome).startsWith(normalized(search.trim())))
          .slice(0, 8)
          .map((m) => `${m.nome} - ${m.microrregiao.mesorregiao.UF.sigla}`);

        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } catch (err) {
        console.error("Erro ao buscar cidades:", err);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [search]);

  const handleSearch = () => {
    if (search.trim()) {
      navigate(`/busca?cidade=${encodeURIComponent(search)}`);
      setShowSuggestions(false);
    }
  };

  const handleSelectCity = (city) => {
    setSearch(city);
    setShowSuggestions(false);
    navigate(`/busca?cidade=${encodeURIComponent(city)}`);
  };

  return (
    <section className="relative bg-background py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Bem-vindo à sua nova <span className="text-primary">plataforma de modelos</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              A maior plataforma de divulgação de conteúdo. Encontre perfis verificados com fotos, vídeos e informações
              completas. Segurança e discrição garantidas.
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
              {/* Input com autocomplete */}
              <div className="relative" ref={wrapperRef}>
                <Input
                  placeholder="Buscar por cidade..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="pr-12 h-12 text-base"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground p-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                </button>

                {/* Dropdown de sugestões */}
                {showSuggestions && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                    {suggestions.map((city) => (
                      <button
                        key={city}
                        onClick={() => handleSelectCity(city)}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left"
                      >
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Cidades populares */}
              <div className="mt-5">
                <p className="text-sm font-semibold text-primary mb-3">Cidades populares:</p>
                <div className="space-y-1">
                  {popularCities.map((city) => (
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
