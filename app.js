const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const productsRoutes = require("./routes/products");
const newsRoutes = require("./routes/news");

const app = express();

// ===== Connect MongoDB =====
mongoose
  .connect(
    "mongodb+srv://ebrahimmohamedebrahim2024_db_user:keJJ3RnZF1x4fPsE@growwe.xwylufa.mongodb.net/Growwe"
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("DB Connection Error:", err));

// ===== Middlewares =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images publicly
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== Routes =====
app.use("/products", productsRoutes);
app.use("/news", newsRoutes);
// ===== Start server =====
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
