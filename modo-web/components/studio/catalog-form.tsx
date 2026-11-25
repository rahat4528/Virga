"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { ItemDto } from "@/types/item"

interface CatalogFormProps {
  initialItem?: ItemDto
}

export function CatalogForm({ initialItem }: CatalogFormProps) {
  const router = useRouter()
  const isEditing = Boolean(initialItem?._id)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const initialCover =
    initialItem?.gallery?.find((g) => g.isCover)?.src ||
    initialItem?.gallery?.[0]?.src ||
    "/cashmere-cardigan.jpg"

  const [title, setTitle] = useState(initialItem?.title || "")
  const [description, setDescription] = useState(initialItem?.description || "")
  const [summary, setSummary] = useState(initialItem?.summary || "")
  const [price, setPrice] = useState(initialItem ? String(initialItem.price) : "")
  const [listPrice, setListPrice] = useState(
    initialItem?.listPrice !== undefined ? String(initialItem.listPrice) : ""
  )
  const [stock, setStock] = useState(initialItem ? String(initialItem.stock) : "20")
  const [imageUrl, setImageUrl] = useState(initialCover)
  const [labels, setLabels] = useState(
    initialItem?.labels?.length ? initialItem.labels.join(", ") : "cashmere, tailoring, essential"
  )

  const [spotlight, setSpotlight] = useState(initialItem?.spotlight ?? false)
  const [isFresh, setIsFresh] = useState(initialItem?.isFresh ?? true)
  const [isOffer, setIsOffer] = useState(initialItem?.isOffer ?? false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !description || !price) {
      toast.error("Please fill in title, description, and price")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        title,
        description,
        summary,
        price: parseFloat(price),
        listPrice: listPrice ? parseFloat(listPrice) : undefined,
        stock: parseInt(stock, 10) || 0,
        gallery: [{ src: imageUrl, alt: title, isCover: true }],
        labels: labels.split(",").map((l) => l.trim()).filter(Boolean),
        state: initialItem?.state || "live",
        spotlight,
        isFresh,
        isOffer,
        details: initialItem?.details?.length
          ? initialItem.details
          : [
              { label: "Craft", value: "Virga Atelier Series" },
              { label: "Care", value: "Specialist dry clean only" },
            ],
      }

      const res = await fetch(
        isEditing ? `/api/catalog/${initialItem!._id}` : "/api/studio/catalog",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      const data = await res.json()
      if (res.ok && data.ok) {
        toast.success(
          isEditing ? "Piece updated in catalog!" : "Piece successfully added to catalog!"
        )
        router.push("/studio/catalog")
        router.refresh()
      } else {
        toast.error(data.error?.message || "Failed to save piece")
      }
    } catch (err) {
      console.error(err)
      toast.error("Network error while saving piece")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-card p-6 rounded-3xl border border-border/80 shadow-sm">
      <div className="space-y-4">
        <h3 className="font-heading text-lg font-bold text-foreground">
          {isEditing ? "Update Piece Details" : "Piece Details"}
        </h3>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Double-Faced Virgin Wool Coat"
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary">Summary (One sentence blurb)</Label>
          <Input
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="e.g. Sculptural silhouette crafted from unbleached wool."
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Full Editorial Description</Label>
          <Textarea
            id="description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed narrative on the fiber origin, drape, and finishing…"
            className="rounded-xl min-h-28"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="380"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="listPrice">List Price ($)</Label>
            <Input
              id="listPrice"
              type="number"
              step="0.01"
              value={listPrice}
              onChange={(e) => setListPrice(e.target.value)}
              placeholder="440"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Initial Stock</Label>
            <Input
              id="stock"
              type="number"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Cover Image Path / URL</Label>
          <Input
            id="image"
            required
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="/tailored-wool-blazer.jpg"
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="labels">Labels (comma-separated)</Label>
          <Input
            id="labels"
            value={labels}
            onChange={(e) => setLabels(e.target.value)}
            placeholder="cashmere, tailored, core"
            className="rounded-xl"
          />
        </div>

        <div className="pt-4 border-t border-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="spot" className="cursor-pointer">Highlight in Spotlight</Label>
            <Switch id="spot" checked={spotlight} onCheckedChange={setSpotlight} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="fresh" className="cursor-pointer">Mark as Fresh Arrival</Label>
            <Switch id="fresh" checked={isFresh} onCheckedChange={setIsFresh} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="offer" className="cursor-pointer">Include in Seasonal Archive Offer</Label>
            <Switch id="offer" checked={isOffer} onCheckedChange={setIsOffer} />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} size="lg" className="w-full rounded-full shadow-md">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isEditing ? "Saving Changes…" : "Publishing Piece…"}
          </>
        ) : isEditing ? (
          "Save Catalog Changes"
        ) : (
          "Publish Piece to Catalog"
        )}
      </Button>
    </form>
  )
}

export default CatalogForm
