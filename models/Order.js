// backend/models/Order.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Canceled"],
      default: "Pending",
    },
    paymentInfo: Schema.Types.Mixed,
    shippingData: {
      address: String,
      city: String,
      country: String,
      postalCode: String,
      area: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
