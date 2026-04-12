import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X as XIcon, User, LogIn, UserCheck, Heart, LogOut, Crown, Check, Star, Zap, Loader2, Calendar, ShoppingBag, Shield } from "lucide-react";

const ADMIN_EMAILS = ["bruno13@hotmail.com"];
import { useFavorites } from "@/hooks/useFavorites";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { updatePlan } from "@/lib/updatePlan";
import { toast } from "sonner";
import logoImg from "@/assets/logo.png";

const PLANS = [
  {
    id: "free",
    name: "Gratuito",
    label: "R$ 0",
    sublabel: "para sempre",
    icon: <Zap className="h-4 w-4" />,
    color: "border-border",
    features: ["Até 3 fotos", "Perfil básico"],
  },
  {
    id: "monthly",
    name: "Mensal",
    label: "R$ 9,90",
    sublabel: "por mês",
    icon: <Star className="h-4 w-4" />,
    color: "border-primary",
    badge: "Popular",
    badgeColor: "bg-primary text-primary-foreground",
    features: ["Fotos ilimitadas", "Verificação", "Destaque"],
  },
  {
    id: "yearly",
    name: "Anual",
    label: "R$ 99,90",
    sublabel: "por ano · -44%",
    icon: <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />,
    color: "border-yellow-500",
    badge: "Melhor valor",
    badgeColor: "bg-yellow-500 text-white",
    features: ["Tudo do Mensal", "Prioridade no ranking"],
  },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [planPopoverOpen, setPlanPopoverOpen] = useState(false);
  const [selectedNewPlan, setSelectedNewPlan] = useState<string | null>(null);
  const [planSaving, setPlanSaving] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { favoriteIds } = useFavorites();
  const [planInfo, setPlanInfo] = useState<{ plan: string; expiresAt: string | null; profileId: string | null } | null>(null);
  const [profileTypes, setProfileTypes] = useState<string[]>([]);

  useEffect(() => {
    if (!user) { setPlanInfo(null); setProfileTypes([]); return; }
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setPlanInfo({ plan: "free", expiresAt: null, profileId: null });
          setProfileTypes([]);
          return;
        }
        setPlanInfo({
          plan: (data as any).plan || "free",
          expiresAt: (data as any).plan_expires_at || null,
          profileId: data.id,
        });
        const types = ((data as any).tags ?? []).filter(
          (t: string) => t === "acompanhante" || t === "conteudo"
        );
        setProfileTypes(types.length > 0 ? types : ["acompanhante"]);
      });
  }, [user, location.pathname]);

  const getDaysLeft = (iso: string): number => {
    const diff = new Date(iso).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const formatDate = (iso: string): string =>
    new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const formatShortDate = (iso: string): string =>
    new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  const isPlanExpired = (iso: string): boolean => new Date(iso) < new Date();

  const planLabel =
    planInfo?.plan === "monthly" ? "Mensal" :
    planInfo?.plan === "yearly" ? "Anual" : "Gratuito";

  const getPlanExpiresAt = (planId: string): string | null => {
    if (planId === "free") return null;
    const date = new Date();
    if (planId === "monthly") date.setDate(date.getDate() + 30);
    if (planId === "yearly") date.setFullYear(date.getFullYear() + 1);
    return date.toISOString();
  };

  const handleChangePlan = async () => {
    if (!selectedNewPlan || !planInfo?.profileId || !user) return;
    setPlanSaving(true);
    try {
      await updatePlan(planInfo.profileId, selectedNewPlan);
      const expiresAt = getPlanExpiresAt(selectedNewPlan);
      setPlanInfo({ ...planInfo, plan: selectedNewPlan, expiresAt });
      setSelectedNewPlan(null);
      setPlanPopoverOpen(false);
      const name = selectedNewPlan === "free" ? "Gratuito" : selectedNewPlan === "monthly" ? "Mensal" : "Anual";
      toast.success(`Plano ${name} ativado com sucesso!`);
    } catch {
      toast.error("Erro ao alterar plano");
    }
    setPlanSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Botão "Planos" compartilhado entre desktop e mobile
  const PlanoBadge = () => (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/40 transition-all cursor-pointer">
      <Crown className={`h-3.5 w-3.5 shrink-0 ${planInfo?.plan !== "free" ? "text-primary" : "text-muted-foreground"}`} />
      <div>
        <p className="font-semibold text-foreground text-xs leading-tight">Planos</p>
        <p className={`text-[10px] leading-tight whitespace-nowrap ${planInfo?.expiresAt && isPlanExpired(planInfo.expiresAt) ? "text-destructive font-medium" : "text-muted-foreground"}`}>
          {!planInfo
            ? "Carregando..."
            : planInfo.plan === "free"
            ? "Gratuito"
            : planInfo.expiresAt && isPlanExpired(planInfo.expiresAt)
            ? "Expirado"
            : planInfo.expiresAt
            ? `${planLabel} · ${getDaysLeft(planInfo.expiresAt)}d · vence ${formatShortDate(planInfo.expiresAt)}`
            : planLabel}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 py-1">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoImg} alt="X Model Privé" className="h-24" />
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-4">
              {/* ── Logged in + HAS profile ── */}
              {user && planInfo?.profileId && (
                <>
                  {/* Planos */}
                  <Popover open={planPopoverOpen} onOpenChange={(v) => { setPlanPopoverOpen(v); if (!v) setSelectedNewPlan(null); }}>
                    <PopoverTrigger asChild>
                      <button type="button"><PlanoBadge /></button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
                      <div className="p-4 border-b border-border">
                        <p className="font-semibold text-foreground text-sm mb-1">Meu Plano</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${planInfo.plan !== "free" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {planLabel}
                          </span>
                          {planInfo.expiresAt && !isPlanExpired(planInfo.expiresAt) && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {getDaysLeft(planInfo.expiresAt)} dias restantes · {formatDate(planInfo.expiresAt)}
                            </span>
                          )}
                          {planInfo.expiresAt && isPlanExpired(planInfo.expiresAt) && (
                            <span className="text-xs text-destructive font-semibold flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> Expirado em {formatDate(planInfo.expiresAt)}
                            </span>
                          )}
                          {planInfo.plan === "free" && (
                            <span className="text-xs text-muted-foreground">Sem data de vencimento</span>
                          )}
                        </div>
                      </div>
                      <div className="p-3 space-y-2">
                        <p className="text-xs text-muted-foreground font-medium px-1 mb-2">Mudar plano:</p>
                        {PLANS.map((plan) => {
                          const isCurrent = plan.id === planInfo.plan;
                          const isSelected = selectedNewPlan === plan.id;
                          return (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => !isCurrent && setSelectedNewPlan(plan.id)}
                              disabled={isCurrent}
                              className={`w-full text-left rounded-xl border-2 p-3 transition-all relative ${
                                isCurrent ? "opacity-50 cursor-not-allowed border-border"
                                  : isSelected ? `${plan.color} ring-2 ring-offset-1 ring-primary/30 bg-primary/5`
                                  : "border-border hover:border-muted-foreground/40"
                              }`}
                            >
                              {"badge" in plan && plan.badge && (
                                <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${"badgeColor" in plan ? plan.badgeColor : ""}`}>
                                  {plan.badge}
                                </span>
                              )}
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                  {plan.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-sm text-foreground">{plan.name}</span>
                                    {isCurrent && <span className="text-[10px] text-muted-foreground">(atual)</span>}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-bold text-foreground">{plan.label}</span> · {plan.sublabel}
                                  </p>
                                </div>
                                {isSelected && (
                                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-2 pl-9">
                                {plan.features.map((f) => (
                                  <span key={f} className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <Check className="h-2.5 w-2.5 text-green-500 shrink-0" />{f}
                                  </span>
                                ))}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="px-3 pb-3">
                        <Button className="w-full gap-2" disabled={!selectedNewPlan || planSaving} onClick={handleChangePlan}>
                          {planSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Alterando...</> : "Confirmar plano"}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                </>
              )}

              {/* ── Botões de categoria — sempre visíveis para logados ── */}
              {user && (
                <>
                  <Link
                    to={profileTypes.includes("acompanhante") ? "/meu-perfil" : "/cadastro?tipo=acompanhante"}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 transition-all ${
                      profileTypes.includes("acompanhante")
                        ? "border-primary bg-primary/5 hover:bg-primary/10"
                        : "border-dashed border-muted-foreground/40 hover:border-primary/50 hover:bg-muted/40"
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 shrink-0 ${profileTypes.includes("acompanhante") ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <p className={`font-bold text-[11px] leading-tight whitespace-nowrap ${profileTypes.includes("acompanhante") ? "text-primary" : "text-muted-foreground"}`}>
                        SOU ACOMPANHANTE
                      </p>
                      <p className="text-[10px] leading-tight text-muted-foreground">
                        {profileTypes.includes("acompanhante") ? "Editar perfil" : "Criar perfil"}
                      </p>
                    </div>
                  </Link>

                  <Link
                    to={profileTypes.includes("conteudo") ? "/meu-perfil" : "/cadastro?tipo=conteudo"}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 transition-all ${
                      profileTypes.includes("conteudo")
                        ? "border-primary bg-primary/5 hover:bg-primary/10"
                        : "border-dashed border-muted-foreground/40 hover:border-primary/50 hover:bg-muted/40"
                    }`}
                  >
                    <ShoppingBag className={`h-3.5 w-3.5 shrink-0 ${profileTypes.includes("conteudo") ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <p className={`font-bold text-[11px] leading-tight whitespace-nowrap ${profileTypes.includes("conteudo") ? "text-primary" : "text-muted-foreground"}`}>
                        VENDEDORA DE CONTEÚDOS
                      </p>
                      <p className="text-[10px] leading-tight text-muted-foreground">
                        {profileTypes.includes("conteudo") ? "Editar perfil" : "Criar perfil"}
                      </p>
                    </div>
                  </Link>
                </>
              )}

              {/* Favorites */}
              {user && (
                <Link to="/favoritos" className="relative">
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Heart className="h-5 w-5" />
                    {favoriteIds.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                        {favoriteIds.length}
                      </span>
                    )}
                  </Button>
                </Link>
              )}

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <User className="h-4 w-4" />
                      {user.user_metadata?.full_name || user.email?.split("@")[0]}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {ADMIN_EMAILS.includes(user.email ?? "") && (
                      <DropdownMenuItem onClick={() => navigate("/admin")} className="gap-2 cursor-pointer">
                        <Shield className="h-4 w-4 text-primary" /> Painel Admin
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate("/conta")} className="gap-2 cursor-pointer">
                      <User className="h-4 w-4" /> Minha Conta
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer">
                      <LogOut className="h-4 w-4" /> Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="outline" className="gap-2" onClick={() => setShowSignup(true)}>
                    <User className="h-4 w-4" /> Cadastre-se grátis
                  </Button>
                  <Link to="/login">
                    <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                      <LogIn className="h-4 w-4" /> Entrar
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <XIcon className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          {isOpen && (
            <div className="md:hidden pb-4 space-y-2">
              {user ? (
                <>
                  <p className="text-sm text-muted-foreground px-2">
                    Olá, {user.user_metadata?.full_name || user.email?.split("@")[0]}
                  </p>

                  {/* Planos — só se tiver perfil */}
                  {planInfo?.profileId && (
                    <button type="button" className="w-full" onClick={() => { setIsOpen(false); setPlanPopoverOpen(true); }}>
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-muted/30 w-full text-left">
                        <Crown className={`h-4 w-4 shrink-0 ${planInfo.plan !== "free" ? "text-primary" : "text-muted-foreground"}`} />
                        <div>
                          <p className="text-sm font-semibold text-foreground">Planos</p>
                          <p className={`text-xs ${planInfo.expiresAt && isPlanExpired(planInfo.expiresAt) ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                            {planInfo.plan === "free"
                              ? "Gratuito — sem vencimento"
                              : planInfo.expiresAt && isPlanExpired(planInfo.expiresAt)
                              ? "Plano expirado"
                              : planInfo.expiresAt
                              ? `${planLabel} · ${getDaysLeft(planInfo.expiresAt)} dias · vence ${formatDate(planInfo.expiresAt)}`
                              : planLabel}
                          </p>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Botão: Sou Acompanhante */}
                  <Link
                    to={profileTypes.includes("acompanhante") ? "/meu-perfil" : "/cadastro?tipo=acompanhante"}
                    className="block"
                    onClick={() => setIsOpen(false)}
                  >
                    <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all text-left ${
                      profileTypes.includes("acompanhante")
                        ? "border-primary bg-primary/5"
                        : "border-dashed border-muted-foreground/40 hover:border-primary/50"
                    }`}>
                      <Heart className={`h-4 w-4 shrink-0 ${profileTypes.includes("acompanhante") ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <p className={`font-bold text-sm leading-tight ${profileTypes.includes("acompanhante") ? "text-primary" : "text-muted-foreground"}`}>
                          SOU ACOMPANHANTE
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {profileTypes.includes("acompanhante") ? "Editar perfil" : "Criar perfil"}
                        </p>
                      </div>
                    </button>
                  </Link>

                  {/* Botão: Vendedora de Conteúdos */}
                  <Link
                    to={profileTypes.includes("conteudo") ? "/meu-perfil" : "/cadastro?tipo=conteudo"}
                    className="block"
                    onClick={() => setIsOpen(false)}
                  >
                    <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all text-left ${
                      profileTypes.includes("conteudo")
                        ? "border-primary bg-primary/5"
                        : "border-dashed border-muted-foreground/40 hover:border-primary/50"
                    }`}>
                      <ShoppingBag className={`h-4 w-4 shrink-0 ${profileTypes.includes("conteudo") ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <p className={`font-bold text-sm leading-tight ${profileTypes.includes("conteudo") ? "text-primary" : "text-muted-foreground"}`}>
                          VENDEDORA DE CONTEÚDOS
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {profileTypes.includes("conteudo") ? "Editar perfil" : "Criar perfil"}
                        </p>
                      </div>
                    </button>
                  </Link>

                  <Button variant="outline" className="w-full gap-2" onClick={() => { setIsOpen(false); handleSignOut(); }}>
                    <LogOut className="h-4 w-4" /> Sair
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="w-full gap-2" onClick={() => { setIsOpen(false); setShowSignup(true); }}>
                    <User className="h-4 w-4" /> Cadastre-se grátis
                  </Button>
                  <Link to="/login" className="block" onClick={() => setIsOpen(false)}>
                    <Button className="w-full gap-2 bg-primary text-primary-foreground">
                      <LogIn className="h-4 w-4" /> Entrar
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Dialog cadastro */}
      <Dialog open={showSignup} onOpenChange={setShowSignup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl text-primary">Cadastre-se Grátis</DialogTitle>
            <DialogDescription>Escolha a melhor opção para você</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Link
              to="/cadastro-usuario"
              onClick={() => setShowSignup(false)}
              className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted transition-all group"
            >
              <div className="p-2.5 rounded-full bg-secondary">
                <UserCheck className="h-5 w-5 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Quero ser cliente</p>
                <p className="text-sm text-muted-foreground">Encontre as melhores acompanhantes disponíveis para você.</p>
              </div>
              <span className="text-muted-foreground group-hover:text-primary transition-colors text-xl">›</span>
            </Link>
            <Link
              to="/cadastro?tipo=acompanhante"
              onClick={() => setShowSignup(false)}
              className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted transition-all group"
            >
              <div className="p-2.5 rounded-full bg-primary/10">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-primary">Sou acompanhante</p>
                <p className="text-sm text-muted-foreground">Divulgue seus serviços para milhares de clientes.</p>
              </div>
              <span className="text-muted-foreground group-hover:text-primary transition-colors text-xl">›</span>
            </Link>
            <Link
              to="/cadastro?tipo=conteudo"
              onClick={() => setShowSignup(false)}
              className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted transition-all group"
            >
              <div className="p-2.5 rounded-full bg-primary/10">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-primary">Vendedora de conteúdo</p>
                <p className="text-sm text-muted-foreground">Venda fotos, vídeos e packs exclusivos online.</p>
              </div>
              <span className="text-muted-foreground group-hover:text-primary transition-colors text-xl">›</span>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog planos — usado pelo mobile */}
      <Dialog open={planPopoverOpen && !window.matchMedia("(min-width: 768px)").matches} onOpenChange={(v) => { setPlanPopoverOpen(v); if (!v) setSelectedNewPlan(null); }}>
        <DialogContent className="sm:max-w-sm p-0">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" /> Meu Plano
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 flex-wrap mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${planInfo?.plan !== "free" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {planLabel}
              </span>
              {planInfo?.expiresAt && !isPlanExpired(planInfo.expiresAt) && (
                <span className="text-xs text-muted-foreground">
                  {getDaysLeft(planInfo.expiresAt)} dias · vence {formatDate(planInfo.expiresAt)}
                </span>
              )}
              {planInfo?.expiresAt && isPlanExpired(planInfo.expiresAt) && (
                <span className="text-xs text-destructive font-medium">Expirado</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 space-y-2">
            {PLANS.map((plan) => {
              const isCurrent = plan.id === planInfo?.plan;
              const isSelected = selectedNewPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => !isCurrent && setSelectedNewPlan(plan.id)}
                  disabled={isCurrent}
                  className={`w-full text-left rounded-xl border-2 p-3 transition-all relative ${
                    isCurrent
                      ? "opacity-50 cursor-not-allowed border-border"
                      : isSelected
                      ? `${plan.color} bg-primary/5`
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  {"badge" in plan && plan.badge && (
                    <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${"badgeColor" in plan ? plan.badgeColor : ""}`}>
                      {plan.badge}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {plan.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm">{plan.name}</span>
                        {isCurrent && <span className="text-[10px] text-muted-foreground">(atual)</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">{plan.label}</span> · {plan.sublabel}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="px-3 pb-3">
            <Button className="w-full gap-2" disabled={!selectedNewPlan || planSaving} onClick={handleChangePlan}>
              {planSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Alterando...</> : "Confirmar plano"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navbar;
