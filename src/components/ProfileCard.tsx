import { Link } from "react-router-dom";
import { MapPin, Star, CheckCircle, Crown, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import FavoriteButton from "@/components/FavoriteButton";
import Watermark from "@/components/Watermark";
import { getNivel } from "@/lib/nivel";

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
  referralBonusUntil?: string | null;
  viewCount?: number;
  referralCount?: number;
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
  referralBonusUntil,
  viewCount = 0,
  referralCount = 0,
}: ProfileCardProps) => {
  const isYearly = plan === "yearly";
  const isMonthly = plan === "monthly";
  const hasBonus = !!referralBonusUntil && new Date(referralBonusUntil) > new Date();
  const nivel = getNivel(viewCount, referralCount);
  const wrapperClass = "relative group block bg-card rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1";

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

        {isYearly && (
          <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 via-transparent to-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        )}

        <Watermark className="absolute bottom-14 right-2 z-10" size="md" />

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
          {hasBonus && !isYearly && !isMonthly && (
            <Badge className="gap-1 text-xs font-bold tracking-wide text-white" style={{ background: "linear-gradient(135deg, #e91e8c, #ff6ec7)", boxShadow: "0 2px 8px rgba(233,30,140,0.5)" }}>
              <Gift className="h-3 w-3" />
              DESTAQUE
            </Badge>
          )}
          {nivel.tier !== "ferro" && (
            <Badge
              className="gap-1 text-xs font-bold tracking-wide border-0"
              style={{
                background: nivel.tier === "x"
                  ? "linear-gradient(135deg, #0a0a0a, #7c3aed, #a855f7)"
                  : nivel.color,
                color: ["prata", "platina", "diamante"].includes(nivel.tier) ? "#0a0a0a" : nivel.tier === "x" ? "#fff" : "#0a0a0a",
                boxShadow: `0 2px 8px ${nivel.glowColor}`,
              }}
            >
              {nivel.label}
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

  // Config do wrapper animado — planos pagos têm prioridade, free usa nível
  const wrapperConfig = isYearly
    ? {
        background: "linear-gradient(135deg, #b8860b, #ffd700, #f0c040, #b8860b)",
        animationName: "goldPulse",
        keyframes: `@keyframes goldPulse {
          0%, 100% { box-shadow: 0 0 18px rgba(255,215,0,0.6), 0 4px 32px rgba(255,215,0,0.3); }
          50% { box-shadow: 0 0 36px rgba(255,215,0,1), 0 4px 48px rgba(255,215,0,0.6); }
        }`,
      }
    : isMonthly
    ? {
        background: "linear-gradient(135deg, #dc2626, #ef4444, #f87171, #dc2626)",
        animationName: "redPulse",
        keyframes: `@keyframes redPulse {
          0%, 100% { box-shadow: 0 0 18px rgba(239,68,68,0.6), 0 4px 32px rgba(239,68,68,0.3); }
          50% { box-shadow: 0 0 36px rgba(239,68,68,1), 0 4px 48px rgba(239,68,68,0.6); }
        }`,
      }
    : hasBonus
    ? {
        background: "linear-gradient(135deg, #e91e8c, #ff6ec7, #e91e8c)",
        animationName: "pinkPulse",
        keyframes: `@keyframes pinkPulse {
          0%, 100% { box-shadow: 0 0 14px rgba(233,30,140,0.5), 0 4px 24px rgba(233,30,140,0.2); }
          50% { box-shadow: 0 0 28px rgba(233,30,140,0.9), 0 4px 36px rgba(233,30,140,0.5); }
        }`,
      }
    : {
        background: nivel.borderGradient,
        animationName: nivel.animationName,
        keyframes: nivel.keyframes,
      };

  return (
    <div
      className="relative rounded-xl p-[3px] group"
      style={{
        background: wrapperConfig.background,
        animation: `${wrapperConfig.animationName} 2.5s ease-in-out infinite`,
      }}
    >
      <style>{wrapperConfig.keyframes}</style>
      {card}
    </div>
  );
};

export default ProfileCard;
