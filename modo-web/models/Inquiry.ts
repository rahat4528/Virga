import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IInquiry extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  message: string
  status: "open" | "replied" | "closed"
  addedAt: Date
  modifiedAt: Date
}

const InquirySchema = new Schema<IInquiry>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ["open", "replied", "closed"], default: "open" },
  },
  {
    timestamps: { createdAt: "addedAt", updatedAt: "modifiedAt" },
    collection: "inquiries",
  }
)

InquirySchema.index({ status: 1, addedAt: -1 })

const Inquiry: Model<IInquiry> =
  mongoose.models.Inquiry ?? mongoose.model<IInquiry>("Inquiry", InquirySchema)

export default Inquiry
