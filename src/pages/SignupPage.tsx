import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Heart, User } from "lucide-react";
import logoImg from "@/assets/logo.png";

// step: "register" | "choose" | "client-profile"
// Se já logado → pula direto pra "choose" (ou conta-cliente se já completou)

const SignupPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState<"register" | "choose" | "client-profile">("register");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);

  const [nome, setNome]         = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving]     = useState(false);

  // Se já logado, vai direto para a escolha (ou conta-cliente se já completou)
  // Só roda uma vez — não sobrescreve se usuário já avançou no fluxo
  useEffect(() => {
    if (authLoading || !user) return;
    // Se já passou do register, não interfere
    if (step !== "register") return;
    (async () => {
      const { data } = await (supabase
        .from("user_profiles" as any)
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle()) as any;
      const hasName = data?.display_name && !data.display_name.includes("@");
      if (hasName) {
        navigate("/conta-cliente");
      } else {
        // Garante registro no admin mesmo sem nome
        await (supabase.from("user_profiles" as any).upsert(
          { user_id: user.id, visitor_plan: "free", ...({ email: user.email } as any) },
          { onConflict: "user_id" }
        ));
        setStep("choose");
      }
    })();
  }, [user, authLoading]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAuth(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      toast.error(error.message);
      setLoadingAuth(false);
      return;
    }
    // Cria registro no admin imediatamente (mesmo sem nome/whatsapp ainda)
    if (data.user) {
      await (supabase.from("user_profiles" as any).upsert(
        { user_id: data.user.id, visitor_plan: "free", ...({ email } as any) },
        { onConflict: "user_id" }
      ));
    }
    setLoadingAuth(false);
    setStep("choose");
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: `${window.location.origin}/cadastro-usuario`,
    });
    if (result.error) toast.error("Erro ao fazer login com " + provider);
  };

  const handleChoose = (type: "acompanhante" | "cliente") => {
    if (type === "acompanhante") {
      navigate("/cadastro?tipo=acompanhante");
    } else {
      setStep("client-profile");
    }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim())    { toast.error("Informe seu nome.");     return; }
    if (!whatsapp.trim()) { toast.error("Informe seu WhatsApp."); return; }
    setSaving(true);
    try {
      await (supabase.from("user_profiles" as any).upsert(
        { user_id: user!.id, display_name: nome.trim(), bio: whatsapp.trim(), visitor_plan: "free", ...({ email: user?.email } as any) },
        { onConflict: "user_id" }
      ));
      navigate("/planos-cliente");
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">

        {/* Logo */}
        <div className="text-center">
          <Link to="/"><img src={logoImg} alt="X Model Privé" className="h-12 mx-auto mb-4" /></Link>
          <h1 className="text-2xl font-bold text-foreground">
            {step === "register"       ? "Criar conta"
            : step === "choose"        ? "Como você quer usar a plataforma?"
            : "Complete seu cadastro"}
          </h1>
          {step === "choose" && (
            <p className="text-sm text-muted-foreground mt-1">Escolha uma opção para continuar</p>
          )}
        </div>

        {/* ── STEP: register ── */}
        {step === "register" && (
          <>
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={loadingAuth}>
                {loadingAuth ? "Criando conta..." : "Criar conta"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">ou continue com</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => handleOAuth("google")} className="gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </Button>
              <Button variant="outline" onClick={() => handleOAuth("apple")} className="gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                Apple
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">Entrar</Link>
            </p>
          </>
        )}

        {/* ── STEP: choose ── */}
        {step === "choose" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleChoose("cliente")}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all group text-left"
            >
              <div className="p-3 rounded-full bg-muted group-hover:bg-primary/10 transition-colors shrink-0">
                <User className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Sou cliente</p>
                <p className="text-sm text-muted-foreground mt-0.5">Explore perfis e encontre acompanhantes.</p>
              </div>
              <span className="text-muted-foreground group-hover:text-primary text-xl">›</span>
            </button>

            <button
              type="button"
              onClick={() => handleChoose("acompanhante")}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all group text-left"
            >
              <div className="p-3 rounded-full bg-primary/10 shrink-0">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-primary">Sou acompanhante</p>
                <p className="text-sm text-muted-foreground mt-0.5">Crie seu perfil e divulgue seus serviços.</p>
              </div>
              <span className="text-muted-foreground group-hover:text-primary text-xl">›</span>
            </button>
          </div>
        )}

        {/* ── STEP: client-profile ── */}
        {step === "client-profile" && (
          <form onSubmit={handleSaveClient} className="space-y-4">
            <div>
              <Label htmlFor="nome">Seu nome</Label>
              <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} required placeholder="Como quer ser chamado(a)" autoFocus />
            </div>
            <div>
              <Label htmlFor="whatsapp">Seu WhatsApp</Label>
              <Input id="whatsapp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required placeholder="(54) 99999-0000" />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Salvando..." : "Continuar para planos →"}
            </Button>
            <button type="button" onClick={() => setStep("choose")} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Voltar
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default SignupPage;
