import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  getCurrentUser,
  getCart,
  removeFromCart,
  getImageUrl,
  updateCartItem,
  getCartTotal,
} from "../services/api";

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const fetchUserAndCart = async () => {
        try {
          console.log("Đang lấy thông tin user...");

          // Sử dụng API tập trung để lấy thông tin người dùng
          const userData = await getCurrentUser();

          if (userData && userData.id) {
            console.log("Lấy user thành công:", userData);
            setUserId(userData.id);

            // Lấy dữ liệu giỏ hàng
            fetchCartData();
          } else {
            throw new Error("Không thể lấy thông tin người dùng!");
          }
        } catch (err) {
          console.error("Lỗi khi lấy user:", err.message);
          setError(err.message);
          setLoading(false);
        }
      };

      fetchUserAndCart();
    }, [])
  );

  const fetchCartData = async () => {
    try {
      setLoading(true);

      // Sử dụng API tập trung để lấy dữ liệu giỏ hàng
      const cartData = await getCart();

      if (cartData && cartData.success) {
        console.log("Giỏ hàng:", cartData.data);
        console.log(
          "Số sản phẩm trong giỏ hàng:",
          cartData.data.items ? cartData.data.items.length : 0
        );
        if (cartData.data.items && cartData.data.items.length > 0) {
          console.log("Sản phẩm đầu tiên:", cartData.data.items[0]);
        }
        setCart(cartData.data);
      } else {
        console.log("Không thể tải giỏ hàng, cartData:", cartData);

        // Thử tạo giỏ hàng mới nếu chưa có
        try {
          const { createCart } = require("../services/api");
          const newCartResult = await createCart();

          if (newCartResult && newCartResult.success) {
            console.log("Đã tạo giỏ hàng mới:", newCartResult.data);
            // Đặt giỏ hàng trống
            setCart({ items: [], total: 0 });
          } else {
            setError("Không thể tạo giỏ hàng mới");
          }
        } catch (createError) {
          console.error("Lỗi khi tạo giỏ hàng mới:", createError);
          setError("Không thể tải giỏ hàng");
        }
      }
    } catch (error) {
      console.error("Lỗi khi tải giỏ hàng:", error.message);
      setError("Không thể tải giỏ hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return; // Không cho phép số lượng nhỏ hơn 1

    try {
      const token = await AsyncStorage.getItem("token");

      // Sử dụng API tập trung để cập nhật số lượng sản phẩm trong giỏ hàng
      await updateCartItem(productId, newQuantity, token);

      // Cập nhật lại giỏ hàng sau khi thay đổi số lượng
      fetchCartData();
    } catch (error) {
      console.error("Lỗi khi cập nhật số lượng:", error);
    }
  };

  const confirmRemoveItem = (productId) => {
    setSelectedProductId(productId);
    setModalVisible(true);
  };

  const handleRemoveItem = async () => {
    if (!selectedProductId) return;

    try {
      setModalVisible(false);

      // Hiển thị indicator cho người dùng biết đang xử lý
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      console.log("Đang xóa sản phẩm với ID:", selectedProductId);

      // Sử dụng API tập trung để xóa sản phẩm khỏi giỏ hàng
      const result = await removeFromCart(token, selectedProductId);
      console.log("Kết quả xóa sản phẩm:", result);

      // Cập nhật lại giỏ hàng
      await fetchCartData();
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm:", error);
      Alert.alert("Lỗi", "Không thể xóa sản phẩm. Vui lòng thử lại sau.", [
        { text: "OK" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    navigation.navigate("Checkout");
  };

  // ✅ Tính tổng tiền của các sản phẩm đã chọn
  const totalAmount =
    cart?.items
      ?.filter((item) => item.selected && item.product_id?.price) // Chỉ lấy item đã chọn & có giá
      .reduce(
        (sum, item) =>
          sum + (item.product_id.price || 0) * (item.quantity || 0),
        0
      ) || 0;
  if (!loading && cart?.items?.length === 0) {
    return (
      <Text style={styles.emptyCartText}>Giỏ hàng của bạn đang trống.</Text>
    );
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
        <Text style={styles.headerSubtitle}>Source code của bạn</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2E8B57" style={styles.loader} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchCartData()}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : !cart || !cart.items || cart.items.length === 0 ? (
        <View style={styles.emptyCart}>
          <Ionicons name="cart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyCartText}>Giỏ hàng trống</Text>
          <TouchableOpacity
            style={styles.continueShopping}
            onPress={() => navigation.navigate("Trang chủ")}
          >
            <Text style={styles.continueShoppingText}>Tiếp tục mua sắm</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart.items}
            keyExtractor={(item, index) =>
              item.product_id?._id || `item-${index}`
            }
            renderItem={({ item }) => {
              console.log("Rendering cart item:", item);
              if (!item.product_id) {
                console.log("Warning: cart item is missing product_id", item);
                return null;
              }
              return (
                <View style={styles.cartItem}>
                  <Image
                    source={{
                      uri: getImageUrl(item.product_id.image),
                    }}
                    style={styles.productImage}
                  />

                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>
                      {item.product_id.name}
                    </Text>
                    <Text style={styles.productAuthor}>
                      {item.product_id.author || "Unknown Developer"}
                    </Text>
                    <Text style={styles.productPrice}>
                      {item.product_id.price.toLocaleString()} VNĐ
                    </Text>

                    <View style={styles.quantityContainer}>
                      <TouchableOpacity
                        onPress={() =>
                          handleQuantityChange(
                            item.product_id._id,
                            item.quantity - 1
                          )
                        }
                        style={styles.quantityButton}
                      >
                        <Text style={styles.quantityButtonText}>-</Text>
                      </TouchableOpacity>

                      <Text style={styles.quantityText}>{item.quantity}</Text>

                      <TouchableOpacity
                        onPress={() =>
                          handleQuantityChange(
                            item.product_id._id,
                            item.quantity + 1
                          )
                        }
                        style={styles.quantityButton}
                      >
                        <Text style={styles.quantityButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => confirmRemoveItem(item.product_id._id)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="trash-outline" size={24} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
              );
            }}
          />

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tổng tiền:</Text>
              <Text style={styles.summaryValue}>
                {cart.total ? cart.total.toLocaleString() : "0"} VNĐ
              </Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutButtonText}>
                Tiến hành thanh toán
              </Text>
            </TouchableOpacity>
          </View>

          {/* Xác nhận xóa sản phẩm */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text style={styles.modalTitle}>Xác nhận xóa sản phẩm</Text>
                <Text style={styles.modalText}>
                  Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?
                </Text>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Hủy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleRemoveItem}
                  >
                    <Text style={styles.confirmButtonText}>Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    backgroundColor: "#fff",
    padding: 16,
    paddingTop: 48,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E8B57",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    marginBottom: 15,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  emptyCart: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyCartText: {
    fontSize: 18,
    color: "#666",
    marginVertical: 15,
  },
  continueShopping: {
    backgroundColor: "#2E8B57",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 5,
    marginTop: 10,
  },
  continueShoppingText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cartItem: {
    backgroundColor: "#fff",
    borderRadius: 10,
    margin: 10,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  productAuthor: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  productPrice: {
    fontWeight: "bold",
    color: "#2E8B57",
    fontSize: 16,
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    backgroundColor: "#f0f0f0",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    paddingHorizontal: 15,
  },
  removeButton: {
    padding: 8,
  },
  summaryContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  summaryLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E8B57",
  },
  checkoutButton: {
    backgroundColor: "#2E8B57",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#f1f2f6",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "bold",
  },
  confirmButton: {
    backgroundColor: "#ff6b6b",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default Cart;
