import { supabase } from "@/integrations/supabase/client";
import type { Profile, ServiceItem, PriceItem, Review } from "@/data/mockProfiles";

const PLAN_RANK: Record<string, number> = { yearly: 0, monthly: 1, free: 2 };

function planRank(plan: string | null | undefined): number {
  return PLAN_RANK[plan ?? "free"] ?? 2;
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
  };
}

function hasActiveBonus(profile: any): boolean {
  return !!profile.referralBonusUntil && new Date(profile.referralBonusUntil) > new Date();
}

const LISTING_FIELDS = [
  "id", "name", "age", "city", "state", "tagline", "image", "images", "cover_image",
  "price", "price_duration", "plan", "verified", "verified_date",
  "rating", "review_count", "tags", "gender",
  "is_active", "status", "user_id", "created_at",
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
    .sort((a: any, b: any) => {
      // Bonificadas aparecem logo após os planos pagos
      const bonusA = hasActiveBonus(a) ? 0 : 1;
      const bonusB = hasActiveBonus(b) ? 0 : 1;
      const rankA = planRank(a.plan) * 10 + bonusA;
      const rankB = planRank(b.plan) * 10 + bonusB;
      return rankA - rankB;
    });
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
    .sort((a, b) => planRank(a.plan) - planRank(b.plan))
    .slice(0, 3);
}
