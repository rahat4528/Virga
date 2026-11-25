import { auth } from "@/auth"
import { redirect } from "next/navigation"
import dbConnect from "@/lib/db"
import Wishlist from "@/models/Wishlist"
import Item from "@/models/Item"
import { WishlistClient } from "./wishlist-client"
import type { StoredWishlistItem } from "@/lib/bag"

export const dynamic = "force-dynamic"

export default async function MeWishlistPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login?callbackUrl=/me/wishlist")
  }

  let dbItems: StoredWishlistItem[] = []
  try {
    await dbConnect()
    const doc = await Wishlist.findOne({ client: session.user.id })
      .populate({
        path: "items",
        model: Item,
        select: "title slug price listPrice gallery collection",
        populate: { path: "collection", select: "title" },
      })
      .lean()

    const rawItems = (doc?.items || []) as Array<Record<string, any>>
    dbItems = rawItems
      .filter((it) => it && it._id && it.slug)
      .map((it) => ({
        itemId: it._id.toString(),
        title: it.title,
        slug: it.slug,
        price: it.price,
        listPrice: it.listPrice,
        image:
          it.gallery?.find((g: { isCover?: boolean }) => g.isCover)?.src ||
          it.gallery?.[0]?.src ||
          "/placeholder.jpg",
        collectionTitle: it.collection?.title,
      }))
  } catch (error) {
    console.warn("Failed to load wishlist:", error)
  }

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-border/60">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Saved Pieces
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Pieces you have curated for future consideration.
        </p>
      </div>

      <WishlistClient initialDbItems={dbItems} />
    </div>
  )
}
