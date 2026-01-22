const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const cookieParser = require("cookie-parser");

// Middleware to parse cookies
router.use(cookieParser());

// Trust proxy for secure cookies if behind a reverse proxy
router.use((req, res, next) => {
  req.secure = req.secure || req.headers["x-forwarded-proto"] === "https";
  next();
});

// ---------------- JWT GENERATORS ----------------

const ACCESS_SECRET =
  "8f7a9b2c4d6e1f3a5b7c9d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a";
const REFRESH_SECRET =
  "1a3b5c7d9e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2";

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: "7d" });
};

// ---------------- SIGNUP ----------------

router.post("/signup", async (req, res) => {
  try {
    const { userName, email, password, phone, address, country, city, area } =
      req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { userName }] });
    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.email === email
            ? "Email already registered"
            : "Username already taken",
      });
    }

    // Create new user
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

    // Save user first to get _id
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    await User.updateOne({ _id: user._id }, { refreshToken });

    // Set cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: req.secure,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
    res.status(500).json({ message: "Server error during signup" });
  }
});

// ---------------- LOGIN ----------------

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    await User.updateOne({ _id: user._id }, { refreshToken });

    // Set cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: req.secure,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
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
    res.status(500).json({ message: "Server error during login" });
  }
});

// ---------------- REFRESH TOKEN ----------------

router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return res.status(401).json({ message: "Refresh token not found" });

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken)
      return res.status(401).json({ message: "Invalid refresh token" });

    const accessToken = generateAccessToken(user._id);
    res.json({ accessToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
});

// ---------------- LOGOUT ----------------

router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await User.findOneAndUpdate(
        { refreshToken },
        { $unset: { refreshToken: 1 } },
      );
    }

    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
});

module.exports = router;
