import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Camera, X, Upload, Loader2, Video, Check, Star, Zap } from "lucide-react";
import ScheduleSection, { defaultSchedule, scheduleToDb } from "@/components/register/ScheduleSection";
import ServicesSection, { defaultServices, servicesToDb } from "@/components/register/ServicesSection";
import PaymentSection from "@/components/register/PaymentSection";

const PLANS = [
  {
    id: "free",
    name: "Gratuito",
    price: null,
    label: "R$ 0",
    sublabel: "para sempre",
    icon: <Zap className="h-5 w-5" />,
    color: "border-border",
    badgeColor: "bg-muted text-muted-foreground",
    features: ["Até 3 fotos", "Sem vídeo de verificação", "Perfil básico visível"],
    missing: ["Vídeo de verificação", "Destaque mensal", "Fotos ilimitadas"],
  },
  {
    id: "monthly",
    name: "Mensal",
    price: 29.9,
    label: "R$ 29,90",
    sublabel: "por mês",
    icon: <Star className="h-5 w-5" />,
    color: "border-primary",
    badgeColor: "bg-primary text-primary-foreground",
    badge: "Mais popular",
    features: ["Fotos ilimitadas", "Vídeo de verificação", "Destaque mensal", "Selo verificada"],
    missing: [],
  },
  {
    id: "yearly",
    name: "Anual",
    price: 199.9,
    label: "R$ 199,90",
    sublabel: "por ano • economize 44%",
    icon: <Star className="h-5 w-5 fill-primary" />,
    color: "border-yellow-500",
    badgeColor: "bg-yellow-500 text-white",
    badge: "Melhor valor",
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

const RegisterPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [verificationVideo, setVerificationVideo] = useState<File | null>(null);
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const totalSteps = 5;

  const [schedule, setSchedule] = useState(defaultSchedule);
  const [services, setServices] = useState(defaultServices);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(["Dinheiro", "PIX"]);
  const [pricing, setPricing] = useState([{ duration: "1 hora", price: "" }]);

  const [form, setForm] = useState({
    name: "",
    age: "",
    city: "",
    state: "",
    phone: "",
    description: "",
    tagline: "",
    price: "",
    height: "",
    weight: "",
    ethnicity: "",
    eyeColor: "",
    hairColor: "",
    hairLength: "",
    gender: "Mulher",
    attendsTo: "Homens",
    hasOwnPlace: false,
    tattoos: false,
    piercings: false,
    silicone: false,
    smoker: false,
  });

  const update = (field: string, value: string | boolean) => setForm((prev) => ({ ...prev, [field]: value }));

  const maxPhotos = selectedPlan === "free" ? 3 : 10;

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > maxPhotos) {
      toast.error(`Máximo de ${maxPhotos} fotos no plano ${selectedPlan === "free" ? "gratuito" : "selecionado"}`);
      return;
    }
    setPhotos((prev) => [...prev, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (!user) return [];
    const urls: string[] = [];
    for (const photo of photos) {
      const ext = photo.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("model-photos")
        .upload(path, photo, { cacheControl: "3600", upsert: false });
      if (error) {
        console.error("Upload error:", error);
        continue;
      }
      const { data: urlData } = supabase.storage.from("model-photos").getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Você precisa estar logado");
      navigate("/login");
      return;
    }
    if (photos.length === 0) {
      toast.error("Adicione pelo menos 1 foto");
      return;
    }
    if (selectedPlan !== "free" && !verificationVideo) {
      toast.error("O vídeo de verificação é obrigatório neste plano");
      return;
    }

    setLoading(true);
    try {
      const imageUrls = await uploadPhotos();
      if (imageUrls.length === 0) {
        toast.error("Erro ao fazer upload das fotos");
        setLoading(false);
        return;
      }

      const mainPrice = pricing.find((p) => p.duration === "1 hora")?.price || form.price;
      const pricingDb = pricing.filter((p) => p.price).map((p) => ({ duration: p.duration, price: parseInt(p.price) }));
      if (pricingDb.length === 0 && form.price) pricingDb.push({ duration: "1 hora", price: parseInt(form.price) });

      const { error } = await supabase.from("profiles").insert({
        user_id: user.id,
        name: form.name,
        age: parseInt(form.age),
        city: form.city,
        state: form.state,
        phone: form.phone,
        description: form.description,
        tagline: form.tagline,
        price: parseInt(mainPrice || form.price),
        price_duration: "1 hora",
        image: imageUrls[0],
        images: imageUrls,
        cover_image: imageUrls[0],
        height: form.height,
        weight: form.weight,
        ethnicity: form.ethnicity,
        eye_color: form.eyeColor,
        hair_color: form.hairColor,
        hair_length: form.hairLength,
        gender: form.gender,
        gender_description: form.gender === "Mulher" ? "Mulher Cisgênero." : form.gender,
        genitalia: form.gender === "Mulher" ? "Possui vagina" : "",
        sexual_preference: "Ativo - Passivo",
        sexual_preference_description: "Faz e recebe penetração",
        attends_to: form.attendsTo,
        has_own_place: form.hasOwnPlace,
        tattoos: form.tattoos,
        piercings: form.piercings,
        silicone: form.silicone,
        smoker: form.smoker,
        languages: ["Português"],
        location: `${form.city} - ${form.state}`,
        location_zone: "",
        location_distance: "",
        places_served: form.hasOwnPlace ? "Local próprio" : "Hotéis e motéis",
        amenities: "",
        neighborhoods: [],
        max_clients: "apenas 1 cliente",
        verified: selectedPlan !== "free",
        rating: 0,
        review_count: 0,
        tags: [],
        pricing: pricingDb,
        payment_methods: paymentMethods,
        schedule: scheduleToDb(schedule),
        profile_created_at: new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
        detailed_services: servicesToDb(services),
        services: services.filter((s) => s.does).map((s) => s.name),
        reviews: [],
      });

      if (error) {
        toast.error("Erro ao criar perfil: " + error.message);
      } else {
        toast.success("Perfil criado com sucesso! 🎉");
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro inesperado ao criar perfil");
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardContent className="pt-6 text-center space-y-4">
              <h2 className="text-xl font-bold">Faça login para continuar</h2>
              <p className="text-muted-foreground">Você precisa estar logado para cadastrar seu perfil.</p>
              <Button onClick={() => navigate("/login")} className="w-full">
                Fazer login
              </Button>
              <Button variant="outline" onClick={() => navigate("/cadastro-usuario")} className="w-full">
                Criar conta
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Cadastro de Modelo</CardTitle>
              <CardDescription>Preencha seus dados e adicione suas melhores fotos</CardDescription>
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                  <div
                    key={s}
                    className={`h-2 w-10 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Etapa {step} de {totalSteps}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                {/* ── Step 1: Dados pessoais ── */}
                {step === 1 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Dados pessoais</h3>
                    <div>
                      <Label htmlFor="name">Nome artístico *</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        required
                        placeholder="Como você quer ser chamada"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="age">Idade *</Label>
                        <Input
                          id="age"
                          type="number"
                          min="18"
                          max="60"
                          value={form.age}
                          onChange={(e) => update("age", e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">WhatsApp *</Label>
                        <Input
                          id="phone"
                          value={form.phone}
                          onChange={(e) => update("phone", e.target.value)}
                          required
                          placeholder="(11) 99999-0000"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">Cidade *</Label>
                        <Input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} required />
                      </div>
                      <div>
                        <Label htmlFor="state">Estado *</Label>
                        <Select value={form.state} onValueChange={(v) => update("state", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="UF" />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              "AC",
                              "AL",
                              "AP",
                              "AM",
                              "BA",
                              "CE",
                              "DF",
                              "ES",
                              "GO",
                              "MA",
                              "MT",
                              "MS",
                              "MG",
                              "PA",
                              "PB",
                              "PR",
                              "PE",
                              "PI",
                              "RJ",
                              "RN",
                              "RS",
                              "RO",
                              "RR",
                              "SC",
                              "SP",
                              "SE",
                              "TO",
                            ].map((uf) => (
                              <SelectItem key={uf} value={uf}>
                                {uf}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="tagline">Frase de destaque</Label>
                      <Input
                        id="tagline"
                        value={form.tagline}
                        onChange={(e) => update("tagline", e.target.value)}
                        placeholder="Ex: Loira fitness com atendimento premium"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Sobre você *</Label>
                      <Textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => update("description", e.target.value)}
                        rows={4}
                        required
                        placeholder="Descreva você, seu atendimento e o que oferece..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Valor por hora (R$) *</Label>
                      <Input
                        id="price"
                        type="number"
                        min="50"
                        value={form.price}
                        onChange={(e) => update("price", e.target.value)}
                        required
                        placeholder="300"
                      />
                    </div>
                    <Button type="button" className="w-full" onClick={() => setStep(2)}>
                      Próximo: Aparência
                    </Button>
                  </div>
                )}

                {/* ── Step 2: Aparência ── */}
                {step === 2 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Aparência</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Altura</Label>
                        <Input
                          value={form.height}
                          onChange={(e) => update("height", e.target.value)}
                          placeholder="1,70 m"
                        />
                      </div>
                      <div>
                        <Label>Peso</Label>
                        <Input
                          value={form.weight}
                          onChange={(e) => update("weight", e.target.value)}
                          placeholder="55 kg"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Etnia</Label>
                        <Select value={form.ethnicity} onValueChange={(v) => update("ethnicity", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {["Branca", "Morena", "Negra", "Asiática", "Indígena", "Outra"].map((e) => (
                              <SelectItem key={e} value={e}>
                                {e}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Cor dos olhos</Label>
                        <Select value={form.eyeColor} onValueChange={(v) => update("eyeColor", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {["Castanho", "Verde", "Azul", "Mel", "Preto"].map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Cor do cabelo</Label>
                        <Select value={form.hairColor} onValueChange={(v) => update("hairColor", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {["Loira", "Castanha", "Ruiva", "Preta", "Colorido"].map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Comprimento</Label>
                        <Select value={form.hairLength} onValueChange={(v) => update("hairLength", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {["Curto", "Médio", "Longo"].map((l) => (
                              <SelectItem key={l} value={l}>
                                {l}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Gênero</Label>
                        <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["Mulher", "Homem", "Trans", "Outro"].map((g) => (
                              <SelectItem key={g} value={g}>
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Atende</Label>
                        <Select value={form.attendsTo} onValueChange={(v) => update("attendsTo", v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["Homens", "Mulheres", "Homens e mulheres", "Homens e casais", "Todos"].map((a) => (
                              <SelectItem key={a} value={a}>
                                {a}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-3 pt-2">
                      {[
                        { key: "hasOwnPlace", label: "Tenho local próprio" },
                        { key: "tattoos", label: "Tenho tatuagens" },
                        { key: "piercings", label: "Tenho piercings" },
                        { key: "silicone", label: "Tenho silicone" },
                        { key: "smoker", label: "Sou fumante" },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between">
                          <Label>{label}</Label>
                          <Switch
                            checked={form[key as keyof typeof form] as boolean}
                            onCheckedChange={(v) => update(key, v)}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                        Voltar
                      </Button>
                      <Button type="button" className="flex-1" onClick={() => setStep(3)}>
                        Próximo: Serviços
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── Step 3: Serviços, Horários, Pagamento ── */}
                {step === 3 && (
                  <div className="space-y-6">
                    <h3 className="font-semibold text-foreground">Serviços, Horários e Valores</h3>
                    <ServicesSection services={services} onChange={setServices} />
                    <div className="border-t border-border pt-4">
                      <ScheduleSection schedule={schedule} onChange={setSchedule} />
                    </div>
                    <div className="border-t border-border pt-4">
                      <PaymentSection
                        paymentMethods={paymentMethods}
                        onPaymentMethodsChange={setPaymentMethods}
                        pricing={pricing}
                        onPricingChange={setPricing}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>
                        Voltar
                      </Button>
                      <Button type="button" className="flex-1" onClick={() => setStep(4)}>
                        Próximo: Fotos
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── Step 4: Fotos & Vídeo ── */}
                {step === 4 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Suas fotos</h3>
                    <p className="text-sm text-muted-foreground">
                      Adicione até {maxPhotos} fotos. A primeira será sua foto principal.
                      {selectedPlan === "free" && (
                        <span className="text-yellow-600 font-medium"> (plano gratuito: máx. 3)</span>
                      )}
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                      {previews.map((src, i) => (
                        <div key={i} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border">
                          <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                          {i === 0 && (
                            <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">
                              Principal
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {photos.length < maxPhotos && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-[3/4] rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Camera className="h-6 w-6" />
                          <span className="text-xs">Adicionar</span>
                        </button>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePhotos}
                    />

                    {/* Vídeo — só para planos pagos */}
                    {selectedPlan !== "free" ? (
                      <div className="border-t border-border pt-4 space-y-3">
                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Video className="h-4 w-4 text-primary" />
                          Vídeo de verificação <span className="text-destructive font-semibold">* obrigatório</span>
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Grave um vídeo curto mostrando seu rosto para verificar que você é real.
                        </p>
                        {verificationVideo ? (
                          <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                            <Video className="h-5 w-5 text-primary" />
                            <span className="text-sm text-foreground flex-1 truncate">{verificationVideo.name}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setVerificationVideo(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="gap-2 border-destructive/40 hover:border-destructive"
                              onClick={() => videoInputRef.current?.click()}
                            >
                              <Video className="h-4 w-4" /> Enviar vídeo
                            </Button>
                            <p className="text-xs text-destructive">
                              Você não poderá publicar o perfil sem enviar o vídeo.
                            </p>
                          </div>
                        )}
                        <input
                          ref={videoInputRef}
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setVerificationVideo(file);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="border-t border-border pt-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                          <Video className="h-5 w-5 text-yellow-600 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-yellow-700">
                              Vídeo não disponível no plano gratuito
                            </p>
                            <p className="text-xs text-yellow-600/80">
                              Faça upgrade para o plano Mensal ou Anual e adicione vídeo ao seu perfil.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(3)}>
                        Voltar
                      </Button>
                      <Button
                        type="button"
                        className="flex-1"
                        onClick={() => setStep(5)}
                        disabled={photos.length === 0 || (selectedPlan !== "free" && !verificationVideo)}
                      >
                        Próximo: Escolher plano
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── Step 5: Planos ── */}
                {step === 5 && (
                  <div className="space-y-5">
                    <div className="text-center">
                      <h3 className="font-semibold text-foreground text-lg">Escolha seu plano</h3>
                      <p className="text-sm text-muted-foreground mt-1">Você pode mudar de plano a qualquer momento</p>
                    </div>

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
                          {plan.badge && (
                            <span
                              className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${plan.badgeColor}`}
                            >
                              {plan.badge}
                            </span>
                          )}
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className={`p-2 rounded-lg ${selectedPlan === plan.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
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
                              <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
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
                              <li
                                key={f}
                                className="flex items-center gap-2 text-sm text-muted-foreground/60 line-through"
                              >
                                <X className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" /> {f}
                              </li>
                            ))}
                          </ul>
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(4)}>
                        Voltar
                      </Button>
                      <Button type="submit" className="flex-1 gap-2" disabled={loading || !selectedPlan}>
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Criando perfil...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" /> Publicar perfil
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RegisterPage;
