import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getHomeData, searchProducts, getImageUrl } from "../services/api";

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const navigation = useNavigation();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterProducts(searchText, selectedCategory);
  }, [searchText, selectedCategory, products]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getHomeData();

      // Đảm bảo luôn nhận được mảng, ngay cả khi API trả về undefined
      const categoriesData = Array.isArray(result.categories)
        ? result.categories
        : [];
      const productsData = Array.isArray(result.products)
        ? result.products
        : [];

      console.log("Categories from API:", categoriesData);
      console.log("Products from API:", productsData);

      // Thêm category "All" vào đầu danh sách và đảm bảo mỗi category đều có _id và name
      const validCategories = categoriesData
        .filter((cat) => cat && (cat._id || cat.id)) // Lọc bỏ các category không hợp lệ
        .map((cat) => ({
          _id: cat._id || cat.id, // Đảm bảo luôn có _id
          name: cat.name || "Danh mục", // Đảm bảo luôn có name
        }));

      // Thêm danh mục "All"
      setCategories([{ _id: "all", name: "All" }, ...validCategories]);
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = (categoryId) => {
    console.log("Selected Category:", categoryId);
    setSelectedCategory(categoryId);
  };

  const filterProducts = (search, category) => {
    console.log("Filtering products with:", { search, category });
    console.log("All Products Before Filtering:", products);

    let filtered = products;

    if (category !== "all") {
      filtered = filtered.filter((product) => {
        console.log(
          `Checking Product: ${product.name}, Category_ID:`,
          product.category_id
        );
        return product.category_id === category;
      });
    }

    if (search) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    console.log("Filtered Products:", filtered);
    setFilteredProducts(filtered);
  };

  // Render mỗi sản phẩm source code
  const renderProductItem = ({ item }) => {
    // Sử dụng cách đơn giản hơn để xử lý ảnh
    let imageSource;
    try {
      imageSource = item.image
        ? { uri: getImageUrl(item.image) }
        : require("../../assets/images/logo.png");
    } catch (error) {
      console.log("Lỗi xử lý ảnh:", error);
      imageSource = require("../../assets/images/logo.png");
    }

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate("ProductDetail", { product: item })}
      >
        <View style={styles.imageContainer}>
          <Image source={imageSource} style={styles.productImage} />
          {item && item.file ? (
            <View style={styles.fileIndicator}>
              <Ionicons name="code-slash-outline" size={14} color="#fff" />
            </View>
          ) : null}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name || "Sản phẩm không tên"}
          </Text>
          <Text style={styles.authorName} numberOfLines={1}>
            {item.author || "Unknown Developer"}
          </Text>
          <Text style={styles.productPrice}>
            {(item.price || 0).toLocaleString("vi-VN")} VNĐ
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Code Marketplace</Text>
        <Text style={styles.headerSubtitle}>
          Source code chất lượng cho dự án của bạn
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          placeholder="Tìm kiếm source code"
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
        {searchText ? (
          <TouchableOpacity
            style={styles.clearIcon}
            onPress={() => {
              setSearchText("");
              Keyboard.dismiss();
            }}
          >
            <Icon name="x" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContainer}
      >
        {Array.isArray(categories) &&
          categories.map((category) => (
            <TouchableOpacity
              key={category?._id || `category-${Math.random()}`}
              style={[
                styles.categoryButton,
                selectedCategory === category?._id &&
                  styles.selectedCategoryButton,
              ]}
              onPress={() => handleCategoryFilter(category?._id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category?._id &&
                    styles.selectedCategoryText,
                ]}
              >
                {category?.name || "Danh mục"}
              </Text>
            </TouchableOpacity>
          ))}
      </ScrollView>

      {/* Product List */}
      {loading ? (
        <ActivityIndicator size="large" color="#2E8B57" style={styles.loader} />
      ) : (
        <FlatList
          data={Array.isArray(filteredProducts) ? filteredProducts : []}
          keyExtractor={(item) => item?._id || `product-${Math.random()}`}
          renderItem={renderProductItem}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.productListContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="code-slash" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Không tìm thấy source code</Text>
            </View>
          }
        />
      )}

      {/* Floating Chat Button */}
      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => navigation.navigate("Chat")}
      >
        <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    padding: 15,
  },
  header: {
    textAlign: "center",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E8B57",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#555",
    marginTop: 5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEE",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearIcon: {
    marginLeft: 10,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 15,
  },
  categoryButton: {
    backgroundColor: "#3498db",
    marginRight: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
  },
  selectedCategoryButton: {
    backgroundColor: "#2E8B57",
  },
  categoryText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
  selectedCategoryText: {
    fontWeight: "bold",
  },
  productListContainer: {
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 10,
    margin: 6,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: "relative",
    alignItems: "center",
    marginBottom: 10,
  },
  productImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    resizeMode: "cover",
  },
  fileIndicator: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#2E8B57",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    padding: 5,
  },
  productName: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
    color: "#333",
  },
  authorName: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  productPrice: {
    fontWeight: "bold",
    color: "#2E8B57",
    fontSize: 16,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyText: {
    color: "#999",
    fontSize: 16,
    marginTop: 10,
  },
  chatButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#2196F3",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default Home;
