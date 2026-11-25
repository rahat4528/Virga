"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowUp, ArrowDown, Plus, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

export interface LayoutSectionRow {
  type: "hero" | "block" | "collection-showcase" | "journal-strip"
  referenceId?: string
  label: string
  isVisible: boolean
}

export function PageBuilderEditor({
  initialSections,
  availableBlocks,
}: {
  initialSections: LayoutSectionRow[]
  availableBlocks: Array<{ _id: string; heading: string; kind: string }>
}) {
  const [sections, setSections] = useState<LayoutSectionRow[]>(initialSections)
  const [isSaving, setIsSaving] = useState(false)

  function moveSection(idx: number, delta: -1 | 1) {
    const nextIdx = idx + delta
    if (nextIdx < 0 || nextIdx >= sections.length) return
    const copy = [...sections]
    const [moved] = copy.splice(idx, 1)
    copy.splice(nextIdx, 0, moved)
    setSections(copy)
  }

  function toggleVisibility(idx: number) {
    setSections((prev) =>
      prev.map((sec, i) => (i === idx ? { ...sec, isVisible: !sec.isVisible } : sec))
    )
  }

  function addSection(type: LayoutSectionRow["type"], label: string, referenceId?: string) {
    setSections((prev) => [...prev, { type, label, referenceId, isVisible: true }])
    toast.success(`Added ${label}`)
  }

  async function handlePublish() {
    if (sections.length === 0) {
      toast.error("At least one section is required")
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch("/api/studio/page-builder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: sections.map((s, idx) => ({
            type: s.type,
            referenceId: s.referenceId || undefined,
            position: idx,
            isVisible: s.isVisible,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error(data.error?.message || "Failed to publish homepage layout")
        return
      }
      toast.success("Homepage layout published to storefront")
    } catch {
      toast.error("Network error while publishing layout")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Storefront Page Builder
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Reorder homepage sections, toggle visibility, and publish live layout changes.
          </p>
        </div>

        <Button onClick={handlePublish} disabled={isSaving} size="sm" className="rounded-full text-xs">
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Publishing…
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Publish Layout
            </>
          )}
        </Button>
      </div>

      <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-6">
        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Homepage Section Sequence
          </Label>
          <div className="space-y-2">
            {sections.map((sec, idx) => (
              <div
                key={`${sec.type}-${sec.referenceId || idx}-${idx}`}
                className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-muted/50 border border-border/60 text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-foreground">{sec.label}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono">
                    ({sec.type})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-2">
                    <span className="text-[11px] text-muted-foreground">
                      {sec.isVisible ? "Visible" : "Hidden"}
                    </span>
                    <Switch
                      checked={sec.isVisible}
                      onCheckedChange={() => toggleVisibility(idx)}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={idx === 0}
                    onClick={() => moveSection(idx, -1)}
                    className="h-7 w-7 rounded-full"
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={idx === sections.length - 1}
                    onClick={() => moveSection(idx, 1)}
                    className="h-7 w-7 rounded-full"
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSections((prev) => prev.filter((_, i) => i !== idx))}
                    className="h-7 text-xs text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-3 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addSection("hero", "Editorial Hero Banner")}
            className="rounded-full text-xs"
          >
            <Plus className="h-3 w-3 mr-1" /> Add Hero
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addSection("collection-showcase", "Collection Showcase")}
            className="rounded-full text-xs"
          >
            <Plus className="h-3 w-3 mr-1" /> Add Collection Showcase
          </Button>
          {availableBlocks.slice(0, 4).map((b) => (
            <Button
              key={b._id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addSection("block", b.heading, b._id)}
              className="rounded-full text-xs"
            >
              <Plus className="h-3 w-3 mr-1" /> {b.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
