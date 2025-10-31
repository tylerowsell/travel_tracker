"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatCard } from "@/components/stat-card"
import { BudgetProgress } from "@/components/budget-progress"
import { ExpenseCard } from "@/components/expense-card"
import { BudgetDonut } from "@/components/charts/budget-donut"
import { CategoryBreakdown } from "@/components/charts/category-breakdown"
import { DailySpendingTrend } from "@/components/charts/daily-spending-trend"
import { ExpenseModal } from "@/components/expense-modal"
import { ItineraryTimeline } from "@/components/itinerary-timeline"
import { ItineraryModal } from "@/components/itinerary-modal"
import { BudgetEditModal } from "@/components/budget-edit-modal"
import { SettlementCalculator } from "@/components/settlement-calculator"
import { MemberManagement } from "@/components/member-management"
import { ActivityFeed } from "@/components/activity-feed"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Wallet, TrendingUp, Users, Calendar, Plus, Edit2 } from "lucide-react"
import { motion } from "framer-motion"

// Dynamically import TripMap to avoid SSR issues with Leaflet
const TripMap = dynamic(() => import('@/components/trip-map').then(mod => ({ default: mod.TripMap })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px]">
      <div className="shimmer card p-8">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
})

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "x-user-sub": "dev-user-sub" },
})

export default function TripDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [expenseToEdit, setExpenseToEdit] = useState<any>(null)
  const [itineraryModal, setItineraryModal] = useState<{ open: boolean; item: any }>({ open: false, item: null })
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)

  const { data: trip } = useQuery({
    queryKey: ["trip", id],
    queryFn: async () => {
      const res = await api.get(`/trips/${id}`)
      return res.data
    },
  })

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", id],
    queryFn: async () => {
      const res = await api.get(`/expenses/${id}`)
      return res.data
    },
  })

  const { data: analytics } = useQuery({
    queryKey: ["analytics", id],
    queryFn: async () => {
      const res = await api.get(`/analytics/${id}/budget-vs-actual`)
      return res.data
    },
    enabled: !!trip,
  })

  const { data: dailyTrends } = useQuery({
    queryKey: ["daily-trends", id],
    queryFn: async () => {
      const res = await api.get(`/analytics/${id}/daily-trends`)
      return res.data
    },
  })

  const { data: itinerary = [] } = useQuery({
    queryKey: ["itinerary", id],
    queryFn: async () => {
      const res = await api.get(`/itinerary/${id}`)
      return res.data
    },
  })

  const { data: categoryBudgets = [] } = useQuery({
    queryKey: ["category-budgets", id],
    queryFn: async () => {
      const res = await api.get(`/category-budgets/${id}`)
      return res.data
    },
  })

  const handleAddExpense = async (expenseData: any) => {
    await api.post(`/expenses/${id}`, expenseData)
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["expenses", id] })
    queryClient.invalidateQueries({ queryKey: ["analytics", id] })
    queryClient.invalidateQueries({ queryKey: ["daily-trends", id] })
  }

  const handleEditExpense = async (expenseData: any) => {
    await api.put(`/expenses/${id}/${expenseToEdit.id}`, expenseData)
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["expenses", id] })
    queryClient.invalidateQueries({ queryKey: ["analytics", id] })
    queryClient.invalidateQueries({ queryKey: ["daily-trends", id] })
    setExpenseToEdit(null)
  }

  const handleDeleteExpense = async (expenseId: number) => {
    await api.delete(`/expenses/${id}/${expenseId}`)
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["expenses", id] })
    queryClient.invalidateQueries({ queryKey: ["analytics", id] })
    queryClient.invalidateQueries({ queryKey: ["daily-trends", id] })
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="shimmer card p-8">
          <p className="text-muted-foreground">Loading trip...</p>
        </div>
      </div>
    )
  }

  const totalSpent = analytics?.total_spent || 0
  const totalBudget = analytics?.total_planned || trip.total_budget || 0
  const utilizationPercent = analytics?.utilization_percent || 0

  return (
    <div className="space-y-8">
      {/* Header with Add Expense Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div className="space-y-2">
          <h1 className="text-4xl font-bold gradient-text">{trip.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{trip.participants?.length || 0} travelers</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setExpenseToEdit(null)
            setIsExpenseModalOpen(true)
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          Add Expense
        </button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Budget"
          value={formatCurrency(totalBudget, trip.home_currency)}
          icon={Wallet}
          delay={0}
        />
        <StatCard
          title="Total Spent"
          value={formatCurrency(totalSpent, trip.home_currency)}
          icon={TrendingUp}
          change={utilizationPercent - 100}
          trend={utilizationPercent > 100 ? "up" : utilizationPercent < 80 ? "down" : "neutral"}
          delay={0.1}
        />
        <StatCard
          title="Remaining"
          value={formatCurrency(totalBudget - totalSpent, trip.home_currency)}
          icon={Wallet}
          delay={0.2}
        />
        <StatCard
          title="Daily Average"
          value={formatCurrency(dailyTrends?.average_daily || 0, trip.home_currency)}
          icon={Calendar}
          delay={0.3}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
          <TabsTrigger value="split">Split</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget Donut Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Utilization</CardTitle>
                <CardDescription>Overall spending vs budget</CardDescription>
              </CardHeader>
              <CardContent className="chart-container relative">
                {totalBudget > 0 ? (
                  <BudgetDonut
                    totalBudget={totalBudget}
                    totalSpent={totalSpent}
                    currency={trip.home_currency}
                  />
                ) : (
                  <p className="text-muted-foreground text-center">No budget set</p>
                )}
              </CardContent>
            </Card>

            {/* Daily Spending Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Spending</CardTitle>
                <CardDescription>Track your daily expenses</CardDescription>
              </CardHeader>
              <CardContent className="chart-container">
                {dailyTrends?.days?.length > 0 ? (
                  <DailySpendingTrend
                    data={dailyTrends.days}
                    currency={trip.home_currency}
                    perDiemBudget={trip.per_diem_budget}
                  />
                ) : (
                  <p className="text-muted-foreground text-center">No expenses yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Expenses */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Expenses</CardTitle>
                  <CardDescription>Latest {Math.min(5, expenses.length)} transactions</CardDescription>
                </div>
                <button
                  onClick={() => {
                    setExpenseToEdit(null)
                    setIsExpenseModalOpen(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-primary text-primary hover:bg-primary/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {expenses.slice(0, 5).map((expense: any, index: number) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  index={index}
                  onEdit={(exp) => {
                    setExpenseToEdit(exp)
                    setIsExpenseModalOpen(true)
                  }}
                  onDelete={handleDeleteExpense}
                />
              ))}
              {expenses.length === 0 && (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">No expenses recorded yet</p>
                  <button
                    onClick={() => {
                      setExpenseToEdit(null)
                      setIsExpenseModalOpen(true)
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Expense
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Category Breakdown</CardTitle>
                  <CardDescription>Planned vs actual spending by category</CardDescription>
                </div>
                <button
                  onClick={() => setIsBudgetModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Budget
                </button>
              </div>
            </CardHeader>
            <CardContent className="chart-container">
              {analytics?.categories?.length > 0 ? (
                <CategoryBreakdown
                  data={analytics.categories}
                  currency={trip.home_currency}
                />
              ) : (
                <p className="text-muted-foreground text-center">No category budgets set</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Budget Progress</CardTitle>
              <CardDescription>Track spending against category budgets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {analytics?.categories?.map((cat: any) => (
                <BudgetProgress
                  key={cat.category}
                  spent={cat.actual}
                  budget={cat.planned}
                  currency={trip.home_currency}
                  category={cat.category}
                />
              ))}
              {(!analytics?.categories || analytics.categories.length === 0) && (
                <p className="text-muted-foreground text-center py-8">
                  Set up category budgets to track spending
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Expenses</CardTitle>
                  <CardDescription>Complete expense history ({expenses.length} total)</CardDescription>
                </div>
                <button
                  onClick={() => {
                    setExpenseToEdit(null)
                    setIsExpenseModalOpen(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-5 h-5" />
                  Add Expense
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {expenses.map((expense: any, index: number) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  index={index}
                  onEdit={(exp) => {
                    setExpenseToEdit(exp)
                    setIsExpenseModalOpen(true)
                  }}
                  onDelete={handleDeleteExpense}
                />
              ))}
              {expenses.length === 0 && (
                <div className="text-center py-16 space-y-4">
                  <Wallet className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start tracking your trip expenses
                    </p>
                    <button
                      onClick={() => {
                        setExpenseToEdit(null)
                        setIsExpenseModalOpen(true)
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      <Plus className="w-5 h-5" />
                      Add Your First Expense
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Itinerary Tab */}
        <TabsContent value="itinerary">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Trip Itinerary</CardTitle>
                  <CardDescription>Your complete travel schedule</CardDescription>
                </div>
                <button
                  onClick={() => setItineraryModal({ open: true, item: null })}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <ItineraryTimeline
                items={itinerary}
                onItemClick={(item) => setItineraryModal({ open: true, item })}
                onAddClick={() => setItineraryModal({ open: true, item: null })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Map Tab */}
        <TabsContent value="map">
          <TripMap expenses={expenses} itinerary={itinerary} trip={trip} />
        </TabsContent>

        {/* Split Tab */}
        <TabsContent value="split">
          <Card>
            <CardHeader>
              <CardTitle>Expense Splitting & Settlements</CardTitle>
              <CardDescription>See who owes what and suggested settlements</CardDescription>
            </CardHeader>
            <CardContent>
              <SettlementCalculator trip={trip} expenses={expenses} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <MemberManagement tripId={trip.id} ownerSub={trip.owner_sub} />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>Real-time updates on trip changes</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityFeed tripId={trip.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false)
          setExpenseToEdit(null)
        }}
        onSubmit={expenseToEdit ? handleEditExpense : handleAddExpense}
        trip={trip}
        expense={expenseToEdit}
      />

      <ItineraryModal
        isOpen={itineraryModal.open}
        onClose={() => setItineraryModal({ open: false, item: null })}
        tripId={Number(id)}
        item={itineraryModal.item}
      />

      <BudgetEditModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        tripId={Number(id)}
        trip={trip}
        currentBudgets={categoryBudgets}
      />
    </div>
  )
}
