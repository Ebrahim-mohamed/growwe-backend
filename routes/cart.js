// routes/cart.js
const router = require("express").Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Product = require("../models/Product");

router.get("/", auth, async (req, res) => {
  const user = await User.findById(req.user.id).populate("cart.product");
  res.json(user.cart);
});

router.post("/add", auth, async (req, res) => {
  const { productId, quantity } = req.body;

  const product = await Product.findById(productId);
  const user = await User.findById(req.user.id);

  const item = user.cart.find((i) => i.product.toString() === productId);

  if (item) item.quantity += quantity;
  else
    user.cart.push({
      product: productId,
      quantity,
      price: product.price,
    });

  await user.save();
  res.json(user.cart);
});

module.exports = router;
