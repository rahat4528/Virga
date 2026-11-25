import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IStoreSettings extends Document {
  _id: mongoose.Types.ObjectId
  key: string
  storeName: string
  tagline: string
  conciergeEmail: string
  freeShippingThreshold: number
  standardShippingRate: number
  expressShippingRate: number
  taxRatePct: number
  allowComplimentaryExchanges: boolean
  lowStockEmailAlerts: boolean
  lowStockThreshold: number
  currency: string
  updatedBy?: string
  addedAt: Date
  modifiedAt: Date
}

const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    storeName: { type: String, required: true, trim: true, default: "Virga" },
    tagline: { type: String, trim: true, default: "Considered Fashion & Living" },
    conciergeEmail: { type: String, trim: true, default: "concierge@virga.store" },
    freeShippingThreshold: { type: Number, min: 0, default: 150 },
    standardShippingRate: { type: Number, min: 0, default: 12 },
    expressShippingRate: { type: Number, min: 0, default: 25 },
    taxRatePct: { type: Number, min: 0, max: 50, default: 8 },
    allowComplimentaryExchanges: { type: Boolean, default: true },
    lowStockEmailAlerts: { type: Boolean, default: true },
    lowStockThreshold: { type: Number, min: 1, default: 5 },
    currency: { type: String, trim: true, default: "USD" },
    updatedBy: { type: String },
  },
  {
    timestamps: { createdAt: "addedAt", updatedAt: "modifiedAt" },
    collection: "store_settings",
  }
)

const StoreSettings: Model<IStoreSettings> =
  mongoose.models.StoreSettings ??
  mongoose.model<IStoreSettings>("StoreSettings", StoreSettingsSchema)

export default StoreSettings
