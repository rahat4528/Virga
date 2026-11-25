import mongoose, { Schema, type Document, type Model } from "mongoose"
import { EXCHANGE_STATES, type ExchangeState } from "@/lib/commerce"

export interface IExchange extends Document {
  _id: mongoose.Types.ObjectId
  exchangeNo: string
  orderNo: string
  order?: mongoose.Types.ObjectId
  client?: mongoose.Types.ObjectId
  clientName: string
  clientEmail?: string
  pieceTitle: string
  optionLabel?: string
  reason: string
  details?: string
  status: ExchangeState
  resolutionNote?: string
  addedAt: Date
  modifiedAt: Date
}

const ExchangeSchema = new Schema<IExchange>(
  {
    exchangeNo: { type: String, required: true, unique: true, trim: true },
    orderNo: { type: String, required: true, trim: true },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    client: { type: Schema.Types.ObjectId, ref: "User" },
    clientName: { type: String, required: true, trim: true },
    clientEmail: { type: String, trim: true, lowercase: true },
    pieceTitle: { type: String, required: true, trim: true },
    optionLabel: { type: String, trim: true },
    reason: { type: String, required: true, trim: true },
    details: { type: String, trim: true },
    status: {
      type: String,
      enum: EXCHANGE_STATES,
      default: "Requested",
    },
    resolutionNote: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: "addedAt", updatedAt: "modifiedAt" },
    collection: "exchanges",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

ExchangeSchema.index({ orderNo: 1 })
ExchangeSchema.index({ status: 1 })
ExchangeSchema.index({ addedAt: -1 })

const Exchange: Model<IExchange> =
  mongoose.models.Exchange ?? mongoose.model<IExchange>("Exchange", ExchangeSchema)

export default Exchange
