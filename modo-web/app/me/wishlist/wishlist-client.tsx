"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingBag, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/cn"
import {
  addToStoredBag,
  getStoredWishlist,
  saveStoredWishlist,
  type StoredWishlistItem,
} from "@/lib/bag"
import { toast } from "sonner"

interface WishlistClientProps {
  initialDbItems: StoredWishlistItem[]
}

export function WishlistClient({ initialDbItems }: WishlistClientProps) {
  const [items, setItems] = useState<StoredWishlistItem[]>(initialDbItems)

  useEffect(() => {
    const localItems = getStoredWishlist()
    if (localItems.length === 0) return

    const existingIds = new Set(initialDbItems.map((i) => i.itemId))
    const merged = [...initialDbItems]
    const toSync: StoredWishlistItem[] = []

    for (const localItem of localItems) {
      if (!existingIds.has(localItem.itemId)) {
        merged.push(localItem)
        toSync.push(localItem)
      }
    }
    setItems(merged)

    // Sync any guest-saved items up to authenticated wishlist
    toSync.forEach((item) => {
      fetch("/api/me/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.itemId }),
      }).catch(() => {})
    })
  }, [initialDbItems])

  function handleMoveToBag(item: StoredWishlistItem) {
    addToStoredBag({
      id: `${item.itemId}-std`,
      itemId: item.itemId,
      title: item.title,
      slug: item.slug,
      price: item.price,
      image: item.image || "/placeholder.jpg",
      qty: 1,
    })
    toast.success(`Added ${item.title} to your bag`)
  }

  async function handleRemove(itemId: string) {
    const updated = items.filter((i) => i.itemId !== itemId)
    setItems(updated)
    saveStoredWishlist(updated)

    try {
      await fetch(`/api/me/wishlist?itemId=${encodeURIComponent(itemId)}`, {
        method: "DELETE",
      })
    } catch {
      // ignore
    }
    toast.success("Removed from saved pieces")
  }

  if (items.length === 0) {
    return (
      <div className="p-12 rounded-3xl bg-card border border-border/80 text-center space-y-3">
        <Heart className="h-8 w-8 text-primary/40 mx-auto" />
        <h3 className="font-heading text-base font-semibold text-foreground">
          Your Wishlist is Empty
        </h3>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          Save your favorite pieces while browsing by clicking the heart icon on any piece.
        </p>
        <Button asChild size="sm" className="rounded-full text-xs">
          <Link href="/shop">Browse Catalog</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.itemId}
          className="rounded-2xl bg-card border border-border/80 overflow-hidden flex flex-col justify-between p-4 space-y-4 shadow-sm"
        >
          <Link href={`/shop/${item.slug}`} className="group space-y-3 block">
            <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-muted border border-border/50">
              <Image
                src={item.image || "/placeholder.jpg"}
                alt={item.title}
                fill
                sizes="(min-width: 1024px) 220px, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-103"
              />
            </div>
            <div className="space-y-1">
              {item.collectionTitle && (
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {item.collectionTitle}
                </p>
              )}
              <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {item.title}
              </h4>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-foreground">{formatPrice(item.price)}</span>
                {item.listPrice && item.listPrice > item.price && (
                  <span className="text-muted-foreground line-through">
                    {formatPrice(item.listPrice)}
                  </span>
                )}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              size="sm"
              onClick={() => handleMoveToBag(item)}
              className="flex-1 rounded-full text-xs"
            >
              <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
              Add to Bag
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(item.itemId)}
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${item.title} from wishlist`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
