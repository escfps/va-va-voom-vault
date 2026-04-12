import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturedProfiles from "@/components/FeaturedProfiles";
import Footer from "@/components/Footer";
import { useSeo } from "@/lib/useSeo";

const Index = () => {
  useSeo({
    title: "Acompanhantes Verificadas no Brasil",
    description: "Encontre acompanhantes verificadas perto de você. Perfis reais com fotos exclusivas, avaliações e contato direto via WhatsApp. Discreção total.",
    keywords: "acompanhantes Brasil, acompanhante verificada, modelos, garotas de programa, xmodelprive",
    canonical: "https://xmodelprive.com",
  });
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeaturedProfiles />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
