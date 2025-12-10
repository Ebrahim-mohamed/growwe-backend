const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    titleEN: { type: String, required: true },
    titleAR: { type: String, required: true },
    desEN: { type: String, required: true },
    desAR: { type: String, required: true },
    newsImage: { type: String }, // filename
  },
  { timestamps: true }
);

module.exports = mongoose.model("News", newsSchema);
