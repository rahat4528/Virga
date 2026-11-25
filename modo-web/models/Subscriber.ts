import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface ISubscriber extends Document {
  _id: mongoose.Types.ObjectId
  email: string
  source: string
  isActive: boolean
  addedAt: Date
  modifiedAt: Date
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    source: { type: String, default: "footer" },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "addedAt", updatedAt: "modifiedAt" },
    collection: "subscribers",
  }
)

const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber ?? mongoose.model<ISubscriber>("Subscriber", SubscriberSchema)

export default Subscriber
