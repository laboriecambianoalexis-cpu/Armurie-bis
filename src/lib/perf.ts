import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { hasWebGL } from './motion'

/**
 * Niveau d'effets visuels, propre à chaque PC (on joue à RedM en même temps : le site doit rester léger).
 * - eco  (par défaut) : aucun WebGL, aucune animation continue, pas de flou — même look en version statique.
 * - full : fond shader, métal liquide, verre liquide, barillet 3D — mis en pause dès que la fenêtre n'est plus active.
 */
export type FxLevel = 'eco' | 'full'

export const useFx = create<{ level: FxLevel; setLevel: (l: FxLevel) => void }>()(
  persist((set) => ({ level: 'eco', setLevel: (level) => set({ level }) }), { name: 'armurerie-fx' }),
)

const webgl = hasWebGL()

/** true si les effets WebGL doivent être montés. */
export const useFullFx = () => useFx((s) => s.level === 'full') && webgl

/** true tant que la fenêtre du site est visible ET au premier plan (sinon on met les animations en pause). */
export function useWindowActive() {
  const [active, setActive] = useState(() => !document.hidden && document.hasFocus())
  useEffect(() => {
    const update = () => setActive(!document.hidden && document.hasFocus())
    window.addEventListener('focus', update)
    window.addEventListener('blur', update)
    document.addEventListener('visibilitychange', update)
    return () => {
      window.removeEventListener('focus', update)
      window.removeEventListener('blur', update)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])
  return active
}

/** Reflète le niveau sur <html> pour que le CSS allège aussi le flou en mode éco. */
export function useFxClass() {
  const level = useFx((s) => s.level)
  useEffect(() => {
    document.documentElement.classList.toggle('fx-eco', level === 'eco')
  }, [level])
}
