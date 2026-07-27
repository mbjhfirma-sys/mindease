export default function StatSparkline({ values, width = 64, height = 24 }: { values: number[]; width?: number; height?: number }) {
  const max = Math.max(...values, 1);
  const n = values.length;
  const topPad = 3;
  const bottomPad = 3;

  const xAt = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * width);
  const yAt = (v: number) => height - bottomPad - (v / max) * (height - topPad - bottomPad);

  const line = values.map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(" ");
  const lastSegment = n >= 2 ? `M${xAt(n - 2).toFixed(1)},${yAt(values[n - 2]).toFixed(1)} L${xAt(n - 1).toFixed(1)},${yAt(values[n - 1]).toFixed(1)}` : "";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible flex-none">
      <path d={line} fill="none" stroke="var(--color-stone-300)" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      {lastSegment && <path d={lastSegment} fill="none" stroke="var(--color-sage-600)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
      <circle cx={xAt(n - 1)} cy={yAt(values[n - 1])} r={2.6} fill="var(--color-sage-600)" />
    </svg>
  );
}
