"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, Save, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

export interface StudioHomeBlockRow {
  _id: string
  heading: string
  slug: string
  kind: string
  pickingMode: string
  layout: string
  columns: number
  isLive: boolean
}

export interface StudioHeroBannerState {
  headline: string
  subline: string
  backdrop: string
  primaryLabel: string
  primaryHref: string
  secondaryLabel: string
  secondaryHref: string
}

export function HomeBlocksManager({ initialBlocks }: { initialBlocks: StudioHomeBlockRow[] }) {
  const [blocks, setBlocks] = useState(initialBlocks)
  const [isSaving, setIsSaving] = useState(false)

  function moveBlock(idx: number, delta: -1 | 1) {
    const nextIdx = idx + delta
    if (nextIdx < 0 || nextIdx >= blocks.length) return
    const copy = [...blocks]
    const [moved] = copy.splice(idx, 1)
    copy.splice(nextIdx, 0, moved)
    setBlocks(copy)
  }

  function toggleLive(idx: number) {
    setBlocks((prev) =>
      prev.map((b, i) => (i === idx ? { ...b, isLive: !b.isLive } : b))
    )
  }

  async function saveBlocks() {
    setIsSaving(true)
    try {
      const res = await fetch("/api/studio/home-blocks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: blocks.map((b) => ({ _id: b._id, isLive: b.isLive })),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error(data.error?.message || "Failed to update home blocks")
        return
      }
      toast.success("Home blocks order & visibility saved")
    } catch {
      toast.error("Network error while saving home blocks")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-lg font-bold text-foreground">
          Homepage Layout Blocks ({blocks.length})
        </h3>
        <Button onClick={saveBlocks} disabled={isSaving} size="sm" className="rounded-full text-xs">
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
          Save Block Order
        </Button>
      </div>

      <div className="space-y-3">
        {blocks.map((block, idx) => (
          <div
            key={block._id}
            className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-muted/40 border border-border/60"
          >
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm text-foreground">{block.heading}</span>
                <Badge variant="outline" className="rounded-full text-[10px] uppercase">
                  {block.kind}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground block mt-0.5">
                Slug: /{block.slug} · Picking mode: {block.pickingMode} · Layout: {block.layout} ({block.columns} cols)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-1">
                <span className="text-[11px] text-muted-foreground">{block.isLive ? "Live" : "Draft"}</span>
                <Switch checked={block.isLive} onCheckedChange={() => toggleLive(idx)} />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={idx === 0}
                onClick={() => moveBlock(idx, -1)}
                className="h-7 w-7 rounded-full"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={idx === blocks.length - 1}
                onClick={() => moveBlock(idx, 1)}
                className="h-7 w-7 rounded-full"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function HeroBannerEditor({ initialBanner }: { initialBanner: StudioHeroBannerState }) {
  const [form, setForm] = useState(initialBanner)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch("/api/studio/hero-banner", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: form.headline,
          subline: form.subline,
          backdrop: form.backdrop,
          primaryCta: { label: form.primaryLabel, href: form.primaryHref },
          secondaryCta: { label: form.secondaryLabel, href: form.secondaryHref },
          isLive: true,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error(data.error?.message || "Failed to update hero banner")
        return
      }
      toast.success("Hero banner saved & published")
    } catch {
      toast.error("Network error while saving hero banner")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
      <h3 className="font-heading text-lg font-bold text-foreground">Edit Live Hero Banner</h3>

      <div className="space-y-2">
        <Label htmlFor="hb-head">Headline</Label>
        <Input
          id="hb-head"
          required
          value={form.headline}
          onChange={(e) => setForm({ ...form, headline: e.target.value })}
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="hb-sub">Subline</Label>
        <Textarea
          id="hb-sub"
          value={form.subline}
          onChange={(e) => setForm({ ...form, subline: e.target.value })}
          className="rounded-xl min-h-20"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="hb-img">Backdrop Image Path / URL</Label>
        <Input
          id="hb-img"
          value={form.backdrop}
          onChange={(e) => setForm({ ...form, backdrop: e.target.value })}
          className="rounded-xl font-mono text-xs"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="hb-p-lbl" className="text-xs">Primary CTA Label</Label>
          <Input
            id="hb-p-lbl"
            value={form.primaryLabel}
            onChange={(e) => setForm({ ...form, primaryLabel: e.target.value })}
            className="rounded-xl text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hb-p-href" className="text-xs">Primary CTA Link</Label>
          <Input
            id="hb-p-href"
            value={form.primaryHref}
            onChange={(e) => setForm({ ...form, primaryHref: e.target.value })}
            className="rounded-xl text-xs font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hb-s-lbl" className="text-xs">Secondary CTA Label</Label>
          <Input
            id="hb-s-lbl"
            value={form.secondaryLabel}
            onChange={(e) => setForm({ ...form, secondaryLabel: e.target.value })}
            className="rounded-xl text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hb-s-href" className="text-xs">Secondary CTA Link</Label>
          <Input
            id="hb-s-href"
            value={form.secondaryHref}
            onChange={(e) => setForm({ ...form, secondaryHref: e.target.value })}
            className="rounded-xl text-xs font-mono"
          />
        </div>
      </div>

      <Button type="submit" disabled={isSaving} size="sm" className="rounded-full text-xs">
        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
        Publish Hero Banner
      </Button>
    </form>
  )
}

export function QuickJournalForm({ onCreated }: { onCreated?: () => void }) {
  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [body, setBody] = useState("")
  const [coverImage, setCoverImage] = useState("/elegant-fashion-atelier.jpg")
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          excerpt,
          body,
          coverImage: coverImage || undefined,
          labels: ["Atelier", "Dispatch"],
          state: "published",
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error(data.error?.message || "Failed to publish journal dispatch")
        return
      }
      toast.success("Journal article published!")
      setTitle("")
      setExcerpt("")
      setBody("")
      onCreated?.()
    } catch {
      toast.error("Network error while publishing article")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 rounded-3xl bg-card border border-border/80 space-y-3">
      <h4 className="font-heading text-sm font-bold text-foreground">Publish New Journal Dispatch</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          required
          placeholder="Article headline"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-xl text-xs"
        />
        <Input
          placeholder="/elegant-fashion-atelier.jpg"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          className="rounded-xl text-xs font-mono"
        />
      </div>
      <Input
        required
        placeholder="Short editorial excerpt..."
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        className="rounded-xl text-xs"
      />
      <Textarea
        required
        placeholder="Write the full essay or atelier note..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="rounded-xl text-xs min-h-24"
      />
      <Button type="submit" disabled={isSaving} size="sm" className="rounded-full text-xs">
        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
        Publish Dispatch
      </Button>
    </form>
  )
}
