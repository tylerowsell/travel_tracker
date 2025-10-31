"use client"

import { motion } from "framer-motion"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { MapPin, Receipt, Edit2, Trash2 } from "lucide-react"

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
  onEdit?: (expense: any) => void
  onDelete?: (expenseId: number) => void
}

export function ExpenseCard({ expense, index, onEdit, onDelete }: ExpenseCardProps) {
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

            {/* Edit/Delete buttons (show on hover) */}
            {(onEdit || onDelete) && (
              <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(expense);
                    }}
                    className="p-1.5 hover:bg-primary/10 rounded transition-colors"
                    title="Edit expense"
                  >
                    <Edit2 className="w-4 h-4 text-primary" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this expense?')) {
                        onDelete(expense.id);
                      }
                    }}
                    className="p-1.5 hover:bg-red-500/10 rounded transition-colors"
                    title="Delete expense"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </div>
            )}
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
