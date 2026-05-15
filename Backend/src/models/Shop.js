import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    coordinates: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
    },
  },
  { _id: false },
);

const ShopSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One shop per owner
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 500 },
    category: { type: String }, // e.g., 'Indian', 'Chinese', 'Fast Food'
    images: [{ type: String }], // Array of Cloudinary URLs
    address: { type: AddressSchema, required: true },
    deliveryRadiusKm: { type: Number, default: 5 }, // Delivery geo-fence radius
    commissionRate: { type: Number, default: 10 }, // Platform commission %, set by admin
    isOpen: { type: Boolean, default: false },
    operatingHours: {
      open: { type: String, default: "09:00" },
      close: { type: String, default: "22:00" },
    },
    isApproved: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
  },
  { timestamps: true },
);

ShopSchema.index({ "address.coordinates": "2dsphere" });
ShopSchema.index({ name: "text", description: "text", category: "text" });

export default mongoose.model("Shop", ShopSchema);
