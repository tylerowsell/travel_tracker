"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface BudgetDonutProps {
  totalBudget: number
  totalSpent: number
  currency: string
}

export function BudgetDonut({ totalBudget, totalSpent, currency }: BudgetDonutProps) {
  const remaining = Math.max(0, totalBudget - totalSpent)
  const overBudget = Math.max(0, totalSpent - totalBudget)

  const data = [
    { name: "Spent", value: Math.min(totalSpent, totalBudget) },
    { name: "Remaining", value: remaining },
    { name: "Over Budget", value: overBudget },
  ].filter((item) => item.value > 0)

  const COLORS = {
    Spent: "hsl(239, 84%, 67%)",
    Remaining: "hsl(142, 76%, 36%)",
    "Over Budget": "hsl(0, 84%, 60%)",
  }

  const percentage = ((totalSpent / totalBudget) * 100).toFixed(1)

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.name as keyof typeof COLORS]}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="glass p-3 rounded-lg border">
                    <p className="text-sm font-medium">{payload[0].name}</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(payload[0].value as number, currency)}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            content={({ payload }) => (
              <div className="flex justify-center gap-4 mt-4">
                {payload?.map((entry, index) => (
                  <div key={`legend-${index}`} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-3xl font-bold gradient-text">{percentage}%</div>
          <div className="text-xs text-muted-foreground mt-1">Utilized</div>
        </div>
      </div>
    </div>
  )
}
