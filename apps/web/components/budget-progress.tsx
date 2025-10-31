"use client"

import { motion } from "framer-motion"
import { formatCurrency, getBudgetColor } from "@/lib/utils"

interface BudgetProgressProps {
  spent: number
  budget: number
  currency: string
  category?: string
}

export function BudgetProgress({
  spent,
  budget,
  currency,
  category,
}: BudgetProgressProps) {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0
  const remaining = Math.max(0, budget - spent)

  return (
    <div className="space-y-2">
      {category && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium capitalize">{category}</span>
          <span className={getBudgetColor(percentage)}>
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}

      <div className="budget-bar">
        <motion.div
          className="budget-fill bg-gradient-to-r from-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        {percentage > 100 && (
          <motion.div
            className="budget-fill bg-gradient-to-r from-red-500 to-orange-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage - 100, 100)}%` }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          />
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatCurrency(spent, currency)} spent</span>
        <span>{formatCurrency(remaining, currency)} remaining</span>
      </div>
    </div>
  )
}
