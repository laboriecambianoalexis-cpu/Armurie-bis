import * as Tabs from '@radix-ui/react-tabs'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Coins, Crosshair, Download, ScrollText, Settings2, Upload, Users, Handshake, AlertTriangle, Boxes, Calculator, Megaphone, Repeat } from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button, Field, Modal, useConfirm } from '@/components/ui'
import { hasDb, subscribe } from '@/lib/db'
import { exportData, useStore } from '@/lib/store'
import { clamp, cn, isToday, money, toNum } from '@/lib/utils'
import Caisse from '@/pages/Caisse'
import Catalogue from '@/pages/Catalogue'
import Clients from '@/pages/Clients'
import Commandes from '@/pages/Commandes'
import Guide from '@/pages/Guide'
import Partenaires from '@/pages/Partenaires'
import Crieur from '@/pages/Crieur'
import Stock from '@/pages/Stock'
import Compta from '@/pages/Compta'
import Rachat from '@/pages/Rachat'
import { subscribeRachat, useRachat } from '@/lib/rachat'
import { isCritical, subscribeStock, useStock } from '@/lib/stock'
import { subscribeLedger, useLedger } from '@/lib/ledger'
import { subscribeStaff, useStaff } from '@/lib/staff'
import { SellerPicker, StaffSetting } from '@/components/Staff'
import { subscribeExtras, useExtras } from '@/lib/extras'
import { useUi, type TabId } from '@/lib/ui'
import { FxBoundary } from '@/components/fx/FxBoundary'
import { LiquidGlass } from '@/components/fx/LiquidGlass'
import { useFullFx, useFx, useFxClass, useWindowActive } from '@/lib/perf'

// Effets visuels chargés à la demande (three.js / shaders sont lourds)
const ShaderBackground = lazy(() => import('@/components/fx/ShaderBackground'))

const TABS: { id: TabId; label: string; icon: ReactNode; page: () => ReactNode }[] = [
  { id: 'caisse', label: 'Caisse', icon: <Coins size={18} />, page: () => <Caisse /> },
  { id: 'partenaires', label: 'Partenaires', icon: <Handshake size={18} />, page: () => <Partenaires /> },
  { id: 'commandes', label: 'Commandes', icon: <ScrollText size={18} />, page: () => <Commandes /> },
  { id: 'rachat', label: 'Rachat', icon: <Repeat size={18} />, page: () => <Rachat /> },
  { id: 'clients', label: 'Clients', icon: <Users size={18} />, page: () => <Clients /> },
  { id: 'catalogue', label: 'Catalogue', icon: <Crosshair size={18} />, page: () => <Catalogue /> },
  { id: 'stock', label: 'Stock', icon: <Boxes size={18} />, page: () => <Stock /> },
  { id: 'compta', label: 'Compta', icon: <Calculator size={18} />, page: () => <Compta /> },
  { id: 'guide', label: 'Guide', icon: <BookOpen size={18} />, page: () => <Guide /> },
  { id: 'crieur', label: 'Crieur', icon: <Megaphone size={18} />, page: () => <Crieur /> },
]

export default function App() {
  const { tab, setTab } = useUi()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settings = useStore((s) => s.settings)
  const pending = useStore((s) => s.orders.filter((o) => o.status === 'en_attente').length)
  const cartCount = useStore((s) => s.cart.items.reduce((n, i) => n + i.qty, 0))
  const ready = useStore((s) => s.ready)
  const todayTotal = useStore((s) =>
    s.orders.filter((o) => (o.status === 'payee' || o.status === 'livree') && isToday(o.createdAt)).reduce((t, o) => t + o.total, 0),
  )

  // Chargement depuis Supabase + synchro en direct avec les autres caisses
  useEffect(() => {
    if (!hasDb) return
    const { load } = useStore.getState()
    load()
    const loadExtras = useExtras.getState().load
    loadExtras()
    const off = subscribe(load)
    const offExtras = subscribeExtras(loadExtras)
    const loadStock = useStock.getState().load
    loadStock()
    const offStock = subscribeStock(loadStock)
    const loadLedger = useLedger.getState().load
    loadLedger()
    const offLedger = subscribeLedger(loadLedger)
    const loadStaff = useStaff.getState().load
    loadStaff()
    const offStaff = subscribeStaff(loadStaff)
    const loadRachat = useRachat.getState().load
    loadRachat()
    const offRachat = subscribeRachat(loadRachat)
    return () => {
      offRachat()
      offStaff()
      offLedger()
      off()
      offExtras()
      offStock()
    }
  }, [])

  const fullFx = useFullFx()
  const materials = useStock((st) => st.materials)
  const critical = useMemo(() => materials.filter(isCritical), [materials])
  const active = useWindowActive()
  useFxClass()

  return (
    <Tabs.Root value={tab} onValueChange={(v) => setTab(v as TabId)} className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 pb-10 sm:px-8">
      {/* fond animé : seulement en mode complet ET tant que la fenêtre est au premier plan */}
      {fullFx && active && (
        <FxBoundary>
          <Suspense fallback={null}>
            <ShaderBackground />
          </Suspense>
        </FxBoundary>
      )}

      <div className="site-frame" aria-hidden="true" />

      {/* ——— En-tête : bannière de la boutique, vendeur à gauche, recette du jour à droite ——— */}
      <header className="relative mt-5 mb-5 overflow-hidden rounded-[22px] border border-[#5a1414]/60 shadow-[0_30px_60px_-30px_rgba(0,0,0,.9)]">
        <img
          src={`${import.meta.env.BASE_URL}img/banner.webp`}
          alt=""
          className="block h-40 w-full object-cover object-[50%_46%] sm:h-[250px] lg:h-[300px]"
          draggable={false}
        />
        <h1 className="sr-only">{settings.shopName}</h1>
        <div className="pointer-events-none flex flex-wrap items-end justify-between gap-3 bg-[#0b0504] p-3 sm:absolute sm:inset-x-0 sm:bottom-0 sm:bg-transparent sm:px-6 sm:pb-4 [&>*]:pointer-events-auto">
          <SellerPicker />
          <div className="text-right">
            <p className="label text-[14px] text-sepia [text-shadow:0_1px_6px_#000]">Recette du jour</p>
            <p className="font-type text-4xl tracking-[.02em] sm:text-[44px] [text-shadow:0_2px_16px_#000,0_0_4px_#000]">{money(todayTotal)}</p>
          </div>
        </div>
      </header>

      {/* ——— Navigation style menu RDR2 ——— */}
      <nav className="sticky top-0 z-30 mb-6 pt-3 pb-2">
        <LiquidGlass
          className="flex items-center justify-between gap-2 px-2 py-1.5"
          fallbackClassName="rounded-[20px] border border-white/10 bg-[#120c09]/80 backdrop-blur-md"
          borderRadius={20}
          tintOpacity={0.22}
          refreshKey={`${tab}-${ready}`}
          enabled={fullFx}
        >
          <Tabs.List className="flex flex-1 gap-1 overflow-x-auto scroll-thin" aria-label="Sections">
            {TABS.map((t) => (
              <Tabs.Trigger
                key={t.id}
                value={t.id}
                className={cn(
                  'relative flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 font-sc text-[19px] tracking-[.1em] whitespace-nowrap uppercase transition-colors outline-none focus-visible:text-white',
                  tab === t.id ? 'text-white' : 'text-parch/55 hover:text-parch',
                )}
              >
                {tab === t.id && <motion.span layoutId="brush" className="brush absolute inset-x-0 inset-y-1 -z-0" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                <span className="relative z-10 flex items-center gap-2">
                  {t.icon}
                  {t.label}
                  {t.id === 'caisse' && cartCount > 0 && <Badge>{cartCount}</Badge>}
                  {t.id === 'commandes' && pending > 0 && <Badge>{pending}</Badge>}
                  {t.id === 'stock' && critical.length > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-blood px-1.5 font-type text-[13px] tracking-normal text-white">{critical.length}</span>}
                </span>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <button onClick={() => setSettingsOpen(true)} className="mr-1 cursor-pointer rounded-xl p-2 text-parch/60 transition hover:rotate-45 hover:bg-white/10 hover:text-ink" aria-label="Réglages">
            <Settings2 size={22} />
          </button>
        </LiquidGlass>
      </nav>

      {critical.length > 0 && tab !== 'stock' && (
        <button
          onClick={() => setTab('stock')}
          className="mb-4 flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-blood/40 bg-blood/10 px-4 py-2.5 text-left transition hover:bg-blood/20"
        >
          <AlertTriangle className="shrink-0 text-blood" size={20} />
          <span className="flex-1">
            <b className="font-semibold">Stock critique :</b> {critical.map((m) => `${m.name} (${m.stock})`).join(', ')} — pensez à commander.
          </span>
          <span className="label text-[14px] text-sepia">Voir le stock →</span>
        </button>
      )}

      {!ready ? (
        <div className="grid flex-1 place-items-center py-24 text-center">
          <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.6 }} className="font-western text-2xl text-parch/80">
            Ouverture du registre…
          </motion.p>
        </div>
      ) : (
      <AnimatePresence mode="wait">
        {TABS.filter((t) => t.id === tab).map((t) => (
          <Tabs.Content key={t.id} value={t.id} forceMount asChild>
            <motion.main initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="flex-1 outline-none">
              {t.page()}
            </motion.main>
          </Tabs.Content>
        ))}
      </AnimatePresence>
      )}

      <footer className="mt-10 text-center text-sm text-sepia-2 italic">{hasDb ? 'Registre partagé en direct entre toutes les caisses — sauvegarde possible via ⚙.' : 'Données enregistrées dans ce navigateur — pensez à exporter une sauvegarde (⚙).'}</footer>

      <Modal open={settingsOpen} onOpenChange={setSettingsOpen} title="Réglages de la boutique">
        <SettingsForm onDone={() => setSettingsOpen(false)} />
      </Modal>
    </Tabs.Root>
  )
}

const Badge = ({ children }: { children: ReactNode }) => (
  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1.5 font-type text-[13px] tracking-normal text-[#1a120c]">{children}</span>
)

function SettingsForm({ onDone }: { onDone: () => void }) {
  const { settings, saveSettings, importData, resetAll } = useStore()
  const [shopName, setShopName] = useState(settings.shopName)
  const [town, setTown] = useState(settings.town)
  const [tax, setTax] = useState(String(settings.taxPct))
  const fileRef = useRef<HTMLInputElement>(null)
  const { ask, dialog } = useConfirm()

  function save() {
    saveSettings({ shopName: shopName.trim() || 'Armurerie', town: town.trim(), taxPct: clamp(toNum(tax), 0, 100) })
    toast.success('Réglages enregistrés.')
    onDone()
  }

  function download() {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `armurerie-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success('Sauvegarde téléchargée.')
  }

  async function upload(file: File) {
    try {
      const data = JSON.parse(await file.text())
      if (!(await ask('Importer cette sauvegarde remplacera toutes les données actuelles. Continuer ?'))) return
      if (await importData(data)) {
        toast.success('Sauvegarde restaurée.')
        onDone()
      } else toast.error('Fichier de sauvegarde invalide.')
    } catch {
      toast.error('Impossible de lire ce fichier.')
    }
  }

  return (
    <div className="space-y-3">
      <Field label="Nom de la boutique">
        <input className="field" value={shopName} onChange={(e) => setShopName(e.target.value)} maxLength={60} />
      </Field>
      <Field label="Ville / adresse">
        <input className="field" value={town} onChange={(e) => setTown(e.target.value)} maxLength={80} />
      </Field>
      <Field label="Taxe appliquée (%)" hint="0 pour ne pas appliquer de taxe.">
        <input className="field" inputMode="decimal" value={tax} onChange={(e) => setTax(e.target.value)} />
      </Field>
      <div className="flex justify-end">
        <Button variant="blood" onClick={save}>
          Enregistrer
        </Button>
      </div>

      <StaffSetting />
      <FxSetting />

      <p className="ornament pt-2 font-sc">Données</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="ink" onClick={download}>
          <Download size={16} /> Exporter
        </Button>
        <Button variant="ink" onClick={() => fileRef.current?.click()}>
          <Upload size={16} /> Importer
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) upload(f)
            e.target.value = ''
          }}
        />
      </div>
      <Button
        variant="ghost"
        className="w-full text-blood"
        onClick={async () => {
          if (await ask('Tout effacer (clients, commandes, catalogue) et repartir de zéro ?')) {
            resetAll()
            toast('Registre remis à zéro.')
            onDone()
          }
        }}
      >
        Tout remettre à zéro
      </Button>
      {dialog}
    </div>
  )
}

/** Choix du niveau d'effets visuels (enregistré sur ce PC uniquement). */
function FxSetting() {
  const { level, setLevel } = useFx()
  const opt = (v: 'eco' | 'full', title: string, desc: string) => (
    <button
      onClick={() => setLevel(v)}
      className={cn(
        'flex-1 cursor-pointer rounded-xl border p-3 text-left transition',
        level === v ? 'border-blood bg-blood/15 shadow-[0_0_20px_-8px_rgba(208,27,37,.7)]' : 'border-white/10 hover:bg-white/[.05]',
      )}
    >
      <span className="label block text-[17px]">{title}</span>
      <span className="text-[14px] leading-snug text-sepia">{desc}</span>
    </button>
  )
  return (
    <>
      <p className="ornament pt-2 font-sc">Effets visuels (ce PC)</p>
      <div className="flex gap-2">
        {opt('eco', 'Économie', "Recommandé si tu joues à RedM en même temps : aucune animation lourde, presque aucune ressource.")}
        {opt('full', 'Complet', "Fond animé, métal liquide, verre liquide, barillet 3D (mis en pause quand la fenêtre n'est pas active).")}
      </div>
    </>
  )
}
