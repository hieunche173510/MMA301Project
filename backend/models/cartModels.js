const mongoose = require("mongoose");
const CartSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    item:[{
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        image: { type: String },
        selected: { type: Boolean, required: true }
    }],
    total_price: { type: Number, default: 0 },
},{ collection: "Carts"});

module.exports = mongoose.model("Cart", CartSchema);