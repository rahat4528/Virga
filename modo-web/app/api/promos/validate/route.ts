import { NextRequest } from "next/server"
import { z } from "zod"
import dbConnect from "@/lib/db"
import PromoCode from "@/models/PromoCode"
import { okResponse, failResponse } from "@/lib/api"
import { evaluatePromoDiscount } from "@/lib/commerce"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const ValidatePromoSchema = z.object({
  code: z.string().trim().min(1, "Promo code is required").max(32),
  subtotal: z.number().min(0).default(0),
})

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`promo:${ip}`, 20, 5 * 60 * 1000)
  if (!rl.success) {
    return failResponse(
      `Too many promo attempts. Please wait ${rl.retryAfterSeconds} seconds.`,
      "RATE_LIMITED",
      429
    )
  }

  try {
    const body = await req.json()
    const parsed = ValidatePromoSchema.safeParse(body)
    if (!parsed.success) {
      return failResponse("Invalid promo request", "VALIDATION_ERROR", 400, parsed.error.flatten())
    }

    const cleanCode = parsed.data.code.toUpperCase()
    await dbConnect()

    const promo = await PromoCode.findOne({ code: cleanCode }).lean()
    if (!promo) {
      if (cleanCode === "FREESHIP") {
        return okResponse({
          code: "FREESHIP",
          discount: 0,
          freeShipping: true,
          message: "Complimentary shipping applied",
        })
      }
      return failResponse("Invalid or expired promo code", "INVALID_PROMO", 404)
    }

    const result = evaluatePromoDiscount(promo, parsed.data.subtotal)
    if (!result.valid) {
      return failResponse(result.reason || "Promo code cannot be applied", "INVALID_PROMO", 400)
    }

    return okResponse({
      code: result.code,
      discount: result.discount,
      freeShipping: false,
      message:
        promo.discountType === "percentage"
          ? `${promo.value}% savings applied`
          : `$${promo.value} savings applied`,
    })
  } catch (error) {
    console.error("POST /api/promos/validate error:", error)
    return failResponse("Failed to validate promo code", "PROMO_VALIDATE_ERROR", 500)
  }
}
