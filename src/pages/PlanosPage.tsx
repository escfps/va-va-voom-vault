import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, Star, Zap, Copy, Mail, PartyPopper } from "lucide-react";

// ── PIX QR Code helpers ────────────────────────────────────────────────────
function pixField(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

function buildPixPayload(key: string, amount: string, name: string, city: string): string {
  const merchantAccount = pixField(
    "26",
    pixField("00", "BR.GOV.BCB.PIX") + pixField("01", key),
  );
  const additionalData = pixField("62", pixField("05", "***"));
  const base = [
    pixField("00", "01"),
    pixField("01", "11"),
    merchantAccount,
    pixField("52", "0000"),
    pixField("53", "986"),
    pixField("54", amount),
    pixField("58", "BR"),
    pixField("59", name.slice(0, 25)),
    pixField("60", city.slice(0, 15)),
    additionalData,
    "6304",
  ].join("");
  return base + crc16(base);
}

const PIX_KEY = "contato@xmodelprive.com";
const CONTACT_EMAIL = "contato@xmodelprive.com";

const PIX_PAYLOADS: Record<string, string> = {
  monthly: buildPixPayload(PIX_KEY, "9.90", "X MODEL PRIVE", "GRAMADO"),
  yearly:  buildPixPayload(PIX_KEY, "99.90", "X MODEL PRIVE", "GRAMADO"),
};

// ── Plans ──────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "free",
    name: "Gratuito",
    label: "R$ 0",
    sublabel: "para sempre",
    icon: <Zap className="h-5 w-5" />,
    color: "border-border",
    features: ["Até 3 fotos", "Perfil básico na plataforma"],
    missing: ["Verificação", "Destaque", "Fotos ilimitadas", "Upload de vídeos", "Selo verificada", "Vídeo como foto de perfil"],
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
    features: ["Fotos ilimitadas", "Verificação", "Destaque", "Upload de vídeos", "Selo verificada"],
    missing: ["Vídeo como foto de perfil"],
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
      "Verificação",
      "Destaque",
      "Upload de vídeos",
      "Selo verificada",
      "Prioridade no ranking",
      "Vídeo como foto de perfil",
    ],
    missing: [],
  },
];

// ── Component ──────────────────────────────────────────────────────────────
const PlanosPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pixStep, setPixStep] = useState(false);

  const locationState = location.state as { profileId?: string; preselectedPlan?: string } | null;
  const profileId = locationState?.profileId;
  const preselectedPlan = locationState?.preselectedPlan;

  useEffect(() => { if (preselectedPlan) setSelectedPlan(preselectedPlan); }, [preselectedPlan]);

  const isPaidPlan = selectedPlan && selectedPlan !== "free";

  const handleConfirm = async () => {
    if (!selectedPlan || !user) return;

    if (isPaidPlan) {
      setPixStep(true);
      return;
    }

    // Plano gratuito
    setLoading(true);
    try {
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
    } catch (err: any) {
      toast.error(`Erro: ${err?.message ?? err}`);
    } finally {
      setLoading(false);
    }
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(PIX_KEY);
    toast.success("Chave PIX copiada!");
  };

  const plan = PLANS.find((p) => p.id === selectedPlan);
  const pixPayload = selectedPlan && PIX_PAYLOADS[selectedPlan] ? PIX_PAYLOADS[selectedPlan] : "";
  const qrUrl = pixPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixPayload)}`
    : "";

  if (pixStep && isPaidPlan && plan) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-10">
          <div className="max-w-sm mx-auto px-4 space-y-6">
            {/* Cabeçalho */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Pagar via PIX</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Plano <strong>{plan.name}</strong> · <strong>{plan.label}</strong>
              </p>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border bg-white">
              {qrUrl && (
                <img
                  src={qrUrl}
                  alt="QR Code PIX"
                  className="w-52 h-52 rounded-lg"
                />
              )}
              <p className="text-xs text-gray-500 text-center">
                Escaneie o QR code no seu app do banco
              </p>
            </div>

            {/* Chave PIX para copiar */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Chave PIX</p>
              <div className="flex items-center gap-2">
                <p className="flex-1 text-sm font-medium text-foreground break-all">{PIX_KEY}</p>
                <button
                  onClick={copyPixKey}
                  className="shrink-0 p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Valor: <strong className="text-foreground">{plan.label}</strong>
              </p>
            </div>

            {/* Instruções */}
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">Após realizar o pagamento:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Tire um print do comprovante</li>
                <li>Envie para o e-mail abaixo com seu nome</li>
                <li>Seu plano será ativado em até 24h</li>
              </ol>
            </div>

            {/* Botão e-mail */}
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Comprovante PIX - Plano ${plan.name}&body=Olá! Segue o comprovante do pagamento do Plano ${plan.name} (${plan.label}).`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Enviar comprovante por e-mail
            </a>

            <button
              onClick={() => setPixStep(false)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Voltar aos planos
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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

          <Button
            onClick={handleConfirm}
            className="w-full mt-6 gap-2"
            disabled={!selectedPlan || loading}
          >
            {isPaidPlan ? "Ver instruções de pagamento →" : "Confirmar plano gratuito"}
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
