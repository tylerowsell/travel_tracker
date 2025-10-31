"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: LucideIcon
  trend?: "up" | "down" | "neutral"
  delay?: number
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend = "neutral",
  delay = 0,
}: StatCardProps) {
  const trendColor = {
    up: "text-green-500",
    down: "text-red-500",
    neutral: "text-muted-foreground",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="stat-card group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold gradient-text">{value}</p>
          {change !== undefined && (
            <p className={cn("text-sm mt-2", trendColor[trend])}>
              {change > 0 ? "+" : ""}
              {change}%{" "}
              <span className="text-muted-foreground">vs planned</span>
            </p>
          )}
        </div>
        <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </motion.div>
  )
}
