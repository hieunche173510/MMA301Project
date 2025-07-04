const express = require("express");
const User = require("../models/userModel");
const auth = require("../middleware/authMidleware"); // Kiểm tra đường dẫn đúng hay không

const router = express.Router();

// Lấy danh sách người dùng
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server, vui lòng thử lại!" });
  }
});

router.post("/create", async (req, res) => {
  try{
    const{ name,email,password,role_id,address,created_at,updated_at,created_by,updated_by} = req.body;

    if(!name || !email || !password || !role_id || !address ){
      return res.status(400).json({message:"Trường này bắt buộc!"});
    }

    const existingUser = await User.findOne({email});
    if(existingUser){
      return res.status(400).json({message:"Email nay da ton tai!"});
    }

    const newUser = new User({name,email,password,role_id,address});
    await newUser.save();
    res.status(201).json({message:"Tao người dùng thanh cong!",user:newUser});
  }catch(error){
    console.error("Lỗi khi tạo người dùng:", error);
    res.status(500).json({ message: "Lỗi server, vui lòng thử lại!" });
  }
});

router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});



router.put('/:id', async (req, res) => {
  try {
      const userId = req.params.id;
      const updateData = req.body;
      updateData.updated_at = new Date();

      const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

      if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "Thông tin người dùng đã được cập nhật ", user: updatedUser });
  } catch (error) {
      res.status(500).json({ message: "Error updating user", error: error.message });
  }
});

module.exports = router;
