interface MapLegendProps {
  label: string;
  domain: [number, number];
  palette: string[];
  formatValue: (value: number) => string;
}

export function MapLegend({ label, domain, palette, formatValue }: MapLegendProps) {
  return (
    <div className="w-48 rounded-md sm:w-60 border border-line bg-canopy/90 px-3 py-2.5 backdrop-blur">
      <p className="mb-1.5 text-xs font-medium text-parchment">{label}</p>
      <div
        className="h-2.5 rounded-sm"
        style={{ background: `linear-gradient(to right, ${palette.join(', ')})` }}
        role="img"
        aria-label={`Colour scale from ${formatValue(domain[0])} to ${formatValue(domain[1])}`}
      />
      <div className="num mt-1 flex justify-between text-xs text-fog">
        <span>{formatValue(domain[0])}</span>
        <span>{formatValue(domain[1])}</span>
      </div>
    </div>
  );
}
