export function toProfileSlug(name: string, id: string): string {
  const nameSlug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  // UUID sem hífens (32 chars) — permite reconstruir o UUID completo depois
  const hexId = id.replace(/-/g, "");
  return `${nameSlug}-${hexId}`;
}

export function extractIdFromSlug(slug: string): string {
  // Os últimos 32 chars hex são o UUID sem hífens
  const hexId = slug.slice(-32);
  // Reconstrói o UUID: 8-4-4-4-12
  return `${hexId.slice(0,8)}-${hexId.slice(8,12)}-${hexId.slice(12,16)}-${hexId.slice(16,20)}-${hexId.slice(20)}`;
}
