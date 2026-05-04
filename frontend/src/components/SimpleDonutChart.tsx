"use client";

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: Segment[];
  size?: number;
  innerRadius?: number;
}

export default function SimpleDonutChart({
  data,
  size = 200,
  innerRadius = 0.55,
}: DonutChartProps) {
  if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height: size }}>
        ไม่มีข้อมูล
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR * innerRadius;

  let cumulativeAngle = -Math.PI / 2;

  const arcs = data.map((seg) => {
    const fraction = seg.value / total;
    const angle = fraction * Math.PI * 2;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    return { ...seg, fraction, startAngle, endAngle: cumulativeAngle };
  });

  const describeArc = (startAngle: number, endAngle: number, r: number) => {
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  return (
    <div className="w-full flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {arcs.map((arc, i) => (
          <path
            key={i}
            d={`${describeArc(arc.startAngle, arc.endAngle, innerR)} L ${cx + outerR * Math.cos(arc.endAngle)} ${cy + outerR * Math.sin(arc.endAngle)} ${describeArc(arc.endAngle, arc.startAngle, outerR)} Z`}
            fill={arc.color}
            opacity={0.9}
          />
        ))}
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#374151" fontSize="16" fontWeight="bold">
          ฿{(total / 1000).toFixed(0)}k
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#9ca3af" fontSize="11">
          รวม
        </text>
      </svg>
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {arcs.map((arc, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: arc.color }} />
            <span>{arc.label}</span>
            <span className="font-medium text-gray-800">{Math.round(arc.fraction * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
