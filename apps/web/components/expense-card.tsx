"use client"

import { motion } from "framer-motion"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { MapPin, Receipt } from "lucide-react"

interface ExpenseCardProps {
  expense: {
    id: number
    dt: string
    amount: number
    currency: string
    category?: string
    merchant_name?: string
    note?: string
    location_text?: string
    payer_id: number
  }
  index: number
}

export function ExpenseCard({ expense, index }: ExpenseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="card p-4 hover:shadow-xl transition-all duration-300 group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {expense.category && (
              <span className={cn("category-badge", expense.category)}>
                {expense.category}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDate(expense.dt)}
            </span>
          </div>

          {expense.merchant_name && (
            <h4 className="font-medium text-lg mb-1">{expense.merchant_name}</h4>
          )}

          {expense.note && (
            <p className="text-sm text-muted-foreground mb-2">{expense.note}</p>
          )}

          {expense.location_text && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{expense.location_text}</span>
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(expense.amount, expense.currency)}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Receipt className="w-3 h-3" />
            <span>Payer #{expense.payer_id}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
