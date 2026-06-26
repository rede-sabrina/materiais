import React from 'react'

export default function BarChart({
  data = [],
  height = 240,
  color = '#2466f3'
}) {
  const max = Math.max(1, ...data.map(d => d.value))

  const padding = 20
  const barGap = 35 // espaço entre barras
  const barWidth = 50 // largura das barras

  const chartWidth =
    padding * 2 +
    data.length * barWidth +
    (data.length - 1) * barGap

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={chartWidth}
        height={height}
        viewBox={`0 0 ${chartWidth} ${height}`}
      >
        {data.map((d, i) => {
          const x = padding + i * (barWidth + barGap)

          const h = (d.value / max) * (height - 60)
          const y = (height - 40) - h

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={h}
                rx="4"
                fill={d.color || color}
                opacity="0.95"
              />

              <text
                x={x + barWidth / 2}
                y={height - 12}
                fontSize="11"
                fill="#374151"
                textAnchor="middle"
              >
                {d.label}
              </text>

              <text
                x={x + barWidth / 2}
                y={y - 10}
                fontSize="11"
                fill="#111827"
                textAnchor="middle"
              >
                {d.value}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}