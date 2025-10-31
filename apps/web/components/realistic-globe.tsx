"use client"

import { useRef, Suspense } from "react"
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)

  // Load real Earth textures from CDN
  const [colorMap, normalMap, specularMap, cloudsMap] = useLoader(THREE.TextureLoader, [
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png',
  ])

  // Brighten and enhance colors
  colorMap.encoding = THREE.sRGBEncoding

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
      {/* Main Earth sphere with enhanced brightness */}
      <mesh ref={meshRef} receiveShadow castShadow>
        <sphereGeometry args={[2, 128, 128]} />
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.85, 0.85)}
          specularMap={specularMap}
          specular={new THREE.Color(0x666666)}
          shininess={35}
          emissive={new THREE.Color(0x112244)}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.01, 64, 64]} />
        <meshPhongMaterial
          map={cloudsMap}
          transparent
          opacity={0.15}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Atmospheric glow - more vibrant */}
      <mesh scale={1.015}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial
          color={new THREE.Color(0x5599ff)}
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer atmosphere */}
      <mesh scale={1.05}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial
          color={new THREE.Color(0x88ccff)}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}

function Scene() {
  const { camera } = useThree()

  // Position camera
  camera.position.set(0, 0, 6)

  return (
    <>
      {/* Brighter ambient light */}
      <ambientLight intensity={0.7} />

      {/* Main directional light - brighter and warmer */}
      <directionalLight
        position={[5, 3, 5]}
        intensity={2.5}
        color={new THREE.Color(0xffffff)}
        castShadow
      />

      {/* Fill light - brighter */}
      <directionalLight
        position={[-3, -1, -3]}
        intensity={0.6}
        color={new THREE.Color(0x5588ff)}
      />

      {/* Rim light */}
      <pointLight
        position={[0, 5, -5]}
        intensity={1.0}
        color={new THREE.Color(0x88ccff)}
      />

      <Suspense fallback={null}>
        <Earth />
      </Suspense>

      {/* Orbit controls with damping for smooth persistence */}
      <OrbitControls
        makeDefault
        enableZoom={true}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        minDistance={4}
        maxDistance={10}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI - Math.PI / 4}
        regress={false}
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
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef} className="relative w-full h-[500px]">
      {/* Three.js Canvas with frameloop="always" to prevent pausing on scroll */}
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          className="w-full h-full"
          frameloop="always"
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          events={(state) => ({
            ...state.events,
            enabled: true,
            priority: 1,
          })}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  )
}
