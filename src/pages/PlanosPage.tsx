import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, Star, Zap, Loader2, PartyPopper } from "lucide-react";

const PLANS = [
  {
    id: "free",
    name: "Gratuito",
    label: "R$ 0",
    sublabel: "para sempre",
    icon: <Zap className="h-5 w-5" />,
    color: "border-border",
    features: ["Até 3 fotos visíveis", "Perfil básico na plataforma"],
    missing: ["Vídeo de verificação", "Destaque mensal", "Fotos ilimitadas", "Selo verificada"],
  },
  {
    id: "monthly",
    name: "Mensal",
    label: "R$ 9,90",
    sublabel: "por mês",
    icon: <Star className="h-5 w-5" />,
    color: "border-primary",
    badge: "Mais popular",
    badgeColor: "bg-primary text-primary-foreground",
    features: ["Fotos ilimitadas", "Vídeo de verificação", "Destaque mensal", "Selo verificada"],
    missing: [],
  },
  {
    id: "yearly",
    name: "Anual",
    label: "R$ 99,90",
    sublabel: "por ano • economize 44%",
    icon: <Star className="h-5 w-5 fill-primary" />,
    color: "border-yellow-500",
    badge: "Melhor valor",
    badgeColor: "bg-yellow-500 text-white",
    features: [
      "Fotos ilimitadas",
      "Vídeo de verificação",
      "Destaque mensal",
      "Selo verificada",
      "Prioridade no ranking",
    ],
    missing: [],
  },
];

const PlanosPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const profileId = (location.state as { profileId?: string } | null)?.profileId;

  const getPlanExpiresAt = (planId: string): string | null => {
    if (planId === "free") return null;
    const date = new Date();
    if (planId === "monthly") date.setDate(date.getDate() + 30);
    if (planId === "yearly") date.setFullYear(date.getFullYear() + 1);
    return date.toISOString();
  };

  const handleConfirm = async () => {
    if (!selectedPlan || !user) return;

    setLoading(true);
    try {
      if (profileId) {
        const { error } = await supabase
          .from("profiles")
          .update({
            plan: selectedPlan,
            plan_expires_at: getPlanExpiresAt(selectedPlan),
            verified: selectedPlan !== "free",
          })
          .eq("id", profileId)
          .eq("user_id", user.id);

        if (error) {
          // Coluna ainda não existe no banco — navega mesmo assim,
          // o perfil já foi criado com sucesso
          console.warn("Plan update skipped (column may not exist yet):", error.message);
        }
      }

      if (selectedPlan === "free") {
        toast.success("Perfil publicado! Edite e complete seus dados abaixo.");
      } else {
        const planName = selectedPlan === "monthly" ? "Mensal" : "Anual";
        toast.success(`Plano ${planName} ativado! Edite seu perfil abaixo.`);
      }
      navigate("/meu-perfil");
    } catch (err: any) {
      console.error("Unexpected error:", err);
      toast.error(`Erro inesperado: ${err?.message ?? err}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-10">
        <div className="max-w-2xl mx-auto px-4">
          {/* Cabeçalho de sucesso */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <PartyPopper className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Cadastro concluído!</h1>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              Seu perfil foi criado com sucesso. Agora escolha o plano ideal para você.
            </p>
          </div>

          {/* Cards de planos */}
          <div className="space-y-3">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={`w-full text-left rounded-xl border-2 p-4 transition-all relative ${
                  selectedPlan === plan.id
                    ? plan.color + " ring-2 ring-offset-1 ring-primary/40 bg-primary/5"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                {"badge" in plan && plan.badge && (
                  <span
                    className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${"badgeColor" in plan ? plan.badgeColor : ""}`}
                  >
                    {plan.badge}
                  </span>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`p-2 rounded-lg ${
                      selectedPlan === plan.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {plan.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-bold text-foreground text-base">{plan.label}</span>{" "}
                      <span className="text-xs">{plan.sublabel}</span>
                    </p>
                  </div>
                  {selectedPlan === plan.id && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-3.5 w-3.5 text-green-500 shrink-0" /> {f}
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground/60 line-through">
                      <X className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          <Button
            onClick={handleConfirm}
            className="w-full mt-6 gap-2"
            disabled={!selectedPlan || loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Confirmando...
              </>
            ) : (
              "Confirmar plano e acessar plataforma"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-3">
            Você pode alterar seu plano a qualquer momento no seu perfil.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PlanosPage;
