import { NextRequest } from "next/server"
import mongoose from "mongoose"
import { z } from "zod"
import dbConnect from "@/lib/db"
import Item from "@/models/Item"
import { okResponse, failResponse } from "@/lib/api"
import { requireStudioAuth } from "@/lib/auth-guards"

const UpdateStockSchema = z.object({
  itemId: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), "Invalid item ID"),
  stock: z.number().int().min(0).max(100000),
})

export async function PATCH(req: NextRequest) {
  const authCheck = await requireStudioAuth()
  if (!authCheck.ok) return authCheck.response

  try {
    const body = await req.json()
    const parsed = UpdateStockSchema.safeParse(body)
    if (!parsed.success) {
      return failResponse("Invalid stock update", "VALIDATION_ERROR", 400, parsed.error.flatten())
    }

    await dbConnect()
    const item = await Item.findById(parsed.data.itemId)
    if (!item) {
      return failResponse("Item not found", "ITEM_NOT_FOUND", 404)
    }

    item.stock = parsed.data.stock
    if (item.stock === 0 && item.state === "live") {
      item.state = "sold-out"
    } else if (item.stock > 0 && item.state === "sold-out") {
      item.state = "live"
    }

    await item.save()
    return okResponse({ item })
  } catch (error) {
    console.error("PATCH /api/studio/stock error:", error)
    return failResponse("Failed to update stock", "STOCK_UPDATE_ERROR", 500)
  }
}
