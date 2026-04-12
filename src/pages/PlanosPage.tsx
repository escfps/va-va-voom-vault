import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      "Vídeo como foto de perfil e capa",
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

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerTaxId, setCustomerTaxId] = useState("");

  const profileId = (location.state as { profileId?: string } | null)?.profileId;

  const isPaidPlan = selectedPlan && selectedPlan !== "free";

  const handleConfirm = async () => {
    if (!selectedPlan || !user) return;

    if (isPaidPlan && (!customerName.trim() || !customerPhone.trim() || !customerTaxId.trim())) {
      toast.error("Preencha nome, telefone e CPF para continuar.");
      return;
    }

    setLoading(true);
    try {
      if (selectedPlan === "free") {
        if (profileId) {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token ?? supabaseKey;
          await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${profileId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "apikey": supabaseKey,
              "Authorization": `Bearer ${token}`,
              "Prefer": "return=minimal",
            },
            body: JSON.stringify({ plan: "free", plan_expires_at: null, verified: false }),
          });
        }
        toast.success("Perfil enviado para análise! Você será notificada quando for aprovado.");
        navigate("/meu-perfil");
        return;
      }

      // Plano pago → chama Edge Function para criar cobrança no AbacatePay
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-billing`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            planId: selectedPlan,
            profileId,
            customerName: customerName.trim(),
            customerPhone: customerPhone.replace(/\D/g, ""),
            customerTaxId: customerTaxId.replace(/\D/g, ""),
          }),
        }
      );

      const result = await res.json();

      if (!res.ok || result.error) {
        toast.error("Erro ao iniciar pagamento: " + (result.error ?? "Tente novamente."));
        setLoading(false);
        return;
      }

      // Redireciona para a página de pagamento do AbacatePay
      window.location.href = result.url;
    } catch (err: any) {
      console.error("Unexpected error:", err);
      toast.error(`Erro inesperado: ${err?.message ?? err}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-10">
        <div className="max-w-2xl mx-auto px-4">
          {/* Cabeçalho */}
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
                  {plan.features.map((f: string) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-3.5 w-3.5 text-green-500 shrink-0" /> {f}
                    </li>
                  ))}
                  {plan.missing.map((f: string) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground/60 line-through">
                      <X className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {/* Dados para pagamento (só planos pagos) */}
          {isPaidPlan && (
            <div className="mt-6 space-y-3 p-4 rounded-xl border border-border bg-muted/30">
              <p className="text-sm font-medium text-foreground">Dados para pagamento</p>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="customerName" className="text-xs">Nome completo</Label>
                  <Input
                    id="customerName"
                    placeholder="Seu nome completo"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone" className="text-xs">Telefone (WhatsApp)</Label>
                  <Input
                    id="customerPhone"
                    placeholder="(11) 99999-9999"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="customerTaxId" className="text-xs">CPF</Label>
                  <Input
                    id="customerTaxId"
                    placeholder="000.000.000-00"
                    value={customerTaxId}
                    onChange={(e) => setCustomerTaxId(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Você será redirecionado para a página de pagamento segura (PIX ou cartão).
              </p>
            </div>
          )}

          <Button
            onClick={handleConfirm}
            className="w-full mt-6 gap-2"
            disabled={!selectedPlan || loading}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Aguarde...</>
            ) : isPaidPlan ? (
              "Ir para pagamento"
            ) : (
              "Confirmar plano gratuito"
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
