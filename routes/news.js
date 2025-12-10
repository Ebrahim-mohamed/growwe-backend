const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const News = require("../models/News");

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// GET all news
router.get("/", async (req, res) => {
  try {
    const news = await News.find();
    res.json(news);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// POST create news
router.post("/", upload.single("newsImage"), async (req, res) => {
  try {
    const { titleEN, titleAR, desEN, desAR } = req.body;
    const newsImage = req.file ? req.file.filename : null;

    const newNews = new News({ titleEN, titleAR, desEN, desAR, newsImage });
    await newNews.save();
    res.json(newNews);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// PUT update news
router.put("/:id", upload.single("newsImage"), async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id);
    if (!news) return res.status(404).send("News not found");

    const { titleEN, titleAR, desEN, desAR } = req.body;

    // Replace image if new one is uploaded
    if (req.file) {
      if (news.newsImage) {
        const oldPath = path.join(__dirname, "../uploads", news.newsImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      news.newsImage = req.file.filename;
    }

    news.titleEN = titleEN;
    news.titleAR = titleAR;
    news.desEN = desEN;
    news.desAR = desAR;

    await news.save();
    res.json(news);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// DELETE news
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id);
    if (!news) return res.status(404).send("News not found");

    // Delete image safely
    if (news.newsImage) {
      const filePath = path.join(__dirname, "../uploads", news.newsImage);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // Delete the document
    await News.deleteOne({ _id: id });

    res.send("News deleted");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
