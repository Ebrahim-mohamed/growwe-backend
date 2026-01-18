const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    shippingData: {
      address: String,
      city: String,
      area: String,
      country: String,
      phone: String,
    },
    paymentInfo: {
      method: String,
      status: String,
      transactionId: String,
      paidAt: Date,
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Completed",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Failed",
      ],
      default: "Pending",
    },
    // Legacy fields for compatibility with payment routes
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    paymobOrderId: {
      type: String,
    },
    paymentDetails: {
      transactionId: String,
      paidAt: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Virtual to support both 'buyer' and 'userId' field names
orderSchema.pre("save", function (next) {
  if (this.buyer && !this.userId) {
    this.userId = this.buyer;
  } else if (this.userId && !this.buyer) {
    this.buyer = this.userId;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
