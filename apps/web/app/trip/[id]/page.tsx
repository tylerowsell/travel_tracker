"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatCard } from "@/components/stat-card"
import { BudgetProgress } from "@/components/budget-progress"
import { ExpenseCard } from "@/components/expense-card"
import { BudgetDonut } from "@/components/charts/budget-donut"
import { CategoryBreakdown } from "@/components/charts/category-breakdown"
import { DailySpendingTrend } from "@/components/charts/daily-spending-trend"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Wallet, TrendingUp, Users, Calendar } from "lucide-react"
import { motion } from "framer-motion"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "x-user-sub": "dev-user-sub" },
})

export default function TripDetailPage() {
  const { id } = useParams()

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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
          <TabsTrigger value="split">Split</TabsTrigger>
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
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>Latest {Math.min(5, expenses.length)} transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {expenses.slice(0, 5).map((expense: any, index: number) => (
                <ExpenseCard key={expense.id} expense={expense} index={index} />
              ))}
              {expenses.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No expenses recorded yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>Planned vs actual spending by category</CardDescription>
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
              <CardTitle>All Expenses</CardTitle>
              <CardDescription>Complete expense history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {expenses.map((expense: any, index: number) => (
                <ExpenseCard key={expense.id} expense={expense} index={index} />
              ))}
              {expenses.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No expenses recorded yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Itinerary Tab */}
        <TabsContent value="itinerary">
          <Card>
            <CardHeader>
              <CardTitle>Trip Itinerary</CardTitle>
              <CardDescription>Your travel schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Itinerary feature coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Split Tab */}
        <TabsContent value="split">
          <Card>
            <CardHeader>
              <CardTitle>Expense Splitting</CardTitle>
              <CardDescription>See who owes what</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Settlement feature coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
