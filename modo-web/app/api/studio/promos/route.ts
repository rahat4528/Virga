import { NextRequest } from "next/server"
import mongoose from "mongoose"
import { z } from "zod"
import dbConnect from "@/lib/db"
import PromoCode from "@/models/PromoCode"
import { okResponse, failResponse } from "@/lib/api"
import { requireStudioAuth } from "@/lib/auth-guards"

const CreatePromoSchema = z.object({
  code: z.string().trim().min(2).max(32).toUpperCase(),
  discountType: z.enum(["percentage", "fixed"]),
  value: z.number().min(1).max(10000),
  minSpend: z.number().min(0).default(0),
  usageLimit: z.number().int().min(1).optional(),
  isActive: z.boolean().default(true),
})

const TogglePromoSchema = z.object({
  id: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), "Invalid promo ID"),
  isActive: z.boolean(),
})

export async function GET() {
  const authCheck = await requireStudioAuth()
  if (!authCheck.ok) return authCheck.response

  try {
    await dbConnect()
    const items = await PromoCode.find().sort({ addedAt: -1 }).lean()
    return okResponse({ items })
  } catch (error) {
    console.error("GET /api/studio/promos error:", error)
    return failResponse("Failed to fetch promo codes", "PROMOS_FETCH_ERROR", 500)
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireStudioAuth()
  if (!authCheck.ok) return authCheck.response

  try {
    const body = await req.json()
    const parsed = CreatePromoSchema.safeParse(body)
    if (!parsed.success) {
      return failResponse("Invalid promo payload", "VALIDATION_ERROR", 400, parsed.error.flatten())
    }

    if (parsed.data.discountType === "percentage" && parsed.data.value > 90) {
      return failResponse("Percentage discount cannot exceed 90%", "VALIDATION_ERROR", 400)
    }

    await dbConnect()
    const existing = await PromoCode.findOne({ code: parsed.data.code })
    if (existing) {
      return failResponse(`Promo code ${parsed.data.code} already exists`, "DUPLICATE_PROMO", 409)
    }

    const item = await PromoCode.create(parsed.data)
    return okResponse({ item }, 201)
  } catch (error) {
    console.error("POST /api/studio/promos error:", error)
    return failResponse("Failed to create promo code", "PROMO_CREATE_ERROR", 500)
  }
}

export async function PATCH(req: NextRequest) {
  const authCheck = await requireStudioAuth()
  if (!authCheck.ok) return authCheck.response

  try {
    const body = await req.json()
    const parsed = TogglePromoSchema.safeParse(body)
    if (!parsed.success) {
      return failResponse("Invalid promo update", "VALIDATION_ERROR", 400, parsed.error.flatten())
    }

    await dbConnect()
    const item = await PromoCode.findByIdAndUpdate(
      parsed.data.id,
      { $set: { isActive: parsed.data.isActive } },
      { new: true }
    )
    if (!item) {
      return failResponse("Promo code not found", "PROMO_NOT_FOUND", 404)
    }

    return okResponse({ item })
  } catch (error) {
    console.error("PATCH /api/studio/promos error:", error)
    return failResponse("Failed to update promo code", "PROMO_UPDATE_ERROR", 500)
  }
}
