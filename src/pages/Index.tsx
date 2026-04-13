import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturedProfiles from "@/components/FeaturedProfiles";
import Footer from "@/components/Footer";
import { useSeo } from "@/lib/useSeo";

const Index = () => {
  useSeo({
    title: "XMODELPRIVE - A nova plataforma de acompanhantes que está conquistando o Brasil!",
    description: "Modelos com perfis selecionados, fotos reais, contato direto e total liberdade para escolher, anunciar e faturar. Tudo com descrição completa, transparência e uma experiência exclusiva.",
    keywords: "acompanhantes Brasil, acompanhante verificada, modelos, garotas de programa, xmodelprive, anunciar acompanhante",
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
