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
import { Trash2, Loader2, Search, User, Heart, ShoppingBag, ExternalLink, Shield, Users, CheckCircle, Crown, Pencil, Clock, ThumbsUp, ThumbsDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updatePlan } from "@/lib/updatePlan";

// ─── Configure o e-mail do administrador aqui ───────────────────────────────
const ADMIN_EMAILS = ["bruno13@hotmail.com", "texasgramado@gmail.com"];

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
  const [updatingPlanId, setUpdatingPlanId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "acompanhante" | "conteudo">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");

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
      .select("*")
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

    if (filterStatus !== "all") {
      list = list.filter((p) => (p.status ?? "pending") === filterStatus);
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
  }, [search, filterType, filterStatus, profiles]);

  const handleChangeStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdatingStatusId(id);
    try {
      const { error } = await supabase.rpc("set_profile_status", {
        profile_id: id,
        new_status: status,
      });

      if (error) throw new Error(error.message);

      toast.success(status === "approved" ? "Perfil aprovado!" : "Perfil reprovado.");
      setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
    } catch (err: any) {
      toast.error("Erro ao atualizar status: " + err.message);
    }
    setUpdatingStatusId(null);
  };

  const handleChangePlan = async (id: string, plan: string) => {
    setUpdatingPlanId(id);
    try {
      await updatePlan(id, plan);
      toast.success(`Plano atualizado para ${plan === "yearly" ? "Anual" : plan === "monthly" ? "Mensal" : "Gratuito"}`);
      setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, plan } : p));
    } catch (err: any) {
      toast.error("Erro ao atualizar plano: " + err.message);
    }
    setUpdatingPlanId(null);
  };

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
                <div className="flex gap-2 flex-wrap">
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
                  <div className="w-px bg-border" />
                  {(["all", "pending", "approved", "rejected"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filterStatus === s
                          ? s === "pending" ? "bg-yellow-500 text-white"
                          : s === "approved" ? "bg-green-600 text-white"
                          : s === "rejected" ? "bg-destructive text-white"
                          : "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {s === "all" ? "Todos status" : s === "pending" ? `⏳ Pendentes (${profiles.filter(p => (p.status ?? "pending") === "pending").length})` : s === "approved" ? "✅ Aprovados" : "❌ Reprovados"}
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
                          {(profile.status ?? "pending") === "pending" && (
                            <span className="text-[10px] bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 px-1.5 py-0.5 rounded-full font-medium">⏳ Pendente</span>
                          )}
                          {profile.status === "approved" && (
                            <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium">✅ Aprovado</span>
                          )}
                          {profile.status === "rejected" && (
                            <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 px-1.5 py-0.5 rounded-full font-medium">❌ Reprovado</span>
                          )}
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
                        <Select
                          value={profile.plan ?? "free"}
                          onValueChange={(val) => handleChangePlan(profile.id, val)}
                          disabled={updatingPlanId === profile.id}
                        >
                          <SelectTrigger className="h-8 text-xs w-28 gap-1">
                            {updatingPlanId === profile.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <Crown className="h-3 w-3 text-yellow-500" />}
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Gratuito</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                            <SelectItem value="yearly">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                        <Link to={`/meu-perfil?adminProfileId=${profile.id}`} target="_blank">
                          <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8">
                            <Pencil className="h-3.5 w-3.5" /> Editar
                          </Button>
                        </Link>
                        <Link to={`/perfil/${profile.id}`} target="_blank">
                          <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8">
                            <ExternalLink className="h-3.5 w-3.5" /> Ver
                          </Button>
                        </Link>
                        {(profile.status ?? "pending") === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="gap-1 text-xs h-8 bg-green-600 hover:bg-green-700"
                              disabled={updatingStatusId === profile.id}
                              onClick={() => handleChangeStatus(profile.id, "approved")}
                            >
                              {updatingStatusId === profile.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1 text-xs h-8"
                              disabled={updatingStatusId === profile.id}
                              onClick={() => handleChangeStatus(profile.id, "rejected")}
                            >
                              <ThumbsDown className="h-3.5 w-3.5" /> Reprovar
                            </Button>
                          </>
                        )}
                        {profile.status === "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs h-8 text-yellow-600 border-yellow-500 hover:bg-yellow-50"
                            disabled={updatingStatusId === profile.id}
                            onClick={() => handleChangeStatus(profile.id, "rejected")}
                          >
                            <Clock className="h-3.5 w-3.5" /> Suspender
                          </Button>
                        )}
                        {profile.status === "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs h-8 text-green-600 border-green-500 hover:bg-green-50"
                            disabled={updatingStatusId === profile.id}
                            onClick={() => handleChangeStatus(profile.id, "approved")}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" /> Reativar
                          </Button>
                        )}
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
