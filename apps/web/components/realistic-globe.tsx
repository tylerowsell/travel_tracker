"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Stars, Html } from "@react-three/drei"
import * as THREE from "three"
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

// Improved noise function using multiple techniques
function noise2D(x: number, y: number) {
  // Simple 2D noise using sine waves
  const n1 = Math.sin(x * 5.3 + y * 2.1) * Math.cos(x * 2.9 - y * 4.7)
  const n2 = Math.sin(x * 8.7 - y * 5.3) * Math.cos(x * 6.1 + y * 3.9)
  const n3 = Math.sin(x * 13.5 + y * 9.1) * Math.cos(x * 11.3 - y * 7.7)

  return (n1 + n2 * 0.5 + n3 * 0.25) / 1.75
}

function Landmark({ landmark, radius }: { landmark: Landmark; radius: number }) {
  const position = latLngToVector3(landmark.lat, landmark.lng, radius)
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle pulsing animation
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.15
      meshRef.current.scale.setScalar(scale)
    }
  })

  return (
    <group position={position}>
      {/* Pin marker */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial
          color={landmark.color}
          emissive={landmark.color}
          emissiveIntensity={0.8}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Glowing ring around marker */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06, 0.08, 32]} />
        <meshBasicMaterial
          color={landmark.color}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Label */}
      <Html
        distanceFactor={6}
        position={[0, 0.15, 0]}
        center
        style={{
          transition: "all 0.2s",
          opacity: 0.9,
          pointerEvents: "none",
        }}
      >
        <div className="glass px-3 py-1 rounded-lg border text-sm font-medium whitespace-nowrap shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            {landmark.icon === "pin" ? (
              <MapPin className="w-3 h-3" style={{ color: landmark.color }} />
            ) : (
              <Plane className="w-3 h-3" style={{ color: landmark.color }} />
            )}
            {landmark.name}
          </div>
        </div>
      </Html>
    </group>
  )
}

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)

  // Create realistic earth texture with proper land/water distribution
  const earthTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2048
    canvas.height = 1024
    const ctx = canvas.getContext('2d')!

    // Draw base ocean
    ctx.fillStyle = '#1a4d7a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Generate continents using noise
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const nx = x / canvas.width
        const ny = y / canvas.height

        // Multiple octaves of noise for realistic continents
        let elevation = 0
        let amplitude = 1
        let frequency = 1

        // Create continent-like structures
        for (let i = 0; i < 5; i++) {
          elevation += noise2D(nx * frequency * 3, ny * frequency * 3) * amplitude
          amplitude *= 0.5
          frequency *= 2.1
        }

        // Normalize to 0-1 range
        elevation = (elevation + 1) / 2

        // Apply latitude-based modification (less land near poles)
        const latFactor = 1 - Math.abs(ny - 0.5) * 1.5
        elevation *= Math.max(0.3, latFactor)

        const idx = (y * canvas.width + x) * 4

        // Color based on elevation
        if (elevation < 0.35) {
          // Deep ocean - dark blue
          data[idx] = 15
          data[idx + 1] = 50 + elevation * 50
          data[idx + 2] = 100 + elevation * 80
        } else if (elevation < 0.4) {
          // Shallow ocean - lighter blue
          data[idx] = 30 + elevation * 80
          data[idx + 1] = 90 + elevation * 80
          data[idx + 2] = 160 + elevation * 40
        } else if (elevation < 0.43) {
          // Beach/coast - sandy
          const sandy = (elevation - 0.4) / 0.03
          data[idx] = 180 + sandy * 50
          data[idx + 1] = 160 + sandy * 40
          data[idx + 2] = 100 + sandy * 30
        } else if (elevation < 0.6) {
          // Lowlands - green vegetation
          const greenLevel = (elevation - 0.43) / 0.17
          data[idx] = 34 + greenLevel * 80
          data[idx + 1] = 100 + greenLevel * 80
          data[idx + 2] = 34 + greenLevel * 40
        } else if (elevation < 0.75) {
          // Highlands - brown/tan
          const brownLevel = (elevation - 0.6) / 0.15
          data[idx] = 100 + brownLevel * 80
          data[idx + 1] = 90 + brownLevel * 60
          data[idx + 2] = 50 + brownLevel * 40
        } else {
          // Mountains - gray to white
          const snowLevel = Math.min(1, (elevation - 0.75) / 0.25)
          data[idx] = 120 + snowLevel * 135
          data[idx + 1] = 120 + snowLevel * 135
          data[idx + 2] = 120 + snowLevel * 135
        }

        data[idx + 3] = 255
      }
    }

    ctx.putImageData(imageData, 0, 0)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])

  // Create cloud layer texture
  const cloudTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const nx = x / canvas.width
        const ny = y / canvas.height

        let cloudDensity = 0
        let amplitude = 1
        let frequency = 1

        for (let i = 0; i < 3; i++) {
          cloudDensity += noise2D(nx * frequency * 4 + 100, ny * frequency * 4 + 100) * amplitude
          amplitude *= 0.5
          frequency *= 2
        }

        cloudDensity = (cloudDensity + 1) / 2

        const idx = (y * canvas.width + x) * 4
        const cloud = cloudDensity > 0.6 ? Math.min(255, (cloudDensity - 0.6) * 400) : 0

        data[idx] = 255
        data[idx + 1] = 255
        data[idx + 2] = 255
        data[idx + 3] = cloud
      }
    }

    ctx.putImageData(imageData, 0, 0)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])

  // Animate rotation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0012
    }
  })

  return (
    <group>
      {/* Main Earth sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 128, 128]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.7}
          metalness={0.1}
          emissive={new THREE.Color(0x112244)}
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.01, 64, 64]} />
        <meshStandardMaterial
          map={cloudTexture}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>

      {/* Atmospheric glow */}
      <mesh scale={1.015}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial
          color={new THREE.Color(0x4488ff)}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer atmosphere */}
      <mesh scale={1.08}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial
          color={new THREE.Color(0x88ccff)}
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Landmarks */}
      {landmarks.map((landmark) => (
        <Landmark key={landmark.name} landmark={landmark} radius={2.05} />
      ))}
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
      <ambientLight intensity={0.4} />

      {/* Main directional light (sun) */}
      <directionalLight
        position={[5, 3, 5]}
        intensity={1.5}
        color={new THREE.Color(0xffffff)}
      />

      {/* Fill light from opposite side */}
      <directionalLight
        position={[-3, -1, -3]}
        intensity={0.3}
        color={new THREE.Color(0x4488ff)}
      />

      {/* Rim light for edge definition */}
      <pointLight
        position={[0, 5, -5]}
        intensity={0.6}
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
        enableZoom={true}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        minDistance={4}
        maxDistance={10}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI - Math.PI / 4}
      />
    </>
  )
}

export function RealisticGlobe() {
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
    </div>
  )
}
