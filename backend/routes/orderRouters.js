const express = require("express");
const Order = require("../models/orderModels");
const Cart = require("../models/cartModels");
const { default: axios } = require("axios");

const router = express.Router();

router.post("/checkout", async (req, res) => {
  try {
    const { user_id, payment_method, items } = req.body;

    console.log("Checkout request:", {
      user_id,
      payment_method,
      itemsCount: items ? items.length : 0,
    });

    let selectedItems = [];
    let total_price = 0;

    // Nếu items được gửi từ frontend, sử dụng chúng
    if (items && items.length > 0) {
      // Chuyển đổi items từ frontend sang định dạng của MongoDB
      selectedItems = items.map((item) => ({
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
        selected: true,
      }));

      // Tính tổng tiền
      total_price = selectedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    } else {
      // Lấy từ giỏ hàng trong database
      const cart = await Cart.findOne({ user_id });
      if (!cart || !cart.item || cart.item.length === 0) {
        return res.status(400).json({ message: "Giỏ hàng trống!" });
      }

      selectedItems = cart.item.filter((i) => i && i.selected);
      if (!selectedItems || selectedItems.length === 0) {
        return res.status(400).json({ message: "Bạn chưa chọn sản phẩm nào!" });
      }

      // Nếu có cart, lấy total_price từ đó, nếu không thì mặc định là 0
      total_price = cart ? cart.total_price : 0;
    }

    // Tạo đơn hàng mới
    // Log thông tin trước khi tạo đơn hàng
    console.log("Tạo đơn hàng với dữ liệu:", {
      user_id,
      itemsCount: selectedItems.length,
      total_price,
      payment_method,
    });

    // Đảm bảo tất cả các trường bắt buộc đều có giá trị
    const order = new Order({
      user_id,
      items: selectedItems.map((item) => ({
        product_id: item.product_id,
        name: item.name || "Không có tên",
        price: item.price || 0,
        quantity: item.quantity || 1,
        image: item.image || "",
      })),
      total_price: total_price,
      payment_method,
    });

    await order.save();

    // **Thanh toán COD**
    if (payment_method === "COD") {
      // Xóa giỏ hàng sau khi đặt hàng thành công
      await Cart.findOneAndUpdate({ user_id }, { item: [], total_price: 0 });

      // Đối với COD, chúng ta cũng trả về order_id để frontend có thể đánh dấu đã thanh toán
      return res.status(200).json({
        message: "Đặt hàng thành công! Thanh toán khi nhận hàng.",
        order_id: order._id,
        status: "Pending",
      });
    }

    // **Thanh toán VNPay**
    if (payment_method === "VNPay") {
      try {
        console.log("Đang xử lý thanh toán VNPay với tổng tiền:", total_price);
        console.log("Order ID:", order._id.toString());

        const paymentData = {
          amount: total_price, // Sử dụng total_price đã tính toán ở trên
          orderId: order._id.toString(),
        };

        console.log("Gọi API VNPay với dữ liệu:", paymentData);

        // Sử dụng axios thay vì fetch
        // Xác định URL để gọi API VNPay
        const apiUrl =
          process.env.NODE_ENV === "production"
            ? `${
                process.env.SERVER_URL || "http://localhost:9999"
              }/api/payment/create_payment_url`
            : "http://localhost:9999/api/payment/create_payment_url";

        console.log("Gọi API VNPay tại URL:", apiUrl);

        const response = await axios.post(apiUrl, paymentData);

        console.log("Kết quả từ API VNPay:", response.data);

        if (!response.data || !response.data.paymentUrl) {
          console.error(
            "API VNPay không trả về URL thanh toán:",
            response.data
          );
          throw new Error("API không trả về paymentUrl");
        }

        // Xóa giỏ hàng sau khi đặt hàng thành công
        await Cart.findOneAndUpdate({ user_id }, { item: [], total_price: 0 });

        return res.json({
          paymentUrl: response.data.paymentUrl,
          order_id: order._id,
          status: "Chờ thanh toán",
        });
      } catch (error) {
        console.error("Lỗi khi gọi API VNPay:", error);
        return res.status(500).json({
          error: "Không lấy được payment URL",
          details: error.message,
        });
      }
    }

    return res
      .status(400)
      .json({ message: "Phương thức thanh toán không hợp lệ!" });
  } catch (error) {
    console.error("Lỗi khi đặt hàng:", error);
    res.status(500).json({
      message: "Lỗi server khi đặt hàng!",
      details: error.message || "Không có chi tiết lỗi",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ created_at: -1 });
    res.json(orders);
  } catch (error) {
    console.error("không có dữ liệu đơn hàng", error);
  }
});

// router.get("/user/:user_id", async (req, res) => {
//     try {
//         const { user_id } = req.params;

//         const orders = await Order.find({ user_id }).sort({ created_at: -1 });

//         if (!orders.length) {
//             return res.status(404).json({ message: "Bạn chưa có đơn hàng nào!" });
//         }

//         res.json(orders);
//     } catch (error) {
//         res.status(500).json({ message: "Lỗi server!" });
//     }
// });

router.get("/user/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const { status } = req.query;

    // Tạo điều kiện truy vấn MongoDB
    let query = { user_id };

    // Nếu có status, thêm điều kiện lọc theo status
    if (status) {
      query.status = status;
    }

    // Truy vấn đơn hàng với điều kiện và sắp xếp theo thời gian tạo (mới nhất trước)
    const orders = await Order.find(query).sort({ created_at: -1 });

    // Nếu không có đơn hàng nào, trả về thông báo
    if (!orders.length) {
      return res
        .status(200)
        .json({ message: "Không có đơn hàng nào tồn tại!" });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error("❌ Lỗi khi truy vấn đơn hàng:", error);
    res.status(500).json({ message: "Lỗi server!", details: error.message });
  }
});

//  API Cập Nhật Trạng Thái Đơn Hàng
router.put("/update-status/:order_id", async (req, res) => {
  try {
    const { status } = req.body;
    await Order.findByIdAndUpdate(req.params.order_id, { status });
    res.json({ message: "Cập nhật trạng thái thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!" });
  }
});

//  API Hủy Đơn Hàng
router.delete("/cancel/:order_id", async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.order_id);
    res.json({ message: "Hủy đơn hàng thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!" });
  }
});

router.get("/order-status", async (req, res) => {
  try {
    const orderCounts = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Chuyển đổi kết quả thành object
    const result = {
      Pending: 0,
      Delivering: 0,
      Completed: 0,
      Cancelled: 0,
    };
    orderCounts.forEach((item) => {
      result[item._id] = item.count;
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Error fetching order status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/order-status/:status", async (req, res) => {
  try {
    const { status } = req.params;

    // Kiểm tra trạng thái hợp lệ
    const validStatuses = [
      "Pending",
      "Processing",
      "Completed",
      "Cancelled",
      "Canceled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid order status" });
    }

    const orders = await Order.find({ status });

    res.status(200).json(orders);
  } catch (error) {
    console.error("❌ Error fetching orders by status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
