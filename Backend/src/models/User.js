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
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "owner", "delivery_boy", "admin"],
      required: true,
    },
    phone: {
      type: String,
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
      index: { expires: 0 },
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

  this.password = await bcrypt.hash(this.password, saltRounds);
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", UserSchema);
