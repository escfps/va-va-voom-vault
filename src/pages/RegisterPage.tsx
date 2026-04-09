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
import { Camera, X, Upload, Loader2 } from "lucide-react";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [step, setStep] = useState(1);

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

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 10) {
      toast.error("Máximo de 10 fotos permitidas");
      return;
    }
    const newPhotos = [...photos, ...files];
    setPhotos(newPhotos);
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
      const { data: urlData } = supabase.storage
        .from("model-photos")
        .getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Você precisa estar logado para cadastrar um perfil");
      navigate("/login");
      return;
    }
    if (photos.length === 0) {
      toast.error("Adicione pelo menos 1 foto");
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

      const { error } = await supabase.from("profiles").insert({
        user_id: user.id,
        name: form.name,
        age: parseInt(form.age),
        city: form.city,
        state: form.state,
        phone: form.phone,
        description: form.description,
        tagline: form.tagline,
        price: parseInt(form.price),
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
        verified: false,
        rating: 0,
        review_count: 0,
        tags: [],
        pricing: [
          { duration: "1 hora", price: parseInt(form.price) },
        ],
        payment_methods: ["Dinheiro", "PIX"],
        schedule: [
          { day: "Segunda-feira", hours: "08:00 - 22:00" },
          { day: "Terça-feira", hours: "08:00 - 22:00" },
          { day: "Quarta-feira", hours: "08:00 - 22:00" },
          { day: "Quinta-feira", hours: "08:00 - 22:00" },
          { day: "Sexta-feira", hours: "08:00 - 22:00" },
          { day: "Sábado", hours: "10:00 - 20:00" },
          { day: "Domingo", hours: null },
        ],
        profile_created_at: new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
        detailed_services: [],
        services: [],
        reviews: [],
      });

      if (error) {
        console.error("Insert error:", error);
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
              <h2 className="text-xl font-bold text-foreground">Faça login para continuar</h2>
              <p className="text-muted-foreground">Você precisa estar logado para cadastrar seu perfil de modelo.</p>
              <Button onClick={() => navigate("/login")} className="w-full">Fazer login</Button>
              <Button variant="outline" onClick={() => navigate("/cadastro-usuario")} className="w-full">Criar conta</Button>
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
              <CardDescription>
                Preencha seus dados e adicione suas melhores fotos
              </CardDescription>
              <div className="flex justify-center gap-2 mt-4">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-2 w-16 rounded-full transition-colors ${
                      s <= step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                {/* Step 1: Basic info */}
                {step === 1 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Dados pessoais</h3>
                    <div>
                      <Label htmlFor="name">Nome artístico *</Label>
                      <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="Como você quer ser chamada" />
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
                            {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (
                              <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="tagline">Frase de destaque</Label>
                      <Input id="tagline" value={form.tagline} onChange={(e) => update("tagline", e.target.value)} placeholder="Ex: Loira fitness com atendimento premium" />
                    </div>
                    <div>
                      <Label htmlFor="description">Sobre você *</Label>
                      <Textarea id="description" value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} required placeholder="Descreva você, seu atendimento e o que oferece..." />
                    </div>
                    <div>
                      <Label htmlFor="price">Valor por hora (R$) *</Label>
                      <Input id="price" type="number" min="50" value={form.price} onChange={(e) => update("price", e.target.value)} required placeholder="300" />
                    </div>
                    <Button type="button" className="w-full" onClick={() => setStep(2)}>
                      Próximo: Aparência
                    </Button>
                  </div>
                )}

                {/* Step 2: Appearance */}
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

                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>Voltar</Button>
                      <Button type="button" className="flex-1" onClick={() => setStep(3)}>Próximo: Fotos</Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Photos */}
                {step === 3 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Suas fotos</h3>
                    <p className="text-sm text-muted-foreground">Adicione até 10 fotos. A primeira será sua foto principal.</p>

                    <div className="grid grid-cols-3 gap-3">
                      {previews.map((src, i) => (
                        <div key={i} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border">
                          <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                          {i === 0 && (
                            <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">Principal</span>
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
                      {photos.length < 10 && (
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

                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>Voltar</Button>
                      <Button type="submit" className="flex-1 gap-2" disabled={loading || photos.length === 0}>
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Criando perfil...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Publicar perfil
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
