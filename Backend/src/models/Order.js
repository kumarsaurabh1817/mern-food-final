import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  { _id: false },
);

const OrderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const OrderSchema = new mongoose.Schema(
  {
    idempotencyKey: { type: String, unique: true, sparse: true },
    // Plain date field — checked in code to decide whether a key is still active.
    // WARNING: Do NOT add `index: { expires: 0 }` here — that would be a MongoDB TTL
    // index that deletes the *entire* Order document after 24 h, wiping paid orders.
    // Expiry is enforced in the checkout controller, not by MongoDB.
    idempotencyKeyExpiresAt: {
      type: Date,
      default: null,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    deliveryAgent: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["online", "cod"] },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentGatewayId: { type: String },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready_for_pickup",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    preparationTime: { type: Number },
    deliveryAddress: { type: AddressSchema, required: true },
    deliveryOTP: { type: String, select: false }, // plain OTP — only exposed to the customer role
    deliveryOTPHash: { type: String, select: false }, // bcrypt hash — hidden from all client responses; only selected explicitly for OTP verification
    statusTimestamps: {
      pending: { type: Date, default: Date.now },
      confirmed: { type: Date },
      preparing: { type: Date },
      ready_for_pickup: { type: Date },
      out_for_delivery: { type: Date },
      delivered: { type: Date },
      cancelled: { type: Date },
    },
  },
  { timestamps: true },
);

// NOTE: No manual index for idempotencyKey — the field-level unique:true already creates one.
OrderSchema.index({ customer: 1 });
OrderSchema.index({ shop: 1 });
OrderSchema.index({ deliveryAgent: 1 });
OrderSchema.index({ status: 1 });
// FIX #23: Compound indexes for the two dominant query shapes
OrderSchema.index({ shop: 1, status: 1 }); // owner order list + analytics
OrderSchema.index({ customer: 1, status: 1 }); // customer order history + cancellation check
OrderSchema.index({ deliveryAgent: 1, status: 1 }); // delivery pool + earnings

OrderSchema.pre("save", function () {
  if (this.isModified("status")) {
    if (!this.statusTimestamps) {
      this.statusTimestamps = {};
    }
    this.statusTimestamps[this.status] = new Date();
  }
});

export default mongoose.model("Order", OrderSchema);
