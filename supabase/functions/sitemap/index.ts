import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BASE_URL = "https://xmodelprive.com";

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Busca cidades únicas com perfis aprovados
  const { data: profiles } = await supabase
    .from("profiles")
    .select("city, state")
    .eq("status", "approved")
    .eq("is_active", true);

  // Deduplica cidades
  const citySet = new Map<string, { city: string; state: string }>();
  for (const p of profiles ?? []) {
    if (!p.city || !p.state) continue;
    const key = `${toSlug(p.city)}-${p.state.toLowerCase()}`;
    if (!citySet.has(key)) citySet.set(key, { city: p.city, state: p.state });
  }

  const today = new Date().toISOString().split("T")[0];

  // Páginas estáticas
  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "daily" },
    { url: "/busca", priority: "0.9", changefreq: "daily" },
    { url: "/ranking", priority: "0.7", changefreq: "weekly" },
    { url: "/cadastro", priority: "0.6", changefreq: "monthly" },
  ];

  const staticUrls = staticPages
    .map(
      (p) => `
  <url>
    <loc>${BASE_URL}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
    )
    .join("");

  // Páginas de cidade
  const cityUrls = [...citySet.entries()]
    .map(
      ([slug, { city, state }]) => `
  <url>
    <loc>${BASE_URL}/acompanhantes/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${cityUrls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
