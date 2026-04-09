import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturedProfiles from "@/components/FeaturedProfiles";
import Footer from "@/components/Footer";

const Index = () => {
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
