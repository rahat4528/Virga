import { notFound } from "next/navigation"
import Link from "next/link"
import mongoose from "mongoose"
import dbConnect from "@/lib/db"
import Item from "@/models/Item"
import CatalogForm from "@/components/studio/catalog-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { ItemDto } from "@/types/item"

export const dynamic = "force-dynamic"

export default async function StudioEditCatalogItemPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    notFound()
  }

  await dbConnect()
  const doc = await Item.findById(id).lean({ virtuals: true })
  if (!doc) {
    notFound()
  }

  const item = JSON.parse(JSON.stringify(doc)) as ItemDto

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Edit Piece
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Updating catalog entry <span className="font-mono">/{item.slug}</span>
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="rounded-full text-xs">
          <Link href="/studio/catalog">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back to Catalog
          </Link>
        </Button>
      </div>

      <CatalogForm initialItem={item} />
    </div>
  )
}
