import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { notifyAdmin } from "@/lib/whatsapp";
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
import { Camera, X, Upload, Loader2, Video, Heart, User, ShoppingBag, Check, ImageIcon } from "lucide-react";
import ScheduleSection, { defaultSchedule, scheduleToDb } from "@/components/register/ScheduleSection";
import ServicesSection, { defaultServices, servicesToDb } from "@/components/register/ServicesSection";
import PaymentSection from "@/components/register/PaymentSection";

const CONTENT_TYPES = [
  "Fotos",
  "Vídeos",
  "Packs temáticos",
  "Assinatura mensal",
  "Lives",
  "Chamadas de vídeo",
  "Fan page exclusiva",
];

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Controle de perfil existente
  const [existingProfileId, setExistingProfileId] = useState<string | null>(null);
  const [existingProfileTypes, setExistingProfileTypes] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("id, tags")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return; // sem perfil, permite cadastro normal

        const types: string[] = (data.tags ?? []).filter(
          (t: string) => t === "acompanhante" || t === "conteudo"
        );
        const requestedType = urlTipo;

        // Já tem os dois tipos → redireciona
        if (types.includes("acompanhante") && types.includes("conteudo")) {
          toast.info("Você já tem perfis de ambas as categorias.");
          navigate("/meu-perfil");
          return;
        }

        // Já tem o tipo solicitado → redireciona
        if (requestedType && types.includes(requestedType)) {
          const label = requestedType === "acompanhante" ? "acompanhante" : "vendedora de conteúdo";
          toast.info(`Você já tem um perfil ${label}. Redirecionando para edição.`);
          navigate("/meu-perfil");
          return;
        }

        // Tem um tipo diferente → permite adicionar o novo tipo
        if (requestedType && !types.includes(requestedType)) {
          setExistingProfileId(data.id);
          setExistingProfileTypes(types);
          setStep(1); // pula seleção de tipo
          const existingLabel = types.includes("acompanhante") ? "acompanhante" : "vendedora de conteúdo";
          const newLabel = requestedType === "acompanhante" ? "Acompanhante" : "Criadora de Conteúdo";
          toast.info(`Você já tem perfil de ${existingLabel}. Adicionando: ${newLabel}.`);
          return;
        }

        // Tem perfil mas sem tipo específico solicitado → redireciona
        toast.info("Você já tem um perfil cadastrado. Redirecionando para edição.");
        navigate("/meu-perfil");
      });
  }, [user, navigate]);

  // Pré-marca via query param (?tipo=acompanhante ou ?tipo=conteudo)
  const urlTipo = searchParams.get("tipo");
  const initialTypes: string[] =
    urlTipo === "acompanhante" || urlTipo === "conteudo" ? [urlTipo] : [];

  // Código de indicação via ?ref=CODIGO
  // Salva no localStorage para não perder se a pessoa precisar fazer login/signup antes
  const refFromUrl = searchParams.get("ref");
  if (refFromUrl) localStorage.setItem("referral_ref", refFromUrl);
  const refCode = refFromUrl || localStorage.getItem("referral_ref") || "";

  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState<number>(0);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState<number>(0);
  const [verificationVideo, setVerificationVideo] = useState<File | null>(null);
  const [step, setStep] = useState(0); // 0 = seleção de tipos
  const totalSteps = 4;

  // Array de tipos selecionados: pode conter "acompanhante" e/ou "conteudo"
  const [profileTypes, setProfileTypes] = useState<string[]>(initialTypes);
  const [contentTypes, setContentTypes] = useState<string[]>([]);

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

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const isType = (t: string) => profileTypes.includes(t);

  const toggleType = (t: string) =>
    setProfileTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );

  const toggleContentType = (t: string) =>
    setContentTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );

  const maxPhotos = 10;

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > maxPhotos) {
      toast.error(`Máximo de ${maxPhotos} fotos permitidas`);
      return;
    }
    setPhotos((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
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
        throw new Error(error.message);
      }
      const { data: urlData } = supabase.storage.from("model-photos").getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Você precisa estar logado"); navigate("/login"); return; }
    if (!form.name || !form.age || !form.city || !form.state || !form.phone || !form.description || !form.price) {
      toast.error("Preencha todos os campos obrigatórios nas etapas anteriores");
      setStep(1);
      return;
    }
    if (parseInt(form.age) < 18) { toast.error("Você precisa ter pelo menos 18 anos"); setStep(1); return; }
    if (photos.length === 0) { toast.error("Adicione pelo menos 1 foto"); return; }

    setLoading(true);
    try {
      const imageUrls = await uploadPhotos();

      const mainPrice = pricing.find((p) => p.price)?.price || form.price;
      const pricingDb = pricing.filter((p) => p.price).map((p) => ({ duration: p.duration, price: parseInt(p.price) }));
      if (pricingDb.length === 0 && form.price)
        pricingDb.push({ duration: isType("acompanhante") ? "1 hora" : "Pack de fotos", price: parseInt(form.price) });

      const normalizeCity = (c: string) =>
        c.trim().replace(/\s+/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

      // Serviços: escort + content types juntos no array services
      const escortServices = isType("acompanhante")
        ? services.filter((s) => s.does).map((s) => s.name)
        : [];
      const allServices = [
        ...escortServices,
        ...contentTypes.map((ct) => `Conteúdo: ${ct}`),
      ];

      // Campos comuns a INSERT e UPDATE
      const sharedFields = {
        name: form.name,
        age: parseInt(form.age),
        city: normalizeCity(form.city),
        state: form.state.toUpperCase().trim(),
        phone: form.phone,
        description: form.description,
        tagline: form.tagline,
        price: parseInt(mainPrice || form.price),
        price_duration: isType("acompanhante") ? "1 hora" : "pack",
        image: imageUrls[selectedProfileIndex] ?? imageUrls[0],
        images: imageUrls,
        cover_image: imageUrls[selectedCoverIndex] ?? imageUrls[0],
        height: form.height,
        weight: form.weight,
        ethnicity: form.ethnicity,
        eye_color: form.eyeColor,
        hair_color: form.hairColor,
        hair_length: form.hairLength,
        gender: form.gender,
        gender_description: form.gender === "Mulher" ? "Mulher Cisgênero." : form.gender,
        genitalia: isType("acompanhante") && form.gender === "Mulher" ? "Possui vagina" : "",
        sexual_preference: isType("acompanhante") ? "Ativo - Passivo" : "",
        sexual_preference_description: isType("acompanhante") ? "Faz e recebe penetração" : "",
        attends_to: isType("acompanhante") ? form.attendsTo : "Somente online",
        has_own_place: isType("acompanhante") ? form.hasOwnPlace : false,
        places_served: isType("acompanhante")
          ? form.hasOwnPlace ? "Local próprio" : "Hotéis e motéis"
          : "Online",
        max_clients: isType("acompanhante") ? "apenas 1 cliente" : "ilimitado",
        tattoos: form.tattoos,
        piercings: form.piercings,
        silicone: form.silicone,
        smoker: form.smoker,
        languages: ["Português"],
        location: `${form.city} - ${form.state}`,
        payment_methods: paymentMethods,
        pricing: pricingDb,
        schedule: isType("acompanhante") ? scheduleToDb(schedule) : null,
        detailed_services: isType("acompanhante") ? servicesToDb(services) : null,
        services: allServices,
      };

      if (existingProfileId) {
        // Busca dados existentes para fazer merge sem sobrescrever o outro tipo
        const { data: existing } = await supabase
          .from("profiles")
          .select("services, images, image, cover_image")
          .eq("id", existingProfileId)
          .maybeSingle();

        const existingServices: string[] = (existing?.services ?? []);
        const existingImages: string[] = (existing?.images ?? []);

        // Mescla tags e serviços sem remover os do tipo antigo
        const mergedTags = [...new Set([...existingProfileTypes, ...profileTypes])];
        const mergedServices = [...new Set([...existingServices, ...allServices])];

        // Novas fotos vão para o final (existentes ficam na frente)
        const mergedImages = existingImages.length > 0
          ? [...existingImages, ...imageUrls]
          : imageUrls;

        // Payload base: só tags, serviços e fotos mescladas
        const updatePayload: Record<string, any> = {
          tags: mergedTags,
          services: mergedServices,
          images: mergedImages,
          image: mergedImages[0] ?? existing?.image,
          cover_image: mergedImages[0] ?? existing?.cover_image,
        };

        // Se está adicionando "acompanhante", inclui campos específicos de escort
        if (isType("acompanhante")) {
          Object.assign(updatePayload, {
            name: form.name,
            age: parseInt(form.age),
            city: normalizeCity(form.city),
            state: form.state.toUpperCase().trim(),
            phone: form.phone,
            description: form.description,
            tagline: form.tagline,
            price: parseInt(mainPrice || form.price),
            price_duration: "1 hora",
            height: form.height,
            weight: form.weight,
            ethnicity: form.ethnicity,
            eye_color: form.eyeColor,
            hair_color: form.hairColor,
            hair_length: form.hairLength,
            gender: form.gender,
            gender_description: form.gender === "Mulher" ? "Mulher Cisgênero." : form.gender,
            attends_to: form.attendsTo,
            has_own_place: form.hasOwnPlace,
            places_served: form.hasOwnPlace ? "Local próprio" : "Hotéis e motéis",
            tattoos: form.tattoos,
            piercings: form.piercings,
            silicone: form.silicone,
            smoker: form.smoker,
            schedule: scheduleToDb(schedule),
            detailed_services: servicesToDb(services),
            payment_methods: paymentMethods,
            pricing: pricingDb,
            location: `${form.city} - ${form.state}`,
          });
        }

        const { error } = await supabase
          .from("profiles")
          .update(updatePayload as any)
          .eq("id", existingProfileId);

        if (error) {
          toast.error("Erro ao adicionar categoria: " + error.message);
        } else {
          const finalTypes = [...new Set([...existingProfileTypes, ...profileTypes])];
          if (finalTypes.includes("acompanhante")) {
            navigate("/planos", { state: { profileId: existingProfileId } });
          } else {
            toast.success("Perfil de criadora criado! Complete seus dados abaixo.");
            navigate("/meu-perfil");
          }
        }
      } else {
        // Cria perfil novo
        // Gera código de indicação único
        const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const { data: profileData, error } = await supabase
          .from("profiles")
          .insert({
            ...sharedFields,
            user_id: user.id,
            location_zone: "",
            location_distance: "",
            amenities: "",
            neighborhoods: [],
            verified: false,
            rating: 0,
            review_count: 0,
            tags: profileTypes,
            profile_created_at: new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
            reviews: [],
            referral_code: referralCode,
            referred_by: refCode || null,
          } as any)
          .select("id")
          .single();

        if (error) {
          toast.error("Erro ao criar perfil: " + error.message);
        } else {
          localStorage.removeItem("referral_ref"); // limpa após uso
          const tipo = profileTypes.includes("acompanhante") ? "Acompanhante" : "Criadora de conteúdo";
          notifyAdmin(`🆕 *Novo perfil cadastrado!*\n\nNome: ${form.name}\nTipo: ${tipo}\nCidade: ${form.city} - ${form.state}\nE-mail: ${user.email}\n\nAcesse o painel admin para aprovar.`);
          if (profileTypes.includes("acompanhante")) {
            navigate("/planos", { state: { profileId: profileData.id } });
          } else {
            toast.success("Perfil de criadora criado! Complete seus dados abaixo.");
            navigate("/meu-perfil");
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro inesperado ao criar perfil");
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
              <Button onClick={() => navigate(`/login?redirect=/cadastro${refCode ? `?ref=${refCode}` : ""}`)} className="w-full">Fazer login</Button>
              <Button variant="outline" onClick={() => navigate(`/cadastro-usuario${refCode ? `?ref=${refCode}` : ""}`)} className="w-full">Criar conta</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const typeLabel =
    isType("acompanhante") && isType("conteudo")
      ? "Acompanhante & Criadora de Conteúdo"
      : isType("conteudo")
      ? "Criadora de Conteúdo"
      : "Acompanhante";

  const cardTitle = step === 0 ? "Como você quer se cadastrar?" : `Cadastro — ${typeLabel}`;
  const cardDescription =
    step === 0
      ? "Selecione uma ou mais categorias"
      : "Preencha seus dados e adicione suas melhores fotos";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{cardTitle}</CardTitle>
              <CardDescription>{cardDescription}</CardDescription>
              {step > 0 && (
                <>
                  <div className="flex justify-center gap-2 mt-4">
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                      <div
                        key={s}
                        className={`h-2 w-10 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Etapa {step} de {totalSteps}</p>
                </>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>

                {/* ── Step 0: Seleção de tipos (multi-select) ── */}
                {step === 0 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Você pode selecionar mais de uma categoria na mesma conta.
                    </p>

                    {/* Card Acompanhante */}
                    <button
                      type="button"
                      onClick={() => toggleType("acompanhante")}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-colors group ${
                        isType("acompanhante")
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`mt-0.5 p-2 rounded-lg transition-colors ${
                          isType("acompanhante") ? "bg-primary/20" : "bg-muted group-hover:bg-primary/10"
                        }`}>
                          <Heart className={`h-5 w-5 ${isType("acompanhante") ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold ${isType("acompanhante") ? "text-primary" : "text-foreground"}`}>
                            Acompanhante
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Ofereça serviços de acompanhamento com agenda, horários e lista de serviços.
                          </p>
                        </div>
                        <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isType("acompanhante") ? "border-primary bg-primary" : "border-border"
                        }`}>
                          {isType("acompanhante") && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      </div>
                    </button>

                    {/* Card Vendedora de Conteúdo */}
                    <button
                      type="button"
                      onClick={() => toggleType("conteudo")}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-colors group ${
                        isType("conteudo")
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`mt-0.5 p-2 rounded-lg transition-colors ${
                          isType("conteudo") ? "bg-primary/20" : "bg-muted group-hover:bg-primary/10"
                        }`}>
                          <ShoppingBag className={`h-5 w-5 ${isType("conteudo") ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold ${isType("conteudo") ? "text-primary" : "text-foreground"}`}>
                            Vendedora de Conteúdo
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Venda fotos, vídeos e packs exclusivos. Atendimento 100% online.
                          </p>
                        </div>
                        <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isType("conteudo") ? "border-primary bg-primary" : "border-border"
                        }`}>
                          {isType("conteudo") && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      </div>
                    </button>

                    {/* Badge quando os dois estão selecionados */}
                    {isType("acompanhante") && isType("conteudo") && (
                      <div className="text-center py-1">
                        <span className="inline-block text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                          Perfil combinado — suas duas categorias aparecerão juntas
                        </span>
                      </div>
                    )}

                    <Button
                      type="button"
                      className="w-full"
                      disabled={profileTypes.length === 0}
                      onClick={() => setStep(1)}
                    >
                      Continuar
                    </Button>

                    <div className="relative flex items-center gap-3 py-1">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">ou</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Opção Cliente */}
                    <button
                      type="button"
                      onClick={() => navigate("/cadastro-usuario")}
                      className="w-full text-left p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">Quero ser cliente</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Explore perfis, salve favoritos e entre em contato.
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                )}

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
                        <Input id="age" type="number" min="18" max="60" value={form.age} onChange={(e) => update("age", e.target.value)} required />
                      </div>
                      <div>
                        <Label htmlFor="phone">WhatsApp *</Label>
                        <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} required placeholder="(11) 99999-0000" />
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
                          <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                          <SelectContent>
                            {UF_LIST.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
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
                        placeholder={
                          isType("acompanhante") && isType("conteudo")
                            ? "Ex: Acompanhante e criadora de conteúdo exclusivo"
                            : isType("conteudo")
                            ? "Ex: Conteúdo exclusivo e personalizado"
                            : "Ex: Loira fitness com atendimento premium"
                        }
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
                        placeholder={
                          isType("acompanhante") && isType("conteudo")
                            ? "Fale sobre você, seu atendimento presencial e também seu conteúdo online..."
                            : isType("conteudo")
                            ? "Fale sobre seu conteúdo, estilo e o que seus fãs podem esperar..."
                            : "Descreva você, seu atendimento e o que oferece..."
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">
                        {isType("acompanhante") ? "Valor por hora (R$) *" : "Preço do pack (R$) *"}
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        min="10"
                        value={form.price}
                        onChange={(e) => update("price", e.target.value)}
                        required
                        placeholder={isType("acompanhante") ? "300" : "30"}
                      />
                    </div>
                    <Button type="button" className="w-full" onClick={() => setStep(2)}>
                      Próximo: Aparência
                    </Button>
                    <Button type="button" variant="ghost" className="w-full text-sm" onClick={() => setStep(0)}>
                      Voltar à seleção de categorias
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
                        <Input value={form.height} onChange={(e) => update("height", e.target.value)} placeholder="1,70 m" />
                      </div>
                      <div>
                        <Label>Peso</Label>
                        <Input value={form.weight} onChange={(e) => update("weight", e.target.value)} placeholder="55 kg" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Etnia</Label>
                        <Select value={form.ethnicity} onValueChange={(v) => update("ethnicity", v)}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {["Branca","Morena","Negra","Asiática","Indígena","Outra"].map((e) => (
                              <SelectItem key={e} value={e}>{e}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Cor dos olhos</Label>
                        <Select value={form.eyeColor} onValueChange={(v) => update("eyeColor", v)}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {["Castanho","Verde","Azul","Mel","Preto"].map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Cor do cabelo</Label>
                        <Select value={form.hairColor} onValueChange={(v) => update("hairColor", v)}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {["Loira","Castanha","Ruiva","Preta","Colorido"].map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Comprimento</Label>
                        <Select value={form.hairLength} onValueChange={(v) => update("hairLength", v)}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {["Curto","Médio","Longo"].map((l) => (
                              <SelectItem key={l} value={l}>{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className={`grid gap-4 ${isType("acompanhante") ? "grid-cols-2" : "grid-cols-1"}`}>
                      <div>
                        <Label>Gênero</Label>
                        <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["Mulher","Homem","Trans","Outro"].map((g) => (
                              <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {isType("acompanhante") && (
                        <div>
                          <Label>Atende</Label>
                          <Select value={form.attendsTo} onValueChange={(v) => update("attendsTo", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["Homens","Mulheres","Homens e mulheres","Homens e casais","Todos"].map((a) => (
                                <SelectItem key={a} value={a}>{a}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 pt-2">
                      {isType("acompanhante") && (
                        <div className="flex items-center justify-between">
                          <Label>Tenho local próprio</Label>
                          <Switch checked={form.hasOwnPlace} onCheckedChange={(v) => update("hasOwnPlace", v)} />
                        </div>
                      )}
                      {[
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
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>Voltar</Button>
                      <Button type="button" className="flex-1" onClick={() => setStep(3)}>
                        {isType("acompanhante") && isType("conteudo")
                          ? "Próximo: Serviços & Conteúdo"
                          : isType("conteudo")
                          ? "Próximo: Conteúdo"
                          : "Próximo: Serviços"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── Step 3: Serviços / Conteúdo / Ambos ── */}
                {step === 3 && (
                  <div className="space-y-6">
                    <h3 className="font-semibold text-foreground">
                      {isType("acompanhante") && isType("conteudo")
                        ? "Serviços, Conteúdo e Valores"
                        : isType("conteudo")
                        ? "Conteúdo e Valores"
                        : "Serviços, Horários e Valores"}
                    </h3>

                    {/* Seção de conteúdo digital */}
                    {isType("conteudo") && (
                      <div>
                        <Label className="text-sm font-medium">O que você vende online?</Label>
                        <p className="text-xs text-muted-foreground mb-3">
                          Selecione todos os tipos de conteúdo que você oferece
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {CONTENT_TYPES.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => toggleContentType(opt)}
                              className={`px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${
                                contentTypes.includes(opt)
                                  ? "border-primary bg-primary/10 text-primary font-medium"
                                  : "border-border hover:border-primary/50 text-foreground"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Seção de serviços de acompanhante */}
                    {isType("acompanhante") && (
                      <div className={isType("conteudo") ? "border-t border-border pt-4" : ""}>
                        <ServicesSection services={services} onChange={setServices} />
                      </div>
                    )}

                    {/* Horários (só acompanhante) */}
                    {isType("acompanhante") && (
                      <div className="border-t border-border pt-4">
                        <ScheduleSection schedule={schedule} onChange={setSchedule} />
                      </div>
                    )}

                    {/* Pagamento — sempre */}
                    <div className="border-t border-border pt-4">
                      <PaymentSection
                        paymentMethods={paymentMethods}
                        onPaymentMethodsChange={setPaymentMethods}
                        pricing={pricing}
                        onPricingChange={setPricing}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>Voltar</Button>
                      <Button type="button" className="flex-1" onClick={() => setStep(4)}>Próximo: Fotos</Button>
                    </div>
                  </div>
                )}

                {/* ── Step 4: Fotos & Vídeo ── */}
                {step === 4 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Suas fotos e vídeos</h3>
                    <p className="text-sm text-muted-foreground">
                      Adicione até {maxPhotos} mídias. Toque em uma foto para definir como perfil ou capa.
                    </p>
                    {previews.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-primary inline-block" /> Perfil</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-purple-500 inline-block" /> Capa</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-yellow-400 inline-block" /> Perfil e capa</span>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      {previews.map((src, i) => {
                        const isProfile = i === selectedProfileIndex;
                        const isCover = i === selectedCoverIndex;
                        const isVideo = photos[i]?.type.startsWith("video/");
                        return (
                        <div key={i} className={`relative flex flex-col rounded-lg overflow-hidden border-2 transition-all ${isProfile && isCover ? "border-yellow-400" : isProfile ? "border-primary" : isCover ? "border-purple-500" : "border-border"}`}>
                          <div className="relative aspect-[3/4]">
                            {isVideo ? (
                              <video src={src} className="w-full h-full object-cover" muted playsInline />
                            ) : (
                              <img src={src} alt={`Mídia ${i + 1}`} className="w-full h-full object-cover" />
                            )}
                            <div className="absolute top-1 left-1 flex flex-col gap-0.5">
                              {isProfile && <span className="bg-primary text-primary-foreground text-[9px] px-1 py-0.5 rounded font-bold">PERFIL</span>}
                              {isCover && <span className="bg-purple-500 text-white text-[9px] px-1 py-0.5 rounded font-bold">CAPA</span>}
                            </div>
                            <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="flex gap-1 p-1 bg-muted">
                            <button
                              type="button"
                              onClick={() => setSelectedProfileIndex(i)}
                              disabled={isProfile}
                              className={`flex-1 text-[9px] py-1 rounded font-bold flex items-center justify-center gap-0.5 transition-colors ${isProfile ? "bg-primary text-white cursor-default" : "bg-background border border-primary text-primary hover:bg-primary hover:text-white"}`}
                            >
                              <Camera className="h-2.5 w-2.5" /> {isProfile ? "Perfil ✓" : "Perfil"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedCoverIndex(i)}
                              disabled={isCover}
                              className={`flex-1 text-[9px] py-1 rounded font-bold flex items-center justify-center gap-0.5 transition-colors ${isCover ? "bg-purple-500 text-white cursor-default" : "bg-background border border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white"}`}
                            >
                              <ImageIcon className="h-2.5 w-2.5" /> {isCover ? "Capa ✓" : "Capa"}
                            </button>
                          </div>
                        </div>
                        );
                      })}
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
                    <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handlePhotos} />

                    <div className="border-t border-border pt-4 space-y-3">
                      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Video className="h-4 w-4 text-primary" />
                        Vídeo de verificação
                        <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Grave um vídeo curto mostrando seu rosto. Necessário para o selo de verificação nos planos pagos.
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
                        <Button type="button" variant="outline" className="gap-2" onClick={() => videoInputRef.current?.click()}>
                          <Video className="h-4 w-4" /> Enviar vídeo
                        </Button>
                      )}
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => { const file = e.target.files?.[0]; if (file) setVerificationVideo(file); }}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(3)}>Voltar</Button>
                      <Button type="submit" className="flex-1 gap-2" disabled={loading || photos.length === 0}>
                        {loading ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Criando perfil...</>
                        ) : (
                          <><Upload className="h-4 w-4" /> Publicar e escolher plano</>
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
