import { NextRequest } from "next/server"
import mongoose from "mongoose"
import { z } from "zod"
import dbConnect from "@/lib/db"
import Campaign from "@/models/Campaign"
import Subscriber from "@/models/Subscriber"
import { okResponse, failResponse } from "@/lib/api"
import { requireStudioAuth } from "@/lib/auth-guards"

const CreateCampaignSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  audience: z.string().trim().min(2).max(80).default("All Clients"),
  body: z.string().trim().max(5000).optional(),
  state: z.enum(["Draft", "Scheduled", "Sent"]).default("Draft"),
})

const UpdateCampaignSchema = z.object({
  id: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), "Invalid campaign ID"),
  state: z.enum(["Draft", "Scheduled", "Sent"]),
})

export async function GET() {
  const authCheck = await requireStudioAuth()
  if (!authCheck.ok) return authCheck.response

  try {
    await dbConnect()
    const items = await Campaign.find().sort({ addedAt: -1 }).lean()
    return okResponse({ items })
  } catch (error) {
    console.error("GET /api/studio/campaigns error:", error)
    return failResponse("Failed to fetch campaigns", "CAMPAIGNS_FETCH_ERROR", 500)
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireStudioAuth()
  if (!authCheck.ok) return authCheck.response

  try {
    const body = await req.json()
    const parsed = CreateCampaignSchema.safeParse(body)
    if (!parsed.success) {
      return failResponse("Invalid campaign payload", "VALIDATION_ERROR", 400, parsed.error.flatten())
    }

    await dbConnect()
    const subCount = await Subscriber.countDocuments({ isActive: true })
    const item = await Campaign.create({
      ...parsed.data,
      recipientCount: parsed.data.state === "Sent" ? subCount : 0,
      sentAt: parsed.data.state === "Sent" ? new Date() : undefined,
      openRate: parsed.data.state === "Sent" ? "0.0%" : "—",
    })
    return okResponse({ item }, 201)
  } catch (error) {
    console.error("POST /api/studio/campaigns error:", error)
    return failResponse("Failed to create campaign", "CAMPAIGN_CREATE_ERROR", 500)
  }
}

export async function PATCH(req: NextRequest) {
  const authCheck = await requireStudioAuth()
  if (!authCheck.ok) return authCheck.response

  try {
    const body = await req.json()
    const parsed = UpdateCampaignSchema.safeParse(body)
    if (!parsed.success) {
      return failResponse("Invalid campaign update", "VALIDATION_ERROR", 400, parsed.error.flatten())
    }

    await dbConnect()
    const subCount = await Subscriber.countDocuments({ isActive: true })
    const item = await Campaign.findByIdAndUpdate(
      parsed.data.id,
      {
        $set: {
          state: parsed.data.state,
          ...(parsed.data.state === "Sent"
            ? { sentAt: new Date(), recipientCount: subCount }
            : {}),
        },
      },
      { new: true }
    )
    if (!item) {
      return failResponse("Campaign not found", "CAMPAIGN_NOT_FOUND", 404)
    }

    return okResponse({ item })
  } catch (error) {
    console.error("PATCH /api/studio/campaigns error:", error)
    return failResponse("Failed to update campaign", "CAMPAIGN_UPDATE_ERROR", 500)
  }
}
