import mongoose from "mongoose";

const MenuItemSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    name: { type: String, required: true },
    description: { type: String, maxlength: 300 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String },
    image: { type: String },
    isVeg: { type: Boolean, required: true },
    isAvailable: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

MenuItemSchema.index({ shop: 1 });
MenuItemSchema.index({ name: "text", description: "text" });

export default mongoose.model("MenuItem", MenuItemSchema);
