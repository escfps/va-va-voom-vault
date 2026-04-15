import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X as XIcon, User, LogIn, UserCheck, Heart, LogOut, Crown, Check, Star, Zap, Loader2, Calendar, ShoppingBag, Shield, Gift, Copy, Wallet } from "lucide-react";

const ADMIN_EMAILS = ["bruno13@hotmail.com", "texasgramado@gmail.com"];
import { FEATURES } from "@/lib/features";
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
import { toProfileSlug } from "@/lib/profileSlug";

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
    features: ["Fotos ilimitadas", "Verificação", "Destaque", "Upload de vídeos"],
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
    features: ["Tudo do Mensal", "Prioridade no ranking", "Vídeo como foto de perfil"],
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
  const [planInfo, setPlanInfo] = useState<{ plan: string; expiresAt: string | null; profileId: string | null; profileName: string | null } | null>(null);
  const [profileTypes, setProfileTypes] = useState<string[]>([]);
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralBalance, setReferralBalance] = useState<number>(0);
  const [referralOpen, setReferralOpen] = useState(false);

  useEffect(() => {
    if (!user) { setPlanInfo(null); setProfileTypes([]); return; }
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setPlanInfo({ plan: "free", expiresAt: null, profileId: null, profileName: null });
          setProfileTypes([]);
          return;
        }
        setPlanInfo({
          plan: (data as any).plan || "free",
          expiresAt: (data as any).plan_expires_at || null,
          profileId: data.id,
          profileName: (data as any).name || null,
        });
        setReferralCode((data as any).referral_code || "");
        setReferralBalance((data as any).referral_balance || 0);
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


  const handleChangePlan = async () => {
    if (!selectedNewPlan || !planInfo?.profileId || !user) return;

    // Planos pagos: redireciona para checkout com PIX
    if (selectedNewPlan !== "free") {
      setPlanPopoverOpen(false);
      setSelectedNewPlan(null);
      navigate("/planos", { state: { profileId: planInfo.profileId, preselectedPlan: selectedNewPlan } });
      return;
    }

    // Downgrade para free: aplica direto
    setPlanSaving(true);
    try {
      await updatePlan(planInfo.profileId, selectedNewPlan);
      setPlanInfo({ ...planInfo, plan: "free", expiresAt: null });
      setSelectedNewPlan(null);
      setPlanPopoverOpen(false);
      toast.success("Plano alterado para Gratuito.");
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
              <Link to="/ranking" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                🏆 Ranking
              </Link>
              <Link to="/cadastro-usuario" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                👤 Sou cliente
              </Link>
              {/* ── Logged in + HAS profile ── */}
              {user && planInfo?.profileId && (
                <>
                  {/* Indicações */}
                  <Popover open={referralOpen} onOpenChange={setReferralOpen}>
                    <PopoverTrigger asChild>
                      <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-pink-400/60 hover:bg-pink-500/5 transition-all">
                        <Gift className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground text-xs leading-tight">Indicações</p>
                          <p className="text-[10px] leading-tight text-pink-500 font-medium">R$ {referralBalance.toFixed(2)}</p>
                        </div>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4 space-y-4" align="end" sideOffset={8}>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Programa de Indicação</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Indique modelos e ganhe R$ 5,00 por cada plano ativado</p>
                      </div>

                      {/* Saldo */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-xs font-medium text-foreground">Saldo acumulado</p>
                            <p className="text-[10px] text-muted-foreground">
                              {referralBalance >= 100 ? "Pronto para sacar!" : `Faltam R$ ${(100 - referralBalance).toFixed(2)} para sacar`}
                            </p>
                          </div>
                        </div>
                        <p className={`text-lg font-bold ${referralBalance >= 100 ? "text-green-600" : "text-foreground"}`}>
                          R$ {referralBalance.toFixed(2)}
                        </p>
                      </div>

                      {referralBalance >= 100 && (
                        <p className="text-xs text-green-600 bg-green-500/10 rounded-lg p-2">
                          🎉 Saldo disponível! Entre em contato via WhatsApp para sacar via PIX.
                        </p>
                      )}

                      {/* Código + Link */}
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-foreground">Seu código de indicação</p>
                        {referralCode ? (
                          <div className="flex flex-col gap-1.5">
                            {/* Código */}
                            <div className="flex items-center gap-2">
                              <p className="flex-1 text-sm font-bold text-primary bg-primary/10 rounded-lg px-3 py-1.5 font-mono tracking-widest text-center">
                                {referralCode}
                              </p>
                              <button
                                onClick={() => { navigator.clipboard.writeText(referralCode); toast.success("Código copiado!"); }}
                                className="shrink-0 p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            {/* Link completo */}
                            <div className="flex items-center gap-2">
                              <p className="flex-1 text-xs text-muted-foreground bg-muted rounded-lg px-2 py-1.5 font-mono truncate">
                                xmodelprive.com/cadastro?ref={referralCode}
                              </p>
                              <button
                                onClick={() => { navigator.clipboard.writeText(`https://xmodelprive.com/cadastro?ref=${referralCode}`); toast.success("Link copiado!"); }}
                                className="shrink-0 p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Código será gerado em breve.</p>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>• R$ 5,00 por modelo que ativar qualquer plano</p>
                        <p>• Saque disponível a partir de R$ 100,00</p>
                      </div>
                    </PopoverContent>
                  </Popover>

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
                          {planSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Aguarde...</> : selectedNewPlan && selectedNewPlan !== "free" ? "Ir ao pagamento →" : "Confirmar plano"}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                </>
              )}

              {/* ── Botões de categoria — sempre visíveis para logados ── */}
              {user && (
                <>
                  {/* Acompanhante */}
                  {profileTypes.includes("acompanhante") ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all">
                          <Heart className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <div className="text-left">
                            <p className="font-bold text-[11px] leading-tight whitespace-nowrap text-primary">SOU ACOMPANHANTE</p>
                            <p className="text-[10px] leading-tight text-muted-foreground">Editar perfil ▾</p>
                          </div>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-44">
                        <DropdownMenuItem asChild>
                          <Link to="/meu-perfil" className="flex items-center gap-2 cursor-pointer">
                            <User className="h-4 w-4" /> Editar perfil
                          </Link>
                        </DropdownMenuItem>
                        {planInfo?.profileId && (
                          <DropdownMenuItem asChild>
                            <Link to={`/acompanhante/${toProfileSlug(planInfo.profileName ?? "", planInfo.profileId ?? "")}`} className="flex items-center gap-2 cursor-pointer">
                              <Heart className="h-4 w-4" /> Ver perfil
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Link
                      to="/cadastro?tipo=acompanhante"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-dashed border-muted-foreground/40 hover:border-primary/50 hover:bg-muted/40 transition-all"
                    >
                      <Heart className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-bold text-[11px] leading-tight whitespace-nowrap text-muted-foreground">SOU ACOMPANHANTE</p>
                        <p className="text-[10px] leading-tight text-muted-foreground">Criar perfil</p>
                      </div>
                    </Link>
                  )}

                  {/* Vendedora de conteúdo — desativado temporariamente */}
                  {FEATURES.CRIADORA_CONTEUDO && (profileTypes.includes("conteudo") ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all">
                          <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <div className="text-left">
                            <p className="font-bold text-[11px] leading-tight whitespace-nowrap text-primary">VENDEDORA DE CONTEÚDOS</p>
                            <p className="text-[10px] leading-tight text-muted-foreground">Editar perfil ▾</p>
                          </div>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-44">
                        <DropdownMenuItem asChild>
                          <Link to="/meu-perfil" className="flex items-center gap-2 cursor-pointer">
                            <User className="h-4 w-4" /> Editar perfil
                          </Link>
                        </DropdownMenuItem>
                        {planInfo?.profileId && (
                          <DropdownMenuItem asChild>
                            <Link to={`/acompanhante/${toProfileSlug(planInfo.profileName ?? "", planInfo.profileId ?? "")}`} className="flex items-center gap-2 cursor-pointer">
                              <ShoppingBag className="h-4 w-4" /> Ver perfil
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Link
                      to="/cadastro?tipo=conteudo"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-dashed border-muted-foreground/40 hover:border-primary/50 hover:bg-muted/40 transition-all"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-bold text-[11px] leading-tight whitespace-nowrap text-muted-foreground">VENDEDORA DE CONTEÚDOS</p>
                        <p className="text-[10px] leading-tight text-muted-foreground">Criar perfil</p>
                      </div>
                    </Link>
                  ))}
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

            {/* Mobile: botão cadastro visível + hambúrguer */}
            <div className="md:hidden flex items-center gap-2">
              {!user && (
                <Button size="sm" className="gap-1.5 text-xs px-3" onClick={() => setShowSignup(true)}>
                  <User className="h-3.5 w-3.5" /> Cadastre-se
                </Button>
              )}
              <button className="p-2" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <XIcon className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
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
                  {profileTypes.includes("acompanhante") ? (
                    <div className="space-y-1">
                      <div className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 border-primary bg-primary/5 text-left`}>
                        <Heart className="h-4 w-4 shrink-0 text-primary" />
                        <div className="flex-1">
                          <p className="font-bold text-sm leading-tight text-primary">SOU ACOMPANHANTE</p>
                          <p className="text-xs text-muted-foreground">Selecione uma ação</p>
                        </div>
                      </div>
                      <div className="flex gap-2 pl-2">
                        <Link to="/meu-perfil" onClick={() => setIsOpen(false)} className="flex-1">
                          <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors">
                            <User className="h-3.5 w-3.5" /> Editar perfil
                          </button>
                        </Link>
                        {planInfo?.profileId && (
                          <Link to={`/acompanhante/${toProfileSlug(planInfo.profileName ?? "", planInfo.profileId ?? "")}`} onClick={() => setIsOpen(false)} className="flex-1">
                            <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors">
                              <Heart className="h-3.5 w-3.5" /> Ver perfil
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Link to="/cadastro?tipo=acompanhante" className="block" onClick={() => setIsOpen(false)}>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 border-dashed border-muted-foreground/40 hover:border-primary/50 transition-all text-left">
                        <Heart className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="font-bold text-sm leading-tight text-muted-foreground">SOU ACOMPANHANTE</p>
                          <p className="text-xs text-muted-foreground">Criar perfil</p>
                        </div>
                      </button>
                    </Link>
                  )}

                  {/* Botão: Vendedora de Conteúdos — desativado temporariamente */}
                  {FEATURES.CRIADORA_CONTEUDO && (profileTypes.includes("conteudo") ? (
                    <div className="space-y-1">
                      <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 border-primary bg-primary/5 text-left">
                        <ShoppingBag className="h-4 w-4 shrink-0 text-primary" />
                        <div className="flex-1">
                          <p className="font-bold text-sm leading-tight text-primary">VENDEDORA DE CONTEÚDOS</p>
                          <p className="text-xs text-muted-foreground">Selecione uma ação</p>
                        </div>
                      </div>
                      <div className="flex gap-2 pl-2">
                        <Link to="/meu-perfil" onClick={() => setIsOpen(false)} className="flex-1">
                          <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors">
                            <User className="h-3.5 w-3.5" /> Editar perfil
                          </button>
                        </Link>
                        {planInfo?.profileId && (
                          <Link to={`/acompanhante/${toProfileSlug(planInfo.profileName ?? "", planInfo.profileId ?? "")}`} onClick={() => setIsOpen(false)} className="flex-1">
                            <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors">
                              <ShoppingBag className="h-3.5 w-3.5" /> Ver perfil
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Link to="/cadastro?tipo=conteudo" className="block" onClick={() => setIsOpen(false)}>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 border-dashed border-muted-foreground/40 hover:border-primary/50 transition-all text-left">
                        <ShoppingBag className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="font-bold text-sm leading-tight text-muted-foreground">VENDEDORA DE CONTEÚDOS</p>
                          <p className="text-xs text-muted-foreground">Criar perfil</p>
                        </div>
                      </button>
                    </Link>
                  ))}

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
              <Link to="/ranking" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 text-sm font-semibold">
                🏆 Ranking
              </Link>
              <Link to="/cadastro-usuario" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 text-sm font-semibold">
                👤 Sou cliente
              </Link>
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
                <p className="font-semibold text-foreground">Criar conta</p>
                <p className="text-sm text-muted-foreground">Cadastre-se como cliente ou acompanhante.</p>
              </div>
              <span className="text-muted-foreground group-hover:text-primary transition-colors text-xl">›</span>
            </Link>
            {FEATURES.CRIADORA_CONTEUDO && (
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
            )}
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
              {planSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Aguarde...</> : selectedNewPlan && selectedNewPlan !== "free" ? "Ir ao pagamento →" : "Confirmar plano"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navbar;
