export type RiskSeverity = "high" | "moderate";

const LABEL: Record<RiskSeverity, string> = { high: "High", moderate: "Moderate" };

// "pill" reproduces NeedsAttention.tsx's original badge treatment (rounded-full, bordered,
// sage-app red/amber-50 palette). "chip" reproduces the client-detail safety banner's
// treatment (rounded, no border, chart-banner-* design tokens so it stays legible on that
// banner's tinted background). Both were previously hand-duplicated per call site.
const PILL_STYLES: Record<RiskSeverity, string> = {
  high: "text-red-600 bg-red-50 border-red-200",
  moderate: "text-amber-700 bg-amber-50 border-amber-200",
};

const CHIP_STYLES: Record<RiskSeverity, string> = {
  high: "bg-chart-banner-high-border text-chart-banner-high-text",
  moderate: "bg-chart-banner-medium-border text-chart-banner-medium-text",
};

export function SeverityBadge({
  severity,
  variant = "pill",
  className = "",
}: {
  severity: RiskSeverity;
  variant?: "pill" | "chip";
  className?: string;
}) {
  if (variant === "chip") {
    return (
      <span className={`flex-shrink-0 font-semibold px-1.5 py-0.5 rounded ${CHIP_STYLES[severity]} ${className}`}>
        {LABEL[severity]}
      </span>
    );
  }
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${PILL_STYLES[severity]} ${className}`}>
      {LABEL[severity]}
    </span>
  );
}
