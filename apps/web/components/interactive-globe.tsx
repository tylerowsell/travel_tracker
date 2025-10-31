"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { MapPin, Plane } from "lucide-react"

interface Landmark {
  name: string
  x: number
  y: number
  icon: "pin" | "plane"
  color: string
}

const landmarks: Landmark[] = [
  { name: "Paris", x: 55, y: 35, icon: "pin", color: "#6366f1" },
  { name: "Tokyo", x: 75, y: 42, icon: "pin", color: "#8b5cf6" },
  { name: "New York", x: 25, y: 38, icon: "pin", color: "#ec4899" },
  { name: "Sydney", x: 80, y: 70, icon: "pin", color: "#06b6d4" },
  { name: "London", x: 50, y: 32, icon: "plane", color: "#f59e0b" },
  { name: "Dubai", x: 62, y: 48, icon: "pin", color: "#10b981" },
]

export function InteractiveGlobe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredLandmark, setHoveredLandmark] = useState<string | null>(null)

  // Mouse position tracking
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Smooth spring animations for mouse movement
  const springConfig = { stiffness: 150, damping: 30 }
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [15, -15]), springConfig)
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-15, 15]), springConfig)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      mouseX.set(e.clientX - centerX)
      mouseY.set(e.clientY - centerY)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[500px] flex items-center justify-center perspective-1000"
    >
      {/* Globe container */}
      <motion.div
        className="relative w-96 h-96"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl animate-pulse-glow" />

        {/* Main globe sphere */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-blue-900/40 backdrop-blur-xl border border-white/10 shadow-2xl">
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            {/* Latitude lines */}
            {[20, 35, 50, 65, 80].map((y) => (
              <ellipse
                key={`lat-${y}`}
                cx="50"
                cy="50"
                rx="48"
                ry={48 * Math.cos(((y - 50) / 50) * Math.PI / 2)}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.5"
                transform={`translate(0, ${y - 50})`}
              />
            ))}
            {/* Longitude lines */}
            {[0, 30, 60, 90, 120, 150].map((angle) => (
              <ellipse
                key={`lon-${angle}`}
                cx="50"
                cy="50"
                rx="2"
                ry="48"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.5"
                transform={`rotate(${angle} 50 50)`}
              />
            ))}
          </svg>

          {/* Landmarks */}
          {landmarks.map((landmark, index) => {
            const isHovered = hoveredLandmark === landmark.name
            return (
              <motion.div
                key={landmark.name}
                className="absolute"
                style={{
                  left: `${landmark.x}%`,
                  top: `${landmark.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, type: "spring" }}
                onMouseEnter={() => setHoveredLandmark(landmark.name)}
                onMouseLeave={() => setHoveredLandmark(null)}
              >
                <motion.div
                  className="relative"
                  animate={{
                    scale: isHovered ? 1.5 : 1,
                    y: isHovered ? -10 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {/* Ping effect */}
                  {isHovered && (
                    <span className="absolute inset-0 rounded-full animate-ping opacity-75"
                      style={{ backgroundColor: landmark.color }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className="relative w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20"
                    style={{ backgroundColor: landmark.color }}
                  >
                    {landmark.icon === "pin" ? (
                      <MapPin className="w-4 h-4 text-white" />
                    ) : (
                      <Plane className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Label */}
                  <motion.div
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : -5 }}
                  >
                    <div className="glass px-3 py-1 rounded-lg border text-sm font-medium">
                      {landmark.name}
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        {/* Shimmer effect overlay */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]" />
        </div>
      </motion.div>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  )
}
