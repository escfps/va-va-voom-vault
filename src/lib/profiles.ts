import { supabase } from "@/integrations/supabase/client";
import type { Profile, ServiceItem, PriceItem, Review } from "@/data/mockProfiles";

// Ordenação: anual > mensal > bônus 7 dias > X > esmeralda > diamante > platina > ouro > prata > bronze > ferro
const NIVEL_RANK: Record<string, number> = {
  x: 3, esmeralda: 4, diamante: 5, platina: 6, ouro: 7, prata: 8, bronze: 9, ferro: 10,
};

function getNivelTier(viewCount: number, referralCount: number): string {
  if (viewCount >= 50000 && referralCount >= 200) return "x";
  if (viewCount >= 30000 && referralCount >= 100) return "esmeralda";
  if (viewCount >= 15000 && referralCount >= 60)  return "diamante";
  if (viewCount >= 7000  && referralCount >= 30)  return "platina";
  if (viewCount >= 3000  && referralCount >= 15)  return "ouro";
  if (viewCount >= 1000  && referralCount >= 5)   return "prata";
  if (viewCount >= 300   && referralCount >= 2)   return "bronze";
  return "ferro";
}

function profileRank(p: any): number {
  if (p.plan === "yearly") return 0;
  if (p.plan === "monthly") return 1;
  if (hasActiveBonus(p)) return 2;
  return NIVEL_RANK[getNivelTier(p.viewCount ?? 0, p.referralCount ?? 0)] ?? 10;
}

function mapDbToProfile(row: any): Profile {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    city: row.city,
    state: row.state,
    tagline: row.tagline ?? "",
    image: row.image ?? "",
    images: row.images ?? [],
    coverImage: row.cover_image ?? "",
    price: row.price,
    priceDuration: row.price_duration ?? "1 hora",
    plan: row.plan ?? "free",
    verified: row.verified ?? false,
    verifiedDate: row.verified_date ?? undefined,
    rating: Number(row.rating ?? 0),
    reviewCount: row.review_count ?? 0,
    tags: row.tags ?? [],
    description: row.description ?? "",
    phone: row.phone ?? "",
    height: row.height ?? "",
    weight: row.weight ?? "",
    gender: row.gender ?? "",
    genderDescription: row.gender_description ?? "",
    genitalia: row.genitalia ?? "",
    sexualPreference: row.sexual_preference ?? "",
    sexualPreferenceDescription: row.sexual_preference_description ?? "",
    ethnicity: row.ethnicity ?? "",
    eyeColor: row.eye_color ?? "",
    hairColor: row.hair_color ?? "",
    hairLength: row.hair_length ?? "",
    shoeSize: row.shoe_size ?? "",
    silicone: row.silicone ?? false,
    tattoos: row.tattoos ?? false,
    piercings: row.piercings ?? false,
    smoker: row.smoker ?? false,
    languages: row.languages ?? [],
    location: row.location ?? "",
    locationZone: row.location_zone ?? "",
    locationDistance: row.location_distance ?? "",
    placesServed: row.places_served ?? "",
    amenities: row.amenities ?? "",
    neighborhoods: row.neighborhoods ?? [],
    nearbyCities: row.nearby_cities ?? null,
    hasOwnPlace: row.has_own_place ?? false,
    attendsTo: row.attends_to ?? "",
    maxClients: row.max_clients ?? "",
    pricing: (row.pricing as PriceItem[]) ?? [],
    paymentMethods: row.payment_methods ?? [],
    schedule: (row.schedule as { day: string; hours: string | null }[]) ?? [],
    profileCreatedAt: row.profile_created_at ?? "",
    detailedServices: (row.detailed_services as ServiceItem[]) ?? [],
    services: row.services ?? [],
    reviews: (row.reviews as Review[]) ?? [],
    profileTypes: (row.tags ?? []).filter((t: string) => t === "acompanhante" || t === "conteudo").length > 0
      ? (row.tags ?? []).filter((t: string) => t === "acompanhante" || t === "conteudo")
      : ["acompanhante"],
    userId: row.user_id ?? undefined,
    isActive: row.is_active ?? true,
    status: row.status ?? "pending",
    referralBonusUntil: row.referral_bonus_until ?? null,
    viewCount: row.view_count ?? 0,
    referralCount: row.referral_count ?? 0,
  };
}

function hasActiveBonus(profile: any): boolean {
  return !!profile.referralBonusUntil && new Date(profile.referralBonusUntil) > new Date();
}

const LISTING_FIELDS = [
  "id", "name", "age", "city", "state", "tagline", "image", "images", "cover_image",
  "price", "price_duration", "plan", "verified", "verified_date",
  "rating", "review_count", "tags", "gender",
  "is_active", "status", "user_id", "created_at", "view_count", "referral_count",
].join(", ");

export async function fetchProfiles(): Promise<Profile[]> {
  // Tenta com o campo de bônus; se a coluna não existir ainda, faz fallback sem ela
  let { data, error } = await (supabase
    .from("profiles")
    .select(LISTING_FIELDS + ", referral_bonus_until") as any)
    .eq("status", "approved")
    .eq("is_active", true)
    .limit(200);

  if (error) {
    // Fallback sem a coluna de bônus (migration ainda não rodada)
    const fallback = await (supabase
      .from("profiles")
      .select(LISTING_FIELDS) as any)
      .eq("status", "approved")
      .eq("is_active", true)
      .limit(200);

    if (fallback.error) {
      console.error("Error fetching profiles:", fallback.error);
      return [];
    }
    data = fallback.data;
  }

  return (data ?? [])
    .map(mapDbToProfile)
    .sort((a: any, b: any) => profileRank(a) - profileRank(b));
}

export async function fetchProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return mapDbToProfile(data);
}

export async function fetchProfilesByCity(city: string, excludeId?: string): Promise<Profile[]> {
  let query = (supabase
    .from("profiles")
    .select("*") as any)
    .eq("city", city)
    .eq("status", "approved");

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.limit(20);

  if (error) {
    console.error("Error fetching profiles by city:", error);
    return [];
  }

  return (data ?? [])
    .map(mapDbToProfile)
    .sort((a, b) => profileRank(a) - profileRank(b))
    .slice(0, 3);
}
