// backend/app.js
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// connect database
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("DB connected"))
  .catch((err) => console.error("DB Connection Error:", err));

// import routes
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const ordersRoutes = require("./routes/orders");
const paymentsRoutes = require("./routes/payments");
// Assuming you already have products & news routes:
const productsRoutes = require("./routes/products");
const newsRoutes = require("./routes/news");

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/orders", ordersRoutes);
app.use("/payments", paymentsRoutes);
app.use("/products", productsRoutes);
app.use("/news", newsRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("Server running on port", PORT));
