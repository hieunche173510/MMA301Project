import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Button,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import {
  getProducts,
  getCategories,
  addProduct as createProduct,
  getImageUrl,
} from "../services/api";
import { launchImageLibrary } from "react-native-image-picker";

const ListProduct = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // State to store categories
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedProducts, setPaginatedProducts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal visibility
  const [newProduct, setNewProduct] = useState({
    name: "",
    category_id: "", // Selected category ID
    price: "",
    description: "",
    author: "",
    stock: "",
    image: null,
    file: null, // Thêm state cho file source code
  });
  const [sourceFileName, setSourceFileName] = useState(""); // State lưu tên file source code
  const productsPerPage = 9;

  useEffect(() => {
    fetchProducts();
    fetchCategories(); // Fetch categories on component mount
  }, []);

  useEffect(() => {
    const totalPages = Math.ceil(products.length / productsPerPage);
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const newPaginatedProducts = products.slice(startIndex, endIndex);
    setPaginatedProducts(newPaginatedProducts);
  }, [currentPage, products]);

  const fetchProducts = async () => {
    try {
      const productsData = await getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesData = await getCategories();
      // Extract the actual array from the response
      if (categoriesData && categoriesData.data) {
        setCategories(categoriesData.data);
      } else {
        console.error("Unexpected categories data format:", categoriesData);
        setCategories([]); // Default to empty array to avoid map errors
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]); // Default to empty array to avoid map errors
    }
  };
  const handleImagePick = () => {
    console.log("Gọi trình chọn ảnh");

    // Web-specific file picker
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        console.log("Ảnh đã chọn:", file);
        // Store the file object directly instead of converting to Base64 here
        setNewProduct({
          ...newProduct,
          image: file, // Store the File object
        });
      }
    };

    input.click();
  };

  const handleSourceFilePick = () => {
    console.log("Gọi trình chọn file source code");

    // Web-specific file picker
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".zip,.rar";

    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        console.log("File source code đã chọn:", file);
        // Kiểm tra định dạng file (.zip, .rar)
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith(".zip") || fileName.endsWith(".rar")) {
          setNewProduct({
            ...newProduct,
            file: file, // Store the File object
          });
          setSourceFileName(file.name);
        } else {
          alert("Vui lòng chọn file .zip hoặc .rar");
        }
      }
    };

    input.click();
  };

  const handleAddProduct = async () => {
    console.log("Gọi hàm handleAddProduct");
    const formData = new FormData();

    // Append product fields from state
    formData.append("name", newProduct.name);
    formData.append("category_id", newProduct.category_id);
    formData.append("price", newProduct.price);
    formData.append("description", newProduct.description);
    formData.append("author", newProduct.author);
    formData.append("stock", newProduct.stock);

    if (newProduct.image) {
      // For web, image is a File object
      formData.append(
        "image",
        newProduct.image,
        newProduct.image.name || `product_image_${Date.now()}.jpg`
      );
      console.log("Ảnh đã được thêm vào formData:", newProduct.image);
    } else {
      console.log("Chưa chọn ảnh sản phẩm!");
      alert("Vui lòng chọn ảnh sản phẩm!");
      return;
    }

    if (newProduct.file) {
      // Thêm file source code vào FormData
      formData.append("file", newProduct.file, newProduct.file.name);
      console.log(
        "File source code đã được thêm vào formData:",
        newProduct.file
      );
    } else {
      console.log("Chưa chọn file source code!");
      alert("Vui lòng chọn file source code (.zip/.rar)!");
      return;
    }

    try {
      console.log("Đang gửi yêu cầu POST lên server...");
      const response = await createProduct(formData);

      console.log("Phản hồi từ server:", response);
      // Kiểm tra xem phản hồi có success hay không
      if (response && response.success) {
        alert(response.message || "Source code đã thêm thành công!");
        setIsModalVisible(false);
        fetchProducts();
      } else {
        // Nếu có phản hồi nhưng không có success flag
        console.warn("Phản hồi không như mong đợi:", response);
        alert(response.message || "Có lỗi xảy ra khi tạo sản phẩm");
      }
    } catch (error) {
      console.error(
        "Lỗi khi tạo sản phẩm:",
        error.response ? error.response.data : error
      );
      alert(error.response?.data?.message || "Lỗi khi tạo sản phẩm");
    }
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity style={styles.productCard}>
      <Image
        source={{ uri: getImageUrl(item.image) }}
        style={styles.productImage}
        onError={() => console.log("🚨 Lỗi ảnh:", getImageUrl(item.image))}
      />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>{item.price}vnđ</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.productContainer}>
      <View style={styles.titleContainer}>
        <Text style={styles.sectionTitle}>Source Code</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.addButtonText}>Thêm Source Code</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={paginatedProducts}
        keyExtractor={(item) => item._id.toString()}
        renderItem={renderProductItem}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không có sản phẩm nào.</Text>
        }
        contentContainerStyle={styles.flatListContent}
      />

      {products.length > 0 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={styles.paginationButton}
            onPress={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <Text style={styles.paginationText}>Previous</Text>
          </TouchableOpacity>
          <Text style={styles.pageInfo}>
            Page {currentPage} of {Math.ceil(products.length / productsPerPage)}
          </Text>
          <TouchableOpacity
            style={styles.paginationButton}
            onPress={() => setCurrentPage(currentPage + 1)}
            disabled={
              currentPage === Math.ceil(products.length / productsPerPage)
            }
          >
            <Text style={styles.paginationText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal for adding a product */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm Source Code Mới</Text>

            <TextInput
              style={styles.input}
              placeholder="Tên source code"
              value={newProduct.name}
              onChangeText={(text) =>
                setNewProduct({ ...newProduct, name: text })
              }
            />

            <Picker
              selectedValue={newProduct.category_id}
              style={styles.input}
              onValueChange={(itemValue) =>
                setNewProduct({ ...newProduct, category_id: itemValue })
              }
            >
              <Picker.Item label="Chọn loại source code" value="" />
              {categories && Array.isArray(categories)
                ? categories.map((category) => (
                    <Picker.Item
                      key={category._id}
                      label={category.name}
                      value={category._id}
                    />
                  ))
                : null}
            </Picker>
            <TextInput
              style={styles.input}
              placeholder="Giá (VND)"
              keyboardType="numeric"
              value={newProduct.price}
              onChangeText={(text) =>
                setNewProduct({ ...newProduct, price: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Mô tả chi tiết source code"
              value={newProduct.description}
              onChangeText={(text) =>
                setNewProduct({ ...newProduct, description: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Tác giả/Developer"
              value={newProduct.author}
              onChangeText={(text) =>
                setNewProduct({ ...newProduct, author: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Số lượng (mặc định: 10)"
              keyboardType="numeric"
              value={newProduct.stock}
              onChangeText={(text) =>
                setNewProduct({ ...newProduct, stock: text })
              }
            />

            <TouchableOpacity
              onPress={handleImagePick}
              style={styles.imageButton}
            >
              <Text style={styles.imageButtonText}>Chọn ảnh preview</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSourceFilePick}
              style={styles.fileButton}
            >
              <Text style={styles.fileButtonText}>
                Chọn file source code (.zip/.rar)
              </Text>
            </TouchableOpacity>

            {newProduct.image && (
              <Text style={styles.imagePreviewText}>
                Ảnh đã chọn: {newProduct.image.name || "Unnamed"}
              </Text>
            )}
            {sourceFileName !== "" && (
              <Text style={styles.filePreviewText}>
                File source đã chọn: {sourceFileName}
              </Text>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddProduct}
              >
                <Text style={styles.submitButtonText}>Thêm Source Code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  productContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#40C4FF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  flatListContent: {
    paddingBottom: 40,
  },
  productCard: {
    flex: 1,
    margin: 4,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    resizeMode: "cover",
    borderRadius: 6,
  },
  productName: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  productPrice: {
    marginTop: 2,
    fontSize: 10,
    color: "#666",
    textAlign: "center",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  paginationButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
  },
  paginationText: {
    color: "#333",
    fontSize: 12,
    fontWeight: "bold",
  },
  pageInfo: {
    fontSize: 12,
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 8,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  imageButton: {
    marginTop: 10,
    backgroundColor: "#40C4FF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  imageButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  fileButton: {
    marginTop: 10,
    backgroundColor: "#66BB6A",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  fileButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  imagePreviewText: {
    fontSize: 14,
    color: "#333",
    marginTop: 6,
  },
  filePreviewText: {
    fontSize: 14,
    color: "#2E8B57", // Màu xanh lá đậm cho text hiển thị tên file
    marginTop: 6,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: "#2E8B57",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    marginLeft: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
});
export default ListProduct;
