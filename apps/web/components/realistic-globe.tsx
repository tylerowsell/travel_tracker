"use client"

import { useRef, Suspense } from "react"
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber"
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

  // Load real Earth textures from CDN
  // Using high-quality 2K textures for optimal performance/quality balance
  const [colorMap, normalMap, specularMap, cloudsMap] = useLoader(THREE.TextureLoader, [
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png',
  ])

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
      {/* Main Earth sphere with real textures */}
      <mesh ref={meshRef} receiveShadow castShadow>
        <sphereGeometry args={[2, 128, 128]} />
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.85, 0.85)}
          specularMap={specularMap}
          specular={new THREE.Color(0x333333)}
          shininess={25}
          emissive={new THREE.Color(0x000000)}
        />
      </mesh>

      {/* Cloud layer with real cloud texture */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.01, 64, 64]} />
        <meshPhongMaterial
          map={cloudsMap}
          transparent
          opacity={0.12}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Atmospheric glow - subtle blue haze */}
      <mesh scale={1.015}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial
          color={new THREE.Color(0x6699ff)}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer atmosphere - very subtle */}
      <mesh scale={1.05}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial
          color={new THREE.Color(0x88ccff)}
          transparent
          opacity={0.05}
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
      <ambientLight intensity={0.5} />

      {/* Main directional light (sun) - positioned to show Earth's day side */}
      <directionalLight
        position={[5, 3, 5]}
        intensity={2.0}
        color={new THREE.Color(0xffffff)}
        castShadow
      />

      {/* Fill light from opposite side - subtle blue tint */}
      <directionalLight
        position={[-3, -1, -3]}
        intensity={0.4}
        color={new THREE.Color(0x4488ff)}
      />

      {/* Rim light for edge definition */}
      <pointLight
        position={[0, 5, -5]}
        intensity={0.8}
        color={new THREE.Color(0x88ccff)}
      />

      <Suspense fallback={null}>
        <Earth />
      </Suspense>

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

function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Loading Earth...</p>
      </div>
    </div>
  )
}

export function RealisticGlobe() {
  return (
    <div className="relative w-full h-[500px]">
      {/* Three.js Canvas */}
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          className="w-full h-full"
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  )
}
