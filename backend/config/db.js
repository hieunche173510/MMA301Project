const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    console.log("🔍 Kết nối MongoDB với URI:", process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI, {
      useUnifiedTopology: true,
    });

    console.log("✅ Kết nối MongoDB thành công!");
  } catch (error) {
    console.error("❌ Lỗi kết nối MongoDB:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
