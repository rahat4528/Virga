import { NextRequest } from "next/server"
import mongoose from "mongoose"
import { z } from "zod"
import dbConnect from "@/lib/db"
import Exchange from "@/models/Exchange"
import { okResponse, failResponse } from "@/lib/api"
import { requireStudioAuth } from "@/lib/auth-guards"
import { EXCHANGE_STATES } from "@/lib/commerce"

const CreateExchangeSchema = z.object({
  orderNo: z.string().trim().min(3).max(40),
  clientName: z.string().trim().min(2).max(100),
  clientEmail: z.string().trim().email().optional(),
  pieceTitle: z.string().trim().min(2).max(200),
  optionLabel: z.string().trim().max(80).optional(),
  reason: z.string().trim().min(2).max(200),
  details: z.string().trim().max(500).optional(),
})

const UpdateExchangeSchema = z.object({
  id: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), "Invalid exchange ID"),
  status: z.enum(EXCHANGE_STATES),
  resolutionNote: z.string().trim().max(300).optional(),
})

export async function GET() {
  const authCheck = await requireStudioAuth()
  if (!authCheck.ok) return authCheck.response

  try {
    await dbConnect()
    const items = await Exchange.find().sort({ addedAt: -1 }).lean()
    return okResponse({ items })
  } catch (error) {
    console.error("GET /api/studio/exchanges error:", error)
    return failResponse("Failed to fetch exchanges", "EXCHANGES_FETCH_ERROR", 500)
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireStudioAuth()
  if (!authCheck.ok) return authCheck.response

  try {
    const body = await req.json()
    const parsed = CreateExchangeSchema.safeParse(body)
    if (!parsed.success) {
      return failResponse("Invalid exchange payload", "VALIDATION_ERROR", 400, parsed.error.flatten())
    }

    await dbConnect()
    const exchangeNo = `EX-${Math.floor(1000 + Math.random() * 9000)}`
    const item = await Exchange.create({
      exchangeNo,
      ...parsed.data,
      status: "Requested",
    })
    return okResponse({ item }, 201)
  } catch (error) {
    console.error("POST /api/studio/exchanges error:", error)
    return failResponse("Failed to create exchange", "EXCHANGE_CREATE_ERROR", 500)
  }
}

export async function PATCH(req: NextRequest) {
  const authCheck = await requireStudioAuth()
  if (!authCheck.ok) return authCheck.response

  try {
    const body = await req.json()
    const parsed = UpdateExchangeSchema.safeParse(body)
    if (!parsed.success) {
      return failResponse("Invalid exchange update", "VALIDATION_ERROR", 400, parsed.error.flatten())
    }

    await dbConnect()
    const item = await Exchange.findByIdAndUpdate(
      parsed.data.id,
      {
        $set: {
          status: parsed.data.status,
          ...(parsed.data.resolutionNote !== undefined
            ? { resolutionNote: parsed.data.resolutionNote }
            : {}),
        },
      },
      { new: true, runValidators: true }
    )
    if (!item) {
      return failResponse("Exchange not found", "EXCHANGE_NOT_FOUND", 404)
    }

    return okResponse({ item })
  } catch (error) {
    console.error("PATCH /api/studio/exchanges error:", error)
    return failResponse("Failed to update exchange", "EXCHANGE_UPDATE_ERROR", 500)
  }
}
