"use client";

interface BarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}

export default function SimpleBarChart({ data, color = "#7c3aed", height = 200 }: BarChartProps) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;
  const padding = barWidth * 0.2;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${data.length * 100} ${height}`} className="w-full" style={{ height }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
          <line
            key={tick}
            x1="0"
            y1={height - tick * (height - 30)}
            x2={data.length * 100}
            y2={height - tick * (height - 30)}
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 30);
          const x = index * 100 + padding;
          const y = height - barHeight - 20;

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={100 - padding * 2}
                height={barHeight}
                fill={color}
                rx="4"
                opacity="0.9"
              />
              <text
                x={x + (100 - padding * 2) / 2}
                y={y - 5}
                textAnchor="middle"
                className="text-xs"
                fill="#374151"
                fontSize="12"
              >
                {item.value > 0 ? `฿${(item.value / 1000).toFixed(0)}k` : ""}
              </text>
              <text
                x={x + (100 - padding * 2) / 2}
                y={height - 5}
                textAnchor="middle"
                className="text-xs"
                fill="#6b7280"
                fontSize="12"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
