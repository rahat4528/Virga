"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Check, Search } from "lucide-react"
import { toast } from "sonner"

interface AssetFile {
  id: string
  src: string
  name: string
  size: string
}

export function AssetLibrary({ initialAssets = [] }: { initialAssets?: AssetFile[] }) {
  const [assets, setAssets] = useState<AssetFile[]>(initialAssets)
  const [search, setSearch] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (initialAssets.length > 0) return
    fetch("/api/studio/assets")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ok && Array.isArray(data.items)) {
          setAssets(data.items)
        }
      })
      .catch(() => {})
  }, [initialAssets.length])

  function copyPath(asset: AssetFile) {
    navigator.clipboard.writeText(asset.src)
    setCopiedId(asset.id)
    toast.success(`Copied path: ${asset.src}`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filtered = assets.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter public assets…"
            className="pl-8.5 rounded-xl text-xs h-9"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {filtered.length} local visual assets available · Click any card to copy path
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {filtered.map((asset) => (
          <div
            key={asset.id}
            onClick={() => copyPath(asset)}
            className="group relative rounded-2xl border border-border/80 overflow-hidden bg-card p-2 space-y-2 cursor-pointer hover:border-primary transition-all"
          >
            <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
              <Image src={asset.src} alt={asset.name} fill sizes="160px" className="object-cover" />
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-mono text-foreground truncate max-w-[120px]">
                {asset.name}
              </span>
              {copiedId === asset.id ? (
                <Check className="h-3.5 w-3.5 text-secondary flex-shrink-0" />
              ) : (
                <span className="text-[10px] text-muted-foreground">{asset.size}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AssetLibrary
