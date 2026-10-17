import { Check, Copy, Megaphone, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button, Panel } from '@/components/ui'
import { useStore } from '@/lib/store'

const KEY = 'armurerie-crieur'
const defaults = (shop: string) => [`Arme, munitions, personnalisation, amélioration ? L'${shop.replace(/^Armurerie/i, 'armurerie')} est ouverte et à votre service !`]

function load(shop: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (Array.isArray(v) && v.length) return v
  } catch {
    /* stockage indisponible */
  }
  return defaults(shop)
}

/** Annonces du crieur public : un clic = copié, prêt à coller en jeu. */
export default function Crieur() {
  const shop = useStore((s) => s.settings.shopName)
  const [msgs, setMsgs] = useState(() => load(shop))
  const [copied, setCopied] = useState<number | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(msgs))
    } catch {
      /* stockage indisponible */
    }
  }, [msgs])

  async function copy(i: number) {
    try {
      await navigator.clipboard.writeText(msgs[i])
    } catch {
      // repli pour les navigateurs qui refusent l'API presse-papiers
      const t = document.createElement('textarea')
      t.value = msgs[i]
      document.body.appendChild(t)
      t.select()
      document.execCommand('copy')
      t.remove()
    }
    setCopied(i)
    toast.success('Annonce copiée — colle-la en jeu (Ctrl+V).')
    setTimeout(() => setCopied((c) => (c === i ? null : c)), 1800)
  }

  return (
    <Panel
      title="Crieur public"
      icon={<Megaphone />}
      actions={
        <Button variant="ink" onClick={() => setMsgs((m) => [...m, ''])}>
          <Plus size={17} /> Nouvelle annonce
        </Button>
      }
    >
      <p className="mb-4 text-[15px] text-sepia italic">Clique sur « Copier », puis colle l'annonce en jeu. Les textes sont modifiables et gardés sur ce PC.</p>
      <div className="space-y-4">
        {msgs.map((m, i) => (
          <div key={i} className="tile p-4 hover:translate-y-0">
            <textarea
              className="field min-h-24 text-[18px] leading-snug"
              value={m}
              onChange={(e) => setMsgs((all) => all.map((x, k) => (k === i ? e.target.value : x)))}
              maxLength={500}
              placeholder="Texte de l'annonce…"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[14px] text-sepia">{m.length} caractère(s)</span>
              <div className="flex gap-2">
                {msgs.length > 1 && (
                  <Button size="sm" variant="ghost" onClick={() => setMsgs((all) => all.filter((_, k) => k !== i))} aria-label="Supprimer l'annonce">
                    <Trash2 size={14} />
                  </Button>
                )}
                <Button variant="blood" disabled={!m.trim()} onClick={() => copy(i)}>
                  {copied === i ? <Check size={18} /> : <Copy size={18} />} {copied === i ? 'Copié !' : 'Copier'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
