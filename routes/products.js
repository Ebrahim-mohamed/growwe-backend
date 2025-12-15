const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Product = require("../models/Product");

const router = express.Router();

/* ==============================
   UPLOADS CONFIG
================================ */

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/* ==============================
   GET ALL PRODUCTS
   ?category=soil | mulch
================================ */

router.get("/", async (req, res) => {
  try {
    const { category } = req.query;

    const filter = {};
    if (category) filter.category = category;

    const products = await Product.find(filter).sort({
      createdAt: -1,
    });

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/* ==============================
   CREATE PRODUCT
================================ */

router.post("/", upload.single("productImage"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Image is required" });

    const requiredFields = [
      "nameEN",
      "nameAR",
      "desEN",
      "desAR",
      "price",
      "quantity",
      "typeEN",
      "typeAR",
      "size",
      "unitEN",
      "unitAR",
      "category",
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          error: `${field} is required`,
        });
      }
    }

    const product = await Product.create({
      ...req.body,
      productImage: req.file.filename,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

/* ==============================
   UPDATE PRODUCT
================================ */

router.put("/:id", upload.single("productImage"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ error: "Product not found" });

    const updates = { ...req.body };

    if (req.file) {
      // delete old image safely
      if (product.productImage) {
        const oldImagePath = path.join(UPLOAD_DIR, product.productImage);

        fs.promises.unlink(oldImagePath).catch(() => {}); // prevent ENOENT crash
      }

      updates.productImage = req.file.filename;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

/* ==============================
   DELETE PRODUCT
================================ */

router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ error: "Product not found" });

    if (product.productImage) {
      const imgPath = path.join(UPLOAD_DIR, product.productImage);

      fs.promises.unlink(imgPath).catch(() => {});
    }

    await product.deleteOne();

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;
