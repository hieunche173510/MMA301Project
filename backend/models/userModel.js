const mongoose = require("mongoose");
require("./roleModels"); // Đảm bảo Role model được đăng ký trước

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },

  name: { type: String, required: true },
  password: { type: String, required: true },
  role_id: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
  address: { type: String },
  phone: { type: Number },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { collection: "Users" });

module.exports = mongoose.model("User", UserSchema);