const mongoose = require("mongoose");

const RoleSchema = new mongoose.Schema({
    role: { type: String, required: true, unique: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
},{collection:"Roles"});

module.exports = mongoose.model("Role", RoleSchema);