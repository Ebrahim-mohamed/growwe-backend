
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const cookieParser = require("cookie-parser");

const adminAuth = require("../middleware/adminAuth");

// Middleware to parse cookies
router.use(cookieParser());

// Trust proxy for secure cookies if behind Nginx
router.use((req, res, next) => {
  req.secure = req.secure || req.headers["x-forwarded-proto"] === "https";
  next();
});

// ======================================
// CUSTOMER JWT GENERATORS
// ======================================

const ACCESS_SECRET =
  "8f7a9b2c4d6e1f3a5b7c9d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a";

const REFRESH_SECRET =
  "1a3b5c7d9e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2";

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

// ======================================
// CUSTOMER SIGNUP
// ======================================

router.post("/signup", async (req, res) => {
  try {
    const {
      userName,
      email,
      password,
      phone,
      address,
      country,
      city,
      area,
    } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { userName }],
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.email === email
            ? "Email already registered"
            : "Username already taken",
      });
    }

    const user = new User({
      userName,
      email,
      password,
      phone,
      address,
      country,
      city,
      area,
    });

    // isAdmin automatically defaults to false
    await user.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await User.updateOne(
      { _id: user._id },
      { refreshToken }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: req.secure,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.status(201).json({
      message: "User created successfully",
      accessToken,
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).json({
      message: "Server error during signup",
    });
  }
});

// ======================================
// CUSTOMER LOGIN
// ======================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await User.updateOne(
      { _id: user._id },
      { refreshToken }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: req.secure,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error during login",
    });
  }
});

// ======================================
// CUSTOMER REFRESH TOKEN
// ======================================

router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token not found",
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      REFRESH_SECRET
    );

    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    const accessToken = generateAccessToken(user._id);

    res.json({ accessToken });
  } catch (error) {
    console.error("Refresh token error:", error);

    res.status(401).json({
      message: "Invalid or expired refresh token",
    });
  }
});

// ======================================
// CUSTOMER LOGOUT
// ======================================

router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await User.findOneAndUpdate(
        { refreshToken },
        { $unset: { refreshToken: 1 } }
      );
    }

    res.clearCookie("refreshToken", {
      path: "/",
    });

    res.json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);

    res.status(500).json({
      message: "Server error during logout",
    });
  }
});

// ======================================
// ADMIN LOGIN (NO JWT)
// ======================================

router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const admin = await User.findOne({
      email: email.trim().toLowerCase(),
      isAdmin: true,
    });

    if (!admin) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Generate a random session token, NOT JWT
    const token = crypto.randomBytes(48).toString("hex");

    const expiresAt = new Date(
      Date.now() + 8 * 60 * 60 * 1000
    );

    // Save the session in MongoDB
    admin.adminSession = token;
    admin.adminSessionExpiresAt = expiresAt;

    await admin.save();

    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: req.secure,
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      message: "Admin login successful.",
      admin: {
        id: admin._id,
        userName: admin.userName,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      message: "Server error during admin login.",
    });
  }
});

// ======================================
// VERIFY ADMIN SESSION
// ======================================

router.get("/admin/me", adminAuth, (req, res) => {
  return res.status(200).json({
    admin: {
      id: req.admin._id,
      userName: req.admin.userName,
      email: req.admin.email,
      isAdmin: req.admin.isAdmin,
    },
  });
});

// ======================================
// ADMIN LOGOUT
// ======================================

router.post("/admin/logout", async (req, res) => {
  try {
    const token = req.cookies?.adminToken;

    if (token) {
      await User.updateOne(
        {
          adminSession: token,
          isAdmin: true,
        },
        {
          $set: {
            adminSession: null,
            adminSessionExpiresAt: null,
          },
        }
      );
    }

    res.clearCookie("adminToken", {
      httpOnly: true,
      secure: req.secure,
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      message: "Admin logged out successfully.",
    });
  } catch (error) {
    console.error("Admin logout error:", error);

    return res.status(500).json({
      message: "Admin logout failed.",
    });
  }
});

module.exports = router;
