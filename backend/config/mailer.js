require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Email gửi
    pass: process.env.EMAIL_PASS, // Mật khẩu ứng dụng
  },
});
const sendEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
        };

        await transporter.sendMail(mailOptions);
        console.log("Email đã được gửi thành công!");
    } catch (error) {
        console.error("Lỗi gửi email:", error);
        throw new Error("Không thể gửi email.");
    }
};

module.exports = sendEmail;