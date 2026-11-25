"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Heart, Check } from "lucide-react"
import { toast } from "sonner"
import type { ItemDto } from "@/types/item"
import { addToStoredBag, getStoredWishlist, toggleStoredWishlist } from "@/lib/bag"

interface AddToBagClientProps {
  item: ItemDto
}

export function AddToBagClient({ item }: AddToBagClientProps) {
  const options = item.options || []
  const [selectedOptionSku, setSelectedOptionSku] = useState(options[0]?.sku || "")
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isAdded, setIsAdded] = useState(false)

  const selectedOption = options.find((o) => o.sku === selectedOptionSku)
  const isSoldOut = item.state === "sold-out" || (selectedOption && selectedOption.stock <= 0)

  const cover =
    item.gallery?.find((g) => g.isCover)?.src ||
    item.gallery?.[0]?.src ||
    "/placeholder.jpg"

  useEffect(() => {
    const localSaved = getStoredWishlist().some((w) => w.itemId === item._id)
    setIsWishlisted(localSaved)

    fetch("/api/me/wishlist")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.ok && Array.isArray(data.items)) {
          const inDb = data.items.some((w: { _id: string }) => w._id === item._id)
          if (inDb) setIsWishlisted(true)
        }
      })
      .catch(() => {})
  }, [item._id])

  function handleAddToBag() {
    if (isSoldOut) return

    addToStoredBag({
      id: `${item._id}-${selectedOptionSku || "std"}`,
      itemId: item._id,
      title: item.title,
      slug: item.slug,
      price: selectedOption?.price || item.price,
      image: cover,
      qty: 1,
      optionLabel: selectedOption?.label || undefined,
      optionSku: selectedOptionSku || undefined,
    })

    setIsAdded(true)
    toast.success(`Added ${item.title} to your bag`)
    setTimeout(() => setIsAdded(false), 2000)
  }

  async function toggleWishlist() {
    const collectionTitle =
      typeof item.collection === "object" && item.collection?.title ? item.collection.title : undefined

    const { saved } = toggleStoredWishlist({
      itemId: item._id,
      title: item.title,
      slug: item.slug,
      price: item.price,
      listPrice: item.listPrice,
      image: cover,
      collectionTitle,
    })
    setIsWishlisted(saved)

    try {
      await fetch(saved ? "/api/me/wishlist" : `/api/me/wishlist?itemId=${encodeURIComponent(item._id)}`, {
        method: saved ? "POST" : "DELETE",
        ...(saved
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ itemId: item._id }),
            }
          : {}),
      })
    } catch {
      // Guest fallback already persisted locally
    }

    toast(saved ? "Saved to your wishlist" : "Removed from saved pieces")
  }

  return (
    <div className="space-y-5 pt-2">
      {/* Options Selector */}
      {options.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold uppercase tracking-wider text-muted-foreground">
              Select Size / Option
            </span>
            <span className="text-muted-foreground">
              {selectedOption ? `${selectedOption.stock} available` : ""}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
              const isSelected = selectedOptionSku === opt.sku
              const outOfStock = opt.stock <= 0

              return (
                <button
                  key={opt.sku}
                  type="button"
                  disabled={outOfStock}
                  onClick={() => setSelectedOptionSku(opt.sku)}
                  className={`h-11 px-4 rounded-xl text-xs font-semibold border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                      : outOfStock
                      ? "border-border/40 text-muted-foreground/40 line-through bg-muted/40 cursor-not-allowed"
                      : "border-border/80 hover:border-foreground text-foreground bg-card"
                  }`}
                >
                  {opt.label || opt.size || opt.sku}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleAddToBag}
          disabled={isSoldOut}
          size="lg"
          className="flex-1 rounded-full text-sm font-medium h-12 shadow-md"
        >
          {isAdded ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Added to Bag
            </>
          ) : isSoldOut ? (
            "Sold Out"
          ) : (
            <>
              <ShoppingBag className="mr-2 h-4 w-4" />
              Add to Shopping Bag
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggleWishlist}
          className="h-12 w-12 rounded-full border-border/80"
          aria-label="Wishlist"
        >
          <Heart className={`h-5 w-5 ${isWishlisted ? "fill-primary text-primary" : "text-foreground"}`} />
        </Button>
      </div>
    </div>
  )
}
