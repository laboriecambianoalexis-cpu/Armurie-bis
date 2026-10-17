import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn, money } from '@/lib/utils'

/* Graphiques SVG légers (pas de librairie : le site doit rester léger à côté de RedM).
 * Couleurs validées sur fond sombre : laiton (série unique), gain #4fa86a / perte #e0443d
 * (paire toujours doublée par la position au-dessus / au-dessous de zéro et le signe).
 */
const BRASS = '#d6a54d'
const GAIN = '#4fa86a'
const LOSS = '#e0443d'
const GRID = 'rgba(241,236,226,.08)'
const INK_MUTED = 'rgba(241,236,226,.55)'

function useWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(600)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, e.contentRect.width)))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return { ref, w }
}

const compact = (v: number) => (Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(1).replace('.', ',')}k` : `$${Math.round(v)}`)

/** 4 graduations « rondes » couvrant [min, max]. */
function ticks(min: number, max: number) {
  const span = max - min || 1
  const step = Math.pow(10, Math.floor(Math.log10(span / 4)))
  const nice = [1, 2, 2.5, 5, 10].map((m) => m * step).find((s) => span / s <= 5) ?? step * 10
  const out: number[] = []
  const end = Math.ceil(max / nice) * nice // la dernière graduation couvre toujours le maximum
  for (let v = Math.floor(min / nice) * nice; v <= end + 1e-9; v += nice) out.push(Math.round(v * 100) / 100)
  return out
}

export function ChartCard({ title, subtitle, children, className }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn('glass-panel p-5', className)}>
      <h3 className="label text-[17px] text-ink">{title}</h3>
      {subtitle && <p className="text-[14px] text-sepia">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Tooltip({ x, y, w, children }: { x: number; y: number; w: number; children: ReactNode }) {
  const left = Math.min(Math.max(x, 70), w - 70)
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl border border-white/12 bg-[#120c09]/95 px-3 py-2 text-[14px] whitespace-nowrap shadow-xl"
      style={{ left, top: y - 10 }}
    >
      {children}
    </div>
  )
}

/** Courbe du solde (série unique, aire légère). */
export function BalanceChart({ points, height = 220 }: { points: { t: number; label: string; v: number }[]; height?: number }) {
  const { ref, w } = useWidth()
  const [hover, setHover] = useState<number | null>(null)
  if (points.length < 2) return <p className="py-10 text-center text-sepia italic">Pas assez de mouvements pour tracer la courbe.</p>

  const pad = { l: 56, r: 12, t: 12, b: 26 }
  const vals = points.map((p) => p.v)
  const tk = ticks(Math.min(0, ...vals), Math.max(...vals))
  const lo = tk[0]
  const hi = tk[tk.length - 1]
  const t0 = points[0].t
  const t1 = points[points.length - 1].t || t0 + 1
  const x = (t: number) => pad.l + ((t - t0) / (t1 - t0 || 1)) * (w - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo || 1)) * (height - pad.t - pad.b)
  // marches d'escalier : le solde ne change qu'au moment d'un mouvement
  let d = `M${x(points[0].t)},${y(points[0].v)}`
  for (let i = 1; i < points.length; i++) d += ` H${x(points[i].t)} V${y(points[i].v)}`
  const area = `${d} V${y(lo)} H${x(points[0].t)} Z`
  const h = hover !== null ? points[hover] : null

  return (
    <div ref={ref} className="relative">
      <svg
        width={w}
        height={height}
        className="block touch-none"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const t = t0 + ((e.clientX - r.left - pad.l) / (w - pad.l - pad.r)) * (t1 - t0)
          let best = 0
          points.forEach((p, i) => p.t <= t && (best = i))
          setHover(best)
        }}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label="Évolution du solde du compte"
      >
        <defs>
          <linearGradient id="bal-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={BRASS} stopOpacity=".28" />
            <stop offset="1" stopColor={BRASS} stopOpacity="0" />
          </linearGradient>
        </defs>
        {tk.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} stroke={v === 0 ? 'rgba(241,236,226,.25)' : GRID} />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" fontSize="12" fill={INK_MUTED}>
              {compact(v)}
            </text>
          </g>
        ))}
        <path d={area} fill="url(#bal-fill)" />
        <path d={d} fill="none" stroke={BRASS} strokeWidth="2" strokeLinejoin="round" />
        <text x={pad.l} y={height - 6} fontSize="12" fill={INK_MUTED}>
          {points[0].label}
        </text>
        <text x={w - pad.r} y={height - 6} textAnchor="end" fontSize="12" fill={INK_MUTED}>
          {points[points.length - 1].label}
        </text>
        {h && (
          <>
            <line x1={x(h.t)} x2={x(h.t)} y1={pad.t} y2={height - pad.b} stroke="rgba(241,236,226,.3)" strokeDasharray="3 3" />
            <circle cx={x(h.t)} cy={y(h.v)} r="5" fill={BRASS} stroke="#1b1310" strokeWidth="2" />
          </>
        )}
      </svg>
      {h && (
        <Tooltip x={x(h.t)} y={y(h.v)} w={w}>
          <span className="text-sepia">{h.label}</span> · <b className="font-type text-[17px] text-ink">{money(h.v)}</b>
        </Tooltip>
      )}
    </div>
  )
}

/** Barres de flux net par jour / heure : au-dessus de zéro = gain, en dessous = perte. */
export function FlowBars({ buckets, height = 220 }: { buckets: { label: string; in: number; out: number }[]; height?: number }) {
  const { ref, w } = useWidth()
  const [hover, setHover] = useState<number | null>(null)
  if (!buckets.some((b) => b.in || b.out)) return <p className="py-10 text-center text-sepia italic">Aucun mouvement sur la période.</p>

  const pad = { l: 56, r: 8, t: 12, b: 26 }
  const nets = buckets.map((b) => b.in + b.out)
  const tk = ticks(Math.min(0, ...nets), Math.max(0, ...nets))
  const lo = tk[0]
  const hi = tk[tk.length - 1]
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo || 1)) * (height - pad.t - pad.b)
  const slot = (w - pad.l - pad.r) / buckets.length
  const bw = Math.max(3, Math.min(28, slot - 4)) // 2px d'écart de chaque côté
  const every = Math.ceil(buckets.length / Math.max(1, Math.floor((w - pad.l) / 56)))

  return (
    <div ref={ref} className="relative">
      <svg width={w} height={height} className="block" role="img" aria-label="Flux net par période">
        {tk.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} stroke={v === 0 ? 'rgba(241,236,226,.3)' : GRID} />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" fontSize="12" fill={INK_MUTED}>
              {compact(v)}
            </text>
          </g>
        ))}
        {buckets.map((b, i) => {
          const net = nets[i]
          const cx = pad.l + slot * i + slot / 2
          const top = y(Math.max(0, net))
          const hgt = Math.max(net ? 2 : 0, Math.abs(y(net) - y(0)))
          return (
            <g key={i} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
              {/* zone de survol plus large que la barre */}
              <rect x={pad.l + slot * i} y={pad.t} width={slot} height={height - pad.t - pad.b} fill="transparent" />
              {net !== 0 && (
                <rect
                  x={cx - bw / 2}
                  y={top}
                  width={bw}
                  height={hgt}
                  rx={Math.min(4, bw / 2)}
                  fill={net > 0 ? GAIN : LOSS}
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              )}
              {i % every === 0 && (
                <text x={cx} y={height - 6} textAnchor="middle" fontSize="12" fill={INK_MUTED}>
                  {b.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <Tooltip x={pad.l + slot * hover + slot / 2} y={y(Math.max(0, nets[hover]))} w={w}>
          <p className="text-sepia">{buckets[hover].label}</p>
          <p>
            Entrées <b className="font-type text-[16px] text-ink">+{money(buckets[hover].in)}</b> · Sorties{' '}
            <b className="font-type text-[16px] text-ink">−{money(Math.abs(buckets[hover].out))}</b>
          </p>
          <p>
            Net{' '}
            <b className="font-type text-[17px] text-ink">
              {nets[hover] >= 0 ? '+' : '−'}
              {money(Math.abs(nets[hover]))}
            </b>
          </p>
        </Tooltip>
      )}
    </div>
  )
}

/** Barres horizontales (série unique laiton) : ex. bénéfice par article. Valeur écrite en texte, pas en couleur. */
export function HBars({ rows, max = 8 }: { rows: { label: string; value: number }[]; max?: number }) {
  const list = rows.slice(0, max)
  const top = Math.max(...list.map((r) => Math.abs(r.value)), 1)
  if (!list.length) return <p className="py-6 text-center text-sepia italic">Aucune donnée.</p>
  return (
    <ul className="space-y-2.5">
      {list.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(110px,180px)_1fr_auto] items-center gap-3">
          <span className="truncate text-[15.5px]" title={r.label}>
            {r.label}
          </span>
          <div className="h-3 overflow-hidden rounded-full bg-white/[.06]">
            <div
              className="h-full rounded-full"
              style={{ width: `${(Math.abs(r.value) / top) * 100}%`, background: r.value < 0 ? LOSS : BRASS }}
            />
          </div>
          <span className="w-24 text-right font-type text-[17px]">{money(r.value)}</span>
        </li>
      ))}
    </ul>
  )
}
