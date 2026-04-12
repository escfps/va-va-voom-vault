import { useEffect } from "react";

interface SeoProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
}

export function useSeo({ title, description, keywords, canonical }: SeoProps) {
  useEffect(() => {
    const siteName = "X Model Privê";

    // Title
    document.title = title ? `${title} | ${siteName}` : siteName;

    // Description
    setMeta("description", description ?? "Encontre acompanhantes verificadas perto de você. Perfis reais, fotos exclusivas e contato direto. Acesse xmodelprive.com");

    // Keywords
    if (keywords) setMeta("keywords", keywords);

    // Canonical
    if (canonical) {
      let link = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    // OG
    setOg("og:title", title ? `${title} | ${siteName}` : siteName);
    setOg("og:description", description ?? "Encontre acompanhantes verificadas perto de você.");
    setOg("og:url", canonical ?? window.location.href);
  }, [title, description, keywords, canonical]);
}

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

function setOg(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.content = content;
}
