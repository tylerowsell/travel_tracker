"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface CategoryData {
  category: string
  planned: number
  actual: number
  variance: number
}

interface CategoryBreakdownProps {
  data: CategoryData[]
  currency: string
}

const CATEGORY_COLORS: Record<string, string> = {
  accommodation: "hsl(217, 91%, 60%)",
  food: "hsl(142, 76%, 36%)",
  transport: "hsl(45, 93%, 47%)",
  activities: "hsl(271, 91%, 65%)",
  shopping: "hsl(330, 81%, 60%)",
  other: "hsl(215, 20%, 65%)",
}

export function CategoryBreakdown({ data, currency }: CategoryBreakdownProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="category"
          stroke="hsl(var(--muted-foreground))"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => formatCurrency(value, currency).replace(/\.\d+/, "")}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              return (
                <div className="glass p-4 rounded-lg border">
                  <p className="font-medium capitalize mb-2">{data.category}</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Planned:</span>
                      <span className="font-semibold">
                        {formatCurrency(data.planned, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Actual:</span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(data.actual, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 pt-1 border-t border-border">
                      <span className="text-muted-foreground">Variance:</span>
                      <span
                        className={`font-semibold ${
                          data.variance > 0 ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {data.variance > 0 ? "+" : ""}
                        {formatCurrency(data.variance, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Bar dataKey="planned" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="actual" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.other}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
