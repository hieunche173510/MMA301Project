const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Role = require("../models/roleModels");
const OtpRequest = require("../models/otpModels");

const router = express.Router();
const authMidleware = require("../middleware/authMidleware");
const sendEmail = require("../config/mailer");
// const AsyncStorage = await import("@react-native-async-storage/async-storage");

const isValidEmail = (email) => {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
};

router.post("/register", async (req, res) => {
  try {
    console.log("🔹 Nhận request đăng ký:", req.body);

    const { email, name, password } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!email || !name || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ thông tin!" });
    }

    // Kiểm tra email có hợp lệ không
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Email không hợp lệ!" });
    }

    // Kiểm tra mật khẩu có đủ 8 ký tự không
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Mật khẩu phải có ít nhất 8 ký tự!" });
    }

    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã được sử dụng!" });
    }

    // Mã hóa mật khẩu trước khi lưu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới
    const newUser = new User({
      email,
      name,
      password: hashedPassword,
      role_id: "67b841a3ecb6cc5e38dd0057",
    });

    // Lưu vào database
    await newUser.save();

    console.log("✔ Người dùng đã được lưu:", newUser);

    // Trả về phản hồi có chứa thông tin user (không gửi password)
    return res.status(201).json({
      message: "Đăng ký thành công!",
      user: { id: newUser._id, email, name },
    });
  } catch (error) {
    console.error("❌ Lỗi đăng ký:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Thiếu email hoặc mật khẩu!" });
    }

    const user = await User.findOne({ email }).populate("role_id"); // Lấy cả role
    if (!user) {
      return res.status(400).json({ message: "Email không tồn tại!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu không đúng!" });
    }

    // Tạo token chứa userId và role
    const token = jwt.sign(
      { userId: user._id, role: user.role_id.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Log thêm thông tin để debug
    console.log("✅ Đăng nhập thành công:", {
      userId: user._id,
      email: user.email,
      role: user.role_id.role,
      roleId: user.role_id._id,
    });

    res.json({
      message: "Đăng nhập thành công!",
      token,
      role: user.role_id.role, // Gửi role về FE
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server, vui lòng thử lại!" });
  }
});
router.get("/me", authMidleware(), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate("role_id");
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại!" });
    }
    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role_id.role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server, vui lòng thử lại!" });
  }
});

router.post("/change-password", authMidleware(), async (req, res) => {
  try {
    console.log("📥 Dữ liệu nhận từ frontend:", req.body);

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Thiếu mật khẩu cũ hoặc mới!" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại!" });
    }

    console.log("🔍 Mật khẩu cũ từ frontend:", currentPassword);
    console.log("🔍 Mật khẩu trong DB:", user.password);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    console.log("🔍 Kết quả so khớp:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu cũ không đúng!" });
    }
    const isValidPassword = (password) => {
      return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
        password
      );
    };

    if (!isValidPassword(newPassword)) {
      return res
        .status(400)
        .json({
          message:
            "Mật khẩu mới phải có ít nhất 8 ký tự, chứa chữ, số và ký tự đặc biệt!",
        });
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới không được trùng với mật khẩu cũ!" });
    }
    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log("🔑 Mật khẩu mới đã hash:", hashedPassword);

    // Cập nhật vào database
    user.password = hashedPassword;
    await user.save();

    console.log("✅ Mật khẩu mới đã được lưu thành công!");

    res.json({ message: "Mật khẩu đã được cập nhật thành công!" });
  } catch (error) {
    console.error("❌ Lỗi server:", error);
    res.status(500).json({ message: "Lỗi server, vui lòng thử lại!" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Vui lòng nhập email!" });
    }

    // Kiểm tra xem email có tồn tại không
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại!" });
    }

    // Tạo OTP 6 số
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu OTP vào database (Xóa OTP cũ nếu có)
    await OtpRequest.deleteMany({ user_id: user._id });
    const otpData = new OtpRequest({
      user_id: user._id,
      otp: otpCode,
      expires_at: new Date(Date.now() + 5 * 60 * 1000), // Hết hạn sau 5 phút
    });
    await otpData.save();

    // Gửi email chứa OTP (sử dụng hàm helper)
    await sendEmail(
      email,
      "Mã OTP đặt lại mật khẩu",
      `Mã OTP của bạn là: ${otpCode}. Mã này có hiệu lực trong 5 phút.`
    );
    res.json({ message: "Mã OTP đã được gửi qua email!" });
  } catch (error) {
    console.error("Lỗi gửi OTP:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

// router.post("/verify-otp", async (req, res) => {
//     try {
//         const { email, otp } = req.body;

//         if (!email || !otp) {
//             return res.status(400).json({ message: "Vui lòng nhập email và OTP!" });
//         }

//         // Kiểm tra xem email có tồn tại không
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ message: "Email không tồn tại!" });
//         }

//         // Kiểm tra OTP trong database
//         const otpRecord = await OtpRequest.findOne({ user_id: user._id, otp });

//         if (!otpRecord) {
//             return res.status(400).json({ message: "Mã OTP không hợp lệ!" });
//         }

//         // Kiểm tra thời gian hết hạn
//         if (otpRecord.expires_at < new Date()) {
//             await OtpRequest.deleteOne({ _id: otpRecord._id });  // Xóa OTP hết hạn
//             return res.status(400).json({ message: "Mã OTP đã hết hạn!" });
//         }

//         // Xóa OTP sau khi xác thực thành công
//         await OtpRequest.deleteOne({ _id: otpRecord._id });

//         res.json({ message: "Mã OTP hợp lệ! Bạn có thể đặt lại mật khẩu." });
//     } catch (error) {
//         console.error("Lỗi xác thực OTP:", error);
//         res.status(500).json({ message: "Lỗi server!" });
//     }
// });

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Vui lòng nhập email và OTP!" });
    }

    // Kiểm tra xem email có tồn tại không
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại!" });
    }

    // Kiểm tra OTP trong database
    const otpRecord = await OtpRequest.findOne({ user_id: user._id, otp });

    if (!otpRecord) {
      return res
        .status(400)
        .json({ message: "Mã OTP không hợp lệ hoặc đã được sử dụng!" });
    }

    // Kiểm tra thời gian hết hạn
    if (otpRecord.expires_at < new Date()) {
      await OtpRequest.deleteOne({ _id: otpRecord._id }); // Xóa OTP hết hạn
      return res
        .status(400)
        .json({ message: "Mã OTP đã hết hạn, vui lòng yêu cầu mã mới!" });
    }

    // Xóa OTP sau khi xác thực thành công
    await OtpRequest.deleteOne({ _id: otpRecord._id });

    res.json({ message: "Mã OTP hợp lệ! Bạn có thể đặt lại mật khẩu." });
  } catch (error) {
    console.error("Lỗi xác thực OTP:", error);
    res.status(500).json({ message: "Lỗi server! Vui lòng thử lại sau." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập email và mật khẩu mới!" });
    }

    // Kiểm tra xem email có tồn tại không
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại!" });
    }

    // Kiểm tra mật khẩu mới có hợp lệ không
    const isValidPassword = (password) => {
      return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
        password
      );
    };

    if (!isValidPassword(newPassword)) {
      return res
        .status(400)
        .json({
          message:
            "Mật khẩu mới phải có ít nhất 8 ký tự, chứa chữ, số và ký tự đặc biệt!",
        });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Mật khẩu đã được đặt lại thành công!" });
  } catch (error) {
    console.error("Lỗi đặt lại mật khẩu:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

module.exports = router;
