import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";

const PagamentoConfirmadoPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("plan");
  const profileId = searchParams.get("profileId");

  const [checking, setChecking] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!profileId) { setChecking(false); return; }

    // Aguarda até 10s pelo webhook ativar o plano
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const { data } = await (supabase
        .from("profiles")
        .select("plan") as any)
        .eq("id", profileId)
        .maybeSingle();

      if (data?.plan === planId) {
        setConfirmed(true);
        setChecking(false);
        clearInterval(interval);
        return;
      }

      if (attempts >= 10) {
        setChecking(false);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [profileId, planId]);

  const planLabel = planId === "yearly" ? "Anual" : planId === "monthly" ? "Mensal" : planId;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-16">
        <div className="max-w-sm mx-auto px-4 text-center space-y-4">
          {checking ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <h1 className="text-xl font-bold text-foreground">Confirmando pagamento...</h1>
              <p className="text-sm text-muted-foreground">Aguarde enquanto verificamos sua assinatura.</p>
            </>
          ) : confirmed ? (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Pagamento confirmado!</h1>
              <p className="text-muted-foreground">
                Seu <strong>Plano {planLabel}</strong> foi ativado com sucesso.
              </p>
              <Button className="w-full" onClick={() => navigate("/meu-perfil")}>
                Ir para meu perfil
              </Button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto">
                <Loader2 className="h-8 w-8 text-yellow-600" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Processando pagamento</h1>
              <p className="text-sm text-muted-foreground">
                Seu pagamento está sendo processado. O plano será ativado em instantes.
                Você receberá uma confirmação em breve.
              </p>
              <Button className="w-full" onClick={() => navigate("/meu-perfil")}>
                Ir para meu perfil
              </Button>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PagamentoConfirmadoPage;
