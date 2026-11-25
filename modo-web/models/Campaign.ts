import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface ICampaign extends Document {
  _id: mongoose.Types.ObjectId
  subject: string
  audience: string
  body?: string
  openRate: string
  recipientCount: number
  scheduledAt?: Date
  sentAt?: Date
  state: "Draft" | "Scheduled" | "Sent"
  addedAt: Date
  modifiedAt: Date
}

const CampaignSchema = new Schema<ICampaign>(
  {
    subject: { type: String, required: true, trim: true },
    audience: { type: String, required: true, trim: true, default: "All Clients" },
    body: { type: String, trim: true },
    openRate: { type: String, default: "—" },
    recipientCount: { type: Number, default: 0, min: 0 },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    state: {
      type: String,
      enum: ["Draft", "Scheduled", "Sent"],
      default: "Draft",
    },
  },
  {
    timestamps: { createdAt: "addedAt", updatedAt: "modifiedAt" },
    collection: "campaigns",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

CampaignSchema.index({ state: 1, addedAt: -1 })

const Campaign: Model<ICampaign> =
  mongoose.models.Campaign ?? mongoose.model<ICampaign>("Campaign", CampaignSchema)

export default Campaign
