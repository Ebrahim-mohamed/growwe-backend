// models/Product.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    productImage: { type: String, required: true },

    nameEN: { type: String, required: true },
    nameAR: { type: String, required: true },

    desEN: { type: String, required: true },
    desAR: { type: String, required: true },

    price: { type: Number, required: true },
    quantity: { type: Number, required: true },

    typeEN: { type: String, required: true },
    typeAR: { type: String, required: true },

    size: { type: String, required: true },

    unitEN: { type: String, required: true },
    unitAR: { type: String, required: true },

    category: {
      type: String,
      required: true, // soil | mulch
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
