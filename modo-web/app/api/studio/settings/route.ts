import { NextRequest } from "next/server"
import { z } from "zod"
import dbConnect from "@/lib/db"
import StoreSettings from "@/models/StoreSettings"
import { okResponse, failResponse } from "@/lib/api"
import { requireStudioAuth } from "@/lib/auth-guards"

const StoreSettingsSchema = z.object({
  storeName: z.string().trim().min(2).max(100),
  tagline: z.string().trim().min(2).max(200),
  conciergeEmail: z.string().trim().email().max(255),
  freeShippingThreshold: z.number().min(0).max(10000),
  standardShippingRate: z.number().min(0).max(500),
  expressShippingRate: z.number().min(0).max(500).default(25),
  taxRatePct: z.number().min(0).max(50).default(8),
  allowComplimentaryExchanges: z.boolean(),
  lowStockEmailAlerts: z.boolean(),
  lowStockThreshold: z.number().int().min(1).max(100).default(5),
})

export async function GET() {
  const authCheck = await requireStudioAuth()
  if (!authCheck.ok) return authCheck.response

  try {
    await dbConnect()
    const existing = await StoreSettings.findOne({ key: "default" }).lean()
    const settings = existing ?? (await StoreSettings.create({ key: "default" })).toObject()
    return okResponse({ item: settings })
  } catch (error) {
    console.error("GET /api/studio/settings error:", error)
    return failResponse("Failed to fetch settings", "SETTINGS_FETCH_ERROR", 500)
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireStudioAuth()
  if (!authCheck.ok) return authCheck.response

  try {
    const body = await req.json()
    const parsed = StoreSettingsSchema.safeParse(body)
    if (!parsed.success) {
      return failResponse("Invalid settings payload", "VALIDATION_ERROR", 400, parsed.error.flatten())
    }

    await dbConnect()
    const item = await StoreSettings.findOneAndUpdate(
      { key: "default" },
      { $set: { ...parsed.data, updatedBy: authCheck.session.email } },
      { new: true, upsert: true, runValidators: true }
    )
    return okResponse({ item })
  } catch (error) {
    console.error("PUT /api/studio/settings error:", error)
    return failResponse("Failed to save settings", "SETTINGS_UPDATE_ERROR", 500)
  }
}
