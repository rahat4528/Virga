import { NextRequest } from "next/server"
import mongoose from "mongoose"
import { z } from "zod"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { okResponse, failResponse } from "@/lib/api"
import { requireStudioAuth } from "@/lib/auth-guards"
import { ORDER_STATES, isValidOrderTransition } from "@/lib/commerce"

const UpdateOrderSchema = z.object({
  state: z.enum(ORDER_STATES),
  note: z.string().trim().max(300).optional(),
  tracking: z
    .object({
      carrier: z.string().trim().max(80).optional(),
      number: z.string().trim().max(120).optional(),
      url: z.string().trim().max(300).optional(),
    })
    .optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireStudioAuth()
  if (!authCheck.ok) return authCheck.response

  const { id } = await params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return failResponse("Invalid order ID", "INVALID_ID", 400)
  }

  try {
    const body = await req.json()
    const parsed = UpdateOrderSchema.safeParse(body)
    if (!parsed.success) {
      return failResponse("Invalid order update", "VALIDATION_ERROR", 400, parsed.error.flatten())
    }

    await dbConnect()
    const order = await Order.findById(id)
    if (!order) {
      return failResponse("Order not found", "ORDER_NOT_FOUND", 404)
    }

    if (!isValidOrderTransition(order.state, parsed.data.state)) {
      return failResponse(
        `Cannot transition order from ${order.state} to ${parsed.data.state}`,
        "INVALID_STATE_TRANSITION",
        400
      )
    }

    order.state = parsed.data.state
    if (parsed.data.state === "paid") {
      order.payment.status = "succeeded"
    } else if (parsed.data.state === "refunded") {
      order.payment.status = "refunded"
    }

    if (parsed.data.tracking) {
      order.tracking = {
        carrier: parsed.data.tracking.carrier ?? order.tracking?.carrier,
        number: parsed.data.tracking.number ?? order.tracking?.number,
        url: parsed.data.tracking.url ?? order.tracking?.url,
      }
    }

    order.timeline.push({
      state: `Status updated to ${parsed.data.state}`,
      at: new Date(),
      by: authCheck.session.name,
      note: parsed.data.note || undefined,
    })

    await order.save()
    return okResponse({ item: order })
  } catch (error) {
    console.error("PATCH /api/studio/orders/[id] error:", error)
    return failResponse("Failed to update order", "ORDER_UPDATE_ERROR", 500)
  }
}
