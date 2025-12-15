// backend/models/User.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const cartItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, default: 1 },
});

const addressSchema = new Schema({
  label: String,
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
  phone: String,
});

const userSchema = new Schema(
  {
    userName: { type: String, required: true, unique: true, trim: true },
    email: { type: String, unique: true, sparse: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isVerified: { type: Boolean, default: false },
    cart: [cartItemSchema],
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    addresses: [addressSchema],
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
