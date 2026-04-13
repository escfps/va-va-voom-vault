export type EloTier = "ferro" | "bronze" | "prata" | "ouro" | "platina" | "diamante" | "esmeralda" | "x";

export interface EloInfo {
  tier: EloTier;
  label: string;
  color: string;
  borderGradient: string;
  animationName: string;
  keyframes: string;
  glowColor: string;
}

const TIERS: { tier: EloTier; minViews: number; minReferrals: number }[] = [
  { tier: "x",          minViews: 50000, minReferrals: 200 },
  { tier: "esmeralda",  minViews: 30000, minReferrals: 100 },
  { tier: "diamante",   minViews: 15000, minReferrals: 60  },
  { tier: "platina",    minViews: 7000,  minReferrals: 30  },
  { tier: "ouro",       minViews: 3000,  minReferrals: 15  },
  { tier: "prata",      minViews: 1000,  minReferrals: 5   },
  { tier: "bronze",     minViews: 300,   minReferrals: 2   },
  { tier: "ferro",      minViews: 0,     minReferrals: 0   },
];

const ELO_META: Record<EloTier, Omit<EloInfo, "tier">> = {
  ferro: {
    label: "Ferro",
    color: "#8a8a8a",
    glowColor: "rgba(138,138,138,0.6)",
    borderGradient: "linear-gradient(135deg, #555, #9a9a9a, #555)",
    animationName: "ferroPulse",
    keyframes: `@keyframes ferroPulse {
      0%,100% { box-shadow: 0 0 10px rgba(138,138,138,0.4), 0 4px 20px rgba(138,138,138,0.2); }
      50%      { box-shadow: 0 0 20px rgba(138,138,138,0.8), 0 4px 32px rgba(138,138,138,0.4); }
    }`,
  },
  bronze: {
    label: "Bronze",
    color: "#cd7f32",
    glowColor: "rgba(205,127,50,0.6)",
    borderGradient: "linear-gradient(135deg, #7c4f1a, #cd7f32, #e8a96b, #cd7f32)",
    animationName: "bronzePulse",
    keyframes: `@keyframes bronzePulse {
      0%,100% { box-shadow: 0 0 12px rgba(205,127,50,0.5), 0 4px 24px rgba(205,127,50,0.2); }
      50%      { box-shadow: 0 0 24px rgba(205,127,50,0.9), 0 4px 40px rgba(205,127,50,0.5); }
    }`,
  },
  prata: {
    label: "Prata",
    color: "#c0c0c0",
    glowColor: "rgba(192,192,192,0.6)",
    borderGradient: "linear-gradient(135deg, #888, #c0c0c0, #e8e8e8, #c0c0c0)",
    animationName: "prataPulse",
    keyframes: `@keyframes prataPulse {
      0%,100% { box-shadow: 0 0 12px rgba(192,192,192,0.5), 0 4px 24px rgba(192,192,192,0.2); }
      50%      { box-shadow: 0 0 24px rgba(192,192,192,0.9), 0 4px 40px rgba(192,192,192,0.5); }
    }`,
  },
  ouro: {
    label: "Ouro",
    color: "#ffd700",
    glowColor: "rgba(255,215,0,0.7)",
    borderGradient: "linear-gradient(135deg, #b8860b, #ffd700, #fff176, #ffd700, #b8860b)",
    animationName: "ouroPulse",
    keyframes: `@keyframes ouroPulse {
      0%,100% { box-shadow: 0 0 16px rgba(255,215,0,0.6), 0 4px 28px rgba(255,215,0,0.3); }
      50%      { box-shadow: 0 0 32px rgba(255,215,0,1.0), 0 4px 48px rgba(255,215,0,0.6); }
    }`,
  },
  platina: {
    label: "Platina",
    color: "#00e5c0",
    glowColor: "rgba(0,229,192,0.6)",
    borderGradient: "linear-gradient(135deg, #007a66, #00e5c0, #80fff0, #00e5c0, #007a66)",
    animationName: "platinaPulse",
    keyframes: `@keyframes platinaPulse {
      0%,100% { box-shadow: 0 0 16px rgba(0,229,192,0.5), 0 4px 28px rgba(0,229,192,0.2); }
      50%      { box-shadow: 0 0 32px rgba(0,229,192,0.9), 0 4px 48px rgba(0,229,192,0.5); }
    }`,
  },
  diamante: {
    label: "Diamante",
    color: "#60a5fa",
    glowColor: "rgba(96,165,250,0.6)",
    borderGradient: "linear-gradient(135deg, #1d4ed8, #60a5fa, #bfdbfe, #60a5fa, #1d4ed8)",
    animationName: "diamantePulse",
    keyframes: `@keyframes diamantePulse {
      0%,100% { box-shadow: 0 0 18px rgba(96,165,250,0.5), 0 4px 32px rgba(96,165,250,0.3); }
      50%      { box-shadow: 0 0 36px rgba(96,165,250,1.0), 0 4px 52px rgba(96,165,250,0.6); }
    }`,
  },
  esmeralda: {
    label: "Esmeralda",
    color: "#10b981",
    glowColor: "rgba(16,185,129,0.6)",
    borderGradient: "linear-gradient(135deg, #065f46, #10b981, #6ee7b7, #10b981, #065f46)",
    animationName: "esmeraldaPulse",
    keyframes: `@keyframes esmeraldaPulse {
      0%,100% { box-shadow: 0 0 18px rgba(16,185,129,0.5), 0 4px 32px rgba(16,185,129,0.3); }
      50%      { box-shadow: 0 0 36px rgba(16,185,129,1.0), 0 4px 52px rgba(16,185,129,0.6); }
    }`,
  },
  x: {
    label: "X",
    color: "#a855f7",
    glowColor: "rgba(168,85,247,0.8)",
    borderGradient: "linear-gradient(135deg, #0a0a0a, #7c3aed, #a855f7, #ec4899, #a855f7, #7c3aed, #0a0a0a)",
    animationName: "xPulse",
    keyframes: `@keyframes xPulse {
      0%   { box-shadow: 0 0 24px rgba(168,85,247,0.7), 0 4px 40px rgba(236,72,153,0.4); }
      33%  { box-shadow: 0 0 40px rgba(236,72,153,0.9), 0 4px 60px rgba(168,85,247,0.6); }
      66%  { box-shadow: 0 0 40px rgba(168,85,247,1.0), 0 4px 60px rgba(236,72,153,0.7); }
      100% { box-shadow: 0 0 24px rgba(168,85,247,0.7), 0 4px 40px rgba(236,72,153,0.4); }
    }`,
  },
};

export function getElo(viewCount: number, referralCount: number): EloInfo {
  for (const t of TIERS) {
    if (viewCount >= t.minViews && referralCount >= t.minReferrals) {
      return { tier: t.tier, ...ELO_META[t.tier] };
    }
  }
  return { tier: "ferro", ...ELO_META.ferro };
}

export function getNextElo(viewCount: number, referralCount: number): { tier: EloTier; label: string; missingViews: number; missingReferrals: number } | null {
  const current = getElo(viewCount, referralCount);
  const idx = TIERS.findIndex(t => t.tier === current.tier);
  if (idx === 0) return null; // já é X
  const next = TIERS[idx - 1];
  return {
    tier: next.tier,
    label: ELO_META[next.tier].label,
    missingViews: Math.max(0, next.minViews - viewCount),
    missingReferrals: Math.max(0, next.minReferrals - referralCount),
  };
}
