import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useFavorites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favoriteIds = [], isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("favorites")
        .select("profile_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((f) => f.profile_id);
    },
    enabled: !!user,
  });

  const toggleFavorite = useMutation({
    mutationFn: async (profileId: string) => {
      if (!user) throw new Error("Login necessário");
      const isFav = favoriteIds.includes(profileId);
      if (isFav) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("profile_id", profileId);
        if (error) throw error;
        return { action: "removed" as const };
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, profile_id: profileId });
        if (error) throw error;
        return { action: "added" as const };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(
        result.action === "added"
          ? "Adicionado aos favoritos ❤️"
          : "Removido dos favoritos"
      );
    },
    onError: () => {
      toast.error("Erro ao atualizar favoritos");
    },
  });

  const isFavorite = (profileId: string) => favoriteIds.includes(profileId);

  return { favoriteIds, isLoading, toggleFavorite, isFavorite };
};
