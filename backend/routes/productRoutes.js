const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const categoryModels = require("../models/categoryModels");
const productModels = require("../models/productModels");
const mongoose = require("mongoose");
const router = express.Router();

// Cấu hình Multer để lưu ảnh vào thư mục uploads
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Đổi tên file tránh trùng
  },
});

const upload = multer({ storage: storage });

// Middleware upload nhiều file: image và source file
const uploadFiles = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);

router.get("/", async (req, res) => {
  try {
    const products = await productModels.find();
    res.json(products);
  } catch (error) {
    console.error("Lỗi khi lấy danh mục:", error);
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
});
const uploadBase64Image = async (base64String) => {
  const buffer = Buffer.from(base64String.split(",")[1], "base64");
  const fileName = `${Date.now()}.jpg`; // Or any format you prefer
  const filePath = path.join(__dirname, "uploads", fileName);
  fs.writeFileSync(filePath, buffer);
  return filePath;
};

router.post("/create", uploadFiles, async (req, res) => {
  try {
    console.log("Nhận request create product:", req.body);
    console.log("Files được upload:", req.files);

    const { name, category_id, price, description, author, stock } = req.body;

    // Debug body
    console.log("Body data:", {
      name,
      category_id,
      price,
      description,
      author,
      stock,
    });

    // Kiểm tra các trường bị thiếu
    let missingFields = [];
    if (!name) missingFields.push("name");
    if (!category_id) missingFields.push("category_id");
    if (!price) missingFields.push("price");
    if (!description) missingFields.push("description");
    if (!author) missingFields.push("author");
    if (!stock) missingFields.push("stock");

    if (missingFields.length > 0) {
      console.log("Thiếu các trường:", missingFields);
      return res.status(400).json({
        message: "Các trường sau bị thiếu!",
        missingFields,
      });
    }

    // Kiểm tra danh mục có tồn tại không và ObjectId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(category_id)) {
      console.log("Category ID không hợp lệ:", category_id);
      return res.status(400).json({ message: "Category ID không hợp lệ" });
    }

    const categoryExists = await categoryModels.findById(category_id);
    if (!categoryExists) {
      console.log("Không tìm thấy danh mục:", category_id);
      return res.status(400).json({ message: "Không tìm thấy category này" });
    }

    // Kiểm tra sản phẩm đã tồn tại chưa
    const existingProduct = await productModels.findOne({ name });
    if (existingProduct) {
      console.log("Source code đã tồn tại:", name);
      return res.status(400).json({ message: "Source code này đã tồn tại" });
    }

    // Kiểm tra giá và số lượng
    const numPrice = Number(price);
    const numStock = Number(stock);

    if (isNaN(numPrice) || numPrice <= 1000) {
      console.log("Giá không hợp lệ:", price);
      return res.status(400).json({ message: "Giá phải lớn hơn 1000VND" });
    }

    if (isNaN(numStock) || numStock <= 0) {
      console.log("Số lượng không hợp lệ:", stock);
      return res.status(400).json({ message: "Số lượng sản phẩm phải > 0" });
    }

    // Kiểm tra file ảnh
    if (!req.files || !req.files.image || req.files.image.length === 0) {
      console.log("Thiếu file ảnh:", req.files);
      return res
        .status(400)
        .json({ message: "Vui lòng chọn ảnh preview cho source code!" });
    }

    // Kiểm tra file source code
    if (!req.files || !req.files.file || req.files.file.length === 0) {
      console.log("Thiếu file source code:", req.files);
      return res
        .status(400)
        .json({ message: "Vui lòng chọn file source code (.zip, .rar)!" });
    }

    // Lưu đường dẫn ảnh và file
    const imagePath = `/uploads/${req.files.image[0].filename}`;
    const filePath = `/uploads/${req.files.file[0].filename}`;

    console.log("Image path:", imagePath);
    console.log("File path:", filePath);

    // Tạo sản phẩm mới
    const newProduct = new productModels({
      name,
      category_id,
      price: numPrice,
      description,
      author,
      stock: numStock,
      image: imagePath,
      file: filePath,
    });

    await newProduct.save();
    console.log("Source code được tạo thành công:", newProduct);
    res.status(201).json({
      success: true,
      message: "Source code đã thêm thành công!",
      product: newProduct,
    });
  } catch (error) {
    console.error("Lỗi khi tạo sản phẩm:", error);
    let errorMessage = "Lỗi máy chủ.";

    if (error.name === "ValidationError") {
      errorMessage =
        "Lỗi xác thực dữ liệu: " +
        Object.values(error.errors)
          .map((err) => err.message)
          .join(", ");
      console.error("Validation error:", errorMessage);
      return res.status(400).json({ success: false, message: errorMessage });
    }

    if (error.code === 11000) {
      // Duplicate key error
      errorMessage = "Source code này đã tồn tại";
      console.error("Duplicate error:", errorMessage);
      return res.status(400).json({ success: false, message: errorMessage });
    }

    res.status(500).json({ success: false, message: errorMessage });
  }
});

router.get("/search", async (req, res) => {
  try {
    const { name, minPrice, maxPrice, author, category_id } = req.query;
    let filter = {};

    if (category_id && mongoose.Types.ObjectId.isValid(category_id.trim())) {
      filter.category_id = new mongoose.Types.ObjectId(category_id.trim());
    } else if (category_id) {
      return res.status(400).json({ message: "category_id không hợp lệ!" });
    }

    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    if (author) {
      filter.author = { $regex: author, $options: "i" };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    console.log("Filter được sử dụng:", filter);

    const products = await productModels.find(filter);

    res.status(200).json(products);
  } catch (error) {
    console.error("Lỗi khi tìm kiếm sản phẩm:", error);
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
});

// Lấy sản phẩm theo id
router.get("/detail/:id", async (req, res) => {
  try {
    const productId = req.params.id;

    // Chuyển đổi sang ObjectId nếu ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
    }

    const product = await productModels.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    res.json(product);
  } catch (error) {
    console.error("Lỗi server:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// cập nhật thông tin sản phẩm
router.put("/:id", uploadFiles, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Kiểm tra id hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ!" });
    }

    // Kiểm tra category_id nếu có
    if (
      updateData.category_id &&
      !mongoose.Types.ObjectId.isValid(updateData.category_id)
    ) {
      return res.status(400).json({ message: "category_id không hợp lệ!" });
    }

    // Nếu có ảnh mới, cập nhật imagePath
    if (req.files && req.files.image) {
      updateData.image = `/uploads/${req.files.image[0].filename}`;
    }

    // Nếu có file source code mới, cập nhật filePath
    if (req.files && req.files.file) {
      updateData.file = `/uploads/${req.files.file[0].filename}`;
    }

    // Kiểm tra giá và số lượng
    if (updateData.price !== undefined && updateData.price <= 1000) {
      return res.status(400).json({ message: "Giá phải lớn hơn 1000 VND" });
    }

    if (updateData.stock !== undefined && updateData.stock <= 0) {
      return res.status(400).json({ message: "Số lượng sản phẩm phải > 0" });
    }

    // Cập nhật sản phẩm
    const updatedProduct = await productModels.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại!" });
    }

    res.status(200).json({
      message: "Cập nhật source code thành công!",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật sản phẩm:", error);
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
});
router.use("/uploads", express.static("uploads"));

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Kiem tra id co hop le khong
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ!" });
    }

    // Xoa san pham
    const deletedProduct = await productModels.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại!" });
    }

    res
      .status(200)
      .json({ message: "Xoa san pham thanh cong!", product: deletedProduct });
  } catch (error) {
    console.error("Loi khi xoa san pham:", error);
    res.status(500).json({ message: "Loi server!" });
  }
});

// API download file source code
router.get("/download/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query; // Có thể thêm authentication middleware sau

    // Kiểm tra id hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ!" });
    }

    // Tìm sản phẩm
    const product = await productModels.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại!" });
    }

    // Kiểm tra xem sản phẩm có file source code không
    if (!product.file) {
      return res
        .status(404)
        .json({ message: "Sản phẩm này không có file source code!" });
    }

    // Kiểm tra quyền download (user đã mua sản phẩm này chưa)
    const Order = require("../models/orderModels");
    const hasPurchased = await Order.findOne({
      user_id: user_id,
      "items.product_id": id,
      status: { $in: ["Paid", "Completed"] },
    });

    if (!hasPurchased) {
      // Nếu không có quyền download, chỉ trả về thông báo thông thường với status 200
      return res.status(200).json({
        success: false,
        message: "Bạn cần mua source code này để có thể download!",
      });
    }

    // Đường dẫn file thực tế
    const filePath = path.join(__dirname, "..", product.file);

    // Kiểm tra file có tồn tại không
    if (!require("fs").existsSync(filePath)) {
      return res
        .status(404)
        .json({ message: "File source code không tồn tại trên server!" });
    }

    // Tạo tên file download
    const fileName = `${product.name.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    )}_source_code${path.extname(filePath)}`;

    // Set headers và download file
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    // Gửi file
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Lỗi khi download file:", err);
        res.status(500).json({ message: "Lỗi khi download file!" });
      }
    });
  } catch (error) {
    console.error("Lỗi API download:", error);
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
});

// API kiểm tra quyền truy cập file source code
router.get("/check-access/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;

    // Kiểm tra id hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ!" });
    }

    // Tìm sản phẩm
    const product = await productModels.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại!" });
    }

    // Kiểm tra trong order history xem user đã mua sản phẩm này chưa
    const Order = require("../models/orderModels");
    const hasPurchased = await Order.findOne({
      user_id: user_id,
      "items.product_id": id,
      status: { $in: ["Paid", "Completed"] },
    });

    if (!hasPurchased) {
      return res.status(403).json({
        hasAccess: false,
        message: "Bạn cần mua source code này để có thể download!",
      });
    }

    // Cho phép người đã mua download
    res.json({
      hasAccess: true,
      message: "Bạn có quyền download file này!",
      downloadUrl: `/api/product/download/${id}?user_id=${user_id}`,
    });
  } catch (error) {
    console.error("Lỗi kiểm tra quyền truy cập:", error);
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
});

module.exports = router;
