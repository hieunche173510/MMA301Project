const mongoose = require("mongoose");
const OtpSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    otp: { type: String, required: true },
    expires_at: { type: Date, required: true }
  }, { collection: "OtpRequests", timestamps: true });
  
  module.exports = mongoose.model("OtpRequest", OtpSchema);
  