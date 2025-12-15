// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { generateAccessToken } = require("../middleware/auth");

const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "change_refresh";
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "change_access";
const REFRESH_EXPIRE = "7d";

function generateRefreshToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_EXPIRE,
  });
}

// Register
router.post("/register", async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    if (!userName || !password)
      return res.status(400).json({ error: "Missing required fields" });

    const exists = await User.findOne({ userName });
    if (exists)
      return res.status(409).json({ error: "Username already taken" });

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ userName, email, passwordHash: hash });
    await user.save();

    res.status(201).json({ message: "Registered" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { userName, password } = req.body;
    const user = await User.findOne({ userName });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Send refresh token as httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: { id: user._id, userName: user.userName, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Refresh
router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: "No refresh token" });

    const payload = jwt.verify(token, REFRESH_TOKEN_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: "Invalid refresh token" });

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );
    res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid token" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
});

module.exports = router;
