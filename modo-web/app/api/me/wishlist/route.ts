import { NextRequest } from "next/server"
import mongoose from "mongoose"
import { z } from "zod"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import Wishlist from "@/models/Wishlist"
import Item from "@/models/Item"
import { okResponse, failResponse } from "@/lib/api"

const WishlistBodySchema = z.object({
  itemId: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), "Invalid item ID"),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return failResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    await dbConnect()
    const doc = await Wishlist.findOne({ client: session.user.id })
      .populate({
        path: "items",
        model: Item,
        select: "title slug price listPrice gallery state collection",
        populate: { path: "collection", select: "title slug" },
      })
      .lean()

    return okResponse({ items: doc?.items || [] })
  } catch (error) {
    console.error("GET /api/me/wishlist error:", error)
    return failResponse("Failed to fetch wishlist", "WISHLIST_FETCH_ERROR", 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return failResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    const body = await req.json()
    const parsed = WishlistBodySchema.safeParse(body)
    if (!parsed.success) {
      return failResponse("Invalid wishlist request", "VALIDATION_ERROR", 400, parsed.error.flatten())
    }

    await dbConnect()
    const exists = await Item.exists({ _id: parsed.data.itemId })
    if (!exists) {
      return failResponse("Item not found", "ITEM_NOT_FOUND", 404)
    }

    const updated = await Wishlist.findOneAndUpdate(
      { client: session.user.id },
      { $addToSet: { items: parsed.data.itemId } },
      { new: true, upsert: true }
    )
      .populate("items", "title slug price listPrice gallery state")
      .lean()

    return okResponse({ items: updated?.items || [] })
  } catch (error) {
    console.error("POST /api/me/wishlist error:", error)
    return failResponse("Failed to save item to wishlist", "WISHLIST_SAVE_ERROR", 500)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return failResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get("itemId")
    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      return failResponse("Invalid item ID", "INVALID_ID", 400)
    }

    await dbConnect()
    const updated = await Wishlist.findOneAndUpdate(
      { client: session.user.id },
      { $pull: { items: itemId } },
      { new: true }
    )
      .populate("items", "title slug price listPrice gallery state")
      .lean()

    return okResponse({ items: updated?.items || [] })
  } catch (error) {
    console.error("DELETE /api/me/wishlist error:", error)
    return failResponse("Failed to remove item from wishlist", "WISHLIST_DELETE_ERROR", 500)
  }
}
