"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/cn"
import { addToStoredBag } from "@/lib/bag"
import { toast } from "sonner"

export interface LookHotspotView {
  x: number
  y: number
  note?: string
  itemId: {
    _id: string
    title: string
    slug: string
    price: number
    gallery?: Array<{ src: string; isCover?: boolean }>
  } | null
}

export interface LookView {
  _id: string
  title: string
  slug: string
  season?: string
  cover: string
  hotspots: LookHotspotView[]
}

export function LookbookShowcase({ looks }: { looks: LookView[] }) {
  const [activePinByLook, setActivePinByLook] = useState<Record<string, number>>({})

  function handleQuickAddPiece(item: NonNullable<LookHotspotView["itemId"]>) {
    const cover =
      item.gallery?.find((g) => g.isCover)?.src || item.gallery?.[0]?.src || "/placeholder.jpg"
    addToStoredBag({
      id: `${item._id}-std`,
      itemId: item._id,
      title: item.title,
      slug: item.slug,
      price: item.price,
      image: cover,
      qty: 1,
    })
    toast.success(`Added ${item.title} to your bag`)
  }

  function handleShopWholeLook(look: LookView) {
    const validItems = look.hotspots
      .map((h) => h.itemId)
      .filter((item): item is NonNullable<LookHotspotView["itemId"]> => Boolean(item))

    if (validItems.length === 0) return

    validItems.forEach((item) => {
      const cover =
        item.gallery?.find((g) => g.isCover)?.src || item.gallery?.[0]?.src || "/placeholder.jpg"
      addToStoredBag({
        id: `${item._id}-std`,
        itemId: item._id,
        title: item.title,
        slug: item.slug,
        price: item.price,
        image: cover,
        qty: 1,
      })
    })
    toast.success(`Added ${validItems.length} pieces from "${look.title}" to your bag`)
  }

  if (looks.length === 0) {
    return (
      <div className="p-14 rounded-2xl bg-card border border-border text-center space-y-2">
        <p className="font-heading text-lg font-semibold text-foreground">No published looks yet</p>
        <p className="text-xs text-muted-foreground">
          Seasonal lookbook ensembles will appear here once published in Virga Studio.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-16">
      {looks.map((look, lookIdx) => {
        const activeIdx = activePinByLook[look._id] ?? 0
        const validHotspots = look.hotspots.filter((h) => Boolean(h.itemId))

        return (
          <div
            key={look._id}
            className="p-6 sm:p-10 rounded-2xl bg-card border border-border shadow-sm space-y-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-semibold">
                  Look 0{lookIdx + 1} · {look.season || "Autumn / Winter Series"}
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                  {look.title}
                </h2>
              </div>

              {validHotspots.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleShopWholeLook(look)}
                  className="rounded-full text-xs px-5 self-start sm:self-auto"
                >
                  <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
                  Shop Complete Look ({validHotspots.length})
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Interactive Look Visual with Coordinate Hotspots */}
              <div className="lg:col-span-7 relative aspect-[4/5] rounded-xl overflow-hidden bg-muted border border-border/70 shadow-sm">
                <Image
                  src={look.cover}
                  alt={look.title}
                  fill
                  priority={lookIdx === 0}
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover"
                />

                {look.hotspots.map((hs, idx) => {
                  if (!hs.itemId) return null
                  const isActive = activeIdx === idx
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setActivePinByLook((prev) => ({ ...prev, [look._id]: idx }))
                      }
                      style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                      aria-label={`Inspect ${hs.itemId.title}`}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 h-7 w-7 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-bold shadow-md transition-transform ${
                        isActive
                          ? "bg-primary text-primary-foreground border-white scale-115"
                          : "bg-background/90 text-foreground border-white/90 hover:scale-110"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>

              {/* Hotspot pieces */}
              <div className="lg:col-span-5 space-y-5">
                <div className="space-y-1">
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    Garments in this Composition
                  </h3>
                  <p className="text-xs text-muted-foreground font-light">
                    Click a numbered pin on the ensemble or select a garment below.
                  </p>
                </div>

                <div className="space-y-3">
                  {look.hotspots.map((hs, idx) => {
                    const item = hs.itemId
                    if (!item) return null
                    const cover =
                      item.gallery?.find((g) => g.isCover)?.src ||
                      item.gallery?.[0]?.src ||
                      "/placeholder.jpg"
                    const isActive = activeIdx === idx

                    return (
                      <div
                        key={idx}
                        onMouseEnter={() =>
                          setActivePinByLook((prev) => ({ ...prev, [look._id]: idx }))
                        }
                        className={`flex items-center gap-3.5 p-3.5 rounded-xl border transition-colors ${
                          isActive
                            ? "bg-primary/5 border-primary/50"
                            : "bg-background border-border/70 hover:border-foreground/40"
                        }`}
                      >
                        <div className="relative w-14 h-18 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/50">
                          <Image
                            src={cover}
                            alt={item.title}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <p className="font-mono text-[10px] uppercase tracking-wider text-primary font-semibold">
                            0{idx + 1} · {hs.note || "Tailored Piece"}
                          </p>
                          <Link
                            href={`/shop/${item.slug}`}
                            className="text-sm font-medium text-foreground truncate hover:text-primary transition-colors block"
                          >
                            {item.title}
                          </Link>
                          <p className="text-xs font-semibold text-foreground tracking-tight">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleQuickAddPiece(item)}
                            className="h-8 w-8 rounded-full"
                            title="Add piece to bag"
                            aria-label={`Add ${item.title} to bag`}
                          >
                            <ShoppingBag className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="h-8 w-8 rounded-full"
                          >
                            <Link href={`/shop/${item.slug}`} aria-label={`View ${item.title}`}>
                              <ArrowUpRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
