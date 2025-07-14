import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  getOrdersByStatus,
  getAllOrderStatus,
  updateOrderStatus,
} from "../services/api";
import ListProduct from "./ListProduct";

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [orderStatus, setOrderStatus] = useState({
    Pending: 0,
    Delivering: 0,
    Completed: 0,
    Cancelled: 0,
  });
  const [visibleStatus, setVisibleStatus] = useState(null);

  useEffect(() => {
    fetchOrderStatus();
  }, []);

  const fetchOrders = async (status) => {
    try {
      const data = await getOrdersByStatus(status);
      setOrders(data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đơn:", error);
    }
  };

  const fetchOrderStatus = async () => {
    try {
      const data = await getAllOrderStatus();
      setOrderStatus(data);
    } catch (error) {
      console.error("Lỗi khi lấy số lượng đơn:", error);
    }
  };

  const handleUpdateOrderStatus = async (orderId) => {
    try {
      await updateOrderStatus(orderId, "Processing");
      alert("Cập nhật trạng thái thành công!");
      fetchOrders("Pending"); // Reload the updated list
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
    }
  };

  const handleStatusClick = (status) => {
    if (visibleStatus === status) {
      setVisibleStatus(null);
    } else {
      setVisibleStatus(status);
      fetchOrders(status);
    }
  };

  // Render individual product row
  const renderProductRow = (
    product,
    isFirstProduct,
    orderIndex,
    orderId,
    status
  ) => (
    <View style={styles.productRow}>
      {isFirstProduct ? (
        <Text style={styles.productCell}>{orderIndex + 1}</Text> // STT Đơn Hàng
      ) : (
        <Text style={styles.productCell}></Text> // Ô trống cho các sản phẩm tiếp theo
      )}
      <Text style={styles.productCell}>{product.name}</Text>
      <Text style={styles.productCell}>
        {product.price.toLocaleString()} VND
      </Text>
      <Text style={styles.productCell}>{product.quantity}</Text>

      {/* Hiển thị nút cập nhật trạng thái nếu trạng thái là Pending */}
      {isFirstProduct && status === "Pending" && (
        <TouchableOpacity
          style={styles.updateButton}
          onPress={() => handleUpdateOrderStatus(orderId)}
        >
          <Text style={styles.updateButtonText}>Cập Nhật</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render mỗi đơn hàng
  const renderOrderItem = ({ item, index }) => (
    <View style={styles.orderContainer}>
      {item.items.map((product, productIndex) => (
        <View key={product._id}>
          {renderProductRow(product, productIndex === 0, index)}
        </View>
      ))}

      <View style={styles.summaryRow}>
        <Text style={styles.summaryCell}></Text>
        <Text style={styles.summaryCell}></Text>
        <Text style={styles.summaryLabel}>Tổng Tiền:</Text>
        <Text style={styles.summaryValue}>
          {item.total_price.toLocaleString()} VND
        </Text>
        <Text style={styles.summaryLabel}>Phương Thức Thanh Toán:</Text>
        <Text style={styles.summaryValue}>{item.payment_method}</Text>

        {visibleStatus === "Pending" && (
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => handleUpdateOrderStatus(item._id)}
          >
            <Text style={styles.updateButtonText}>Cập nhật trạng thái</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const statusColors = {
    Pending: "#FFC107",
    Delivering: "#2196F3",
    Completed: "#4CAF50",
    Cancelled: "#F44336",
  };

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>Marketplace Source Code</Text>
        <Text style={styles.menuHeader}>MAIN MENU</Text>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Dashboard</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.mainContent}>
        <Text style={styles.header}>Quản lý Source Code</Text>

        {/* Hướng dẫn quản lý */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionTitle}>
            Chào mừng đến với trang quản lý Source Code
          </Text>
          <Text style={styles.instructionText}>
            • Tại đây bạn có thể thêm, sửa, xóa các source code trên hệ thống
          </Text>
          <Text style={styles.instructionText}>
            • Mỗi source code cần có ảnh preview và file .zip/.rar đính kèm
          </Text>
          <Text style={styles.instructionText}>
            • Hãy cung cấp mô tả chi tiết để người dùng hiểu rõ về source code
            của bạn
          </Text>
        </View>

        {/* Product List Component */}
        <ListProduct />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
  },
  sidebar: {
    width: 250,
    backgroundColor: "#2A2A2A",
    padding: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#50FA7B",
    marginBottom: 30,
  },
  menuHeader: {
    fontSize: 14,
    color: "#888",
    marginBottom: 10,
    marginTop: 20,
  },
  menuItem: {
    paddingVertical: 10,
  },
  menuText: {
    fontSize: 16,
    color: "#F8F8F2",
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#F8F8F2",
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statusWrapper: {
    flex: 1,
    alignItems: "center",
  },
  statusBox: {
    width: "90%",
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  activeStatus: {
    borderColor: "#50FA7B",
    transform: [{ scale: 1.1 }],
  },
  statusValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F8F8F2",
    marginTop: 5,
    textTransform: "capitalize",
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    backgroundColor: "#fff",
    overflow: "hidden",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  orderContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 10,
    paddingBottom: 10,
  },
  productRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  productCell: {
    flex: 1,
    fontSize: 14,
    textAlign: "center",
    color: "#555",
  },
  summaryRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fafafa",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    justifyContent: "flex-end",
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginRight: 10,
  },
  summaryValue: {
    fontSize: 14,
    color: "#333",
    marginRight: 20,
  },
  flatListContent: {
    paddingBottom: 10,
  },
  emptyText: {
    color: "#F8F8F2",
    textAlign: "center",
    marginTop: 30,
    fontSize: 20,
    fontWeight: "500",
  },
  instructionContainer: {
    backgroundColor: "#1E272E",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#50FA7B",
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F8F8F2",
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: "#F8F8F2",
    marginBottom: 6,
    lineHeight: 20,
  },
  updateButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  updateButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default AdminDashboard;
