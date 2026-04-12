import { Link } from "react-router-dom";
import { MapPin, Star, CheckCircle, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import FavoriteButton from "@/components/FavoriteButton";
import logo from "@/assets/logo.png";

interface ProfileCardProps {
  id: string;
  name: string;
  age: number;
  city: string;
  image: string;
  price: number;
  verified: boolean;
  rating: number;
  tags?: string[];
  plan?: string;
}

const ProfileCard = ({
  id,
  name,
  age,
  city,
  image,
  price,
  verified,
  rating,
  tags = [],
  plan = "free",
}: ProfileCardProps) => {
  const isYearly = plan === "yearly";
  const isMonthly = plan === "monthly";

  const wrapperClass = isYearly
    ? "relative group block bg-card rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
    : isMonthly
    ? "group block bg-card rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 border-[3px] border-red-500 shadow-[0_0_14px_rgba(239,68,68,0.5)]"
    : "group block bg-card rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 border border-border shadow-sm";

  const card = (
    <Link to={`/perfil/${id}`} className={wrapperClass}>
      <div className="relative aspect-[3/4] overflow-hidden">
        {/\.(mp4|mov|webm|avi|mkv|m4v)(\?.*)?$/i.test(image) ? (
          <video
            src={image}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            autoPlay muted loop playsInline
          />
        ) : (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        )}

        {/* Overlay dourado animado no hover — só anual */}
        {isYearly && (
          <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 via-transparent to-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        )}

        {/* Watermark logo */}
        <div className="absolute bottom-14 right-2 z-10 pointer-events-none select-none">
          <img
            src={logo}
            alt="X Model Privê"
            className="w-16 opacity-40 drop-shadow-md"
          />
        </div>

        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton profileId={id} />
        </div>

        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {verified && (
            <Badge className="bg-primary text-primary-foreground gap-1 text-xs">
              <CheckCircle className="h-3 w-3" />
              Verificada
            </Badge>
          )}
          {isYearly && (
            <Badge
              className="gap-1 text-xs font-bold tracking-wide border-0"
              style={{
                background: "linear-gradient(135deg, #b8860b, #ffd700, #b8860b)",
                color: "#1a0a00",
                boxShadow: "0 2px 8px rgba(255,215,0,0.6)",
              }}
            >
              <Crown className="h-3 w-3" />
              PREMIUM
            </Badge>
          )}
          {isMonthly && (
            <Badge className="bg-red-500 text-white gap-1 text-xs font-bold tracking-wide">
              <Star className="h-3 w-3 fill-white text-white" />
              VIP
            </Badge>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h3 className="text-lg font-semibold text-white">
            {name}, {age}
          </h3>
          <p className="text-white/80 text-sm flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {city}
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            R$ {price.toLocaleString("pt-BR")}
          </span>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            {rating.toFixed(1)}
          </span>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );

  if (!isYearly) return card;

  // Wrapper com borda dourada animada via pseudo-elemento simulado com div
  return (
    <div
      className="relative rounded-xl p-[3px] group"
      style={{
        background: "linear-gradient(135deg, #b8860b, #ffd700, #f0c040, #b8860b)",
        boxShadow: "0 0 18px rgba(255,215,0,0.55), 0 4px_32px rgba(255,215,0,0.25)",
        animation: "goldPulse 2.5s ease-in-out infinite",
      }}
    >
      <style>{`
        @keyframes goldPulse {
          0%, 100% { box-shadow: 0 0 18px rgba(255,215,0,0.55), 0 4px 32px rgba(255,215,0,0.25); }
          50% { box-shadow: 0 0 32px rgba(255,215,0,0.9), 0 4px 40px rgba(255,215,0,0.5); }
        }
      `}</style>
      {card}
    </div>
  );
};

export default ProfileCard;
