const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    author: { type: String, required: true },
    stock: { type: Number, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    image: { type: String },
    file: { type: String }, // Đường dẫn file source code (.rar, .zip)
  },
  { collection: "Products" }
);

module.exports = mongoose.model("Product", ProductSchema);
