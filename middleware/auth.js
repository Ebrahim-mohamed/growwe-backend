const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Basic auth middleware (what I provided earlier)
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No authentication token, access denied" });
    }

    const decoded = jwt.verify(
      token,
      "8f7a9b2c4d6e1f3a5b7c9d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a",
    );
    const user = await User.findById(decoded.userId).select(
      "-password -refreshToken",
    );

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired", expired: true });
    }
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Alias for requireAuth (compatible with your orders.js)
const requireAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No authentication token, access denied" });
    }

    const decoded = jwt.verify(
      token,
      "8f7a9b2c4d6e1f3a5b7c9d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a",
    );
    const user = await User.findById(decoded.userId).select(
      "-password -refreshToken",
    );

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Set both req.user and req.userId for compatibility
    req.user = {
      id: user._id.toString(),
      _id: user._id,
      userName: user.userName,
      email: user.email,
      isAdmin: user.isAdmin || false,
    };
    req.userId = decoded.userId;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired", expired: true });
    }
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Admin middleware - checks if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    // Make sure user is authenticated first
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Check if user has admin privileges
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied. Admin privileges required." });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Export all variations for compatibility
module.exports = auth;
module.exports.auth = auth;
module.exports.requireAuth = requireAuth;
module.exports.requireAdmin = requireAdmin;
