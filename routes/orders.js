// backend/routes/orders.js
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const { requireAuth, requireAdmin } = require("../middleware/auth");

// ADMIN: get all orders (populated)
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate({ path: "buyer", select: "userName email" })
      .populate({ path: "items.product", select: "nameEN productImage price" })
      .lean();
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// USER: create an order (checkout flow will call this)
router.post("/", requireAuth, async (req, res) => {
  try {
    const { items, totalPrice, shippingData, paymentInfo } = req.body;

    // create unique order number
    const orderNumber = "ORD-" + Date.now();

    const order = new Order({
      orderNumber,
      buyer: req.user.id,
      items,
      totalPrice,
      shippingData,
      paymentInfo,
      status: paymentInfo?.status === "paid" ? "Completed" : "Pending",
    });

    await order.save();

    // push order to user's list and clear cart (simple behavior)
    await User.updateOne(
      { _id: req.user.id },
      { $push: { orders: order._id }, $set: { cart: [] } }
    );

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
