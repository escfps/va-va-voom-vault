import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  profileId: string;
  className?: string;
  size?: "sm" | "default";
}

const FavoriteButton = ({ profileId, className, size = "sm" }: FavoriteButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(profileId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Faça login para favoritar");
      navigate("/login");
      return;
    }
    toggleFavorite.mutate(profileId);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-all",
        className
      )}
      onClick={handleClick}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-colors",
          fav ? "fill-primary text-primary" : "text-foreground"
        )}
      />
    </Button>
  );
};

export default FavoriteButton;
