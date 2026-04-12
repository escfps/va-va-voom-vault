import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { updatePlan } from "@/lib/updatePlan";
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
import {
  Camera, X, Loader2, Save, Trash2, Video, Crown, Calendar, Check, Star, Zap,
  ChevronDown, ChevronUp, Heart, ShoppingBag, ImageIcon, Upload, Eye, Plus, LayoutDashboard, Gift, Copy, Wallet,
} from "lucide-react";
import ScheduleSection, { defaultSchedule, scheduleToDb, dbToSchedule } from "@/components/register/ScheduleSection";
import ServicesSection, { defaultServices, servicesToDb, dbToServices } from "@/components/register/ServicesSection";
import PaymentSection from "@/components/register/PaymentSection";

const isVideoUrl = (url: string) => /\.(mp4|mov|webm|avi|mkv|m4v)(\?.*)?$/i.test(url);

const ADMIN_EMAILS = ["bruno13@hotmail.com", "texasgramado@gmail.com"];

const EditProfilePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const adminTargetProfileId = searchParams.get("adminProfileId");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const contentPhotoInputRef = useRef<HTMLInputElement>(null);
  const contentVideoInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<string>("pending");
  const [profileTypes, setProfileTypes] = useState<string[]>(["acompanhante"]);
  const [activeTab, setActiveTab] = useState<string>("acompanhante");
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralBalance, setReferralBalance] = useState<number>(0);
  const [showPlanChange, setShowPlanChange] = useState(false);
  const [selectedNewPlan, setSelectedNewPlan] = useState<string | null>(null);
  const [planSaving, setPlanSaving] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [newPhotosFirst, setNewPhotosFirst] = useState(false);
  const [selectedProfilePhoto, setSelectedProfilePhoto] = useState<string | null>(null);
  const [selectedCoverPhoto, setSelectedCoverPhoto] = useState<string | null>(null);
  const [verificationVideo, setVerificationVideo] = useState<File | null>(null);
  const [contentMedia, setContentMedia] = useState<string[]>([]);
  const [contentUploading, setContentUploading] = useState(false);
  const [contentDragOver, setContentDragOver] = useState(false);

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

  useEffect(() => {
    if (!user) return;
    const isAdmin = ADMIN_EMAILS.includes(user.email ?? "");
    const fetchProfile = async () => {
      let query = supabase.from("profiles").select("*");
      if (adminTargetProfileId && isAdmin) {
        query = query.eq("id", adminTargetProfileId);
      } else {
        query = query.eq("user_id", user.id);
      }
      const { data, error } = await query.maybeSingle() as any;

      if (error) { console.error(error); toast.error("Erro ao carregar perfil"); setLoading(false); return; }
      if (!data) { setLoading(false); return; }

      setProfileId(data.id);
      setProfileStatus(data.status ?? "pending");
      setExistingImages(data.images || []);
      setSelectedProfilePhoto(data.image || (data.images?.[0] ?? null));
      setSelectedCoverPhoto(data.cover_image || (data.images?.[0] ?? null));
      setCurrentPlan(data.plan || "free");
      setPlanExpiresAt(data.plan_expires_at || null);
      setReferralCode((data as any).referral_code || "");
      setReferralBalance((data as any).referral_balance || 0);

      const types = (data.tags ?? []).filter((t: string) => t === "acompanhante" || t === "conteudo");
      const effectiveTypes = types.length > 0 ? types : ["acompanhante"];
      setProfileTypes(effectiveTypes);
      if (!effectiveTypes.includes("acompanhante") && effectiveTypes.includes("conteudo")) {
        setActiveTab("conteudo");
      }
      setContentMedia(data.images ?? []);

      if (data.schedule && Array.isArray(data.schedule)) {
        setSchedule(dbToSchedule(data.schedule as { day: string; hours: string | null }[]));
      }
      if (data.detailed_services && Array.isArray(data.detailed_services)) {
        setServices(dbToServices(data.detailed_services as { name: string; does: boolean; description: string }[]));
      }
      if (data.payment_methods) setPaymentMethods(data.payment_methods);
      if (data.pricing && Array.isArray(data.pricing)) {
        const pricingData = (data.pricing as { duration: string; price: number }[]).map((p) => ({
          duration: p.duration,
          price: String(p.price),
        }));
        if (pricingData.length > 0) setPricing(pricingData);
      }

      setForm({
        name: data.name || "",
        age: String(data.age || ""),
        city: data.city || "",
        state: data.state || "",
        phone: data.phone || "",
        description: data.description || "",
        tagline: data.tagline || "",
        price: String(data.price || ""),
        height: data.height || "",
        weight: data.weight || "",
        ethnicity: data.ethnicity || "",
        eyeColor: data.eye_color || "",
        hairColor: data.hair_color || "",
        hairLength: data.hair_length || "",
        gender: data.gender || "Mulher",
        attendsTo: data.attends_to || "Homens",
        hasOwnPlace: data.has_own_place || false,
        tattoos: data.tattoos || false,
        piercings: data.piercings || false,
        silicone: data.silicone || false,
        smoker: data.smoker || false,
      });
      setLoading(false);
    };
    fetchProfile();
  }, [user, adminTargetProfileId]);

  const isPaidPlan = currentPlan === "monthly" || currentPlan === "yearly";
  const isYearlyPlan = currentPlan === "yearly";
  const canUploadVideos = isPaidPlan; // mensal e anual podem fazer upload de vídeos de conteúdo
  const photoLimit = isPaidPlan ? Infinity : 3;

  const handleNewPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const videoFiles = files.filter((f) => f.type.startsWith("video/"));
    if (videoFiles.length > 0 && !isYearlyPlan) {
      toast.error("Vídeo na foto de perfil e capa é exclusivo do Plano Anual. Faça upgrade para liberar.");
      return;
    }
    const totalImages = existingImages.length - removedImages.length + newPhotos.length + files.length;
    if (totalImages > photoLimit) { toast.error("Plano Gratuito: máximo de 3 mídias. Faça upgrade para ilimitado."); return; }
    setNewPhotos((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setNewPreviews((prev) => [...prev, ...previews]);
  };

  const removeExistingImage = (url: string) => setRemovedImages((prev) => [...prev, url]);

  const removeNewPhoto = (index: number) => {
    URL.revokeObjectURL(newPreviews[index]);
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadNewPhotos = async (): Promise<string[]> => {
    if (!user) return [];
    const urls: string[] = [];
    for (const photo of newPhotos) {
      const ext = photo.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("model-photos").upload(path, photo, { cacheControl: "3600", upsert: false });
      if (error) { console.error("Upload error:", error); continue; }
      const { data: urlData } = supabase.storage.from("model-photos").getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  // ── Content creator media functions ─────────────────────────────────────────

  const uploadContentFiles = async (files: File[]) => {
    if (!user || files.length === 0) return;

    // Plano gratuito: máx 3 fotos, sem vídeos
    if (!isPaidPlan) {
      const incomingVideos = files.filter((f) => f.type.startsWith("video/"));
      const currentPhotoCount = contentMedia.filter((m) => !isVideoUrl(m)).length;
      const incomingPhotos = files.filter((f) => f.type.startsWith("image/"));

      if (incomingVideos.length > 0) {
        toast.error("Upload de vídeos é exclusivo dos planos Mensal e Anual. Faça upgrade para liberar.");
        return;
      }
      if (incomingPhotos.length > 0 && currentPhotoCount + incomingPhotos.length > 3) {
        toast.error(`Plano Gratuito: máximo de 3 fotos (você já tem ${currentPhotoCount}). Faça upgrade para ilimitado.`);
        return;
      }
    }

    setContentUploading(true);
    const newUrls: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const folder = file.type.startsWith("video/") ? "videos" : "fotos";
      const path = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("model-photos").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) { console.error("Upload error:", error); toast.error(`Erro ao enviar ${file.name}`); continue; }
      const { data: urlData } = supabase.storage.from("model-photos").getPublicUrl(path);
      newUrls.push(urlData.publicUrl);
    }

    if (newUrls.length > 0) {
      const updated = [...contentMedia, ...newUrls];
      const { error } = await supabase
        .from("profiles")
        .update({ images: updated, image: updated[0], cover_image: updated[0] })
        .eq("id", profileId!);
      if (!error) {
        setContentMedia(updated);
        setExistingImages(updated);
        toast.success(`${newUrls.length} arquivo(s) enviado(s) com sucesso!`);
      } else {
        toast.error("Erro ao salvar no perfil: " + error.message);
      }
    }
    setContentUploading(false);
  };

  const handleContentFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) uploadContentFiles(files);
    e.target.value = "";
  };

  const handleContentDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setContentDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (files.length) uploadContentFiles(files);
  };

  const handleContentDelete = async (url: string) => {
    const updated = contentMedia.filter((m) => m !== url);
    const { error } = await supabase
      .from("profiles")
      .update({ images: updated, image: updated[0] ?? null, cover_image: updated[0] ?? null })
      .eq("id", profileId!);
    if (!error) { setContentMedia(updated); setExistingImages(updated); toast.success("Arquivo removido"); }
    else { toast.error("Erro ao remover: " + error.message); }
  };

  const setAsProfilePhoto = async (url: string) => {
    if (isVideoUrl(url) && !isYearlyPlan) {
      toast.error("Vídeo como foto de perfil é exclusivo do Plano Anual.");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ image: url })
      .eq("id", profileId!);
    if (!error) {
      setSelectedProfilePhoto(url);
      toast.success("Foto de perfil atualizada!");
    } else {
      toast.error("Erro ao atualizar: " + error.message);
    }
  };

  const setAsCoverPhoto = async (url: string) => {
    if (isVideoUrl(url) && !isYearlyPlan) {
      toast.error("Vídeo como capa é exclusivo do Plano Anual.");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ cover_image: url })
      .eq("id", profileId!);
    if (!error) {
      setSelectedCoverPhoto(url);
      toast.success("Foto de capa atualizada!");
    } else {
      toast.error("Erro ao atualizar: " + error.message);
    }
  };

  // ── Escort profile save ──────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profileId) return;

    setSaving(true);
    try {
      const uploadedUrls = await uploadNewPhotos();
      const filteredExisting = existingImages.filter((url) => !removedImages.includes(url));
      const finalImages = newPhotosFirst
        ? [...uploadedUrls, ...filteredExisting]
        : [...filteredExisting, ...uploadedUrls];

      if (finalImages.length === 0) { toast.error("Adicione pelo menos 1 foto ou vídeo"); setSaving(false); return; }

      // Foto de perfil e capa: usa seleção manual ou cai para a primeira da lista
      const resolvedProfilePhoto = selectedProfilePhoto && finalImages.includes(selectedProfilePhoto)
        ? selectedProfilePhoto
        : finalImages[0];
      const resolvedCoverPhoto = selectedCoverPhoto && finalImages.includes(selectedCoverPhoto)
        ? selectedCoverPhoto
        : finalImages[0];

      const pricingDb = pricing.filter((p) => p.price).map((p) => ({ duration: p.duration, price: parseInt(p.price) }));

      const normalizeCity = (c: string) =>
        c.trim().replace(/\s+/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

      const { error } = await supabase
        .from("profiles")
        .update({
          name: form.name,
          age: parseInt(form.age),
          city: normalizeCity(form.city),
          state: form.state.toUpperCase().trim(),
          phone: form.phone,
          description: form.description,
          tagline: form.tagline,
          price: parseInt(form.price),
          image: resolvedProfilePhoto,
          images: finalImages,
          cover_image: resolvedCoverPhoto,
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
          tattoos: form.tattoos,
          piercings: form.piercings,
          silicone: form.silicone,
          smoker: form.smoker,
          location: `${form.city} - ${form.state}`,
          places_served: form.hasOwnPlace ? "Local próprio" : "Hotéis e motéis",
          schedule: scheduleToDb(schedule),
          detailed_services: servicesToDb(services),
          services: services.filter((s) => s.does).map((s) => s.name),
          pricing: pricingDb,
          payment_methods: paymentMethods,
        })
        .eq("id", profileId);

      if (error) {
        console.error(error);
        toast.error("Erro ao salvar: " + error.message);
      } else {
        toast.success("Perfil atualizado com sucesso! ✅");
        setExistingImages(finalImages);
        setNewPhotos([]);
        setNewPreviews([]);
        setRemovedImages([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro inesperado ao salvar");
    }
    setSaving(false);
  };

  const getPlanExpiresAt = (planId: string): string | null => {
    if (planId === "free") return null;
    const date = new Date();
    if (planId === "monthly") date.setDate(date.getDate() + 30);
    if (planId === "yearly") date.setFullYear(date.getFullYear() + 1);
    return date.toISOString();
  };

  const formatExpiry = (iso: string): string => {
    const date = new Date(iso);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  };

  const isPlanExpired = (iso: string | null): boolean => {
    if (!iso) return false;
    return new Date(iso) < new Date();
  };

  const handleChangePlan = async () => {
    if (!selectedNewPlan || !profileId || !user) return;

    // Planos pagos: redireciona para o checkout com PIX
    if (selectedNewPlan !== "free") {
      navigate("/planos", { state: { profileId, preselectedPlan: selectedNewPlan } });
      return;
    }

    // Downgrade para free: aplica direto
    setPlanSaving(true);
    try {
      await updatePlan(profileId, selectedNewPlan);
      setCurrentPlan(selectedNewPlan);
      setPlanExpiresAt(null);
      setShowPlanChange(false);
      setSelectedNewPlan(null);
      toast.success("Plano alterado para Gratuito.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao alterar plano");
    }
    setPlanSaving(false);
  };

  const handleDelete = async () => {
    if (!profileId) return;

    const typeLabel = activeTab === "acompanhante" ? "acompanhante" : "vendedora de conteúdo";
    const otherLabel = activeTab === "acompanhante" ? "criadora de conteúdo" : "acompanhante";

    if (profileTypes.length > 1) {
      // Tem os dois tipos: remove apenas o tipo atual, mantém o outro
      if (!confirm(`Remover seu perfil de ${typeLabel}? Seu perfil de ${otherLabel} será mantido.`)) return;
      const newTags = profileTypes.filter((t) => t !== activeTab);
      const { error } = await supabase
        .from("profiles")
        .update({ tags: newTags })
        .eq("id", profileId);
      if (error) {
        toast.error("Erro ao remover categoria");
      } else {
        toast.success(`Perfil de ${typeLabel} removido.`);
        setProfileTypes(newTags);
        setActiveTab(newTags[0]);
      }
    } else {
      // Tem só um tipo: exclui o perfil inteiro
      if (!confirm(`Excluir seu perfil de ${typeLabel} permanentemente? Essa ação não pode ser desfeita.`)) return;
      const { error } = await supabase.from("profiles").delete().eq("id", profileId);
      if (error) { toast.error("Erro ao excluir perfil"); } else { toast.success("Perfil excluído"); navigate("/"); }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardContent className="pt-6 text-center space-y-4">
              <h2 className="text-xl font-bold text-foreground">Faça login para continuar</h2>
              <p className="text-muted-foreground">Você precisa estar logado para editar seu perfil.</p>
              <Button onClick={() => navigate("/login")} className="w-full">Fazer login</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!profileId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardContent className="pt-6 text-center space-y-4">
              <h2 className="text-xl font-bold text-foreground">Nenhum perfil encontrado</h2>
              <p className="text-muted-foreground">Você ainda não cadastrou um perfil de modelo.</p>
              <Button onClick={() => navigate("/cadastro")} className="w-full">Criar perfil</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const showTabs = profileTypes.includes("acompanhante") && profileTypes.includes("conteudo");
  const activeImages = existingImages.filter((url) => !removedImages.includes(url));
  const totalImages = activeImages.length + newPhotos.length;
  const photoCount = contentMedia.filter((m) => !isVideoUrl(m)).length;
  const videoCount = contentMedia.filter((m) => isVideoUrl(m)).length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Banner de status */}
          {profileStatus === "pending" && (
            <div className="mb-4 p-4 rounded-xl border border-yellow-400/50 bg-yellow-50 dark:bg-yellow-900/20 flex items-start gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm">Perfil em análise</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                  Seu perfil está aguardando aprovação da nossa equipe. Você pode editar seus dados enquanto aguarda. Assim que for aprovado, ele ficará visível no site.
                </p>
              </div>
            </div>
          )}
          {profileStatus === "rejected" && (
            <div className="mb-4 p-4 rounded-xl border border-destructive/50 bg-destructive/10 flex items-start gap-3">
              <span className="text-2xl">❌</span>
              <div>
                <p className="font-semibold text-destructive text-sm">Perfil reprovado</p>
                <p className="text-xs text-destructive/80 mt-0.5">
                  Seu perfil foi reprovado. Entre em contato com o suporte para mais informações.
                </p>
              </div>
            </div>
          )}

          {/* ── Tab switcher (only when both types) ── */}
          {showTabs && (
            <div className="flex rounded-xl border border-border overflow-hidden mb-4">
              <button
                type="button"
                onClick={() => setActiveTab("acompanhante")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === "acompanhante"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Heart className="h-4 w-4" /> Acompanhante
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("conteudo")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === "conteudo"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <ShoppingBag className="h-4 w-4" /> Criadora de Conteúdo
              </button>
            </div>
          )}

          {/* ── Aba: Perfil de Acompanhante ── */}
          {profileTypes.includes("acompanhante") && (!showTabs || activeTab === "acompanhante") && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  {showTabs ? "Perfil de Acompanhante" : "Editar Meu Perfil"}
                </CardTitle>
                <CardDescription>Atualize seus dados, fotos, serviços e horários a qualquer momento</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground border-b border-border pb-2">Dados pessoais</h3>
                    <div>
                      <Label htmlFor="name">Nome artístico *</Label>
                      <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label htmlFor="age">Idade *</Label><Input id="age" type="number" min="18" max="60" value={form.age} onChange={(e) => update("age", e.target.value)} required /></div>
                      <div><Label htmlFor="phone">WhatsApp *</Label><Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label htmlFor="city">Cidade *</Label><Input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} required /></div>
                      <div>
                        <Label htmlFor="state">Estado *</Label>
                        <Select value={form.state} onValueChange={(v) => update("state", v)}>
                          <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                          <SelectContent>
                            {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (
                              <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div><Label htmlFor="tagline">Frase de destaque</Label><Input id="tagline" value={form.tagline} onChange={(e) => update("tagline", e.target.value)} /></div>
                    <div><Label htmlFor="description">Sobre você *</Label><Textarea id="description" value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} required /></div>
                    <div><Label htmlFor="price">Valor por hora (R$) *</Label><Input id="price" type="number" min="50" value={form.price} onChange={(e) => update("price", e.target.value)} required /></div>
                  </div>

                  {/* Appearance */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground border-b border-border pb-2">Aparência</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Altura</Label><Input value={form.height} onChange={(e) => update("height", e.target.value)} placeholder="1,70 m" /></div>
                      <div><Label>Peso</Label><Input value={form.weight} onChange={(e) => update("weight", e.target.value)} placeholder="55 kg" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Etnia</Label>
                        <Select value={form.ethnicity} onValueChange={(v) => update("ethnicity", v)}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{["Branca", "Morena", "Negra", "Asiática", "Indígena", "Outra"].map((e) => (<SelectItem key={e} value={e}>{e}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Cor dos olhos</Label>
                        <Select value={form.eyeColor} onValueChange={(v) => update("eyeColor", v)}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{["Castanho", "Verde", "Azul", "Mel", "Preto"].map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Cor do cabelo</Label>
                        <Select value={form.hairColor} onValueChange={(v) => update("hairColor", v)}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{["Loira", "Castanha", "Ruiva", "Preta", "Colorido"].map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Comprimento</Label>
                        <Select value={form.hairLength} onValueChange={(v) => update("hairLength", v)}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{["Curto", "Médio", "Longo"].map((l) => (<SelectItem key={l} value={l}>{l}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Gênero</Label>
                        <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{["Mulher", "Homem", "Trans", "Outro"].map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Atende</Label>
                        <Select value={form.attendsTo} onValueChange={(v) => update("attendsTo", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{["Homens", "Mulheres", "Homens e mulheres", "Homens e casais", "Todos"].map((a) => (<SelectItem key={a} value={a}>{a}</SelectItem>))}</SelectContent>
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
                          <Switch checked={form[key as keyof typeof form] as boolean} onCheckedChange={(v) => update(key, v)} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Services */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground border-b border-border pb-2">Serviços oferecidos</h3>
                    <ServicesSection services={services} onChange={setServices} />
                  </div>

                  {/* Schedule */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground border-b border-border pb-2">Horários de atendimento</h3>
                    <ScheduleSection schedule={schedule} onChange={setSchedule} />
                  </div>

                  {/* Pricing & Payment */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground border-b border-border pb-2">Valores e Pagamento</h3>
                    <PaymentSection
                      paymentMethods={paymentMethods}
                      onPaymentMethodsChange={setPaymentMethods}
                      pricing={pricing}
                      onPricingChange={setPricing}
                    />
                  </div>

                  {/* Photos */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground border-b border-border pb-2">Suas fotos e vídeos</h3>
                    <p className="text-sm text-muted-foreground">
                      {isYearlyPlan ? "Fotos e vídeos ilimitados." : isPaidPlan ? "Fotos ilimitadas." : "Plano Gratuito: até 3 fotos."}
                      {" "}Passe o mouse para definir perfil e capa separadamente.
                    </p>
                    {(activeImages.length + newPreviews.length) > 0 && (
                      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-primary inline-block" /> Foto de perfil</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-purple-500 inline-block" /> Foto de capa</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-yellow-400 inline-block" /> Perfil e capa</span>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      {activeImages.map((src) => {
                        const isProfile = src === selectedProfilePhoto;
                        const isCover = src === selectedCoverPhoto;
                        const isVideo = isVideoUrl(src);
                        return (
                          <div key={src} className={`relative flex flex-col rounded-lg overflow-hidden border-2 transition-all ${isProfile && isCover ? "border-yellow-400" : isProfile ? "border-primary" : isCover ? "border-purple-500" : "border-border"}`}>
                            <div className="relative aspect-[3/4]">
                              {isVideo ? (
                                <video src={src} className="w-full h-full object-cover" muted playsInline />
                              ) : (
                                <img src={src} alt="Mídia" className="w-full h-full object-cover" />
                              )}
                              <div className="absolute top-1 left-1 flex flex-col gap-0.5">
                                {isProfile && <span className="bg-primary text-primary-foreground text-[9px] px-1 py-0.5 rounded font-bold">PERFIL</span>}
                                {isCover && <span className="bg-purple-500 text-white text-[9px] px-1 py-0.5 rounded font-bold">CAPA</span>}
                              </div>
                              <button type="button" onClick={() => removeExistingImage(src)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            {(!isVideo || isYearlyPlan) && (
                              <div className="flex gap-1 p-1 bg-muted">
                                <button type="button" onClick={() => setSelectedProfilePhoto(src)} disabled={isProfile}
                                  className={`flex-1 text-[9px] py-1 rounded font-bold flex items-center justify-center gap-0.5 transition-colors ${isProfile ? "bg-primary text-white cursor-default" : "bg-background border border-primary text-primary hover:bg-primary hover:text-white"}`}>
                                  <Camera className="h-2.5 w-2.5" /> {isProfile ? "Perfil ✓" : "Perfil"}
                                </button>
                                <button type="button" onClick={() => setSelectedCoverPhoto(src)} disabled={isCover}
                                  className={`flex-1 text-[9px] py-1 rounded font-bold flex items-center justify-center gap-0.5 transition-colors ${isCover ? "bg-purple-500 text-white cursor-default" : "bg-background border border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white"}`}>
                                  <ImageIcon className="h-2.5 w-2.5" /> {isCover ? "Capa ✓" : "Capa"}
                                </button>
                              </div>
                            )}
                            {isVideo && !isYearlyPlan && (
                              <div className="p-1 bg-muted text-center text-[9px] text-muted-foreground">Plano Anual p/ usar como capa</div>
                            )}
                          </div>
                        );
                      })}
                      {newPreviews.map((src, i) => {
                        const isVideo = newPhotos[i]?.type.startsWith("video/");
                        return (
                          <div key={`new-${i}`} className="relative flex flex-col rounded-lg overflow-hidden border-2 border-primary/30">
                            <div className="relative aspect-[3/4]">
                              {isVideo ? (
                                <video src={src} className="w-full h-full object-cover" muted playsInline />
                              ) : (
                                <img src={src} alt={`Nova mídia ${i + 1}`} className="w-full h-full object-cover" />
                              )}
                              <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">Nova</span>
                              <button type="button" onClick={() => removeNewPhoto(i)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="p-1 bg-muted text-center text-[9px] text-muted-foreground">Salve para selecionar como perfil/capa</div>
                          </div>
                        );
                      })}
                      {(isPaidPlan || totalImages < photoLimit) && (
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-[3/4] rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                          <Camera className="h-6 w-6" /><span className="text-xs">Adicionar</span>
                        </button>
                      )}
                    </div>
                    {!isYearlyPlan && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Crown className="h-3 w-3 text-yellow-500" />
                        Vídeo como foto principal disponível apenas no <span className="text-primary font-medium">Plano Anual</span>
                      </p>
                    )}
                    <input ref={fileInputRef} type="file" accept={isYearlyPlan ? "image/*,video/*" : "image/*"} multiple className="hidden" onChange={handleNewPhotos} />
                  </div>

                  {/* Verification Video */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
                      <Video className="h-4 w-4 text-primary" /> Vídeo de verificação (opcional)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Grave um vídeo curto mostrando seu rosto para verificar que você é real. Isso aumenta a confiança dos clientes.
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
                    <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setVerificationVideo(file);
                    }} />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 pt-4">
                    <Button type="submit" className="w-full gap-2" disabled={saving}>
                      {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>) : (<><Save className="h-4 w-4" /> Salvar alterações</>)}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => navigate(`/perfil/${profileId}`)}>Ver meu perfil</Button>
                    <Button type="button" variant="destructive" className="gap-2" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4" /> Excluir perfil
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* ── Aba: Criadora de Conteúdo ── */}
          {profileTypes.includes("conteudo") && (!showTabs || activeTab === "conteudo") && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total de mídias", value: contentMedia.length, icon: <LayoutDashboard className="h-4 w-4" /> },
                  { label: "Fotos", value: photoCount, icon: <ImageIcon className="h-4 w-4" /> },
                  { label: "Vídeos", value: videoCount, icon: <Video className="h-4 w-4" /> },
                ].map(({ label, value, icon }) => (
                  <Card key={label}>
                    <CardContent className="pt-4 pb-3 text-center">
                      <div className="flex justify-center text-primary mb-1">{icon}</div>
                      <p className="text-2xl font-bold text-foreground">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Upload zone */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" /> Enviar fotos e vídeos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setContentDragOver(true); }}
                    onDragLeave={() => setContentDragOver(false)}
                    onDrop={handleContentDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                      contentDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    {contentUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Enviando arquivos...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-foreground font-medium">Arraste fotos ou vídeos aqui</p>
                        <p className="text-xs text-muted-foreground">ou escolha abaixo</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 gap-2"
                      disabled={contentUploading || (!isPaidPlan && contentMedia.filter((m) => !isVideoUrl(m)).length >= 3)}
                      title={!isPaidPlan && contentMedia.filter((m) => !isVideoUrl(m)).length >= 3 ? "Limite de 3 fotos no plano Gratuito" : undefined}
                      onClick={() => contentPhotoInputRef.current?.click()}
                    >
                      <ImageIcon className="h-4 w-4" /> Adicionar fotos
                      {!isPaidPlan && contentMedia.filter((m) => !isVideoUrl(m)).length >= 3 && (
                        <span className="text-[10px] opacity-60">(limite)</span>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 gap-2"
                      disabled={contentUploading || (!isPaidPlan && contentMedia.filter((m) => isVideoUrl(m)).length >= 1)}
                      title={!isPaidPlan && contentMedia.filter((m) => isVideoUrl(m)).length >= 1 ? "Limite de 1 vídeo no plano Gratuito" : undefined}
                      onClick={() => contentVideoInputRef.current?.click()}
                    >
                      <Video className="h-4 w-4" /> Adicionar vídeos
                      {!isPaidPlan && contentMedia.filter((m) => isVideoUrl(m)).length >= 1 && (
                        <span className="text-[10px] opacity-60">(limite)</span>
                      )}
                    </Button>
                  </div>
                  <input ref={contentPhotoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleContentFileInput} />
                  <input ref={contentVideoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleContentFileInput} />
                </CardContent>
              </Card>

              {/* Media gallery */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Sua galeria</span>

                    {contentMedia.length > 0 && (
                      <span className="text-xs text-muted-foreground font-normal">
                        {contentMedia.length} arquivo{contentMedia.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {contentMedia.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3 text-[11px]">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-primary inline-block" /> Foto de perfil</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-purple-500 inline-block" /> Foto de capa</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-yellow-400 inline-block" /> Perfil e capa</span>
                      <span className="text-muted-foreground">— passe o mouse para trocar</span>
                    </div>
                  )}
                  {contentMedia.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Camera className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">Nenhuma mídia ainda.</p>
                      <p className="text-xs">Envie suas primeiras fotos ou vídeos acima.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {contentMedia.map((url) => {
                        const isProfile = url === selectedProfilePhoto;
                        const isCover = url === selectedCoverPhoto;
                        const isVideo = isVideoUrl(url);
                        const canSetVideo = isYearlyPlan;
                        return (
                        <div key={url} className={`relative group aspect-square rounded-lg overflow-hidden border-2 bg-muted transition-all ${isProfile && isCover ? "border-yellow-400" : isProfile ? "border-primary" : isCover ? "border-purple-500" : "border-border"}`}>
                          {isVideo ? (
                            <div className="w-full h-full flex items-center justify-center bg-black/80">
                              <video src={url} className="w-full h-full object-cover" muted playsInline />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <Video className="h-8 w-8 text-white/80" />
                              </div>
                            </div>
                          ) : (
                            <img src={url} alt="Mídia" className="w-full h-full object-cover" />
                          )}

                          {/* Badges de seleção */}
                          <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5">
                            {isProfile && (
                              <span className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                <Camera className="h-2.5 w-2.5" /> PERFIL
                              </span>
                            )}
                            {isCover && (
                              <span className="bg-purple-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                <ImageIcon className="h-2.5 w-2.5" /> CAPA
                              </span>
                            )}
                            {isVideo && (
                              <span className="bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded">Vídeo</span>
                            )}
                          </div>

                          {/* Botões de ação ao hover */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                            {(!isVideo || canSetVideo) && (
                              <button
                                type="button"
                                onClick={() => setAsProfilePhoto(url)}
                                disabled={isProfile}
                                className={`w-full text-[10px] px-2 py-1 rounded font-bold flex items-center justify-center gap-1 transition-colors ${isProfile ? "bg-primary/50 text-white cursor-default" : "bg-primary hover:bg-primary/80 text-white"}`}
                              >
                                <Camera className="h-3 w-3" />
                                {isProfile ? "Foto de perfil" : "Definir como perfil"}
                              </button>
                            )}
                            {(!isVideo || canSetVideo) && (
                              <button
                                type="button"
                                onClick={() => setAsCoverPhoto(url)}
                                disabled={isCover}
                                className={`w-full text-[10px] px-2 py-1 rounded font-bold flex items-center justify-center gap-1 transition-colors ${isCover ? "bg-purple-500/50 text-white cursor-default" : "bg-purple-500 hover:bg-purple-600 text-white"}`}
                              >
                                <ImageIcon className="h-3 w-3" />
                                {isCover ? "Foto de capa" : "Definir como capa"}
                              </button>
                            )}
                            {isVideo && !canSetVideo && (
                              <span className="text-[9px] text-yellow-300 text-center font-medium">Plano Anual p/ usar vídeo como perfil/capa</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleContentDelete(url)}
                              className="w-full text-[10px] px-2 py-1 rounded bg-destructive hover:bg-destructive/80 text-white font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" /> Remover
                            </button>
                          </div>
                        </div>
                        );
                      })}
                      <button
                        type="button"
                        disabled={contentUploading}
                        onClick={() => contentPhotoInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Plus className="h-6 w-6" />
                        <span className="text-xs">Adicionar</span>
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Excluir perfil de criadora */}
              <div className="pt-2">
                <Button type="button" variant="destructive" className="w-full gap-2" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                  {profileTypes.length > 1 ? "Remover perfil de criadora" : "Excluir perfil"}
                </Button>
              </div>
            </div>
          )}

          {/* ── Card: Meu Plano ── */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crown className="h-5 w-5 text-primary" /> Meu Plano
              </CardTitle>
              <CardDescription>Gerencie sua assinatura e veja quando ela vence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status atual */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${currentPlan === "free" ? "bg-muted" : "bg-primary/10"}`}>
                    {currentPlan === "free" ? (
                      <Zap className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Star className={`h-5 w-5 ${currentPlan === "yearly" ? "fill-yellow-500 text-yellow-500" : "text-primary"}`} />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Plano {currentPlan === "free" ? "Gratuito" : currentPlan === "monthly" ? "Mensal" : "Anual"}
                    </p>
                    {planExpiresAt && (
                      <p className={`text-xs flex items-center gap-1 mt-0.5 ${isPlanExpired(planExpiresAt) ? "text-destructive" : "text-muted-foreground"}`}>
                        <Calendar className="h-3 w-3" />
                        {isPlanExpired(planExpiresAt) ? "Venceu em " : "Vence em "}
                        {formatExpiry(planExpiresAt)}
                      </p>
                    )}
                    {!planExpiresAt && currentPlan === "free" && (
                      <p className="text-xs text-muted-foreground mt-0.5">Sem data de vencimento</p>
                    )}
                  </div>
                </div>
                {isPlanExpired(planExpiresAt) && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground">
                    Expirado
                  </span>
                )}
                {!isPlanExpired(planExpiresAt) && currentPlan !== "free" && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                    Ativo
                  </span>
                )}
              </div>

              {/* Botão para mostrar/ocultar troca de plano */}
              <button
                type="button"
                onClick={() => { setShowPlanChange((v) => !v); setSelectedNewPlan(null); }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-border hover:border-primary/40 text-sm font-medium text-foreground transition-colors"
              >
                Mudar plano
                {showPlanChange ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {/* Opções de plano */}
              {showPlanChange && (
                <div className="space-y-3 pt-1">
                  {[
                    {
                      id: "free",
                      name: "Gratuito",
                      label: "R$ 0",
                      sublabel: "para sempre",
                      icon: <Zap className="h-4 w-4" />,
                      color: "border-border",
                      features: ["Até 3 fotos", "Perfil básico"],
                      missing: ["Verificação", "Destaque", "Fotos ilimitadas", "Upload de vídeos", "Vídeo como foto de perfil"],
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
                      features: ["Fotos ilimitadas", "Verificação", "Destaque", "Upload de vídeos", "Selo verificada"],
                      missing: ["Vídeo como foto de perfil"],
                    },
                    {
                      id: "yearly",
                      name: "Anual",
                      label: "R$ 99,90",
                      sublabel: "por ano • -44%",
                      icon: <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />,
                      color: "border-yellow-500",
                      badge: "Melhor valor",
                      badgeColor: "bg-yellow-500 text-white",
                      features: ["Fotos ilimitadas", "Verificação", "Destaque", "Upload de vídeos", "Selo verificada", "Prioridade no ranking", "Vídeo como foto de perfil"],
                      missing: [],
                    },
                  ].map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedNewPlan(plan.id)}
                      disabled={plan.id === currentPlan}
                      className={`w-full text-left rounded-xl border-2 p-3 transition-all relative ${
                        plan.id === currentPlan
                          ? "opacity-40 cursor-not-allowed border-border"
                          : selectedNewPlan === plan.id
                          ? plan.color + " ring-2 ring-offset-1 ring-primary/40 bg-primary/5"
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      {"badge" in plan && plan.badge && (
                        <span className={`absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${"badgeColor" in plan ? plan.badgeColor : ""}`}>
                          {plan.badge}
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-lg ${selectedNewPlan === plan.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {plan.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-foreground text-sm">{plan.name}</p>
                            {plan.id === currentPlan && <span className="text-[10px] text-muted-foreground">(atual)</span>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-bold text-foreground">{plan.label}</span> {plan.sublabel}
                          </p>
                        </div>
                        {selectedNewPlan === plan.id && (
                          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <Check className="h-2.5 w-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {plan.features.map((f: string) => (
                          <span key={f} className="text-[11px] text-foreground flex items-center gap-1">
                            <Check className="h-2.5 w-2.5 text-green-500 shrink-0" /> {f}
                          </span>
                        ))}
                        {plan.missing.map((f: string) => (
                          <span key={f} className="text-[11px] text-muted-foreground/50 line-through flex items-center gap-1">
                            <X className="h-2.5 w-2.5 shrink-0" /> {f}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}

                  <Button
                    type="button"
                    onClick={handleChangePlan}
                    disabled={!selectedNewPlan || planSaving}
                    className="w-full gap-2"
                  >
                    {planSaving ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Aguarde...</>
                    ) : selectedNewPlan && selectedNewPlan !== "free" ? (
                      "Ir para pagamento →"
                    ) : (
                      "Confirmar mudança de plano"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Card: Indicações ── */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gift className="h-5 w-5 text-pink-500" /> Programa de Indicação
              </CardTitle>
              <CardDescription>Indique outras modelos e ganhe R$ 5,00 por cada uma que ativar um plano</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Saldo */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Wallet className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Saldo acumulado</p>
                    <p className="text-xs text-muted-foreground">
                      {referralBalance >= 100
                        ? "Você pode solicitar o saque!"
                        : `Faltam R$ ${(100 - referralBalance).toFixed(2)} para poder sacar`}
                    </p>
                  </div>
                </div>
                <p className={`text-2xl font-bold ${referralBalance >= 100 ? "text-green-600" : "text-foreground"}`}>
                  R$ {referralBalance.toFixed(2)}
                </p>
              </div>

              {referralBalance >= 100 && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-sm text-green-700 dark:text-green-400">
                  🎉 Você atingiu R$ 100,00! Entre em contato via WhatsApp para solicitar seu saque via PIX.
                </div>
              )}

              {/* Link de indicação */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Seu link de indicação</p>
                {referralCode ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground break-all font-mono">
                      {`https://xmodelprive.com/cadastro?ref=${referralCode}`}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://xmodelprive.com/cadastro?ref=${referralCode}`);
                        toast.success("Link copiado!");
                      }}
                      className="shrink-0 p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Seu código será gerado automaticamente.</p>
                )}
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Compartilhe seu link com outras modelos</p>
                <p>• Quando elas ativarem qualquer plano pago, você ganha R$ 5,00</p>
                <p>• Acumule R$ 100,00 para solicitar o saque via PIX</p>
              </div>

            </CardContent>
          </Card>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EditProfilePage;
