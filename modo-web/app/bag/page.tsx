"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import TopBar from "@/components/top-bar"
import SiteFooter from "@/components/site-footer"
import BagLine, { type BagItemData } from "@/components/bag-line"
import BagSummary from "@/components/bag-summary"
import TrailNav from "@/components/trail-nav"
import { Button } from "@/components/ui/button"
import { ShoppingBag } from "lucide-react"
import { getStoredBag, saveStoredBag, getStoredPromo, saveStoredPromo } from "@/lib/bag"

export default function BagPage() {
  const [items, setItems] = useState<BagItemData[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [appliedPromoCode, setAppliedPromoCode] = useState("")
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [freeShippingOverride, setFreeShippingOverride] = useState(false)

  const validatePromo = useCallback(async (code: string, currentSubtotal: number) => {
    if (!code || currentSubtotal <= 0) {
      setPromoDiscount(0)
      setFreeShippingOverride(false)
      return
    }
    try {
      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: currentSubtotal }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setAppliedPromoCode(data.code)
        setPromoDiscount(data.discount || 0)
        setFreeShippingOverride(Boolean(data.freeShipping))
      } else {
        setAppliedPromoCode("")
        setPromoDiscount(0)
        setFreeShippingOverride(false)
        saveStoredPromo("")
      }
    } catch {
      // keep silent on network hiccup
    }
  }, [])

  useEffect(() => {
    const bagItems = getStoredBag()
    setItems(bagItems)
    const savedPromo = getStoredPromo()
    const initialSubtotal = bagItems.reduce((sum, item) => sum + item.price * item.qty, 0)
    if (savedPromo && initialSubtotal > 0) {
      validatePromo(savedPromo, initialSubtotal)
    }
    setIsLoaded(true)
  }, [validatePromo])

  function updateQty(id: string, qty: number) {
    const updated = items.map((item) => (item.id === id ? { ...item, qty } : item))
    setItems(updated)
    saveStoredBag(updated)
    const nextSubtotal = updated.reduce((sum, item) => sum + item.price * item.qty, 0)
    if (appliedPromoCode) {
      validatePromo(appliedPromoCode, nextSubtotal)
    }
  }

  function removeItem(id: string) {
    const updated = items.filter((item) => item.id !== id)
    setItems(updated)
    saveStoredBag(updated)
    const nextSubtotal = updated.reduce((sum, item) => sum + item.price * item.qty, 0)
    if (appliedPromoCode) {
      validatePromo(appliedPromoCode, nextSubtotal)
    }
  }

  function handleApplyPromo(result: { code: string; discount: number; freeShipping: boolean }) {
    setAppliedPromoCode(result.code)
    setPromoDiscount(result.discount)
    setFreeShippingOverride(result.freeShipping)
    saveStoredPromo(result.code)
  }

  function handleClearPromo() {
    setAppliedPromoCode("")
    setPromoDiscount(0)
    setFreeShippingOverride(false)
    saveStoredPromo("")
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar />
      <main className="flex-1 container-virga py-8 space-y-8">
        <TrailNav items={[{ label: "Shopping Bag" }]} />

        <div className="pb-4 border-b border-border/60">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Shopping Bag
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length === 0 ? "Your bag is currently empty" : `${items.length} unique pieces in your selection`}
          </p>
        </div>

        {isLoaded && items.length === 0 ? (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h2 className="font-heading text-xl font-bold text-foreground">Your bag is empty</h2>
            <p className="text-sm text-muted-foreground">
              Explore our curated seasonal pieces, knitwear, and living objects to build your selection.
            </p>
            <Button asChild className="rounded-full px-8 shadow-sm">
              <Link href="/shop">Explore The Catalog</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Bag lines */}
            <div className="lg:col-span-2 divide-y divide-border/60">
              {items.map((item) => (
                <BagLine
                  key={item.id}
                  item={item}
                  onUpdateQty={updateQty}
                  onRemove={removeItem}
                />
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <BagSummary
                subtotal={subtotal}
                onApplyPromo={handleApplyPromo}
                onClearPromo={handleClearPromo}
                appliedPromoCode={appliedPromoCode}
                promoDiscount={promoDiscount}
                freeShippingOverride={freeShippingOverride}
              />
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
