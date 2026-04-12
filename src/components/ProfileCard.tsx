import { Link } from "react-router-dom";
import { MapPin, Star, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import FavoriteButton from "@/components/FavoriteButton";

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
}: ProfileCardProps) => {
  return (
    <Link
      to={`/perfil/${id}`}
      className="group block bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
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
        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton profileId={id} />
        </div>
        {verified && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary text-primary-foreground gap-1 text-xs">
              <CheckCircle className="h-3 w-3" />
              Verificada
            </Badge>
          </div>
        )}
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
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs font-normal"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProfileCard;
