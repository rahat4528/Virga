"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, AlertTriangle, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { parseCsvCatalogRows } from "@/lib/commerce"

export default function StudioBulkImportPage() {
  const [csvContent, setCsvContent] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [importedCount, setImportedCount] = useState<number | null>(null)
  const [rowErrors, setRowErrors] = useState<Array<{ rowNumber: number; message: string }>>([])

  function handleValidate() {
    if (!csvContent.trim()) {
      toast.error("Please paste CSV data to validate")
      return
    }
    setIsValidating(true)
    setImportedCount(null)
    const { rows, errors } = parseCsvCatalogRows(csvContent)
    setPreviewCount(rows.length)
    setRowErrors(errors)
    setIsValidating(false)

    if (rows.length === 0) {
      toast.error("No valid rows found in CSV")
    } else if (errors.length > 0) {
      toast.warning(`${rows.length} valid rows ready, ${errors.length} row warnings`)
    } else {
      toast.success(`${rows.length} rows validated and ready to import`)
    }
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!csvContent.trim()) {
      toast.error("Please paste CSV data to import")
      return
    }

    setIsImporting(true)
    setImportedCount(null)
    try {
      const res = await fetch("/api/studio/catalog/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvContent, dryRun: false }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setRowErrors(data.error?.details?.errors || [])
        toast.error(data.error?.message || "Bulk import failed")
        return
      }

      setImportedCount(data.createdCount)
      setRowErrors(data.errors || [])
      setPreviewCount(null)
      toast.success(`Imported ${data.createdCount} pieces into catalog`)
    } catch {
      toast.error("Network error during CSV import")
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="pb-2 border-b border-border/60">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Bulk Catalog CSV Import
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Validate and import multiple catalog pieces and inventory records directly into MongoDB.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-6">
        <div className="p-4 rounded-2xl bg-muted/50 border border-border/60 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Supported CSV Header Columns:</p>
          <p className="font-mono">title, price, listPrice, stock, collection, labels, imageUrl, summary</p>
        </div>

        <form onSubmit={handleImport} className="space-y-4">
          <Textarea
            placeholder={"title,price,listPrice,stock,collection,labels,imageUrl\nSilk Evening Dress,450,520,15,apparel,silk;evening,/silk-dress-detail-1.jpg"}
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            className="font-mono text-xs min-h-48 rounded-2xl"
          />

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isValidating || isImporting}
              onClick={handleValidate}
              className="rounded-full px-5 text-xs"
            >
              {isValidating ? "Validating…" : "Dry-Run Validate"}
            </Button>

            <Button type="submit" disabled={isImporting} className="rounded-full px-6 text-xs">
              {isImporting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Importing Records…
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Import to Catalog
                </>
              )}
            </Button>
          </div>
        </form>

        {previewCount !== null && (
          <div className="p-4 rounded-2xl bg-muted/60 border border-border/60 text-xs text-foreground">
            Dry-run preview: <strong>{previewCount}</strong> valid rows ready to create.
          </div>
        )}

        {importedCount !== null && (
          <div className="p-4 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>Successfully created {importedCount} pieces in the Virga catalog.</span>
            </div>
            <Link href="/studio/catalog" className="underline">
              View Catalog →
            </Link>
          </div>
        )}

        {rowErrors.length > 0 && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 space-y-1.5 text-xs text-destructive">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              <span>Skipped / Invalid Rows ({rowErrors.length})</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5">
              {rowErrors.slice(0, 10).map((err, i) => (
                <li key={i}>
                  Row {err.rowNumber}: {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
