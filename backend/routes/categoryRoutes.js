const express = require("express");
const mongoose = require("mongoose");

const Category = require("../models/categoryModels");
const productModels = require("../models/productModels");

const router = express.Router();


router.get("/", async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
        res.status(500).json({ message: "Lỗi máy chủ." });
    }
});

// tạo danh mục
router.post("/create", async(req, res) => {
    try{
        const {name} =req.body;
        if(!name){
            return res.status(400).json({message:"Tên danh mục này bắt buộc!"});

        }

        const existingCategory = await Category.findOne({name});
        if(existingCategory){
            return res.status(400).json({message:"Ten danh mục nay da ton tai!"});
        }

        const newCategory = new Category({name});
        await newCategory.save();
        res.status(201).json({success:true, message:"Tạo danh mục thanh cong!"});
    }catch(error){
        console.error("Lỗi khi tạo danh mục:", error);
        res.status(500).json({ message: "Lỗi máy chủ." });
    }
});

// lấy sản phẩm theo category id 
router.get("/:category_id", async (req, res) => {
    try {
        const { category_id } = req.params;

        // Kiểm tra category_id có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(category_id)) {
            return res.status(400).json({ message: "category_id không hợp lệ!" });
        }

        // Tìm sản phẩm theo category_id
        const products = await productModels.find({ category_id });

        res.status(200).json(products);
    } catch (error) {
        console.error("Lỗi khi lấy sản phẩm theo category_id:", error);
        res.status(500).json({ message: "Lỗi máy chủ." });
    }
});

module.exports = router;