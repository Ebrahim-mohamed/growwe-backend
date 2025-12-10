const mongoose = require("mongoose");
const ProductSchema = new mongoose.Schema(
  {
    productImage: String,
    nameEN: String,
    nameAR: String,
    desEN: String,
    desAR: String,
    price: Number,
    quantity: Number,
    typeEN: String,
    typeAR: String,
    size: String,
    unitEN: String,
    unitAR: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
