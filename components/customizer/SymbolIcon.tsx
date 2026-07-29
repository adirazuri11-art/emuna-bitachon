// גלריית הסמלים המאושרת לרקמה/אריגה/חריטה.
// מרונדרת גם בבורר וגם בתוך התצוגה המקדימה (SVG טהור).

export function SymbolIcon({
  id,
  color = '#D4AF37',
  size = 28,
}: {
  id: string;
  color?: string;
  size?: number;
}) {
  const stroke = { stroke: color, strokeWidth: 2.2, fill: 'none', strokeLinejoin: 'round' as const };
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      {id === 'magen-david' && (
        <>
          <path d="M16 4 L26 21 L6 21 Z" {...stroke} />
          <path d="M16 28 L6 11 L26 11 Z" {...stroke} />
        </>
      )}
      {id === 'crown' && (
        <path d="M5 23 L7 10 L12 17 L16 7 L20 17 L25 10 L27 23 Z" {...stroke} />
      )}
      {id === 'chai' && (
        <text
          x="16"
          y="24"
          textAnchor="middle"
          fontFamily="var(--font-frank), serif"
          fontWeight={700}
          fontSize="22"
          fill={color}
        >
          חי
        </text>
      )}
      {id === 'olive' && (
        <>
          <path d="M6 26 C12 18 18 12 26 6" {...stroke} />
          <ellipse cx="12" cy="18" rx="4" ry="2.2" transform="rotate(-40 12 18)" {...stroke} />
          <ellipse cx="18" cy="12" rx="4" ry="2.2" transform="rotate(-40 18 12)" {...stroke} />
          <ellipse cx="17" cy="20" rx="4" ry="2.2" transform="rotate(30 17 20)" {...stroke} />
        </>
      )}
      {id === 'pomegranate' && (
        <>
          <circle cx="16" cy="19" r="8" {...stroke} />
          <path d="M12 12 L13.5 7 L16 10 L18.5 7 L20 12" {...stroke} />
        </>
      )}
    </svg>
  );
}
