const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      name: String,
      price: Number,
      quantity: Number,
      image: String,
    },
  ],
  total_price: { type: Number, required: true },
  payment_method: {
    type: String,
    enum: ["VNPay", "Credit", "Banking", "COD"],
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Paid", "Completed", "Canceled"],
    default: "Pending",
  },
  cancel_reason: { type: String },
  created_at: { type: Date, default: Date.now },
});

OrderSchema.pre("save", function (next) {
  console.log("Pre-save hook triggered with status:", this.status);
  // Don't require cancel_reason for any status other than "Canceled"
  if (this.status === "Canceled" && !this.cancel_reason) {
    console.log("Validation error: Missing cancel_reason for Canceled status");
    return next(new Error("Please enter cancellation reason"));
  }
  next();
});

module.exports = mongoose.model("Order", OrderSchema);
