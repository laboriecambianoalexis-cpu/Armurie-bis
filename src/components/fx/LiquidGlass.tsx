import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Container from '@/vendor/liquid-glass/container.js'
import '@/vendor/liquid-glass/glass.css'
import { hasWebGL } from '@/lib/motion'

/**
 * Panneau « liquid glass » (dashersw/liquid-glass-js) : verre WebGL qui réfracte la page derrière lui.
 * La page est capturée puis re-capturée quand `refreshKey` change (contenu différent) ou à la fenêtre redimensionnée.
 * Sans WebGL, on garde un simple fond translucide (classe `fallbackClassName`).
 */
export function LiquidGlass({
  children,
  className = '',
  fallbackClassName = '',
  borderRadius = 16,
  tintOpacity = 0.18,
  refreshKey,
  enabled = true,
}: {
  children: ReactNode
  className?: string
  fallbackClassName?: string
  borderRadius?: number
  tintOpacity?: number
  refreshKey?: unknown
  enabled?: boolean
}) {
  const host = useRef<HTMLDivElement>(null)
  const [target, setTarget] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!host.current || !enabled || !hasWebGL()) return
    const glass = new Container({ borderRadius, type: 'rounded', tintOpacity })
    const el = glass.element
    // la mise en page est gérée par nos classes, pas par glass.css
    el.style.padding = '0'
    el.style.gap = '0'
    el.style.justifyContent = 'stretch'
    el.className += ' ' + className
    host.current.appendChild(el)
    setTarget(el)
    const onResize = () => {
      glass.updateSizeFromDOM()
      schedule()
    }
    let t: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      clearTimeout(t)
      t = setTimeout(() => Container.refresh(), 500)
    }
    window.addEventListener('resize', onResize)
    const ro = new ResizeObserver(() => glass.updateSizeFromDOM())
    ro.observe(el)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', onResize)
      ro.disconnect()
      glass.destroy()
      setTarget(null)
    }
    // options fixées à la création ; on (dé)monte le verre quand le mode change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  // nouvelle capture quand le contenu de la page change (onglet, données…)
  useEffect(() => {
    if (!target) return
    const t = setTimeout(() => Container.refresh(), 700)
    return () => clearTimeout(t)
  }, [refreshKey, target])

  return <div ref={host}>{target ? createPortal(children, target) : <div className={`${className} ${fallbackClassName}`}>{children}</div>}</div>
}
