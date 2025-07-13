import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  getCurrentUser,
  getOrdersByUser,
  updateOrderStatus,
  getImageUrl,
  downloadSourceCode,
} from "../services/api";

const OrderList = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Lấy đơn hàng của người dùng
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("Bạn chưa đăng nhập");
      }

      const data = await getOrdersByUser(token);

      if (Array.isArray(data)) {
        setOrders(data);
        // Khởi tạo hiển thị tất cả đơn hàng
        setFilteredOrders(data);
      } else if (data && data.message) {
        setOrders([]);
        setFilteredOrders([]);
        setError(data.message);
      }
    } catch (err) {
      console.error("❌ Lỗi khi lấy đơn hàng:", err);
      setError("Không thể tải đơn hàng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Always show all orders (no filtering)
  useEffect(() => {
    setFilteredOrders(orders);
  }, [orders]);

  // Làm mới dữ liệu khi người dùng pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  // Fetch dữ liệu khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  // Xử lý cập nhật trạng thái đơn hàng
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      Alert.alert("✅ Thành công", "Trạng thái đơn hàng đã được cập nhật.");
      fetchOrders(); // Làm mới danh sách sau khi cập nhật
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật trạng thái:", err);
      Alert.alert("❌ Lỗi", "Không thể cập nhật trạng thái đơn hàng.");
    }
  };

  // Hiển thị màu sắc dựa trên trạng thái đơn hàng
  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "#FFA500"; // Cam
      case "Paid":
        return "#1E90FF"; // Xanh dương
      case "Completed":
        return "#32CD32"; // Xanh lá
      case "Cancelled":
      case "Canceled":
        return "#FF6347"; // Đỏ
      default:
        return "#777777"; // Xám
    }
  };

  // Format hiển thị trạng thái đơn hàng
  const formatStatus = (status) => {
    switch (status) {
      case "Pending":
        return "⏳ Chờ thanh toán";
      case "Paid":
        return "💰 Đã thanh toán";
      case "Completed":
        return "✅ Hoàn thành";
      case "Cancelled":
      case "Canceled":
        return "❌ Đã hủy";
      default:
        return status;
    }
  };

  // Format giá tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Hiển thị loader khi đang tải dữ liệu
  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D35400" />
        <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#D35400" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn Hàng Của Bạn</Text>
      </View>

      {/* Removed filters as requested */}

      {/* Hiển thị thông báo lỗi nếu có */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#FF6347" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Danh sách đơn hàng */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(order) => order._id}
        renderItem={({ item: order }) => (
          <View style={styles.orderCard}>
            {/* Hiển thị thông tin đơn hàng */}
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderIdText}>
                  Mã đơn: #{order._id.substring(order._id.length - 8)}
                </Text>
                <Text style={styles.orderDateText}>
                  {new Date(order.created_at).toLocaleDateString("vi-VN")}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(order.status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {formatStatus(order.status)}
                </Text>
              </View>
            </View>
            {/* Hiển thị các sản phẩm trong đơn hàng */}
            {order.items &&
              order.items.map((item, index) => (
                <View key={item._id || index} style={styles.productCard}>
                  <Image
                    source={{ uri: getImageUrl(item.image) }}
                    style={styles.productImage}
                    defaultSource={require("../../assets/images/logo.png")}
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.productPrice}>
                      {formatPrice(item.price)}
                    </Text>
                    <Text style={styles.quantityText}>
                      Số lượng: {item.quantity}
                    </Text>
                  </View>
                </View>
              ))}
            {/* Tổng tiền và phương thức thanh toán */}
            <View style={styles.orderFooter}>
              <Text style={styles.paymentMethod}>
                {order.payment_method === "VNPay"
                  ? "💳 Thanh toán qua VNPay"
                  : "💰 Thanh toán trực tuyến"}
              </Text>
              <Text style={styles.totalPrice}>
                Tổng: {formatPrice(order.total_price)}
              </Text>
            </View>
            {/* Đã loại bỏ nút hủy đơn hàng như yêu cầu của marketplace source code */}
            {/* Nút tải file source code nếu đã thanh toán hoặc hoàn thành */}
            {order.items && order.items.length > 0 && (
              <View style={styles.downloadButtonsContainer}>
                {order.items.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.actionButton,
                      styles.downloadButton,
                      order.status !== "Completed" &&
                        order.status !== "Paid" &&
                        styles.disabledButton,
                    ]}
                    disabled={
                      order.status !== "Completed" && order.status !== "Paid"
                    }
                    onPress={async () => {
                      try {
                        // Lấy thông tin user hiện tại
                        const userData = await getCurrentUser();
                        if (!userData || !userData.id) {
                          throw new Error(
                            "Không tìm thấy thông tin người dùng"
                          );
                        }

                        // Đã có trong đơn hàng hoàn thành/đã thanh toán thì có quyền download
                        const downloadUrl = `/api/product/download/${item.product_id}?user_id=${userData.id}`;

                        Alert.alert(
                          "Tải source code",
                          "Bạn có muốn tải source code này về?",
                          [
                            {
                              text: "Hủy",
                              style: "cancel",
                            },
                            {
                              text: "Tải xuống",
                              onPress: async () => {
                                try {
                                  if (Platform.OS === "web") {
                                    // Trên web, mở tab mới để download
                                    if (typeof window !== "undefined") {
                                      window.open(downloadUrl, "_blank");
                                    }
                                  } else {
                                    // Trên mobile, sử dụng Linking
                                    const fullUrl = await downloadSourceCode(
                                      downloadUrl
                                    );
                                    Linking.openURL(fullUrl);
                                  }
                                  Alert.alert(
                                    "Thành công",
                                    "Đã bắt đầu tải source code!"
                                  );
                                } catch (err) {
                                  console.error("Lỗi khi tải:", err);
                                  Alert.alert(
                                    "Lỗi",
                                    "Không thể tải source code. Vui lòng thử lại sau."
                                  );
                                }
                              },
                            },
                          ]
                        );
                      } catch (error) {
                        console.error("Lỗi khi tải source code:", error);
                        Alert.alert(
                          "Lỗi",
                          "Không thể tải source code. Vui lòng thử lại sau."
                        );
                      }
                    }}
                  >
                    <Ionicons name="cloud-download" size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>
                      {"Tải "}
                      {item.name.length > 15
                        ? item.name.substring(0, 15) + "..."
                        : item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#D35400"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={60} color="#CCCCCC" />
            <Text style={styles.emptyText}>Không có đơn hàng nào</Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate("Home")}
            >
              <Text style={styles.browseButtonText}>Khám phá source code</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  // Header styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginLeft: 8,
  },
  // Filter styles
  filterContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#666666",
    marginBottom: 8,
  },
  statusTabsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  statusTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#EEEEEE",
    marginRight: 8,
    marginBottom: 8,
  },
  statusTabText: {
    fontSize: 14,
    color: "#555555",
  },
  activeStatusTabText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  // Error styles
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEAEA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#D32F2F",
    marginLeft: 8,
    flex: 1,
  },
  // Order card styles
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingBottom: 12,
    marginBottom: 12,
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
  },
  orderDateText: {
    fontSize: 13,
    color: "#888888",
    marginTop: 4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  // Product card styles
  productCard: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 8,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
  },
  productInfo: {
    marginLeft: 12,
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: "#D35400",
    fontWeight: "500",
    marginBottom: 2,
  },
  quantityText: {
    fontSize: 13,
    color: "#888888",
  },
  // Order footer styles
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  paymentMethod: {
    fontSize: 13,
    color: "#666666",
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#D35400",
  },
  // Action button styles
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  cancelButton: {
    backgroundColor: "#FF6347",
  },
  downloadButton: {
    backgroundColor: "#4CAF50",
    width: "100%",
    marginBottom: 5,
    marginHorizontal: 5,
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
    opacity: 0.6,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 6,
    fontSize: 14,
  },
  // Empty state styles
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#888888",
    marginTop: 16,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: "#D35400",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  downloadButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 5,
  },
});

export default OrderList;
