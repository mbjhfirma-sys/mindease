import { Plus_Jakarta_Sans } from "next/font/google";

const wordmarkFont = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["700"] });

export default function Logo({
  variant = "color",
  height = 28,
  className = "",
}: {
  variant?: "color" | "white";
  height?: number;
  className?: string;
}) {
  const isWhite = variant === "white";
  const circleBack = isWhite ? "#D8F3DC" : "#1B4332";
  const circleFront = "#74C69D";
  const textColor = isWhite ? "#FFFFFF" : "#1B4332";

  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ gap: Math.round(height * 0.26) }}
    >
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
        className="flex-shrink-0"
        style={{ height, width: height }}
      >
        <circle cx="24" cy="32" r="19" fill={circleBack} />
        <circle cx="41" cy="32" r="19" fill={circleFront} />
      </svg>
      <span
        className={wordmarkFont.className}
        style={{
          fontSize: Math.round(height * 0.8),
          lineHeight: 1,
          color: textColor,
          letterSpacing: "-0.01em",
        }}
      >
        YouMindo
      </span>
    </span>
  );
}
