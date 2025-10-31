"use client"

import "./globals.css"
import { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { CustomCursor } from "@/components/custom-cursor"
import { Plane } from "lucide-react"
import Link from "next/link"

const queryClient = new QueryClient()

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Travel Tracker - Plan, Budget, Explore</title>
        <meta name="description" content="Beautiful travel planning and budget tracking" />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <CustomCursor />

          <div className="min-h-screen">
            <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-40">
              <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <Link href="/" className="flex items-center gap-2 group">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Plane className="w-5 h-5 text-primary" />
                    </div>
                    <h1 className="text-xl font-bold gradient-text">Travel Tracker</h1>
                  </Link>

                  <Link
                    href="/new-trip"
                    className="magnetic-btn"
                  >
                    <span>New Trip</span>
                  </Link>
                </div>
              </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
              {children}
            </main>

            <footer className="border-t border-border mt-20">
              <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
                <p>Built with Next.js, FastAPI, and ❤️</p>
              </div>
            </footer>
          </div>
        </QueryClientProvider>
      </body>
    </html>
  )
}
