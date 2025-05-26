"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface Asset {
  ticker: string
  value: number
  percentage: number
}

interface TopAssetsChartProps {
  assets: Asset[]
}

const COLORS = ["#2A5C8B", "#27AE60", "#EB5757", "#F39C12", "#9B59B6"]

export function TopAssetsChart({ assets }: TopAssetsChartProps) {
  const chartData = assets.map((asset, index) => ({
    ...asset,
    color: COLORS[index % COLORS.length],
  }))

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Top 3 Ativos</h4>

      <div className="flex items-center space-x-4">
        {/* Chart */}
        <div className="w-24 h-24">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={20}
                outerRadius={40}
                paddingAngle={2}
                dataKey="percentage"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {chartData.map((asset, index) => (
            <div key={asset.ticker} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: asset.color }} />
                <span className="text-sm font-medium">{asset.ticker}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{asset.percentage}%</p>
                <p className="text-xs text-gray-600">{formatCurrency(asset.value)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
