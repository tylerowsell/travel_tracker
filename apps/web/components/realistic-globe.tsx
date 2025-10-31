"use client"

import { useRef, useMemo, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Stars } from "@react-three/drei"
import * as THREE from "three"
import { motion } from "framer-motion"
import { MapPin, Plane } from "lucide-react"

interface Landmark {
  name: string
  lat: number
  lng: number
  icon: "pin" | "plane"
  color: string
}

const landmarks: Landmark[] = [
  { name: "Paris", lat: 48.8566, lng: 2.3522, icon: "pin", color: "#6366f1" },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503, icon: "pin", color: "#8b5cf6" },
  { name: "New York", lat: 40.7128, lng: -74.0060, icon: "pin", color: "#ec4899" },
  { name: "Sydney", lat: -33.8688, lng: 151.2093, icon: "pin", color: "#06b6d4" },
  { name: "London", lat: 51.5074, lng: -0.1278, icon: "plane", color: "#f59e0b" },
  { name: "Dubai", lat: 25.2048, lng: 55.2708, icon: "pin", color: "#10b981" },
]

// Convert lat/lng to 3D position on sphere
function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

// Simple noise function for terrain
function noise(x: number, y: number, z: number) {
  // Simple pseudo-random noise based on position
  const value = Math.sin(x * 12.9898 + y * 78.233 + z * 45.543) * 43758.5453
  return value - Math.floor(value)
}

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  // Create earth-like texture procedurally
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    // Create land and water based on noise
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const nx = x / canvas.width
        const ny = y / canvas.height

        // Multiple octaves of noise for realistic terrain
        let value = 0
        let amplitude = 1
        let frequency = 1

        for (let i = 0; i < 4; i++) {
          value += noise(
            nx * frequency * 8,
            ny * frequency * 8,
            i
          ) * amplitude
          amplitude *= 0.5
          frequency *= 2
        }

        // Normalize and create land/water threshold
        value = value / 2

        let color
        if (value < 0.42) {
          // Deep ocean
          color = `rgb(${Math.floor(20 + value * 30)}, ${Math.floor(50 + value * 80)}, ${Math.floor(120 + value * 100)})`
        } else if (value < 0.48) {
          // Shallow water
          color = `rgb(${Math.floor(40 + value * 50)}, ${Math.floor(90 + value * 80)}, ${Math.floor(160 + value * 60)})`
        } else if (value < 0.52) {
          // Beach/coast
          color = `rgb(${Math.floor(194 + value * 30)}, ${Math.floor(178 + value * 40)}, ${Math.floor(128 + value * 20)})`
        } else if (value < 0.65) {
          // Lowlands - green
          color = `rgb(${Math.floor(34 + value * 60)}, ${Math.floor(139 + value * 60)}, ${Math.floor(34 + value * 50)})`
        } else if (value < 0.75) {
          // Highlands - brown/green
          color = `rgb(${Math.floor(107 + value * 40)}, ${Math.floor(142 + value * 30)}, ${Math.floor(35 + value * 40)})`
        } else {
          // Mountains - gray/white
          const snowLevel = Math.max(0, (value - 0.75) * 4)
          color = `rgb(${Math.floor(139 + snowLevel * 116)}, ${Math.floor(137 + snowLevel * 118)}, ${Math.floor(137 + snowLevel * 118)})`
        }

        ctx.fillStyle = color
        ctx.fillRect(x, y, 1, 1)
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])

  // Animate rotation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001
    }
    if (glowRef.current) {
      glowRef.current.rotation.y += 0.001
    }
  })

  return (
    <group>
      {/* Main Earth sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial
          map={texture}
          shininess={15}
          specular={new THREE.Color(0x333333)}
          emissive={new THREE.Color(0x112244)}
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Atmospheric glow */}
      <mesh ref={glowRef} scale={1.02}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial
          color={new THREE.Color(0x4488ff)}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer atmosphere glow */}
      <mesh scale={1.15}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial
          color={new THREE.Color(0x6699ff)}
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Landmarks as 3D markers */}
      {landmarks.map((landmark) => {
        const position = latLngToVector3(landmark.lat, landmark.lng, 2.05)
        return (
          <mesh key={landmark.name} position={position}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial
              color={landmark.color}
              emissive={landmark.color}
              emissiveIntensity={0.5}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function Scene() {
  const { camera } = useThree()

  // Position camera
  camera.position.set(0, 0, 6)

  return (
    <>
      {/* Ambient light for overall illumination */}
      <ambientLight intensity={0.3} />

      {/* Main directional light (sun) */}
      <directionalLight
        position={[5, 3, 5]}
        intensity={1.2}
        color={new THREE.Color(0xffffff)}
      />

      {/* Fill light from opposite side */}
      <directionalLight
        position={[-3, -2, -3]}
        intensity={0.3}
        color={new THREE.Color(0x4488ff)}
      />

      {/* Rim light for edge definition */}
      <pointLight
        position={[0, 0, -5]}
        intensity={0.5}
        color={new THREE.Color(0x88ccff)}
      />

      <Earth />

      {/* Enhanced star field */}
      <Stars
        radius={50}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Orbit controls for mouse interaction */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI - Math.PI / 3}
      />
    </>
  )
}

export function RealisticGlobe() {
  const [hoveredLandmark, setHoveredLandmark] = useState<string | null>(null)

  return (
    <div className="relative w-full h-[500px]">
      {/* Three.js Canvas */}
      <Canvas
        className="w-full h-full"
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <Scene />
      </Canvas>

      {/* 2D Landmark labels overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {landmarks.map((landmark, index) => {
          // Position labels around the globe (simplified positioning)
          const positions = [
            { x: "55%", y: "35%" }, // Paris
            { x: "75%", y: "42%" }, // Tokyo
            { x: "25%", y: "38%" }, // New York
            { x: "80%", y: "70%" }, // Sydney
            { x: "50%", y: "32%" }, // London
            { x: "62%", y: "48%" }, // Dubai
          ]

          const pos = positions[index]
          const isHovered = hoveredLandmark === landmark.name

          return (
            <motion.div
              key={landmark.name}
              className="absolute pointer-events-auto cursor-pointer"
              style={{
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -50%)",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.5, type: "spring" }}
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
                  <span
                    className="absolute inset-0 rounded-full animate-ping opacity-75"
                    style={{ backgroundColor: landmark.color }}
                  />
                )}

                {/* Icon */}
                <div
                  className="relative w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20 backdrop-blur-sm"
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
                  <div className="glass px-3 py-1 rounded-lg border text-sm font-medium shadow-xl">
                    {landmark.name}
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
