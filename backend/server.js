const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const authenRoutes = require("./routes/authenRoutes");
const cateRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRouters");
const VNPayRouter = require("./routes/VNPayRouter.js");
const path = require("path");
const bodyParser = require("body-parser");
const manageorderRouter = require("./adminRouters/manageorderRouter");

dotenv.config();
connectDB();

const app = express();

// Xử lý CORS
app.use(cors());

// Xử lý JSON và form-data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

// API Routes
app.use("/api/auth", authenRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cate", cateRoutes);
app.use("/api/product", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/payment", VNPayRouter);
app.use("/api/admin", manageorderRouter);

// Cấu hình để truy cập file tĩnh (uploads)
app.use(
  "/uploads",
  (req, res, next) => {
    const fileExt = path.extname(req.path).toLowerCase();

    // Set Content-Type cho ảnh
    if ([".jpg", ".jpeg", ".png", ".gif"].includes(fileExt)) {
      res.setHeader("Content-Type", "image/*");
    }
    // Set Content-Type cho file nén
    else if ([".zip", ".rar"].includes(fileExt)) {
      res.setHeader("Content-Type", "application/octet-stream");
    }

    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
