import { LiquidMetal } from '@paper-design/shaders-react'
import { prefersReducedMotion } from '@/lib/motion'

/**
 * Emblème « liquid metal » (Paper Shaders — la librairie derrière paper-design/liquid-logo) :
 * un barillet de revolver en laiton liquide.
 */
export default function LiquidEmblem({ size = 92, tint = '#f2c46d', paused = false }: { size?: number; tint?: string; paused?: boolean }) {
  return (
    <LiquidMetal
      image={`${import.meta.env.BASE_URL}img/emblem.svg`}
      colorBack="#00000000"
      colorTint={tint}
      shape="none"
      repetition={4}
      softness={0.2}
      shiftRed={0.25}
      shiftBlue={0.15}
      distortion={0.08}
      contour={0.45}
      angle={70}
      speed={prefersReducedMotion() || paused ? 0 : 0.6}
      scale={0.8}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}
