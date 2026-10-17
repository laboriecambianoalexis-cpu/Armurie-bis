import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { STATUS_LABEL, type OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

type Variant = 'blood' | 'ink' | 'ghost' | 'brass'

const variants: Record<Variant, string> = {
  blood:
    'border-white/10 bg-gradient-to-b from-[#e0262f] to-[#a3121a] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_10px_28px_-10px_rgba(208,27,37,.75)] hover:brightness-110 hover:shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_14px_34px_-10px_rgba(208,27,37,.9)]',
  ink: 'border-white/12 bg-white/[.07] text-ink hover:bg-white/[.12] hover:border-white/25',
  ghost: 'border-white/10 bg-transparent text-sepia hover:bg-white/[.06] hover:text-ink',
  brass:
    'border-white/10 bg-gradient-to-b from-[#e6b65d] to-[#b07f2c] text-[#1a120c] shadow-[0_10px_28px_-12px_rgba(214,165,77,.7)] hover:brightness-110',
}

export function Button({
  variant = 'ink',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border font-sc tracking-[.14em] uppercase transition duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40',
        size === 'sm' && 'px-3 py-1 text-[15px]',
        size === 'md' && 'px-4 py-2 text-[17px]',
        size === 'lg' && 'px-6 py-3 text-2xl',
        variants[variant],
        className,
      )}
    />
  )
}

export function Panel({ title, icon, actions, className, children }: { title?: ReactNode; icon?: ReactNode; actions?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={cn('glass-panel p-5 sm:p-6', className)}>
      {(title || actions) && (
        <header className="relative z-10 mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && (
            <h2 className="flex items-center gap-2.5 font-western text-2xl tracking-[.08em] text-ink sm:text-[28px]">
              {icon && <span className="text-blood [&_svg]:drop-shadow-[0_0_8px_rgba(208,27,37,.6)]">{icon}</span>}
              {title}
            </h2>
          )}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="relative z-10">{children}</div>
    </section>
  )
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block font-sc text-[15px] tracking-[.14em] text-sepia">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs italic text-sepia-2">{hint}</span>}
    </label>
  )
}

const statusColor: Record<OrderStatus, string> = {
  en_attente: 'text-brass',
  payee: 'text-sage',
  livree: 'text-[#7fb2e5]',
  annulee: 'text-blood',
}

export const StatusStamp = ({ status }: { status: OrderStatus }) => <span className={cn('stamp', statusColor[status])}>{STATUS_LABEL[status]}</span>

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  wide,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild aria-describedby={undefined}>
              <motion.div
                className={cn(
                  'glass-panel fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto p-6 scroll-thin focus:outline-none',
                  wide ? 'max-w-2xl' : 'max-w-lg',
                )}
                initial={{ opacity: 0, x: '-50%', y: '-47%', scale: 0.97 }}
                animate={{ opacity: 1, x: '-50%', y: '-50%', scale: 1 }}
                exit={{ opacity: 0, x: '-50%', y: '-47%', scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              >
                <div className="relative z-10">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <Dialog.Title className="font-western text-3xl tracking-[.06em] text-ink">{title}</Dialog.Title>
                    <Dialog.Close className="cursor-pointer rounded-lg p-1.5 text-sepia transition hover:bg-white/10 hover:text-ink" aria-label="Fermer">
                      <X size={20} />
                    </Dialog.Close>
                  </div>
                  {children}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

/** Petit hook pour une confirmation « Êtes-vous sûr ? ». */
export function useConfirm() {
  const [state, setState] = useState<{ message: string; resolve: (v: boolean) => void } | null>(null)
  const ask = (message: string) => new Promise<boolean>((resolve) => setState({ message, resolve }))
  const close = (v: boolean) => {
    state?.resolve(v)
    setState(null)
  }
  const dialog = (
    <Modal open={!!state} onOpenChange={(o) => !o && close(false)} title="Êtes-vous certain ?">
      <p className="mb-6 text-lg text-ink">{state?.message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => close(false)}>
          Non
        </Button>
        <Button variant="blood" onClick={() => close(true)}>
          Oui, j'en suis sûr
        </Button>
      </div>
    </Modal>
  )
  return { ask, dialog }
}

export function Empty({ icon, children, vivid }: { icon: ReactNode; children: ReactNode; vivid?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center text-sepia">
      <span className={vivid ? '' : 'opacity-60'}>{icon}</span>
      <p className="italic text-sepia">{children}</p>
    </div>
  )
}

export function Stat({ label, value, sub, icon }: { label: string; value: ReactNode; sub?: string; icon: ReactNode }) {
  return (
    <div className="glass-panel p-5">
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="font-sc tracking-[.16em] text-sepia">{label}</p>
          <p className="mt-1 font-type text-5xl tracking-[.02em] text-ink">{value}</p>
          {sub && <p className="mt-1 text-sm italic text-sepia-2">{sub}</p>}
        </div>
        <span className="grid size-11 place-items-center rounded-xl bg-blood/15 text-blood shadow-[0_0_24px_-6px_rgba(208,27,37,.6)]">{icon}</span>
      </div>
    </div>
  )
}
