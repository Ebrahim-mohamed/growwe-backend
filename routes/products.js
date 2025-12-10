const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Product = require("../models/Product.js");

const router = express.Router();

// Image storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/**
 * GET ALL PRODUCTS
 */
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ADD PRODUCT
 */
router.post("/", upload.single("productImage"), async (req, res) => {
  try {
    const body = req.body;

    const product = new Product({
      ...body,
      productImage: req.file?.filename,
    });

    await product.save();
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

/**
 * UPDATE PRODUCT
 */
router.put("/:id", upload.single("productImage"), async (req, res) => {
  try {
    const body = req.body;

    let updates = { ...body };

    // If uploading a new image, delete old one
    if (req.file) {
      const old = await Product.findById(req.params.id);

      if (old?.productImage) {
        const oldPath = `uploads/${old.productImage}`;
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      updates.productImage = req.file.filename;
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update" });
  }
});

/**
 * DELETE PRODUCT
 */
router.delete("/:id", async (req, res) => {
  try {
    const prod = await Product.findByIdAndDelete(req.params.id);

    if (!prod) return res.status(404).json({ error: "Not found" });

    // Delete image if exists
    if (prod.productImage) {
      const img = `uploads/${prod.productImage}`;
      if (fs.existsSync(img)) fs.unlinkSync(img);
    }

    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

module.exports = router;
