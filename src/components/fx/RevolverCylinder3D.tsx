import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { prefersReducedMotion } from '@/lib/motion'

const CHAMBERS = Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2)

/** Barillet de revolver en laiton, modélisé en react-three-fiber. */
const FINISH = {
  brass: { body: '#d8a64c', emissive: '#3a2208', light: '#ffe2a8', rim: '#a8171c' },
  chrome: { body: '#dfe5ee', emissive: '#10141c', light: '#ffffff', rim: '#7c8cff' },
}

function Cylinder({ spin, finish }: { spin: boolean; finish: keyof typeof FINISH }) {
  const ref = useRef<Group>(null)
  useFrame((_, dt) => {
    if (!ref.current || !spin) return
    ref.current.rotation.y += dt * 0.8
    ref.current.rotation.x = Math.sin(performance.now() / 1600) * 0.25 + 0.5
  })
  return (
    <group ref={ref} rotation={[0.5, 0, 0]}>
      {/* corps */}
      <mesh>
        <cylinderGeometry args={[1, 1, 1.1, 48]} />
        <meshStandardMaterial color={FINISH[finish].body} metalness={0.55} roughness={0.32} emissive={FINISH[finish].emissive} emissiveIntensity={0.35} />
      </mesh>
      {/* chambres (vues de dessus et de dessous) */}
      {CHAMBERS.map((a) => (
        <mesh key={a} position={[Math.cos(a) * 0.58, 0, Math.sin(a) * 0.58]}>
          <cylinderGeometry args={[0.22, 0.22, 1.12, 24]} />
          <meshStandardMaterial color="#1a0f08" metalness={0.4} roughness={0.7} />
        </mesh>
      ))}
      {/* axe central */}
      <mesh>
        <cylinderGeometry args={[0.12, 0.12, 1.4, 16]} />
        <meshStandardMaterial color="#6b6b6b" metalness={1} roughness={0.2} />
      </mesh>
    </group>
  )
}

export default function RevolverCylinder3D({ size = 96, finish = 'brass', paused = false }: { size?: number; finish?: keyof typeof FINISH; paused?: boolean }) {
  return (
    <div style={{ width: size, height: size }} aria-hidden="true">
      <Canvas frameloop={paused || prefersReducedMotion() ? 'demand' : 'always'} camera={{ position: [0, 2.2, 2.6], fov: 40 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}>
        <ambientLight intensity={1.4} />
        <hemisphereLight args={['#ffe9c4', '#3a1a0b', 1.2]} />
        <directionalLight position={[3, 4, 2]} intensity={3.2} color={FINISH[finish].light} />
        <pointLight position={[-3, -1, 2]} intensity={6} color={FINISH[finish].rim} />
        <Cylinder spin={!prefersReducedMotion()} finish={finish} />
      </Canvas>
    </div>
  )
}
