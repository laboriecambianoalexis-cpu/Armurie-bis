import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react'
import { prefersReducedMotion } from '@/lib/motion'

/**
 * Fond animé (ShaderGradient, rendu par react-three-fiber) aux couleurs de l'Ouest :
 * bois brûlé, rouge sang, laiton. Le veinage du bois reste par-dessus pour garder l'ambiance.
 * Chargé à la demande (three.js est lourd) — voir App.tsx.
 */
export default function ShaderBackground() {
  const still = prefersReducedMotion()
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      <ShaderGradientCanvas
        style={{ position: 'absolute', inset: 0, width: '100vw', height: '100vh' }}
        pixelDensity={Math.min(1.5, window.devicePixelRatio || 1)}
        fov={45}
        pointerEvents="none"
        lazyLoad={false}
      >
        <ShaderGradient
          type="waterPlane"
          animate={still ? 'off' : 'on'}
          uTime={0.2}
          uSpeed={0.06}
          uStrength={1.4}
          uDensity={0.9}
          uFrequency={2.2}
          uAmplitude={0}
          color1="#2e140a"
          color2="#6e1310"
          color3="#b5782a"
          brightness={0.9}
          grain="off"
          lightType="3d"
          reflection={0.1}
          cAzimuthAngle={180}
          cPolarAngle={90}
          cDistance={2.2}
          cameraZoom={1}
          positionX={0}
          positionY={0}
          positionZ={0}
          rotationX={0}
          rotationY={10}
          rotationZ={50}
        />
      </ShaderGradientCanvas>
      <div className="wood-overlay absolute inset-0" />
    </div>
  )
}
