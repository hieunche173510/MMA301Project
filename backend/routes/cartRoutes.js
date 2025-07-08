const express = require("express");
const Cart = require("../models/cartModels");
const Product = require("../models/productModels");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const carts = await Cart.find();
    res.json(carts);
  } catch (error) {
    console.error("Lỗi khi lấy danh mục:", error);
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
});
// lấy thông tin đơn hàng của 1 người
router.get("/selected/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Tìm giỏ hàng của user đó và lọc các item có selected = true
    const cart = await Cart.findOne({ user_id: userId })
      .populate("user_id")
      .populate("item.product_id");

    if (!cart) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy giỏ hàng cho người dùng này." });
    }

    // Lọc ra các item có selected = true
    const selectedItems = cart.item.filter((i) => i.selected === true);

    // Thay vì trả về lỗi, chỉ trả về mảng rỗng và tổng tiền = 0 nếu không có sản phẩm nào được chọn
    const total_price =
      selectedItems.length > 0
        ? selectedItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          )
        : 0;

    res.status(200).json({
      user_id: cart.user_id,
      selectedItems: selectedItems || [],
      total_price: total_price,
    });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server", details: error.message });
  }
});

// router.get("/selected/:userId", async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const { status } = req.query; // Lấy status từ query string

//         // Tìm giỏ hàng của user và populate dữ liệu
//         const cart = await Cart.findOne({ user_id: userId })
//             .populate("user_id")
//             .populate("item.product_id");

//         if (!cart) {
//             return res.status(404).json({ message: "Không tìm thấy giỏ hàng cho người dùng này." });
//         }

//         // Lọc các sản phẩm có selected = true
//         let selectedItems = cart.item.filter(i => i.selected === true);

//         // Nếu có status, tiếp tục lọc theo status
//         if (status) {
//             selectedItems = selectedItems.filter(i => i.status === status);
//         }

//         if (selectedItems.length === 0) {
//             return res.status(404).json({ message: "Không có sản phẩm nào thỏa mãn điều kiện." });
//         }

//         res.status(200).json({
//             user_id: cart.user_id,
//             selectedItems,
//             total_price: selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
//         });

//     } catch (error) {
//         res.status(500).json({ error: "Lỗi server", details: error.message });
//     }
// });

router.post("/add", async (req, res) => {
  try {
    const { user_id, products } = req.body; // Nhận danh sách sản phẩm

    if (!Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ message: "Danh sách sản phẩm không hợp lệ!" });
    }

    // Kiểm tra xem user đã có giỏ hàng chưa
    let cart = await Cart.findOne({ user_id });

    if (!cart) {
      cart = new Cart({ user_id, total_price: 0, item: [] });
    }

    for (let { product_id, quantity } of products) {
      const product = await Product.findById(product_id);

      if (!product) {
        return res
          .status(404)
          .json({ message: `Sản phẩm với ID ${product_id} không tồn tại!` });
      }

      // Kiểm tra xem sản phẩm đã có trong giỏ chưa
      const existingItem = cart.item.find(
        (i) => i.product_id.toString() === product_id
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.item.push({
          product_id,
          name: product.name,
          price: product.price,
          quantity,
          image: product.image,
          selected: true,
        });
      }
    }

    // Cập nhật tổng giá nhưng chỉ tính sản phẩm `selected = true`
    cart.total_price = cart.item
      .filter((i) => i.selected)
      .reduce((sum, i) => sum + i.price * i.quantity, 0);

    // Lưu giỏ hàng
    await cart.save();

    res.status(201).json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

router.put("/update-selected", async (req, res) => {
  try {
    const { user_id, product_id, selected } = req.body;

    let cart = await Cart.findOne({
      user_id: new mongoose.Types.ObjectId(user_id),
    });
    if (!cart) {
      return res.status(404).json({ message: "Giỏ hàng không tồn tại!" });
    }

    const item = cart.item.find((i) =>
      i.product_id.equals(new mongoose.Types.ObjectId(product_id))
    );
    if (!item) {
      return res
        .status(404)
        .json({ message: "Sản phẩm không có trong giỏ hàng!" });
    }

    // Cập nhật trạng thái selected
    item.selected = selected;

    // Cập nhật tổng tiền chỉ tính sản phẩm `selected = true`
    cart.total_price = cart.item
      .filter((i) => i.selected)
      .reduce((sum, i) => sum + i.price * i.quantity, 0);

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
});
router.get("/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    // Kiểm tra ID có hợp lệ không
    if (!mongoose.isValidObjectId(user_id)) {
      return res.status(400).json({ message: "ID không hợp lệ!" });
    }

    // Tìm cart của user và populate dữ liệu sản phẩm
    const cart = await Cart.findOne({
      user_id: new mongoose.Types.ObjectId(user_id),
    }).populate("item.product_id", "name price image"); // Đổi từ `items` thành `item`

    if (!cart) {
      return res.status(404).json({ message: "Giỏ hàng trống!" });
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Xóa sản phẩm khỏi giỏ hàng - hỗ trợ cả POST và DELETE
router.post("/remove", async (req, res) => {
  try {
    const { user_id, product_id } = req.body;

    if (!user_id || !product_id) {
      return res.status(400).json({ message: "Thiếu user_id hoặc product_id" });
    }

    console.log("Xóa sản phẩm:", { user_id, product_id });

    let cart = await Cart.findOne({ user_id });

    if (!cart || !cart.item) {
      return res.status(404).json({ message: "Giỏ hàng không tồn tại!" });
    }

    console.log("Cart trước khi xóa:", cart);

    //  Chuyển đổi product_id từ string sang ObjectId
    const productIdToRemove = new mongoose.Types.ObjectId(product_id);

    // Lọc bỏ sản phẩm cần xóa
    cart.item = cart.item.filter(
      (item) => !item.product_id.equals(productIdToRemove)
    );

    //  Cập nhật total_price sau khi xóa sản phẩm
    cart.total_price = cart.item.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    console.log("Cart sau khi xóa:", cart);

    await cart.save();

    res.json({ message: "Xóa sản phẩm thành công!", cart });
  } catch (error) {
    console.error("Lỗi server:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

// cập nhật số lượng của sản phẩm
router.put("/update-quantity", async (req, res) => {
  try {
    const { user_id, product_id, quantity } = req.body;

    if (!user_id || !product_id || quantity < 1) {
      return res.status(400).json({ message: "Thông tin không hợp lệ!" });
    }

    let cart = await Cart.findOne({ user_id });

    if (!cart) {
      return res.status(404).json({ message: "Giỏ hàng không tồn tại!" });
    }

    // Tìm sản phẩm trong giỏ hàng
    const item = cart.item.find((i) => i.product_id.toString() === product_id);
    if (!item) {
      return res
        .status(404)
        .json({ message: "Sản phẩm không có trong giỏ hàng!" });
    }

    //  Cập nhật số lượng sản phẩm
    item.quantity = quantity;

    //  Cập nhật tổng tiền (chỉ tính sản phẩm được chọn)
    cart.total_price = cart.item
      .filter((i) => i.selected)
      .reduce((sum, i) => sum + i.price * i.quantity, 0);

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    console.error("Lỗi server:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

// Xóa sản phẩm với DELETE method và param (cho tương thích)
router.delete("/remove/:product_id", async (req, res) => {
  try {
    // Lấy product_id từ params
    const { product_id } = req.params;

    // Lấy user_id từ token hoặc query param
    let user_id = null;

    if (req.query.user_id) {
      user_id = req.query.user_id;
    } else if (req.headers.authorization) {
      // Xác thực từ token (tùy vào cách bạn lưu user_id trong token)
      const token = req.headers.authorization.replace("Bearer ", "");
      // Logic lấy user_id từ token ở đây...

      // Nếu không lấy được từ token, trả về lỗi
      if (!user_id) {
        return res
          .status(400)
          .json({ message: "Thiếu user_id trong query hoặc token" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "Không tìm thấy thông tin người dùng" });
    }

    if (!product_id) {
      return res.status(400).json({ message: "Thiếu product_id" });
    }

    let cart = await Cart.findOne({ user_id });

    if (!cart || !cart.item) {
      return res.status(404).json({ message: "Giỏ hàng không tồn tại!" });
    }

    // Chuyển đổi product_id từ string sang ObjectId
    const productIdToRemove = new mongoose.Types.ObjectId(product_id);

    // Lọc bỏ sản phẩm cần xóa
    cart.item = cart.item.filter(
      (item) => !item.product_id.equals(productIdToRemove)
    );

    // Cập nhật total_price sau khi xóa sản phẩm
    cart.total_price = cart.item.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    await cart.save();

    res.json({ message: "Xóa sản phẩm thành công!", cart });
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

// Tạo giỏ hàng mới cho user nếu chưa có
router.post("/create", async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "Thiếu thông tin user_id" });
    }

    // Kiểm tra xem user đã có giỏ hàng chưa
    let cart = await Cart.findOne({ user_id });

    // Nếu đã có giỏ hàng, trả về giỏ hàng hiện tại
    if (cart) {
      return res.status(200).json({
        message: "Giỏ hàng đã tồn tại",
        cart,
      });
    }

    // Nếu chưa có, tạo giỏ hàng mới
    cart = new Cart({
      user_id,
      item: [],
      total_price: 0,
    });

    await cart.save();

    res.status(201).json({
      message: "Đã tạo giỏ hàng mới",
      cart,
    });
  } catch (error) {
    console.error("Lỗi khi tạo giỏ hàng:", error);
    res.status(500).json({ message: "Lỗi server khi tạo giỏ hàng" });
  }
});

module.exports = router;
