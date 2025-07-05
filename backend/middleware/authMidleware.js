
const jwt = require("jsonwebtoken");

const authMidleware = (roles = []) => {
    return (req, res, next) => {
        const token = req.header("Authorization")?.split(" ")[1]; // Lấy token từ header

        if (!token) {
            return res.status(401).json({ message: "Chưa đăng nhập!" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // Lưu thông tin user từ token vào req.user

            // Kiểm tra role (nếu có truyền roles vào middleware)
            if (roles.length > 0 && !roles.includes(req.user.role)) {
                return res.status(403).json({ message: "Bạn không có quyền truy cập!" });
            }

            next();
        } catch (error) {
            res.status(401).json({ message: "Token không hợp lệ!" });
        }
    };
};

module.exports = authMidleware;
