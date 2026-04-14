import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Crown, Star, Zap, LogOut, Pencil } from "lucide-react";

const ContaClientePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/cadastro-usuario"); return; }
    (supabase.from("user_profiles" as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
    ).then(({ data }: any) => {
      setProfile(data);
      setLoading(false);
    });
  }, [user]);

  const isPremium = profile &&
    profile.visitor_plan && profile.visitor_plan !== "free" &&
    (!profile.visitor_plan_expires_at || new Date(profile.visitor_plan_expires_at) > new Date());

  const planLabel = isPremium
    ? profile.visitor_plan === "yearly" ? "Premium Anual" : "Premium Mensal"
    : "Grátis";

  const planIcon = isPremium
    ? profile.visitor_plan === "yearly"
      ? <Crown className="h-6 w-6 text-yellow-500" />
      : <Star className="h-6 w-6 text-primary" />
    : <Zap className="h-6 w-6 text-muted-foreground" />;

  const planColor = isPremium
    ? profile.visitor_plan === "yearly"
      ? "border-yellow-500 bg-yellow-500/5"
      : "border-primary bg-primary/5"
    : "border-border bg-muted/20";

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-10">
        <div className="max-w-md mx-auto px-4 space-y-6">

          {/* Cabeçalho */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Minha conta</h1>
            <p className="text-sm text-muted-foreground mt-1">{profile?.display_name || user?.email}</p>
          </div>

          {/* Card do plano atual */}
          <div className={`rounded-xl border-2 p-5 ${planColor}`}>
            <div className="flex items-center gap-3 mb-2">
              {planIcon}
              <div>
                <p className="font-semibold text-foreground">Plano atual: {planLabel}</p>
                {isPremium && profile.visitor_plan_expires_at && (
                  <p className="text-xs text-muted-foreground">
                    Válido até {new Date(profile.visitor_plan_expires_at).toLocaleDateString("pt-BR")}
                  </p>
                )}
                {!isPremium && (
                  <p className="text-xs text-muted-foreground">Acesso limitado · sem ver WhatsApp</p>
                )}
              </div>
            </div>
            {!isPremium && (
              <Button className="w-full mt-3 gap-2" onClick={() => navigate("/planos-cliente")}>
                <Crown className="h-4 w-4" /> Assinar Premium a partir de R$5/mês
              </Button>
            )}
            {isPremium && (
              <p className="text-sm text-green-500 font-medium mt-2">
                ✓ Você tem acesso ao WhatsApp das acompanhantes
              </p>
            )}
          </div>

          {/* Informações */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Nome</p>
              <p className="text-sm text-muted-foreground">{profile?.display_name || "—"}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">WhatsApp</p>
              <p className="text-sm text-muted-foreground">{profile?.bio || "—"}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Email</p>
              <p className="text-sm text-muted-foreground truncate max-w-[200px]">{user?.email}</p>
            </div>
          </div>

          {/* Ações */}
          <div className="space-y-2">
            <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/planos-cliente")}>
              <Star className="h-4 w-4" /> Ver planos
            </Button>
            <Button
              variant="ghost"
              className="w-full gap-2 text-muted-foreground"
              onClick={async () => { await signOut(); navigate("/"); }}
            >
              <LogOut className="h-4 w-4" /> Sair da conta
            </Button>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContaClientePage;
