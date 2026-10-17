/** true si l'utilisateur a demandé à réduire les animations (Windows : « Effets d'animation » désactivés). */
export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** true si le navigateur sait faire du WebGL (sinon on garde les fonds CSS). */
export function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
