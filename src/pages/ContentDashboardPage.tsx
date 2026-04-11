import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Upload, Trash2, Loader2, ImageIcon, Video, Edit,
  ShoppingBag, Camera, LayoutDashboard, Plus, Eye,
} from "lucide-react";

const isVideo = (url: string) => /\.(mp4|mov|webm|avi|mkv|m4v)(\?.*)?$/i.test(url);

const CONTENT_TYPE_LABELS: Record<string, string> = {
  "Fotos": "📸 Fotos",
  "Vídeos": "🎬 Vídeos",
  "Packs temáticos": "🎁 Packs temáticos",
  "Assinatura mensal": "⭐ Assinatura mensal",
  "Lives": "🔴 Lives",
  "Chamadas de vídeo": "📞 Chamadas de vídeo",
  "Fan page exclusiva": "💎 Fan page exclusiva",
};

const ContentDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [media, setMedia] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setLoading(false);
        if (data) {
          setProfile(data);
          setMedia(data.images ?? []);
        }
      });
  }, [user]);

  const uploadFiles = async (files: File[]) => {
    if (!user || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const folder = file.type.startsWith("video/") ? "videos" : "fotos";
      const path = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("model-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) {
        console.error("Upload error:", error);
        toast.error(`Erro ao enviar ${file.name}`);
        continue;
      }
      const { data: urlData } = supabase.storage.from("model-photos").getPublicUrl(path);
      newUrls.push(urlData.publicUrl);
    }

    if (newUrls.length > 0) {
      const updated = [...media, ...newUrls];
      const { error } = await supabase
        .from("profiles")
        .update({ images: updated, image: updated[0], cover_image: updated[0] })
        .eq("user_id", user.id);

      if (!error) {
        setMedia(updated);
        toast.success(`${newUrls.length} arquivo(s) enviado(s) com sucesso!`);
      } else {
        toast.error("Erro ao salvar no perfil: " + error.message);
      }
    }
    setUploading(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) uploadFiles(files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (files.length) uploadFiles(files);
  };

  const handleDelete = async (url: string) => {
    const updated = media.filter((m) => m !== url);
    const { error } = await supabase
      .from("profiles")
      .update({ images: updated, image: updated[0] ?? null, cover_image: updated[0] ?? null })
      .eq("user_id", user!.id);

    if (!error) {
      setMedia(updated);
      toast.success("Arquivo removido");
    } else {
      toast.error("Erro ao remover: " + error.message);
    }
  };

  const setAsCover = async (url: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ image: url, cover_image: url })
      .eq("user_id", user!.id);

    if (!error) {
      toast.success("Foto principal atualizada!");
    }
  };

  // ── Estados de carregamento / sem perfil ─────────────────────────────────────

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-sm mx-4">
            <CardContent className="pt-6 text-center space-y-3">
              <p className="font-semibold">Faça login para acessar o painel</p>
              <Button onClick={() => navigate("/login")} className="w-full">Entrar</Button>
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

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-sm mx-4">
            <CardContent className="pt-6 text-center space-y-3">
              <ShoppingBag className="h-10 w-10 text-primary mx-auto" />
              <p className="font-semibold">Você ainda não tem um perfil</p>
              <Button onClick={() => navigate("/cadastro")} className="w-full">Criar perfil</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const profileTypes: string[] = (profile.tags ?? []).filter(
    (t: string) => t === "acompanhante" || t === "conteudo"
  );
  const isContentCreator = profileTypes.includes("conteudo");

  if (!isContentCreator) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center space-y-4">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto" />
              <h2 className="text-xl font-bold">Painel de criadora</h2>
              <p className="text-muted-foreground text-sm">
                Seu perfil não está cadastrado como vendedora de conteúdo. Edite seu perfil para adicionar essa categoria.
              </p>
              <Button onClick={() => navigate("/meu-perfil")} className="w-full gap-2">
                <Edit className="h-4 w-4" /> Editar meu perfil
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Conteúdo que a criadora vende (itens prefixados com "Conteúdo:" nos services)
  const contentServices = (profile.services ?? [])
    .filter((s: string) => s.startsWith("Conteúdo: "))
    .map((s: string) => s.replace("Conteúdo: ", ""));

  const photoCount = media.filter((m) => !isVideo(m)).length;
  const videoCount = media.filter((m) => isVideo(m)).length;
  const coverUrl = profile.image ?? media[0];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-6">

          {/* ── Header ── */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-muted border border-border flex-shrink-0">
                {coverUrl ? (
                  <img src={coverUrl} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <Camera className="h-7 w-7 m-auto mt-3.5 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">{profile.name}</h1>
                  <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    <ShoppingBag className="h-3 w-3" /> Criadora
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{profile.city} · {profile.state}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/meu-perfil")} className="gap-2">
              <Edit className="h-4 w-4" /> Editar perfil completo
            </Button>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total de mídias", value: media.length, icon: <LayoutDashboard className="h-4 w-4" /> },
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

          {/* ── O que você vende ── */}
          {contentServices.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">O que você vende</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {contentServices.map((ct: string) => (
                    <span key={ct} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                      {CONTENT_TYPE_LABELS[ct] ?? ct}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Upload ── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" /> Enviar fotos e vídeos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Drag-and-drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Enviando arquivos...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-foreground font-medium">
                      Arraste fotos ou vídeos aqui
                    </p>
                    <p className="text-xs text-muted-foreground">ou escolha abaixo</p>
                  </div>
                )}
              </div>

              {/* Botões de upload */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  disabled={uploading}
                  onClick={() => photoInputRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4" /> Adicionar fotos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  disabled={uploading}
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Video className="h-4 w-4" /> Adicionar vídeos
                </Button>
              </div>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />
            </CardContent>
          </Card>

          {/* ── Galeria de mídia ── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Sua galeria</span>
                {media.length > 0 && (
                  <span className="text-xs text-muted-foreground font-normal">
                    {media.length} arquivo{media.length !== 1 ? "s" : ""}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {media.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Camera className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Nenhuma mídia ainda.</p>
                  <p className="text-xs">Envie suas primeiras fotos ou vídeos acima.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {media.map((url, i) => (
                    <div
                      key={url}
                      className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted"
                    >
                      {isVideo(url) ? (
                        <div className="w-full h-full flex items-center justify-center bg-black/80">
                          <video
                            src={url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Video className="h-8 w-8 text-white/80" />
                          </div>
                        </div>
                      ) : (
                        <img src={url} alt={`Mídia ${i + 1}`} className="w-full h-full object-cover" />
                      )}

                      {/* Badges */}
                      <div className="absolute top-1.5 left-1.5 flex gap-1">
                        {i === 0 && (
                          <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-medium">
                            Principal
                          </span>
                        )}
                        {isVideo(url) && (
                          <span className="bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                            Vídeo
                          </span>
                        )}
                      </div>

                      {/* Hover actions */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {!isVideo(url) && i !== 0 && (
                          <button
                            type="button"
                            onClick={() => setAsCover(url)}
                            title="Definir como principal"
                            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                          >
                            <Eye className="h-4 w-4 text-white" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(url)}
                          title="Remover"
                          className="p-1.5 bg-destructive/80 hover:bg-destructive rounded-full transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Botão adicionar inline na grade */}
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => photoInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Plus className="h-6 w-6" />
                    <span className="text-xs">Adicionar</span>
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContentDashboardPage;
