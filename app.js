// backend/app.js
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

// CORS configuration - IMPORTANT: Add credentials: true
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://194.164.76.51",
      "https://194.164.76.51",
      "http://194.164.76.51:3001",
      "https://194.164.76.51:3001",
      "https://www.growwe.com",
      "https://growwe.com",
      "https://api.growwe.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // IMPORTANT: This allows cookies to be sent
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect database
mongoose
  .connect(
    process.env.MONGODB_URI ||
      "mongodb+srv://ebrahimmohamedebrahim2024_db_user:keJJ3RnZF1x4fPsE@growwe.xwylufa.mongodb.net/?appName=Growwe",
  )
  .then(() => console.log("DB connected"))
  .catch((err) => console.error("DB Connection Error:", err));

// Import routes
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const ordersRoutes = require("./routes/orders");
const paymentsRoutes = require("./routes/payments");
const cartRoutes = require("./routes/cart"); // Add cart routes
const productsRoutes = require("./routes/products");
const newsRoutes = require("./routes/news");

// Use routes
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/orders", ordersRoutes);
app.use("/payments", paymentsRoutes);
app.use("/cart", cartRoutes); // Add cart routes
app.use("/products", productsRoutes);
app.use("/news", newsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
