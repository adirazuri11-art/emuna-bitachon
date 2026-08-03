// Dependency-free area/line chart (inline SVG). Brand gold on transparent.

interface Point {
  date: string;
  count: number;
}

export function AreaChart({ data, height = 120 }: { data: Point[]; height?: number }) {
  const w = 640;
  const h = height;
  const pad = 6;
  const max = Math.max(1, ...data.map((d) => d.count));
  const n = data.length;
  const x = (i: number) => (n <= 1 ? w / 2 : pad + (i * (w - pad * 2)) / (n - 1));
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2);

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.count).toFixed(1)}`).join(' ');
  const area = `${line} L ${x(n - 1).toFixed(1)} ${h - pad} L ${x(0).toFixed(1)} ${h - pad} Z`;
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" preserveAspectRatio="none" role="img">
      <defs>
        <linearGradient id="crmArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D4AF37" stopOpacity="0.35" />
          <stop offset="1" stopColor="#D4AF37" stopOpacity="0" />
        </linearGradient>
      </defs>
      {total > 0 ? (
        <>
          <path d={area} fill="url(#crmArea)" />
          <path d={line} fill="none" stroke="#E8D48B" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {data.map((d, i) =>
            d.count > 0 ? <circle key={i} cx={x(i)} cy={y(d.count)} r="2.5" fill="#E8D48B" /> : null,
          )}
        </>
      ) : (
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#ffffff22" strokeWidth="1" />
      )}
    </svg>
  );
}
