"use client"

import { useQuery } from "@tanstack/react-query"
import api from "../lib/api"
import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, DollarSign } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => (await api.get("/trips")).data,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="shimmer card p-8">
          <p className="text-muted-foreground">Loading your trips...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Unable to load trips</CardTitle>
            <CardDescription>
              There was a problem connecting to the API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <p className="font-medium mb-2">Troubleshooting:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Check if the API is running at {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}</li>
                <li>Run: <code className="bg-muted px-1 rounded">docker compose logs api</code></li>
                <li>Visit: <a href="http://localhost:8000/health" target="_blank" className="text-primary hover:underline">http://localhost:8000/health</a></li>
              </ul>
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Error details
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                {error instanceof Error ? error.message : String(error)}
              </pre>
            </details>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold gradient-text mb-2">Your Trips</h1>
        <p className="text-muted-foreground">
          Plan, budget, and track your adventures
        </p>
      </div>

      {data?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No trips yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start planning your next adventure
                </p>
                <Link href="/new-trip" className="magnetic-btn inline-flex">
                  Create Your First Trip
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data?.map((trip: any, index: number) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Link href={`/trip/${trip.id}`}>
                <Card className="hover:shadow-xl transition-all duration-300 group cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="gradient-text group-hover:scale-105 transition-transform">
                      {trip.title}
                    </CardTitle>
                    <CardDescription>
                      {trip.destination || "Destination not set"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                      </span>
                    </div>
                    {trip.total_budget && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span className="font-medium">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: trip.home_currency,
                          }).format(trip.total_budget)}{" "}
                          budget
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-border">
                      <span className="text-sm text-muted-foreground">
                        {trip.participants?.length || 0} traveler{trip.participants?.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
