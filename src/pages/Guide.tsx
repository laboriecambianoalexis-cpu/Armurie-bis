import { BookOpen, Mail, Search } from 'lucide-react'
import { useState } from 'react'
import { WeaponSheetCard } from '@/components/WeaponSheetCard'
import { Empty, Panel } from '@/components/ui'
import { CONTACT, FAMILIES, KNOW_HOW, SHEETS, TAG_LABEL } from '@/lib/guide'

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export default function Guide() {
  const [q, setQ] = useState('')
  const n = norm(q)
  const match = SHEETS.filter((s) => !n || norm([s.name, s.summary, s.advice ?? '', s.raw, ...s.tags.map((t) => TAG_LABEL[t])].join(' ')).includes(n))

  return (
    <div className="space-y-6">
      <Panel title="Guide de l'armurier" icon={<BookOpen />}>
        <p className="mb-4 italic text-sepia">Notes de formation : ce qu'il faut savoir sur chaque arme pour bien conseiller le client.</p>
        <div className="relative mb-5 max-w-md">
          <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-sepia" size={16} />
          <input className="field pl-9" placeholder="Arme, « chasse », « étui », « passionnés »…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {match.length === 0 ? (
          <Empty icon={<Search size={32} />}>Rien dans les notes à ce sujet.</Empty>
        ) : (
          <div className="space-y-6">
            {FAMILIES.map((f) => {
              const list = match.filter((s) => s.family === f)
              if (!list.length) return null
              return (
                <section key={f}>
                  <p className="ornament mb-3 text-[19px]">{f}</p>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {list.map((s) => (
                      <WeaponSheetCard key={s.id} sheet={s} />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </Panel>

      <Panel title="Savoir-faire" icon={<BookOpen />}>
        <div className="grid gap-3 md:grid-cols-2">
          {KNOW_HOW.map((k) => (
            <div key={k.title} className="tile p-4 text-ink hover:translate-y-0">
              <h3 className="font-western text-[24px] tracking-[.05em]">{k.title.toUpperCase()}</h3>
              <p className="mt-1">{k.text}</p>
              <p className="mt-2 border-l-2 border-white/15 pl-2 text-[14px] text-sepia italic">« {k.raw} »</p>
            </div>
          ))}
          <div className="flex items-center gap-4 rounded-[16px] border border-blood/40 bg-blood/10 p-4 text-ink shadow-[0_0_30px_-10px_rgba(208,27,37,.5)]">
            <Mail className="text-blood" size={28} />
            <div>
              <p className="font-sc text-sepia">{CONTACT.label}</p>
              <p className="font-type text-2xl tracking-widest">{CONTACT.code}</p>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  )
}
