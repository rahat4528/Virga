import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IWishlist extends Document {
  _id: mongoose.Types.ObjectId
  client: mongoose.Types.ObjectId
  items: mongoose.Types.ObjectId[]
  addedAt: Date
  modifiedAt: Date
}

const WishlistSchema = new Schema<IWishlist>(
  {
    client: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [{ type: Schema.Types.ObjectId, ref: "Item" }],
  },
  {
    timestamps: { createdAt: "addedAt", updatedAt: "modifiedAt" },
    collection: "wishlists",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

const Wishlist: Model<IWishlist> =
  mongoose.models.Wishlist ?? mongoose.model<IWishlist>("Wishlist", WishlistSchema)

export default Wishlist
