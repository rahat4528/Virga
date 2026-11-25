"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

export interface StoreSettingsValues {
  storeName: string
  tagline: string
  conciergeEmail: string
  freeShippingThreshold: number
  standardShippingRate: number
  expressShippingRate: number
  taxRatePct: number
  allowComplimentaryExchanges: boolean
  lowStockEmailAlerts: boolean
  lowStockThreshold: number
}

export function SettingsEditor({ initialValues }: { initialValues: StoreSettingsValues }) {
  const [form, setForm] = useState<StoreSettingsValues>(initialValues)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch("/api/studio/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error(data.error?.message || "Failed to save settings")
        return
      }
      toast.success("Studio configuration saved")
    } catch {
      toast.error("Network error while saving configuration")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-6">
      <div className="space-y-4">
        <h3 className="font-heading text-base font-bold text-foreground">Store Identity</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="s-name">Store Name</Label>
            <Input
              id="s-name"
              required
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-tagline">Tagline</Label>
            <Input
              id="s-tagline"
              required
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="rounded-xl"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="s-email">Contact Concierge Email</Label>
          <Input
            id="s-email"
            type="email"
            required
            value={form.conciergeEmail}
            onChange={(e) => setForm({ ...form, conciergeEmail: e.target.value })}
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-border/60 space-y-4">
        <h3 className="font-heading text-base font-bold text-foreground">Shipping & Tax Policies</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="s-free">Free Shipping Threshold ($)</Label>
            <Input
              id="s-free"
              type="number"
              min={0}
              value={form.freeShippingThreshold}
              onChange={(e) =>
                setForm({ ...form, freeShippingThreshold: Number(e.target.value) || 0 })
              }
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-std">Standard Shipping Flat Rate ($)</Label>
            <Input
              id="s-std"
              type="number"
              min={0}
              value={form.standardShippingRate}
              onChange={(e) =>
                setForm({ ...form, standardShippingRate: Number(e.target.value) || 0 })
              }
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-exp">Express Courier Rate ($)</Label>
            <Input
              id="s-exp"
              type="number"
              min={0}
              value={form.expressShippingRate}
              onChange={(e) =>
                setForm({ ...form, expressShippingRate: Number(e.target.value) || 0 })
              }
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-tax">Estimated Sales Tax (%)</Label>
            <Input
              id="s-tax"
              type="number"
              min={0}
              max={50}
              step="0.1"
              value={form.taxRatePct}
              onChange={(e) => setForm({ ...form, taxRatePct: Number(e.target.value) || 0 })}
              className="rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border/60 space-y-3">
        <h3 className="font-heading text-base font-bold text-foreground">Operations Toggles</h3>
        <div className="flex items-center justify-between">
          <Label htmlFor="t-ex" className="cursor-pointer">
            Enable Complimentary Exchanges (30 days)
          </Label>
          <Switch
            id="t-ex"
            checked={form.allowComplimentaryExchanges}
            onCheckedChange={(checked) =>
              setForm({ ...form, allowComplimentaryExchanges: checked })
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="t-stock" className="cursor-pointer">
            Automatic Low-Stock Email Alerts
          </Label>
          <Switch
            id="t-stock"
            checked={form.lowStockEmailAlerts}
            onCheckedChange={(checked) => setForm({ ...form, lowStockEmailAlerts: checked })}
          />
        </div>
      </div>

      <Button type="submit" disabled={isSaving} size="sm" className="rounded-full px-6">
        {isSaving ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            Saving…
          </>
        ) : (
          <>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Save Configuration
          </>
        )}
      </Button>
    </form>
  )
}
