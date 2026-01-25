const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("-password -refreshToken")
      .populate("cart.productId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile
router.put("/me", auth, async (req, res) => {
  try {
    const { phone, address, country, city, area } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (country) user.country = country;
    if (city) user.city = city;
    if (area) user.area = area;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        country: user.country,
        city: user.city,
        area: user.area,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all users (Admin dashboard)
router.get("/", async (req, res) => {
  try {
    const users = await User.find()
      .select("-password -refreshToken")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete user by ID (Admin dashboard)
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
