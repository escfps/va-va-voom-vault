import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Loader2, Search, User, Heart, ShoppingBag, ExternalLink, Shield, Users, CheckCircle } from "lucide-react";

// ─── Configure o e-mail do administrador aqui ───────────────────────────────
const ADMIN_EMAILS = ["bruno13@hotmail.com"];

const typeLabel = (tags: string[]) => {
  const types = (tags ?? []).filter((t) => t === "acompanhante" || t === "conteudo");
  if (types.includes("acompanhante") && types.includes("conteudo")) return "Acompanhante + Criadora";
  if (types.includes("acompanhante")) return "Acompanhante";
  if (types.includes("conteudo")) return "Criadora de Conteúdo";
  return "Sem tipo";
};

const typeIcon = (tags: string[]) => {
  const types = (tags ?? []).filter((t) => t === "acompanhante" || t === "conteudo");
  if (types.includes("acompanhante") && types.includes("conteudo"))
    return <span className="flex gap-1"><Heart className="h-3.5 w-3.5 text-primary" /><ShoppingBag className="h-3.5 w-3.5 text-primary" /></span>;
  if (types.includes("acompanhante")) return <Heart className="h-3.5 w-3.5 text-primary" />;
  if (types.includes("conteudo")) return <ShoppingBag className="h-3.5 w-3.5 text-primary" />;
  return <User className="h-3.5 w-3.5 text-muted-foreground" />;
};

const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "acompanhante" | "conteudo">("all");

  const isAdmin = user && ADMIN_EMAILS.includes(user.email ?? "");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (!isAdmin) { toast.error("Acesso negado."); navigate("/"); return; }
    fetchProfiles();
  }, [user]);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, age, city, state, tags, plan, verified, image, profile_created_at, user_id")
      .order("profile_created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar perfis: " + error.message);
    } else {
      setProfiles(data ?? []);
      setFiltered(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    let list = profiles;

    if (filterType !== "all") {
      list = list.filter((p) => (p.tags ?? []).includes(filterType));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          p.state?.toLowerCase().includes(q)
      );
    }

    setFiltered(list);
  }, [search, filterType, profiles]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir o perfil de "${name}"? Essa ação não pode ser desfeita.`)) return;
    setDeletingId(id);
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir: " + error.message);
    } else {
      toast.success(`Perfil de ${name} excluído.`);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    }
    setDeletingId(null);
  };

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-sm mx-4">
            <CardContent className="pt-6 text-center space-y-3">
              <Shield className="h-10 w-10 text-destructive mx-auto" />
              <p className="font-semibold">Acesso restrito</p>
              <Button onClick={() => navigate("/")} className="w-full">Voltar ao início</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const totalAcompanhante = profiles.filter((p) => (p.tags ?? []).includes("acompanhante")).length;
  const totalConteudo = profiles.filter((p) => (p.tags ?? []).includes("conteudo")).length;
  const totalVerified = profiles.filter((p) => p.verified).length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="max-w-5xl mx-auto px-4 space-y-6">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
              <p className="text-sm text-muted-foreground">Gerencie os perfis da plataforma</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total de perfis", value: profiles.length, icon: <Users className="h-4 w-4" /> },
              { label: "Acompanhantes", value: totalAcompanhante, icon: <Heart className="h-4 w-4" /> },
              { label: "Criadoras", value: totalConteudo, icon: <ShoppingBag className="h-4 w-4" /> },
              { label: "Verificadas", value: totalVerified, icon: <CheckCircle className="h-4 w-4" /> },
            ].map(({ label, value, icon }) => (
              <Card key={label}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 text-primary mb-1">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Perfis cadastrados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, cidade ou estado..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  {(["all", "acompanhante", "conteudo"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterType(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filterType === t
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {t === "all" ? "Todos" : t === "acompanhante" ? "Acompanhante" : "Criadora"}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Nenhum perfil encontrado.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-border/80 hover:bg-muted/20 transition-all"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border border-border shrink-0">
                        {profile.image ? (
                          <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 m-auto mt-2.5 text-muted-foreground" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-foreground text-sm truncate">{profile.name}</p>
                          {profile.verified && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">Verificada</span>
                          )}
                          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                            {profile.plan === "monthly" ? "Mensal" : profile.plan === "yearly" ? "Anual" : "Gratuito"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            {typeIcon(profile.tags ?? [])} {typeLabel(profile.tags ?? [])}
                          </span>
                          {profile.city && (
                            <span className="text-xs text-muted-foreground">· {profile.city}, {profile.state}</span>
                          )}
                          {profile.age && (
                            <span className="text-xs text-muted-foreground">· {profile.age} anos</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Link to={`/perfil/${profile.id}`} target="_blank">
                          <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8">
                            <ExternalLink className="h-3.5 w-3.5" /> Ver
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1.5 text-xs h-8"
                          disabled={deletingId === profile.id}
                          onClick={() => handleDelete(profile.id, profile.name)}
                        >
                          {deletingId === profile.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && filtered.length > 0 && (
                <p className="text-xs text-muted-foreground text-right">
                  {filtered.length} perfil{filtered.length !== 1 ? "s" : ""} exibido{filtered.length !== 1 ? "s" : ""}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPage;
