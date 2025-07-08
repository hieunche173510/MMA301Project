import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { getCurrentUser, addToCart, getImageUrl } from "../services/api";

const ProductDetail = ({ route, navigation }) => {
  const { product } = route.params;
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Chỉ lấy thông tin người dùng mà không kiểm tra quyền truy cập
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);

        // Lấy thông tin người dùng từ API tập trung
        const userResponse = await getCurrentUser();

        if (userResponse) {
          const currentUserId = userResponse.id;
          setUserId(currentUserId);

          // Không kiểm tra quyền truy cập ở đây nữa
          // Download sẽ chỉ hiển thị ở trang đơn hàng của người dùng
        }
      } catch (err) {
        console.error("Lỗi khi lấy thông tin người dùng:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Download chỉ hiển thị trong phần đơn hàng đã mua

  // Thêm vào giỏ hàng
  const handleAddToCart = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Lỗi", "Bạn chưa đăng nhập. Vui lòng đăng nhập trước!");
        navigation.navigate("Login");
        return;
      }

      if (!product) {
        throw new Error("Không tìm thấy thông tin sản phẩm!");
      }

      // Kiểm tra và lấy thông tin người dùng trước khi thêm vào giỏ hàng
      const userResponse = await getCurrentUser();
      if (!userResponse || (!userResponse._id && !userResponse.id)) {
        Alert.alert(
          "Lỗi",
          "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại!"
        );
        navigation.navigate("Login");
        return;
      }

      // Sử dụng API tập trung để thêm vào giỏ hàng
      const result = await addToCart(token, product._id, 1);

      if (result && result.success) {
        Alert.alert("Thành công", "Sản phẩm đã được thêm vào giỏ hàng!");
      } else {
        throw new Error("Không thể thêm vào giỏ hàng!");
      }
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      Alert.alert("Lỗi", error.message || "Có lỗi xảy ra, vui lòng thử lại!");
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Source Code</Text>
      </View>

      {/* Hình ảnh sản phẩm */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: getImageUrl(product.image) }}
          style={styles.productImage}
          onError={(error) => console.log("Image Load Error:", error)}
        />
      </View>

      {/* Chi tiết sản phẩm */}
      <View style={styles.detailsContainer}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.categoryText}>
          {product.category || "Source Code"}
        </Text>
        <Text style={styles.authorText}>
          Tác giả: {product.author || "Unknown Developer"}
        </Text>
        <Text style={styles.productDescription}>{product.description}</Text>

        {/* Giá sản phẩm */}
        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(product.price)}
          </Text>
        </View>

        {/* Chỉ hiển thị nút "Thêm vào giỏ hàng" */}
        {loading ? (
          <ActivityIndicator size="small" color="#163D2C" />
        ) : (
          <TouchableOpacity
            onPress={handleAddToCart}
            style={styles.addToCartButton}
          >
            <Ionicons
              name="cart-outline"
              size={20}
              color="white"
              style={styles.buttonIcon}
            />
            <Text style={styles.addToCartText}>Thêm vào giỏ hàng</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 16,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
    flex: 1,
    textAlign: "center",
    marginTop: 10,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  productImage: {
    width: 280,
    height: 280,
    resizeMode: "cover",
    borderRadius: 12,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 4,
  },
  authorText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 16,
    fontWeight: "500",
  },
  productDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444",
    marginBottom: 24,
  },
  priceContainer: {
    marginBottom: 24,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#163D2C",
  },
  downloadButton: {
    backgroundColor: "#2E8B57",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  downloadButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  addToCartButton: {
    backgroundColor: "#163D2C",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  addToCartText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default ProductDetail;
