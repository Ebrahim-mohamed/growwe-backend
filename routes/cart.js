const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Product = require("../models/Product");

// Get user cart
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate("cart.productId");
    res.json({ cart: user.cart });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add item to cart
router.post("/", auth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if enough quantity available
    if (quantity > product.quantity) {
      return res.status(400).json({ message: "Insufficient product quantity" });
    }

    const user = await User.findById(req.userId);

    // Check if product already in cart
    const existingItemIndex = user.cart.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = user.cart[existingItemIndex].quantity + quantity;

      if (newQuantity > product.quantity) {
        return res
          .status(400)
          .json({ message: "Insufficient product quantity" });
      }

      user.cart[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      user.cart.push({ productId, quantity });
    }

    await user.save();
    await user.populate("cart.productId");

    res.json({
      message: "Item added to cart",
      cart: user.cart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update cart item quantity
router.put("/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (quantity > product.quantity) {
      return res.status(400).json({ message: "Insufficient product quantity" });
    }

    const user = await User.findById(req.userId);
    const cartItem = user.cart.find(
      (item) => item.productId.toString() === productId,
    );

    if (!cartItem) {
      return res.status(404).json({ message: "Item not in cart" });
    }

    cartItem.quantity = quantity;
    await user.save();
    await user.populate("cart.productId");

    res.json({
      message: "Cart updated",
      cart: user.cart,
    });
  } catch (error) {
    console.error("Update cart error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove item from cart
router.delete("/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.userId);
    user.cart = user.cart.filter(
      (item) => item.productId.toString() !== productId,
    );

    await user.save();
    await user.populate("cart.productId");

    res.json({
      message: "Item removed from cart",
      cart: user.cart,
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Clear cart
router.delete("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.cart = [];
    await user.save();

    res.json({ message: "Cart cleared" });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
