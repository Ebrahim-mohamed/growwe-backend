// backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "change_this";

function generateAccessToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  next();
}

module.exports = { requireAuth, requireAdmin, generateAccessToken };
