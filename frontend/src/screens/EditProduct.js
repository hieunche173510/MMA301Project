import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Text,
} from "react-native";
import { Card, Title } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { getCategories, updateProduct, getImageUrl } from "../services/api";

const EditProduct = ({ route, navigation }) => {
  const { product } = route.params;
  const [productData, setProductData] = useState({
    name: product.name,
    price: String(product.price),
    description: product.description || "",
    stock: String(product.stock),
    author: product.author || "",
    category_id: product.category_id || "",
  });

  const [categories, setCategories] = useState([]);
  const [newImage, setNewImage] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [newSourceFile, setNewSourceFile] = useState(null);
  const [newSourceFileName, setNewSourceFileName] = useState("");

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await getCategories();
        if (result && result.data) {
          setCategories(result.data);
        } else {
          console.error("Unexpected category format:", result);
          setCategories([]);
          showToast("error", "Lỗi", "Định dạng danh mục không hợp lệ");
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
        setCategories([]);
        showToast("error", "Lỗi", "Không thể tải danh mục sản phẩm");
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (field, value) => {
    setProductData({ ...productData, [field]: value });
  };

  // Hiển thị Toast thông báo
  const showToast = (type, text1, text2) => {
    Toast.show({
      type,
      text1,
      text2,
      position: "top",
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 50,
    });
  };

  // Chọn ảnh preview mới
  const handleImageChange = (event) => {
    if (Platform.OS === "web") {
      const file = event.target.files[0];
      if (file) {
        if (file.type.startsWith("image/")) {
          setNewImage(file);
          setNewImagePreview(URL.createObjectURL(file));
        } else {
          showToast("error", "Lỗi", "Vui lòng chọn file ảnh (.jpg, .png)");
        }
      }
    }
  };

  // Chọn file source code mới
  const handleSourceFileChange = (event) => {
    if (Platform.OS === "web") {
      const file = event.target.files[0];
      if (file) {
        if (file.name.endsWith(".zip") || file.name.endsWith(".rar")) {
          setNewSourceFile(file);
          setNewSourceFileName(file.name);
        } else {
          showToast("error", "Lỗi", "Vui lòng chọn file .zip hoặc .rar");
        }
      }
    }
  };

  // Cập nhật sản phẩm
  const handleUpdate = async () => {
    if (!productData.name || !productData.price) {
      showToast("error", "Lỗi", "Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        showToast("error", "Lỗi", "Vui lòng đăng nhập lại!");
        return;
      }

      const formData = new FormData();
      formData.append("name", productData.name);
      formData.append("price", productData.price);
      formData.append("description", productData.description);
      formData.append("stock", productData.stock);
      formData.append("author", productData.author);

      if (productData.category_id) {
        formData.append("category_id", productData.category_id);
      }

      // Thêm ảnh mới nếu có
      if (newImage) {
        formData.append("image", newImage);
      }

      // Thêm file source code mới nếu có
      if (newSourceFile) {
        formData.append("file", newSourceFile);
      }

      // Sử dụng hàm API tập trung từ services/api.js
      const data = await updateProduct(product._id, formData, token);

      if (data && data.success) {
        showToast("success", "Thành công", "Source code đã được cập nhật!");
        setTimeout(() => {
          navigation.navigate("Dashboard");
        }, 1000);
      } else {
        showToast(
          "error",
          "Lỗi",
          data.message || "Có lỗi xảy ra khi cập nhật!"
        );
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      showToast("error", "Lỗi", "Lỗi kết nối server!");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Toast />

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Chỉnh Sửa Source Code</Title>

          {/* Hiển thị ảnh hiện tại */}
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: getImageUrl(product.image) }}
              style={styles.currentImage}
              onError={(e) => console.log("Error loading image", e)}
            />
            <Text style={styles.currentImageLabel}>Ảnh hiện tại</Text>
          </View>

          <TextInput
            placeholder="Tên source code"
            value={productData.name}
            onChangeText={(value) => handleChange("name", value)}
            style={styles.input}
          />

          <TextInput
            placeholder="Giá (VNĐ)"
            value={productData.price}
            onChangeText={(value) => handleChange("price", value)}
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            placeholder="Tác giả/Developer"
            value={productData.author}
            onChangeText={(value) => handleChange("author", value)}
            style={styles.input}
          />

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={productData.category_id}
              onValueChange={(value) => handleChange("category_id", value)}
              style={styles.picker}
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
          </View>

          <TextInput
            placeholder="Mô tả chi tiết source code"
            value={productData.description}
            onChangeText={(value) => handleChange("description", value)}
            multiline
            style={[styles.input, styles.textArea]}
          />

          <TextInput
            placeholder="Số lượng"
            value={productData.stock}
            onChangeText={(value) => handleChange("stock", value)}
            keyboardType="numeric"
            style={styles.input}
          />

          {/* Upload ảnh mới */}
          {Platform.OS === "web" && (
            <View style={styles.fileInputContainer}>
              <Text style={styles.fileInputLabel}>
                <Ionicons name="image-outline" size={18} color="#333" /> Thay
                đổi ảnh preview:
              </Text>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={styles.nativeFileInput}
              />
            </View>
          )}

          {/* Hiển thị ảnh mới đã chọn */}
          {newImagePreview && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: newImagePreview }} style={styles.image} />
              <Text style={styles.newImageLabel}>Ảnh mới</Text>
            </View>
          )}

          {/* Upload file source code mới */}
          {Platform.OS === "web" && (
            <View style={styles.fileInputContainer}>
              <Text style={styles.fileInputLabel}>
                <Ionicons name="code-slash-outline" size={18} color="#333" />{" "}
                Thay đổi file source code:
              </Text>
              <input
                type="file"
                accept=".zip,.rar"
                onChange={handleSourceFileChange}
                style={styles.nativeFileInput}
              />
              {newSourceFileName && (
                <Text style={styles.fileSelectedText}>{newSourceFileName}</Text>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
            <Text style={styles.updateButtonText}>Cập Nhật Source Code</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  card: {
    borderRadius: 10,
    backgroundColor: "#fff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2c3e50",
  },
  imagePreviewContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  currentImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 5,
  },
  currentImageLabel: {
    color: "#555",
    fontSize: 14,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 5,
  },
  newImageLabel: {
    color: "#2E8B57",
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: "#f9f9f9",
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  fileInputContainer: {
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  fileInputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
    fontWeight: "500",
  },
  nativeFileInput: {
    paddingVertical: 8,
  },
  fileSelectedText: {
    marginTop: 8,
    color: "#2E8B57",
    fontWeight: "500",
  },
  updateButton: {
    backgroundColor: "#2E8B57",
    paddingVertical: 14,
    borderRadius: 8,
    elevation: 3,
  },
  updateButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
  },
});

export default EditProduct;
