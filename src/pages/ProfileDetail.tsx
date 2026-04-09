import { useParams, Link } from "react-router-dom";
import { mockProfiles } from "@/data/mockProfiles";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Star, CheckCircle, Phone, Ruler, Weight } from "lucide-react";

const ProfileDetail = () => {
  const { id } = useParams();
  const profile = mockProfiles.find((p) => p.id === id);

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Perfil não encontrado</h2>
            <Link to="/">
              <Button className="mt-4">Voltar ao início</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Images */}
            <div className="space-y-4">
              <div className="aspect-[3/4] rounded-xl overflow-hidden">
                <img
                  src={profile.images[0]}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {profile.images.length > 1 && (
                <div className="grid grid-cols-3 gap-3">
                  {profile.images.slice(1).map((img, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden">
                      <img
                        src={img}
                        alt={`${profile.name} ${i + 2}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">
                  {profile.name}, {profile.age}
                </h1>
                {profile.verified && (
                  <Badge className="bg-primary text-primary-foreground gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Verificada
                  </Badge>
                )}
              </div>

              <p className="flex items-center gap-1.5 text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                {profile.city}, {profile.state}
              </p>

              <div className="flex items-center gap-1.5 mb-6">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{profile.rating.toFixed(1)}</span>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 mb-6">
                <p className="text-2xl font-bold text-primary mb-1">
                  R$ {profile.price.toLocaleString("pt-BR")}
                </p>
                <p className="text-sm text-muted-foreground">Valor a partir de</p>
              </div>

              <p className="text-foreground leading-relaxed mb-6">
                {profile.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {profile.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Ruler className="h-4 w-4" />
                  Altura: {profile.height}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Weight className="h-4 w-4" />
                  Peso: {profile.weight}
                </div>
              </div>

              <Button
                size="lg"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-base"
              >
                <Phone className="h-5 w-5" />
                Entrar em contato
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfileDetail;
