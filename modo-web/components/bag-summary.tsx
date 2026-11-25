"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, ShieldCheck, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/cn"
import { computeOrderTotals } from "@/lib/commerce"
import { toast } from "sonner"

interface BagSummaryProps {
  subtotal: number
  onApplyPromo?: (result: { code: string; discount: number; freeShipping: boolean }) => void
  onClearPromo?: () => void
  appliedPromoCode?: string
  promoDiscount?: number
  freeShippingOverride?: boolean
}

export function BagSummary({
  subtotal,
  onApplyPromo,
  onClearPromo,
  appliedPromoCode = "",
  promoDiscount = 0,
  freeShippingOverride = false,
}: BagSummaryProps) {
  const [promoInput, setPromoInput] = useState(appliedPromoCode)
  const [isApplying, setIsApplying] = useState(false)

  const totals = computeOrderTotals({
    subtotal,
    discount: promoDiscount,
    freeShippingThreshold: freeShippingOverride ? 0 : 150,
    standardShippingRate: freeShippingOverride ? 0 : 12,
  })

  async function handlePromoSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clean = promoInput.trim().toUpperCase()
    if (!clean) return

    setIsApplying(true)
    try {
      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: clean, subtotal }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error(data.error?.message || "Invalid or expired promo code")
        return
      }
      onApplyPromo?.({
        code: data.code,
        discount: data.discount || 0,
        freeShipping: Boolean(data.freeShipping),
      })
      toast.success(data.message || `Promo code ${data.code} applied`)
    } catch {
      toast.error("Could not validate promo code")
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="p-6 sm:p-7 rounded-xl bg-card border border-border shadow-sm space-y-6">
      <h3 className="font-heading text-lg font-bold tracking-tight text-foreground pb-3 border-b border-border/60">
        Order Summary
      </h3>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-medium text-foreground tracking-tight">
            {formatPrice(totals.subtotal)}
          </span>
        </div>

        {totals.discount > 0 && (
          <div className="flex justify-between text-primary font-medium">
            <span>Promotional Savings ({appliedPromoCode})</span>
            <span>-{formatPrice(totals.discount)}</span>
          </div>
        )}

        <div className="flex justify-between text-muted-foreground">
          <span>Carbon-Neutral Delivery</span>
          <span className="font-medium text-foreground">
            {totals.shipping === 0 ? "Complimentary" : formatPrice(totals.shipping)}
          </span>
        </div>

        <div className="flex justify-between text-muted-foreground">
          <span>Estimated Taxes (8%)</span>
          <span className="font-medium text-foreground tracking-tight">
            {formatPrice(totals.tax)}
          </span>
        </div>

        <div className="border-t border-border/80 pt-4 flex justify-between text-base font-bold text-foreground">
          <span>Estimated Total</span>
          <span className="font-heading text-lg">{formatPrice(totals.total)}</span>
        </div>
      </div>

      {/* Promo Code Form */}
      {appliedPromoCode ? (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/10 border border-secondary/30 text-xs">
          <span className="font-mono font-semibold text-secondary">
            Applied: {appliedPromoCode}
          </span>
          <button
            type="button"
            onClick={() => {
              setPromoInput("")
              onClearPromo?.()
            }}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            aria-label="Remove promo code"
          >
            <X className="h-3.5 w-3.5" />
            <span>Remove</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handlePromoSubmit} className="flex gap-2 pt-1">
          <Input
            placeholder="PROMO CODE"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            disabled={isApplying || subtotal <= 0}
            className="rounded-lg text-xs font-mono uppercase h-9 bg-background"
          />
          <Button
            type="submit"
            variant="outline"
            disabled={isApplying || subtotal <= 0}
            className="rounded-lg text-xs px-4 h-9 shrink-0"
          >
            {isApplying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
          </Button>
        </form>
      )}

      {subtotal > 0 ? (
        <Button asChild size="lg" className="w-full rounded-full font-medium shadow-sm h-11 text-sm">
          <Link href="/checkout" className="inline-flex items-center justify-center gap-2">
            <span>Proceed to Checkout</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button disabled size="lg" className="w-full rounded-full font-medium h-11 text-sm">
          Shopping Bag Empty
        </Button>
      )}

      <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-secondary shrink-0" />
        <span>Complimentary returns & 256-bit encrypted checkout</span>
      </div>
    </div>
  )
}

export default BagSummary
