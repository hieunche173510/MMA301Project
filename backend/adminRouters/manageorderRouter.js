
const express = require("express");
const Order = require("../models/orderModels");

const router = express.Router();

router.get('/order-status', async (req, res) => {
    try {
      const orderCounts = await Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);
  
      // Chuyển đổi kết quả thành object
      const result = {
        Pending: 0,
        Delivering: 0,
        Completed: 0,
        Canceled: 0
      };
      orderCounts.forEach((item) => {
        result[item._id] = item.count;
      });
  
      res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error fetching order status:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


  module.exports = router;