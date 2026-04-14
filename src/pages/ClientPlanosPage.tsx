import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { notifyAdmin } from "@/lib/whatsapp";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, Star, Zap, Copy, Crown } from "lucide-react";

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
  const merchantAccount = pixField("26", pixField("00", "BR.GOV.BCB.PIX") + pixField("01", key));
  const additionalData = pixField("62", pixField("05", "***"));
  const base = [
    pixField("00", "01"), pixField("01", "11"), merchantAccount,
    pixField("52", "0000"), pixField("53", "986"), pixField("54", amount),
    pixField("58", "BR"), pixField("59", name.slice(0, 25)), pixField("60", city.slice(0, 15)),
    additionalData, "6304",
  ].join("");
  return base + crc16(base);
}

const PIX_KEY = "contato@xmodelprive.com";
const PIX_PAYLOADS: Record<string, string> = {
  monthly: buildPixPayload(PIX_KEY, "5.00", "X MODEL PRIVE", "GRAMADO"),
  yearly:  buildPixPayload(PIX_KEY, "50.00", "X MODEL PRIVE", "GRAMADO"),
};

const PLANS = [
  {
    id: "free",
    name: "Grátis",
    label: "R$ 0",
    sublabel: "para sempre",
    icon: <Zap className="h-5 w-5" />,
    color: "border-border",
    features: ["Explorar perfis", "Salvar favoritos"],
    missing: ["Ver WhatsApp das acompanhantes", "Acesso prioritário a novos perfis"],
  },
  {
    id: "monthly",
    name: "Premium Mensal",
    label: "R$ 5",
    sublabel: "por mês",
    icon: <Star className="h-5 w-5" />,
    color: "border-primary",
    badge: "Mais popular",
    badgeColor: "bg-primary text-primary-foreground",
    features: ["Ver WhatsApp das acompanhantes", "Explorar perfis", "Salvar favoritos", "Acesso prioritário a novos perfis"],
    missing: [],
  },
  {
    id: "yearly",
    name: "Premium Anual",
    label: "R$ 50",
    sublabel: "por ano • economize 17%",
    icon: <Crown className="h-5 w-5" />,
    color: "border-yellow-500",
    badge: "Melhor valor",
    badgeColor: "bg-yellow-500 text-white",
    features: ["Ver WhatsApp das acompanhantes", "Explorar perfis", "Salvar favoritos", "Acesso prioritário a novos perfis"],
    missing: [],
  },
];

const ClientPlanosPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pixStep, setPixStep] = useState(false);

  useEffect(() => {
    if (!user) navigate("/cadastro-usuario");
  }, [user]);

  const isPaidPlan = selectedPlan && selectedPlan !== "free";
  const plan = PLANS.find((p) => p.id === selectedPlan);
  const pixPayload = selectedPlan && PIX_PAYLOADS[selectedPlan] ? PIX_PAYLOADS[selectedPlan] : "";
  const qrUrl = pixPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixPayload)}`
    : "";

  const handleConfirm = async () => {
    if (!selectedPlan || !user) return;

    if (isPaidPlan) {
      setPixStep(true);
      const planLabel = selectedPlan === "yearly" ? "Premium Anual (R$ 50)" : "Premium Mensal (R$ 5)";
      notifyAdmin(
        `💰 *Nova assinatura de cliente!*\n\nPlano: ${planLabel}\nE-mail: ${user.email}\nID: ${user.id}\n\nAcesse o painel admin → Clientes para ativar.`
      );
      return;
    }

    // Plano gratuito → salvar e ir pra home
    setLoading(true);
    try {
      await (supabase.from("user_profiles" as any)
        .upsert({ user_id: user.id, visitor_plan: "free", visitor_plan_expires_at: null }, { onConflict: "user_id" }));
      toast.success("Conta criada! Bem-vindo(a)!");
      navigate("/");
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

  if (pixStep && isPaidPlan && plan) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-10">
          <div className="max-w-sm mx-auto px-4 space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Pagar via PIX</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {plan.name} · <strong>{plan.label}</strong>
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border bg-white">
              {qrUrl && <img src={qrUrl} alt="QR Code PIX" className="w-52 h-52 rounded-lg" />}
              <p className="text-xs text-gray-500 text-center">Escaneie o QR code no seu app do banco</p>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Chave PIX</p>
              <div className="flex items-center gap-2">
                <p className="flex-1 text-sm font-medium text-foreground break-all">{PIX_KEY}</p>
                <button onClick={copyPixKey} className="shrink-0 p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Valor: <strong className="text-foreground">{plan.label}</strong></p>
            </div>

            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">Após realizar o pagamento:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Tire um print do comprovante</li>
                <li>Envie pelo WhatsApp abaixo</li>
                <li>Seu plano será ativado em até 24h</li>
              </ol>
            </div>

            <a
              href={`https://wa.me/5554974005942?text=${encodeURIComponent(`Olá! Realizei o pagamento do ${plan.name} (${plan.label}). Segue o comprovante. 📎\nE-mail: ${user?.email}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-colors"
              style={{ background: "#25D366", color: "#fff" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar comprovante pelo WhatsApp
            </a>

            <button onClick={() => setPixStep(false)} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
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
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Escolha seu plano</h1>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              Assinantes premium têm acesso ao WhatsApp das acompanhantes.
            </p>
          </div>

          <div className="space-y-3">
            {PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlan(p.id)}
                className={`w-full text-left rounded-xl border-2 p-4 transition-all relative ${
                  selectedPlan === p.id
                    ? p.color + " ring-2 ring-offset-1 ring-primary/40 bg-primary/5"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                {"badge" in p && p.badge && (
                  <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${"badgeColor" in p ? p.badgeColor : ""}`}>
                    {p.badge}
                  </span>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${selectedPlan === p.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {p.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{p.name}</div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-bold text-foreground text-base">{p.label}</span>{" "}
                      <span className="text-xs">{p.sublabel}</span>
                    </div>
                  </div>
                  {selectedPlan === p.id && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-3.5 w-3.5 text-green-500 shrink-0" /> {f}
                    </li>
                  ))}
                  {p.missing.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground/60 line-through">
                      <X className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          <Button onClick={handleConfirm} className="w-full mt-6 gap-2" disabled={!selectedPlan || loading}>
            {isPaidPlan ? "Ver instruções de pagamento →" : "Continuar grátis"}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-3">
            Você pode atualizar seu plano a qualquer momento.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ClientPlanosPage;
