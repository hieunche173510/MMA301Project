const express = require("express");
const router = express.Router();
const qs = require("qs");
const crypto = require("crypto");
const moment = require("moment");
const orderModels = require("../models/orderModels");
require("dotenv").config();

// Hàm helper để lấy URL callback phù hợp với môi trường
const getDynamicReturnUrl = (req) => {
  const configuredUrl = process.env.VNP_RETURN_URL;

  // Nếu đã cấu hình URL callback cụ thể trong .env, ưu tiên sử dụng
  if (configuredUrl && !configuredUrl.includes("yourserver.com")) {
    return configuredUrl;
  }

  // Lấy host từ request
  const host = req.headers.host;
  const protocol = req.protocol || "http";

  // Tạo URL callback động dựa trên host của server
  return `${protocol}://${host}/api/payment/vnpay_return`;
};

router.post("/create_payment_url", async (req, res) => {
  try {
    console.log("VNPay Create Payment URL request body:", req.body);
    const { amount, orderId } = req.body;

    // Log thông tin chi tiết hơn để debug
    console.log("Thông tin thanh toán:", {
      amount,
      orderId,
      amountType: typeof amount,
      orderIdType: typeof orderId,
    });

    if (!amount || !orderId) {
      console.error("Missing required parameters:", { amount, orderId });
      return res.status(400).json({ message: "Thiếu amount hoặc orderId!" });
    }

    const tmnCode = process.env.VNP_TMNCODE;
    const secretKey = process.env.VNP_HASHSECRET;
    const vnpUrl = process.env.VNP_URL;
    // Sử dụng URL callback động thay vì cố định từ .env
    const returnUrl = getDynamicReturnUrl(req);

    console.log("VNPay configuration:", {
      tmnCode: tmnCode ? "Set" : "Missing",
      secretKey: secretKey ? "Set" : "Missing",
      vnpUrl: vnpUrl || "Missing",
      returnUrl: returnUrl || "Missing",
    });

    if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
      console.error("VNPay configuration incomplete");
      return res.status(500).json({ message: "Cấu hình VNPay chưa đầy đủ!" });
    }

    const clientIp =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip;

    // Đảm bảo amount là số và orderId là chuỗi hợp lệ
    const amountNumber = Number(amount);
    const safeOrderId = String(orderId).replace(/[^0-9a-zA-Z_]/g, ""); // Chỉ giữ lại chữ và số

    if (isNaN(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({ message: "Số tiền không hợp lệ!" });
    }

    // Tạo tham số cho VNPay
    const vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: safeOrderId, // Đã làm sạch orderId
      vnp_OrderInfo: `Thanh toan don hang ${safeOrderId}`, // Không dùng ký tự có dấu
      vnp_OrderType: "billpayment",
      vnp_Amount: Math.round(amountNumber * 100), // Đảm bảo là số nguyên
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: clientIp || "127.0.0.1",
      vnp_CreateDate: moment().format("YYYYMMDDHHmmss"),
    };

    const sortedParams = Object.fromEntries(Object.entries(vnp_Params).sort());

    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    sortedParams["vnp_SecureHash"] = signed;
    const paymentUrl = `${vnpUrl}?${qs.stringify(sortedParams, {
      encode: false,
    })}`;

    res.json({ paymentUrl });
  } catch (error) {
    console.error("Lỗi khi tạo URL thanh toán VNPay:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

// router.get("/vnpay_return", (req, res) => {
//     try {
//         const vnp_Params = req.query;
//         const secureHash = vnp_Params["vnp_SecureHash"];
//         delete vnp_Params["vnp_SecureHash"];
//         delete vnp_Params["vnp_SecureHashType"];

//         // Sắp xếp tham số theo thứ tự alphabet
//         const sortedParams = Object.keys(vnp_Params)
//             .sort()
//             .reduce((acc, key) => ({ ...acc, [key]: vnp_Params[key] }), {});

//         // Tạo chuỗi dữ liệu để ký
//         const signData = qs.stringify(sortedParams, { encode: false });
//         const hmac = crypto.createHmac("sha512", process.env.VNP_HASHSECRET);
//         const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

//         // Kiểm tra tính hợp lệ của giao dịch
//         // if (secureHash !== signed) {
//         //     return res.status(400).json({ message: "Giao dịch không hợp lệ!" });
//         // }

//         // Kiểm tra trạng thái giao dịch
//         if (vnp_Params["vnp_ResponseCode"] === "00") {
//             res.json({ message: "Thanh toán thành công!", vnp_Params });
//         } else {
//             res.json({ message: "Thanh toán thất bại!", vnp_Params });
//         }
//     } catch (error) {
//         console.error("Lỗi khi xử lý phản hồi VNPay:", error);
//         res.status(500).json({ message: "Lỗi server!" });
//     }
// });

router.get("/vnpay_return", async (req, res) => {
  try {
    const vnp_Params = req.query;
    const secureHash = vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    // Sắp xếp tham số theo thứ tự alphabet
    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((acc, key) => ({ ...acc, [key]: vnp_Params[key] }), {});

    // Tạo chuỗi dữ liệu để ký
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", process.env.VNP_HASHSECRET);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    // Kiểm tra tính hợp lệ của giao dịch
    // if (secureHash !== signed) {
    //     return res.status(400).json({ message: "Giao dịch không hợp lệ!" });
    // }

    // Lấy thông tin đơn hàng từ tham số VNPay
    const orderId = vnp_Params["vnp_TxnRef"]; // ID đơn hàng
    const paymentStatus =
      vnp_Params["vnp_ResponseCode"] === "00" ? "Đã nhận" : "Đã hủy";
    const transactionNo = vnp_Params["vnp_TransactionNo"]; // Mã giao dịch từ VNPay
    const totalAmount = parseInt(vnp_Params["vnp_Amount"]); // VNPay trả về giá trị nhân 100

    // Kiểm tra đơn hàng trong MongoDB
    const order = await orderModels.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng!" });
    }

    // Cập nhật trạng thái đơn hàng dựa trên kết quả thanh toán
    order.status = paymentStatus === "Đã nhận" ? "Processing" : "Canceled";
    if (order.status === "Canceled") {
      order.cancel_reason = "Thanh toán không thành công";
    }
    await order.save();

    // Gửi phản hồi về client
    res.json({
      message:
        paymentStatus === "Đã nhận"
          ? "Thanh toán thành công!"
          : "Thanh toán thất bại!",
      order_id: order._id,
      transaction_no: transactionNo,
      total_price: totalAmount,
      status: order.status,
    });
  } catch (error) {
    console.error("Lỗi khi xử lý phản hồi VNPay:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

// API kiểm tra trạng thái thanh toán
router.get("/check-status/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(
      "Kiểm tra trạng thái thanh toán cho đơn hàng - orderId nhận được:",
      orderId
    );
    console.log("Loại dữ liệu orderId:", typeof orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu mã đơn hàng!",
      });
    }

    // Kiểm tra xem orderId có đúng định dạng MongoDB ObjectId không
    const mongoose = require("mongoose");
    let validOrderId;

    try {
      validOrderId = new mongoose.Types.ObjectId(orderId);
      console.log("Đã chuyển đổi thành ObjectId hợp lệ:", validOrderId);
    } catch (err) {
      console.error("❌ Không thể chuyển đổi orderId thành ObjectId:", err);
      return res.status(400).json({
        success: false,
        message: "Mã đơn hàng không hợp lệ!",
      });
    }

    // Tìm đơn hàng trong cơ sở dữ liệu
    const order = await orderModels.findById(validOrderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng!",
      });
    }

    // Kiểm tra trạng thái đơn hàng
    const isPaid =
      order.status === "Completed" ||
      order.status === "Processing" ||
      order.status === "Paid";

    return res.status(200).json({
      success: true,
      order_id: order._id,
      status: order.status,
      paid: isPaid,
      message: isPaid
        ? "Đơn hàng đã được thanh toán"
        : "Đơn hàng chưa được thanh toán hoặc đã bị hủy",
    });
  } catch (error) {
    console.error("Lỗi khi kiểm tra trạng thái thanh toán:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm tra trạng thái thanh toán!",
    });
  }
});

// API đánh dấu đơn hàng đã thanh toán (cho COD giả lập)
router.post("/mark-as-paid/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(
      "Đánh dấu đơn hàng đã thanh toán - orderId nhận được:",
      orderId
    );
    console.log("Loại dữ liệu orderId:", typeof orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu mã đơn hàng!",
      });
    }

    // Kiểm tra xem orderId có đúng định dạng MongoDB ObjectId không
    const mongoose = require("mongoose");
    let validOrderId;

    try {
      validOrderId = new mongoose.Types.ObjectId(orderId);
      console.log("Đã chuyển đổi thành ObjectId hợp lệ:", validOrderId);
    } catch (err) {
      console.error("❌ Không thể chuyển đổi orderId thành ObjectId:", err);
      return res.status(400).json({
        success: false,
        message: "Mã đơn hàng không hợp lệ!",
      });
    }

    // Trước tiên, kiểm tra xem đơn hàng có tồn tại không
    const order = await orderModels.findById(validOrderId);
    console.log(
      "Tìm đơn hàng:",
      validOrderId,
      "Kết quả:",
      order ? "Tìm thấy" : "Không tìm thấy"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng!",
      });
    }

    // Thay vì dùng findByIdAndUpdate, chúng ta sẽ cập nhật trực tiếp và lưu
    order.status = "Paid";
    console.log("Đã cập nhật status thành:", order.status);

    // Lưu lại đơn hàng
    await order.save();
    console.log("Đã lưu đơn hàng thành công");

    return res.status(200).json({
      success: true,
      order_id: order._id,
      status: order.status,
      paid: true,
      message: "Đơn hàng đã được đánh dấu là đã thanh toán",
    });
  } catch (error) {
    console.error("Lỗi khi đánh dấu đơn hàng đã thanh toán:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật trạng thái đơn hàng!",
    });
  }
});

module.exports = router;
