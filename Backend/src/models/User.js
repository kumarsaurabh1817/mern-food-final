import mongoose from "mongoose";
import bcrypt from "bcrypt";

const AddressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home" },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, default: "000000" },
    country: { type: String, default: "India" },
    isDefault: { type: Boolean, default: false },
    // Optional geocoordinates — used for delivery radius validation at checkout
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  { _id: true },
);

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
      select: false, // never returned in API responses
    },
    role: {
      type: String,
      enum: ["user", "owner", "delivery_boy", "admin"],
      required: true,
    },
    phone: {
      type: String,
      // Accepts plain digits (10–15), with optional leading + and country code (1–4 digits).
      // The express-validator middleware strips spaces/dashes before saving, so the value
      // stored here is always a compact digit string like "+919876543210" or "9876543210".
      match: [
        /^(\+?\d{1,4})?\(?\d{6,14}\)?$/,
        "Please fill a valid phone number",
      ],
    },
    profilePicture: {
      type: String,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isApprovedByAdmin: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    kycDocuments: {
      aadhaar: String,
      pan: String,
      fssai: String,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    accountLockedUntil: {
      type: Date,
    },
    addresses: [AddressSchema],
    refreshTokens: {
      type: [String],
      default: [],
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpires: {
      type: Date,
      index: { expires: 0 }, // TTL-indexed
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
      index: { expires: 0 }, // TTL-indexed
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
  this.password = await bcrypt.hash(this.password, rounds);
});

// Method to check password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", UserSchema);
