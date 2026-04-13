import { getNivel, getNextNivel } from "@/lib/nivel";

interface NivelCardProps {
  viewCount: number;
  referralCount: number;
}

export default function NivelCard({ viewCount, referralCount }: NivelCardProps) {
  const nivel = getNivel(viewCount, referralCount);
  const next = getNextNivel(viewCount, referralCount);

  const isX = nivel.tier === "x";
  const isDark = ["prata", "platina", "diamante"].includes(nivel.tier);

  return (
    <div
      className="mt-3 rounded-xl p-[2px]"
      style={{
        background: nivel.borderGradient,
        boxShadow: `0 0 16px ${nivel.glowColor}`,
      }}
    >
      <style>{nivel.keyframes}</style>
      <div className="bg-card rounded-[10px] px-4 py-3 flex flex-col gap-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-bold px-2 py-0.5 rounded-full"
              style={{
                background: isX
                  ? "linear-gradient(135deg, #0a0a0a, #7c3aed, #a855f7)"
                  : nivel.color,
                color: isDark ? "#0a0a0a" : isX ? "#fff" : "#0a0a0a",
                boxShadow: `0 2px 8px ${nivel.glowColor}`,
              }}
            >
              {nivel.label}
            </span>
            <span className="text-xs text-muted-foreground font-medium">Nível</span>
          </div>
          {isX && (
            <span className="text-xs font-bold" style={{ color: nivel.color }}>
              ✦ Nível máximo
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>👁 <strong className="text-foreground">{viewCount.toLocaleString("pt-BR")}</strong> views</span>
          <span>🔗 <strong className="text-foreground">{referralCount}</strong> indicações</span>
        </div>

        {/* Progresso para o próximo nível */}
        {next && (
          <div className="text-xs text-muted-foreground border-t border-border pt-2 mt-1">
            <p className="mb-1.5">
              Próximo nível:{" "}
              <strong className="text-foreground">{next.label}</strong>
            </p>
            <div className="flex flex-col gap-1">
              {next.missingViews > 0 && (
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span>Views</span>
                    <span>faltam {next.missingViews.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (viewCount / (viewCount + next.missingViews)) * 100)}%`,
                        background: nivel.color,
                      }}
                    />
                  </div>
                </div>
              )}
              {next.missingReferrals > 0 && (
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span>Indicações</span>
                    <span>faltam {next.missingReferrals}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (referralCount / (referralCount + next.missingReferrals)) * 100)}%`,
                        background: nivel.color,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
