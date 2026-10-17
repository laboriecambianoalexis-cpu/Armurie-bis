import { Crosshair, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Field, Modal, Panel, useConfirm } from '@/components/ui'
import { productIngredients, unitCost, useStock } from '@/lib/stock'
import { useStore } from '@/lib/store'
import { CATEGORIES, type Category, type Ingredient, type Product } from '@/lib/types'
import { money, toNum } from '@/lib/utils'

function ProductForm({ product, onDone }: { product?: Product; onDone: () => void }) {
  const saveProduct = useStore((s) => s.saveProduct)
  const [name, setName] = useState(product?.name ?? '')
  const [category, setCategory] = useState<Category>(product?.category ?? 'Revolvers')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [image, setImage] = useState(product?.image ?? '')
  const materials = useStock((s) => s.materials)
  const [tax, setTax] = useState(String(product?.craftTax ?? 0))
  const [recipe, setRecipe] = useState<Record<string, string>>(() => {
    const existingIngredients = productIngredients(product)
    const knownIds = new Set(materials.map((material) => material.id))
    return Object.fromEntries(existingIngredients.filter(({ materialId }) => !knownIds.has(materialId)).map(({ materialId, qty }) => [materialId, String(qty)]))
  })
  const recipeEntries = productIngredients(product).filter(({ materialId }) => !materials.some((material) => material.id === materialId))
  const cleanIngredients = (): Ingredient[] => [
    ...recipeEntries,
    ...Object.entries(recipe).map(([materialId, value]) => ({ materialId, qty: toNum(value) })),
  ].filter(({ qty }) => qty > 0)
  const cleanRecipe = () => Object.fromEntries(cleanIngredients().map(({ materialId, qty }) => [materialId, qty]))
  const draftProduct = { ...(product ?? {} as Product), craftTax: toNum(tax), ingredients: cleanIngredients(), recipe: cleanRecipe() } as Product

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Donnez un nom à l’article.')
    if (toNum(price) <= 0) return toast.error('Le prix doit être supérieur à zéro.')
    saveProduct({ id: product?.id, name: name.trim(), category, price: toNum(price), stock: null, image: /^(https?:\/\/|img\/)/.test(image.trim()) ? image.trim() : undefined, craftTax: toNum(tax), ingredients: cleanIngredients(), recipe: cleanRecipe() })
    toast.success(product ? 'Article modifié.' : 'Article ajouté au catalogue.')
    onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Désignation *">
        <input className="field" autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Revolver Navy" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Catégorie">
          <select className="field" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Prix ($) *">
          <input className="field" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
        </Field>
      </div>
      <p className="ornament pt-2 text-[16px]">Fiche de fabrication</p>
      <p className="text-[14px] text-sepia">Les personnalisations sortent de la caisse de l'armurerie : leur marge revient intégralement au vendeur.</p>
      <Field label="Frais admin / taxes ($)">
        <input className="field" inputMode="decimal" value={tax} onChange={(e) => setTax(e.target.value)} />
      </Field>
      <fieldset className="min-w-0">
        <legend className="mb-2 font-sc text-[15px] tracking-[.14em] text-sepia">Matières requises</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {recipeEntries.map(({ materialId, qty }) => (
            <label key={materialId} className="flex min-w-0 items-center gap-3 rounded-xl border border-brass/20 bg-brass/[.04] px-3 py-2">
              <span className="min-w-0 flex-1 whitespace-normal break-words text-[15px] leading-snug" title={`Matière retirée (${materialId})`}>Matière retirée ({materialId})</span>
              <input className="field w-20 shrink-0 px-2 py-1 text-right font-type text-[17px]" inputMode="decimal" value={qty} readOnly aria-label={`Recette conservée pour ${materialId}`} />
            </label>
          ))}
          {materials.map((m) => (
            <label key={m.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2">
              <span className="min-w-0 flex-1 whitespace-normal break-words text-[15px] leading-snug" title={m.name}>{m.name}</span>
              <input
                className="field w-20 shrink-0 px-2 py-1 text-right font-type text-[17px]"
                inputMode="decimal"
                placeholder="0"
                value={recipe[m.id] ?? ''}
                onChange={(e) => setRecipe((r) => ({ ...r, [m.id]: e.target.value }))}
                aria-label={`Quantité requise : ${m.name}`}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-[14.5px] text-sepia">
        Coût de fabrication : <b className="font-type text-[17px] text-ink">{money(unitCost(draftProduct, materials))}</b>
        {toNum(price) > 0 && <> · marge {money(toNum(price) - unitCost(draftProduct, materials))}</>}
      </p>
      <Field label="Image (URL, optionnel)" hint="Lien direct vers une image (ex. Discord / Imgur). Vide = illustration automatique.">
        <input className="field" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" maxLength={500} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" variant="blood">
          Enregistrer
        </Button>
      </div>
    </form>
  )
}

export default function Catalogue() {
  const { products, deleteProduct } = useStore()
  const materials = useStock((s) => s.materials)
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const { ask, dialog } = useConfirm()

  async function remove(p: Product) {
    if (await ask(`Retirer « ${p.name} » du catalogue ?`)) {
      deleteProduct(p.id)
      toast('Article retiré.')
    }
  }

  return (
    <Panel
      title="Catalogue"
      icon={<Crosshair />}
      actions={
        <Button variant="blood" onClick={() => setEditing('new')}>
          <Plus size={18} /> Nouvel article
        </Button>
      }
    >
      <div className="space-y-6">
        {CATEGORIES.map((cat) => {
          const items = products.filter((p) => p.category === cat)
          if (!items.length) return null
          return (
            <div key={cat}>
              <p className="ornament mb-2 text-[19px]">{cat}</p>
              <div className="overflow-x-auto">
                <table className="ledger w-full min-w-[560px]">
                  <tbody>
                    {items.map((p) => (
                      <tr key={p.id}>
                        <td className="text-lg">{p.name}</td>
                        <td className="w-28 text-right font-type text-blood">{money(p.price)}</td>
                        <td className="w-32 text-right font-type text-sepia">Coût {money(unitCost(p, materials))}</td>
                        <td className="max-w-48 truncate text-right text-[13px] text-sepia" title={productIngredients(p).map((i) => `${materials.find((m) => m.id === i.materialId)?.name ?? i.materialId} × ${i.qty}`).join(', ')}>{productIngredients(p).length ? productIngredients(p).map((i) => `${materials.find((m) => m.id === i.materialId)?.name ?? i.materialId} ×${i.qty}`).join(', ') : 'Sans recette'}</td>
                        <td className="w-20 text-right whitespace-nowrap">
                          <button className="cursor-pointer p-1.5 text-sepia hover:text-ink" onClick={() => setEditing(p)} aria-label="Modifier">
                            <Pencil size={16} />
                          </button>
                          <button className="cursor-pointer p-1.5 text-sepia hover:text-blood" onClick={() => remove(p)} aria-label="Supprimer">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={editing === 'new' ? 'Nouvel article' : 'Modifier l’article'}>
        {editing && <ProductForm product={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />}
      </Modal>
      {dialog}
    </Panel>
  )
}
