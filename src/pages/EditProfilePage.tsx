import { useState, useRef, useEffect } from "react";
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
import { Camera, X, Loader2, Save, Trash2 } from "lucide-react";

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);

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
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error(error);
        toast.error("Erro ao carregar perfil");
        setLoading(false);
        return;
      }

      if (!data) {
        setLoading(false);
        return;
      }

      setProfileId(data.id);
      setExistingImages(data.images || []);
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
  }, [user]);

  const handleNewPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length - removedImages.length + newPhotos.length + files.length;
    if (totalImages > 10) {
      toast.error("Máximo de 10 fotos permitidas");
      return;
    }
    setNewPhotos((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setNewPreviews((prev) => [...prev, ...previews]);
  };

  const removeExistingImage = (url: string) => {
    setRemovedImages((prev) => [...prev, url]);
  };

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
    if (!user || !profileId) return;

    setSaving(true);
    try {
      const uploadedUrls = await uploadNewPhotos();
      const finalImages = [
        ...existingImages.filter((url) => !removedImages.includes(url)),
        ...uploadedUrls,
      ];

      if (finalImages.length === 0) {
        toast.error("Adicione pelo menos 1 foto");
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          name: form.name,
          age: parseInt(form.age),
          city: form.city,
          state: form.state,
          phone: form.phone,
          description: form.description,
          tagline: form.tagline,
          price: parseInt(form.price),
          image: finalImages[0],
          images: finalImages,
          cover_image: finalImages[0],
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

  const handleDelete = async () => {
    if (!profileId || !confirm("Tem certeza que deseja excluir seu perfil? Essa ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", profileId);
    if (error) {
      toast.error("Erro ao excluir perfil");
    } else {
      toast.success("Perfil excluído");
      navigate("/");
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

  const activeImages = existingImages.filter((url) => !removedImages.includes(url));
  const totalImages = activeImages.length + newPhotos.length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Editar Meu Perfil</CardTitle>
              <CardDescription>Atualize seus dados e fotos a qualquer momento</CardDescription>
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
                    <div>
                      <Label htmlFor="age">Idade *</Label>
                      <Input id="age" type="number" min="18" max="60" value={form.age} onChange={(e) => update("age", e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="phone">WhatsApp *</Label>
                      <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
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
                          {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (
                            <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tagline">Frase de destaque</Label>
                    <Input id="tagline" value={form.tagline} onChange={(e) => update("tagline", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="description">Sobre você *</Label>
                    <Textarea id="description" value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} required />
                  </div>
                  <div>
                    <Label htmlFor="price">Valor por hora (R$) *</Label>
                    <Input id="price" type="number" min="50" value={form.price} onChange={(e) => update("price", e.target.value)} required />
                  </div>
                </div>

                {/* Appearance */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground border-b border-border pb-2">Aparência</h3>
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
                          {["Branca", "Morena", "Negra", "Asiática", "Indígena", "Outra"].map((e) => (
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
                          {["Castanho", "Verde", "Azul", "Mel", "Preto"].map((c) => (
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
                          {["Loira", "Castanha", "Ruiva", "Preta", "Colorido"].map((c) => (
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
                          {["Curto", "Médio", "Longo"].map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Gênero</Label>
                      <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Mulher", "Homem", "Trans", "Outro"].map((g) => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Atende</Label>
                      <Select value={form.attendsTo} onValueChange={(v) => update("attendsTo", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Homens", "Mulheres", "Homens e mulheres", "Homens e casais", "Todos"].map((a) => (
                            <SelectItem key={a} value={a}>{a}</SelectItem>
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
                        <Switch checked={form[key as keyof typeof form] as boolean} onCheckedChange={(v) => update(key, v)} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Photos */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground border-b border-border pb-2">Suas fotos</h3>
                  <p className="text-sm text-muted-foreground">Até 10 fotos. A primeira será sua foto principal.</p>

                  <div className="grid grid-cols-3 gap-3">
                    {activeImages.map((src, i) => (
                      <div key={src} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border">
                        <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                        {i === 0 && newPhotos.length === 0 && (
                          <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">Principal</span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeExistingImage(src)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {newPreviews.map((src, i) => (
                      <div key={`new-${i}`} className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-primary/30">
                        <img src={src} alt={`Nova foto ${i + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">Nova</span>
                        <button
                          type="button"
                          onClick={() => removeNewPhoto(i)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {totalImages < 10 && (
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
                    onChange={handleNewPhotos}
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-4">
                  <Button type="submit" className="w-full gap-2" disabled={saving}>
                    {saving ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                    ) : (
                      <><Save className="h-4 w-4" /> Salvar alterações</>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate(`/perfil/${profileId}`)}>
                    Ver meu perfil
                  </Button>
                  <Button type="button" variant="destructive" className="gap-2" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4" /> Excluir perfil
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EditProfilePage;
