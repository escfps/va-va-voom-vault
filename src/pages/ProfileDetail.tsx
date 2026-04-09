import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { mockProfiles } from "@/data/mockProfiles";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, MapPin, Star, CheckCircle, MessageCircle, Heart, Flag,
  Ruler, Weight, Eye, Scissors, Languages, Home, Users, Clock, Camera,
  User, MessageSquare, ChevronDown, ChevronUp, ShieldCheck, Video,
  DollarSign, Banknote, CreditCard, Smartphone,
} from "lucide-react";

const ProfileDetail = () => {
  const { id } = useParams();
  const profile = mockProfiles.find((p) => p.id === id);
  const [activeTab, setActiveTab] = useState<"fotos" | "sobre" | "avaliacoes">("fotos");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedService, setExpandedService] = useState<string | null>(null);

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Perfil não encontrado</h2>
            <Link to="/"><Button className="mt-4">Voltar ao início</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const tabs = [
    { key: "fotos" as const, label: "Fotos", icon: Camera, count: profile.images.length },
    { key: "sobre" as const, label: "Sobre mim", icon: User },
    { key: "avaliacoes" as const, label: "Avaliações", icon: MessageSquare, count: profile.reviewCount },
  ];

  const characteristics = [
    { label: "Gênero", value: profile.gender, description: profile.genderDescription },
    { label: "Genitália", value: profile.genitalia },
    { label: "Preferência sexual", value: profile.sexualPreference, description: profile.sexualPreferenceDescription },
    { label: "Peso", value: profile.weight },
    { label: "Altura", value: profile.height },
    { label: "Etnia", value: profile.ethnicity },
    { label: "Cor dos olhos", value: profile.eyeColor },
    { label: "Estilo de cabelo", value: profile.hairColor },
    { label: "Tamanho de cabelo", value: profile.hairLength },
    { label: "Tamanho do pé", value: profile.shoeSize },
    { label: "Silicone", value: profile.silicone ? "Sim" : "Não" },
    { label: "Tatuagens", value: profile.tattoos ? "Sim" : "Não" },
    { label: "Piercings", value: profile.piercings ? "Sim" : "Não" },
    { label: "Fumante", value: profile.smoker ? "Sim" : "Não informado" },
    { label: "Idiomas", value: profile.languages.join(", ") },
  ];

  const offeredServices = profile.detailedServices.filter((s) => s.does);
  const notOfferedServices = profile.detailedServices.filter((s) => !s.does);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Cover */}
        <div className="relative h-48 md:h-72 overflow-hidden">
          <img src={profile.coverImage} alt={`Capa de ${profile.name}`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <Link to="/" className="inline-flex items-center gap-2 bg-background/70 backdrop-blur px-4 py-2 rounded-lg text-sm text-foreground hover:bg-background/90 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
            <div className="flex gap-2">
              <button className="bg-background/70 backdrop-blur p-2 rounded-lg hover:bg-background/90 transition-colors">
                <Heart className="h-4 w-4 text-foreground" />
              </button>
              <button className="bg-background/70 backdrop-blur p-2 rounded-lg hover:bg-background/90 transition-colors">
                <Flag className="h-4 w-4 text-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Profile Header */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-background overflow-hidden shadow-xl flex-shrink-0">
              <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 pt-2">
              <p className="text-sm text-muted-foreground mb-1">{profile.tagline}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">{profile.name}</h1>
                {profile.verified && (
                  <Badge className="bg-primary text-primary-foreground gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Verificada
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                <span>Mulher</span><span>·</span>
                <span>{profile.age} anos</span><span>·</span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {profile.rating.toFixed(1)}
                </span>
              </div>
              {profile.verified && profile.verifiedDate && (
                <p className="text-xs text-primary mt-2 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Verificada em {profile.verifiedDate}
                </p>
              )}
            </div>
          </div>

          {/* Cards row */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            {/* Reviews mini */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Avaliações recentes</h3>
              <div className="space-y-3">
                {profile.reviews.slice(0, 2).map((review, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded text-xs font-semibold text-primary flex-shrink-0">
                      <Star className="h-3 w-3 fill-current" />{review.rating.toFixed(1)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{review.timeAgo}</p>
                      <p className="text-sm text-foreground truncate">{review.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setActiveTab("avaliacoes")} className="text-xs text-primary mt-3 hover:underline">
                Ver todas as avaliações
              </button>
            </div>

            {/* Pricing */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-primary mb-1 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Valores
              </h3>
              <p className="text-xs text-muted-foreground">a partir de</p>
              <p className="text-3xl font-bold text-foreground mt-1">R$ {profile.price.toLocaleString("pt-BR")}</p>
              <p className="text-sm text-muted-foreground">({profile.priceDuration})</p>
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Users className="h-3 w-3" /> Atende: {profile.attendsTo}
              </p>
            </div>

            {/* Location */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Localização
              </h3>
              <p className="text-sm text-foreground mt-2">{profile.location}</p>
              {profile.hasOwnPlace && (
                <p className="text-xs text-primary mt-2 flex items-center gap-1">
                  <Home className="h-3 w-3" /> Com local próprio
                </p>
              )}
            </div>
          </div>

          {/* WhatsApp CTA */}
          <div className="mt-6">
            <Button size="lg" className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white gap-2 text-base px-8">
              <MessageCircle className="h-5 w-5" /> Chamar no WhatsApp
            </Button>
          </div>

          {/* Tabs */}
          <div className="mt-10 border-b border-border">
            <div className="flex gap-0">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {tab.count !== undefined && <span className="text-xs opacity-70">({tab.count})</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="py-8">
            {/* FOTOS */}
            {activeTab === "fotos" && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" /> Galeria de fotos
                </h2>

                {/* Verification video placeholder */}
                {profile.verified && (
                  <div className="bg-card border border-border rounded-xl p-5 mb-6 flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      <Video className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">Vídeo de verificação</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Este perfil possui um vídeo de verificação confirmando que a pessoa é real e as fotos são autênticas.
                      </p>
                      <button className="text-xs text-primary mt-1 hover:underline flex items-center gap-1">
                        <Video className="h-3 w-3" /> Assistir vídeo
                      </button>
                    </div>
                  </div>
                )}

                {/* Media verification badge */}
                <div className="bg-card border border-border rounded-xl p-4 mb-6 flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Mídias Verificadas</p>
                    <p className="text-xs text-muted-foreground">
                      O selo de Mídia Verificada sinaliza que a pessoa da foto é real e verificada pela Model X.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {profile.images.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImage(img)} className="aspect-[3/4] rounded-xl overflow-hidden group">
                      <img src={img} alt={`${profile.name} foto ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SOBRE */}
            {activeTab === "sobre" && (
              <div className="space-y-8">
                {/* Description */}
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-3">Descrição</h2>
                  <p className="text-foreground leading-relaxed">{profile.description}</p>
                </div>

                {/* Physical Characteristics - Fatal Model style */}
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    Características físicas
                  </h2>
                  <div className="grid grid-cols-2 gap-0">
                    {characteristics.map((char) => (
                      <div key={char.label} className="border-b border-border py-4 px-2">
                        <p className="text-sm font-semibold text-foreground">{char.label}</p>
                        <p className="text-sm text-primary mt-0.5">{char.value}</p>
                        {"description" in char && char.description && (
                          <p className="text-xs text-muted-foreground italic mt-0.5">{char.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attendance */}
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-3">Atendimento</h2>
                  <div className="bg-card border-l-4 border-l-primary border border-border rounded-xl p-5 space-y-2">
                    <p className="text-sm text-foreground">
                      <strong>Atende:</strong> {profile.attendsTo}
                    </p>
                    <p className="text-sm text-foreground">
                      <strong>Clientes em conjunto:</strong> {profile.maxClients}
                    </p>
                  </div>
                </div>

                {/* Services offered - Fatal Model style */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-semibold text-foreground italic">Serviços oferecidos</h2>
                    <div className="flex-1 h-px bg-primary/30" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-0">
                    {offeredServices.map((service) => (
                      <div key={service.name} className="border-b border-border py-3 px-2">
                        <button
                          onClick={() => setExpandedService(expandedService === service.name ? null : service.name)}
                          className="flex items-center justify-between w-full text-left"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{service.name}</p>
                            <Badge variant="outline" className="mt-1 text-xs border-primary text-primary">
                              Faço
                            </Badge>
                          </div>
                          {expandedService === service.name ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </button>
                        {expandedService === service.name && (
                          <p className="text-xs text-muted-foreground mt-2">{service.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Services NOT offered */}
                {notOfferedServices.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-lg font-semibold text-foreground italic">Serviços não oferecidos</h2>
                      <div className="flex-1 h-px bg-muted-foreground/30" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-0">
                      {notOfferedServices.map((service) => (
                        <div key={service.name} className="border-b border-border py-3 px-2">
                          <button
                            onClick={() => setExpandedService(expandedService === service.name ? null : service.name)}
                            className="flex items-center justify-between w-full text-left"
                          >
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">{service.name}</p>
                              <Badge variant="outline" className="mt-1 text-xs border-destructive text-destructive">
                                Não faço
                              </Badge>
                            </div>
                            {expandedService === service.name ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                          </button>
                          {expandedService === service.name && (
                            <p className="text-xs text-muted-foreground mt-2">{service.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location */}
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-3">Localização</h2>
                  <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm text-foreground">{profile.location}</span>
                    </div>
                    {profile.hasOwnPlace && (
                      <div className="flex items-center gap-3">
                        <Home className="h-4 w-4 text-primary" />
                        <span className="text-sm text-foreground">Possui <strong>local próprio</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* AVALIAÇÕES */}
            {activeTab === "avaliacoes" && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-card border border-border rounded-xl p-5 text-center">
                    <p className="text-3xl font-bold text-foreground">{profile.rating.toFixed(1)}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.round(profile.rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{profile.reviewCount} avaliações</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {profile.reviews.map((review, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} className={`h-4 w-4 ${j < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{review.timeAgo}</span>
                      </div>
                      <p className="text-sm text-foreground">{review.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating WhatsApp mobile */}
        <div className="fixed bottom-6 left-4 right-4 md:hidden z-40">
          <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 shadow-xl">
            <MessageCircle className="h-5 w-5" /> Chamar no WhatsApp
          </Button>
        </div>

        {/* Lightbox */}
        {selectedImage && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
            <img src={selectedImage} alt="Foto ampliada" className="max-w-full max-h-full object-contain rounded-lg" />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProfileDetail;
