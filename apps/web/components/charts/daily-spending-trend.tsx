"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"

interface DailyData {
  date: string
  amount: number
}

interface DailySpendingTrendProps {
  data: DailyData[]
  currency: string
  perDiemBudget?: number
}

export function DailySpendingTrend({
  data,
  currency,
  perDiemBudget,
}: DailySpendingTrendProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          stroke="hsl(var(--muted-foreground))"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => format(new Date(value), "MMM dd")}
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
                <div className="glass p-3 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">
                    {format(new Date(data.date), "MMMM dd, yyyy")}
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(data.amount, currency)}
                  </p>
                </div>
              )
            }
            return null
          }}
        />
        {perDiemBudget && (
          <ReferenceLine
            y={perDiemBudget}
            stroke="hsl(var(--destructive))"
            strokeDasharray="3 3"
            label={{
              value: "Budget",
              position: "right",
              fill: "hsl(var(--muted-foreground))",
              fontSize: 12,
            }}
          />
        )}
        <Line
          type="monotone"
          dataKey="amount"
          stroke="hsl(239, 84%, 67%)"
          strokeWidth={3}
          dot={{ fill: "hsl(239, 84%, 67%)", r: 4 }}
          activeDot={{ r: 6, fill: "hsl(239, 84%, 67%)" }}
          animationDuration={1000}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
