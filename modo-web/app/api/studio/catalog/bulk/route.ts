import { NextRequest } from "next/server"
import { z } from "zod"
import dbConnect from "@/lib/db"
import Item from "@/models/Item"
import Collection from "@/models/Collection"
import { okResponse, failResponse } from "@/lib/api"
import { requireStudioAuth } from "@/lib/auth-guards"
import { parseCsvCatalogRows } from "@/lib/commerce"
import { slugify } from "@/lib/cn"

const BulkImportSchema = z.object({
  csv: z.string().min(5, "CSV payload is required").max(250000),
  dryRun: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  const authCheck = await requireStudioAuth()
  if (!authCheck.ok) return authCheck.response

  try {
    const body = await req.json()
    const parsed = BulkImportSchema.safeParse(body)
    if (!parsed.success) {
      return failResponse("Invalid CSV import payload", "VALIDATION_ERROR", 400, parsed.error.flatten())
    }

    const { rows, errors } = parseCsvCatalogRows(parsed.data.csv)
    if (rows.length === 0) {
      return failResponse("No valid rows found in CSV", "CSV_VALIDATION_FAILED", 400, { errors })
    }

    if (parsed.data.dryRun) {
      return okResponse({ previewCount: rows.length, rows, errors })
    }

    await dbConnect()
    const collections = await Collection.find().select("_id slug title").lean()
    const colBySlug = new Map(collections.map((c) => [c.slug.toLowerCase(), c._id]))

    const createdItems = []
    for (const row of rows) {
      const baseSlug = slugify(row.title) || `piece-${Date.now().toString(36)}`
      const existing = await Item.exists({ slug: baseSlug })
      const slug = existing
        ? `${baseSlug}-${Date.now().toString(36)}-${row.rowNumber}`
        : baseSlug

      const collectionId = row.collectionSlug
        ? colBySlug.get(row.collectionSlug.toLowerCase())
        : undefined

      const created = await Item.create({
        title: row.title,
        slug,
        summary: row.summary,
        description: row.description,
        price: row.price,
        listPrice: row.listPrice,
        stock: row.stock,
        collection: collectionId,
        labels: row.labels,
        gallery: [{ src: row.imageUrl, alt: row.title, isCover: true }],
        state: row.stock > 0 ? "live" : "sold-out",
        isFresh: true,
      })
      createdItems.push({ _id: created._id, title: created.title, slug: created.slug })
    }

    return okResponse(
      {
        createdCount: createdItems.length,
        items: createdItems,
        errors,
      },
      201
    )
  } catch (error) {
    console.error("POST /api/studio/catalog/bulk error:", error)
    return failResponse("Failed to import CSV rows", "BULK_IMPORT_ERROR", 500)
  }
}
