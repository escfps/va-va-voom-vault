interface WatermarkProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { x: "text-3xl",  brand: "text-[9px]",  gap: "gap-0" },
  md: { x: "text-5xl",  brand: "text-xs",     gap: "gap-0.5" },
  lg: { x: "text-7xl",  brand: "text-base",   gap: "gap-1" },
};

const Watermark = ({ className = "", size = "md" }: WatermarkProps) => {
  const s = sizes[size];
  return (
    <div
      className={`pointer-events-none select-none flex flex-col items-center ${s.gap} opacity-25 drop-shadow-lg ${className}`}
    >
      <span className={`${s.x} font-black text-red-600 leading-none`} style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
        X
      </span>
      <span className={`${s.brand} font-bold text-white tracking-widest uppercase leading-none`} style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
        modelprive
      </span>
    </div>
  );
};

export default Watermark;
