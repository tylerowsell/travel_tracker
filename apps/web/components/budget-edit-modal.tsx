'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface BudgetEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: number;
  trip: any;
  currentBudgets: any[];
}

const DEFAULT_CATEGORIES = [
  'accommodation',
  'food',
  'transport',
  'activities',
  'shopping',
  'other',
];

export function BudgetEditModal({ isOpen, onClose, tripId, trip, currentBudgets }: BudgetEditModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [totalBudget, setTotalBudget] = useState(trip?.total_budget || 0);
  const [perDiemBudget, setPerDiemBudget] = useState(trip?.per_diem_budget || 0);
  const [categoryBudgets, setCategoryBudgets] = useState<Array<{ category: string; planned_amount: number }>>([]);

  useEffect(() => {
    if (isOpen) {
      setTotalBudget(trip?.total_budget || 0);
      setPerDiemBudget(trip?.per_diem_budget || 0);

      // Initialize with current budgets or defaults
      if (currentBudgets && currentBudgets.length > 0) {
        setCategoryBudgets(currentBudgets.map(b => ({ category: b.category, planned_amount: b.planned_amount })));
      } else {
        setCategoryBudgets(DEFAULT_CATEGORIES.map(cat => ({ category: cat, planned_amount: 0 })));
      }
    }
  }, [isOpen, trip, currentBudgets]);

  // Update trip budget mutation
  const updateTripMutation = useMutation({
    mutationFn: async () => {
      await axios.put(`${API_URL}/trips/${tripId}`, {
        total_budget: totalBudget || null,
        per_diem_budget: perDiemBudget || null,
      }, {
        headers: { 'x-user-sub': user?.id || '' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId.toString()] });
    },
  });

  // Update category budgets mutation
  const updateCategoryBudgetsMutation = useMutation({
    mutationFn: async () => {
      const validBudgets = categoryBudgets.filter(b => b.planned_amount > 0);
      await axios.post(`${API_URL}/category-budgets/${tripId}/bulk`, validBudgets, {
        headers: { 'x-user-sub': user?.id || '' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', tripId.toString()] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateTripMutation.mutateAsync();
      await updateCategoryBudgetsMutation.mutateAsync();
      onClose();
    } catch (error) {
      console.error('Failed to update budgets:', error);
    }
  };

  const addCategoryRow = () => {
    setCategoryBudgets([...categoryBudgets, { category: '', planned_amount: 0 }]);
  };

  const removeCategoryRow = (index: number) => {
    setCategoryBudgets(categoryBudgets.filter((_, i) => i !== index));
  };

  const updateCategory = (index: number, field: string, value: any) => {
    const updated = [...categoryBudgets];
    updated[index] = { ...updated[index], [field]: value };
    setCategoryBudgets(updated);
  };

  if (!isOpen) return null;

  const isSaving = updateTripMutation.isPending || updateCategoryBudgetsMutation.isPending;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-card border border-border rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Edit Budget</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Overall Budgets */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="total_budget" className="block text-sm font-medium mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Total Trip Budget
                  </label>
                  <input
                    id="total_budget"
                    type="number"
                    step="0.01"
                    value={totalBudget || ''}
                    onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="5000.00"
                  />
                </div>

                <div>
                  <label htmlFor="per_diem" className="block text-sm font-medium mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Per Diem Budget
                  </label>
                  <input
                    id="per_diem"
                    type="number"
                    step="0.01"
                    value={perDiemBudget || ''}
                    onChange={(e) => setPerDiemBudget(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="200.00"
                  />
                </div>
              </div>

              {/* Category Budgets */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">Category Budgets</label>
                  <button
                    type="button"
                    onClick={addCategoryRow}
                    className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                  >
                    <Plus className="w-4 h-4" />
                    Add Category
                  </button>
                </div>

                <div className="space-y-2">
                  {categoryBudgets.map((budget, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={budget.category}
                        onChange={(e) => updateCategory(index, 'category', e.target.value)}
                        className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Category name"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={budget.planned_amount || ''}
                        onChange={(e) => updateCategory(index, 'planned_amount', parseFloat(e.target.value) || 0)}
                        className="w-32 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0.00"
                      />
                      <button
                        type="button"
                        onClick={() => removeCategoryRow(index)}
                        className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-accent/50 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span>Total Category Budget:</span>
                  <span className="font-mono font-semibold">
                    ${categoryBudgets.reduce((sum, b) => sum + (b.planned_amount || 0), 0).toFixed(2)}
                  </span>
                </div>
                {totalBudget > 0 && (
                  <div className="flex justify-between text-sm mt-2 text-muted-foreground">
                    <span>Unallocated:</span>
                    <span className="font-mono">
                      ${(totalBudget - categoryBudgets.reduce((sum, b) => sum + (b.planned_amount || 0), 0)).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
