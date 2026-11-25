import { NextRequest } from "next/server"
import dbConnect from "@/lib/db"
import Order, { generateOrderNumber } from "@/models/Order"
import Item from "@/models/Item"
import PromoCode from "@/models/PromoCode"
import StoreSettings from "@/models/StoreSettings"
import { okResponse, failResponse } from "@/lib/api"
import { auth } from "@/auth"
import { rateLimit, getClientIp, RateLimits } from "@/lib/rate-limit"
import { CreateOrderSchema } from "@/types/order"
import { computeOrderTotals, evaluatePromoDiscount } from "@/lib/commerce"
import { isStudioRole } from "@/lib/auth-guards"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return failResponse("Please sign in to view your orders", "UNAUTHENTICATED", 401)
    }

    await dbConnect()
    const isStaff = isStudioRole(session.user.role)

    // Resource ownership enforcement: customers only see their own orders
    const query = isStaff
      ? {}
      : { $or: [{ client: session.user.id }, { email: session.user.email?.toLowerCase() }] }

    const orders = await Order.find(query)
      .sort({ addedAt: -1 })
      .lean({ virtuals: true })

    return okResponse({ items: orders })
  } catch (error) {
    console.error("GET /api/orders error:", error)
    return failResponse("Failed to fetch orders", "ORDERS_FETCH_ERROR", 500)
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const limitCheck = rateLimit(`orders:${ip}`, RateLimits.ORDERS.limit, RateLimits.ORDERS.windowMs)
  if (!limitCheck.success) {
    return failResponse(
      `Order submission limit reached. Please wait ${limitCheck.retryAfterSeconds} seconds before trying again.`,
      "RATE_LIMITED",
      429
    )
  }

  try {
    const session = await auth()
    const body = await req.json()
    const parsed = CreateOrderSchema.safeParse(body)
    if (!parsed.success) {
      return failResponse("Invalid order data", "VALIDATION_ERROR", 400, parsed.error.flatten())
    }

    await dbConnect()
    const { email, lines, shipTo, billTo, promoCode, shippingMethod, paymentProvider } = parsed.data

    const verifiedEmail = session?.user?.email
      ? session.user.email.toLowerCase()
      : email?.toLowerCase()

    if (!verifiedEmail) {
      return failResponse("A valid contact email is required to process the order", "EMAIL_REQUIRED", 400)
    }

    const clientId = session?.user?.id || undefined

    // Fetch catalog items and store shipping/tax settings concurrently
    const itemIds = lines.map((l) => l.itemId)
    const [dbItems, settingsDoc] = await Promise.all([
      Item.find({ _id: { $in: itemIds } }).lean(),
      StoreSettings.findOne({ key: "default" }).lean(),
    ])
    const itemMap = new Map(dbItems.map((i) => [i._id.toString(), i]))

    let subtotal = 0
    const orderLines = []
    const stockAdjustments: Array<{
      itemId: string
      qty: number
      unitPrice: number
      optionSku?: string
    }> = []

    for (const line of lines) {
      const dbItem = itemMap.get(line.itemId)
      if (!dbItem || dbItem.state === "draft" || dbItem.state === "paused") {
        return failResponse(`Item ${line.itemId} is no longer available`, "ITEM_UNAVAILABLE", 400)
      }
      if (dbItem.state === "sold-out" || dbItem.stock < line.qty) {
        return failResponse(
          `Insufficient stock for ${dbItem.title}`,
          "INSUFFICIENT_STOCK",
          409
        )
      }

      let price = dbItem.price
      let optionSnapshot = undefined

      if (line.optionSku) {
        const option = dbItem.options?.find((o) => o.sku === line.optionSku)
        if (!option || !option.isEnabled) {
          return failResponse(
            `Selected option for ${dbItem.title} is unavailable`,
            "OPTION_UNAVAILABLE",
            400
          )
        }
        if (option.stock < line.qty) {
          return failResponse(
            `Only ${option.stock} units available for ${dbItem.title} (${option.label})`,
            "INSUFFICIENT_STOCK",
            409
          )
        }
        price = option.price
        optionSnapshot = {
          sku: option.sku,
          size: option.size,
          color: option.color,
          label: option.label,
        }
      }

      const coverImage = dbItem.gallery?.find((g) => g.isCover)?.src || dbItem.gallery?.[0]?.src || ""

      orderLines.push({
        item: dbItem._id,
        option: optionSnapshot,
        qty: line.qty,
        unitPrice: price,
        titleSnapshot: dbItem.title,
        imageSnapshot: coverImage,
      })

      stockAdjustments.push({
        itemId: dbItem._id.toString(),
        qty: line.qty,
        unitPrice: price,
        optionSku: optionSnapshot?.sku,
      })

      subtotal += price * line.qty
    }

    // Validate promo code server-side if provided
    let discount = 0
    let appliedPromoId: string | null = null
    let freeShipOverride = false

    if (promoCode && promoCode.trim()) {
      const cleanCode = promoCode.trim().toUpperCase()
      const promoDoc = await PromoCode.findOne({ code: cleanCode }).lean()
      if (promoDoc) {
        const check = evaluatePromoDiscount(promoDoc, subtotal)
        if (!check.valid) {
          return failResponse(check.reason || "Invalid promo code", "INVALID_PROMO", 400)
        }
        discount = check.discount
        appliedPromoId = promoDoc._id.toString()
      } else if (cleanCode === "FREESHIP") {
        freeShipOverride = true
      } else {
        return failResponse(`Promo code ${cleanCode} is invalid or expired`, "INVALID_PROMO", 400)
      }
    }

    const freeThreshold = settingsDoc?.freeShippingThreshold ?? 150
    const standardRate =
      shippingMethod === "express"
        ? settingsDoc?.expressShippingRate ?? 25
        : freeShipOverride
        ? 0
        : settingsDoc?.standardShippingRate ?? 12
    const taxRate = (settingsDoc?.taxRatePct ?? 8) / 100

    const totals = computeOrderTotals({
      subtotal,
      discount,
      freeShippingThreshold: shippingMethod === "express" ? Number.MAX_SAFE_INTEGER : freeThreshold,
      standardShippingRate: standardRate,
      taxRate,
    })

    // Atomic conditional stock decrement per line
    const decremented: typeof stockAdjustments = []
    for (const adj of stockAdjustments) {
      const filter: Record<string, unknown> = {
        _id: adj.itemId,
        stock: { $gte: adj.qty },
      }
      const update: Record<string, unknown> = {
        $inc: {
          stock: -adj.qty,
          "salesStats.units": adj.qty,
          "salesStats.revenue": Math.round(adj.unitPrice * adj.qty * 100) / 100,
        },
      }
      if (adj.optionSku) {
        filter["options"] = { $elemMatch: { sku: adj.optionSku, stock: { $gte: adj.qty } } }
        update.$inc = {
          ...(update.$inc as Record<string, number>),
          "options.$.stock": -adj.qty,
        }
      }

      const updated = await Item.findOneAndUpdate(filter, update, { new: true })
      if (!updated) {
        // Rollback previously decremented lines
        await Promise.all(
          decremented.map((prev) =>
            Item.updateOne(
              prev.optionSku ? { _id: prev.itemId, "options.sku": prev.optionSku } : { _id: prev.itemId },
              {
                $inc: {
                  stock: prev.qty,
                  "salesStats.units": -prev.qty,
                  "salesStats.revenue": -Math.round(prev.unitPrice * prev.qty * 100) / 100,
                  ...(prev.optionSku ? { "options.$.stock": prev.qty } : {}),
                },
              }
            )
          )
        )
        return failResponse(
          "An item in your bag just sold out before checkout completed",
          "CONCURRENT_OUT_OF_STOCK",
          409
        )
      }
      if (updated.stock === 0 && updated.state === "live") {
        await Item.updateOne({ _id: updated._id }, { $set: { state: "sold-out" } })
      }
      decremented.push(adj)
    }

    if (appliedPromoId) {
      await PromoCode.updateOne({ _id: appliedPromoId }, { $inc: { usageCount: 1 } })
    }

    const orderNo = generateOrderNumber()
    const order = await Order.create({
      orderNo,
      client: clientId,
      email: verifiedEmail,
      lines: orderLines,
      totals,
      currency: settingsDoc?.currency || "USD",
      state: "pending",
      payment: {
        provider: paymentProvider,
        status: "unpaid",
      },
      shipTo,
      billTo: billTo || shipTo,
      timeline: [
        {
          state: "Order placed",
          at: new Date(),
          by: session?.user?.name || "Client",
          note: appliedPromoId && promoCode ? `Promo ${promoCode.toUpperCase()} applied` : "Order created successfully",
        },
      ],
    })

    return okResponse({ item: order }, 201)
  } catch (error) {
    console.error("POST /api/orders error:", error)
    return failResponse("Failed to place order", "ORDER_CREATE_ERROR", 500)
  }
}
