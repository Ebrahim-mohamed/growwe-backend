
const User = require("../models/User");

const adminAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.adminToken;

    if (!token) {
      return res.status(401).json({
        message: "Please login as administrator.",
      });
    }

    const admin = await User.findOne({
      adminSession: token,
      isAdmin: true,
      adminSessionExpiresAt: { $gt: new Date() },
    }).select("+adminSession +adminSessionExpiresAt");

    if (!admin) {
      return res.status(401).json({
        message: "Invalid or expired admin session.",
      });
    }

    req.admin = admin;

    next();
  } catch (error) {
    console.error("Admin authentication error:", error);

    return res.status(500).json({
      message: "Authentication error.",
    });
  }
};

module.exports = adminAuth;
