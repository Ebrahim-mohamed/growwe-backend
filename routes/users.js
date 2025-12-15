// backend/routes/users.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Order = require("../models/Order");
const { requireAuth, requireAdmin } = require("../middleware/auth");

// ADMIN: list users with order counts
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().lean();
    const enhanced = await Promise.all(
      users.map(async (u) => {
        const ordersCount = await Order.countDocuments({ buyer: u._id });
        return { ...u, ordersCount };
      })
    );
    res.json(enhanced);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ADMIN: delete user
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    await User.deleteOne({ _id: id });
    await Order.deleteMany({ buyer: id });
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// USER: get current user's cart and profile
router.get("/me", requireAuth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id)
      .populate({ path: "cart.productId", select: "nameEN price productImage" })
      .populate("wishlist")
      .lean();
    res.json(me);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// USER: add to cart
router.post("/cart", requireAuth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const user = await User.findById(req.user.id);
    const exists = user.cart.find((c) => c.productId.toString() === productId);
    if (exists) {
      exists.quantity = exists.quantity + quantity;
    } else {
      user.cart.push({ productId, quantity });
    }
    await user.save();
    res.json({ message: "Added to cart" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// USER: update cart item
router.put("/cart", requireAuth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const user = await User.findById(req.user.id);
    user.cart = user.cart.map((c) =>
      c.productId.toString() === productId ? { ...c.toObject(), quantity } : c
    );
    await user.save();
    res.json({ message: "Cart updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// USER: remove from cart
router.delete("/cart/:productId", requireAuth, async (req, res) => {
  try {
    const pid = req.params.productId;
    await User.updateOne(
      { _id: req.user.id },
      { $pull: { cart: { productId: pid } } }
    );
    res.json({ message: "Removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
