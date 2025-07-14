import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Card, Title } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { getCategories, addCategory, addProduct } from "../services/api";

const AddProduct = ({ navigation }) => {
  const [productData, setProductData] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    author: "",
    stock: "",
  });

  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sourceFile, setSourceFile] = useState(null);
  const [sourceFileName, setSourceFileName] = useState("");
  const [loading, setLoading] = useState(false);

  // Lấy danh sách danh mục từ API
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const result = await getCategories();
      if (Array.isArray(result.data)) {
        setCategories(result.data);
      } else {
        setCategories([]);
        showToast("error", "Lỗi", "Không thể tải danh mục sản phẩm");
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh mục:", error);
      setCategories([]);
      showToast("error", "Lỗi", "Không thể tải danh mục sản phẩm");
    } finally {
      setLoading(false);
    }
  };

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

  // Chọn ảnh preview
  const handleImageChange = async (event) => {
    if (Platform.OS === "web") {
      const file = event.target.files[0];
      if (file) {
        if (file.type.startsWith("image/")) {
          console.log("Ảnh web đã chọn:", file);
          setImage(file);
          setImagePreview(URL.createObjectURL(file));
        } else {
          showToast("error", "Lỗi", "Vui lòng chọn file ảnh (.jpg, .png)");
        }
      }
    } else {
      // Mobile implementation
      try {
        const { launchImageLibraryAsync, MediaTypeOptions } = await import(
          "expo-image-picker"
        );

        // Xin quyền truy cập thư viện ảnh
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== "granted") {
          showToast(
            "error",
            "Lỗi",
            "Cần quyền truy cập thư viện ảnh để tiếp tục!"
          );
          return;
        }

        const result = await launchImageLibraryAsync({
          mediaTypes: MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        console.log("Image picker result:", result);

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const selectedAsset = result.assets[0];
          console.log("Ảnh đã chọn:", selectedAsset);

          // Tạo filename ngẫu nhiên để tránh trùng lặp
          const fileExt = selectedAsset.uri.split(".").pop();
          const fileName = `product_image_${Date.now()}.${fileExt}`;

          // Tạo file object tương thích với FormData
          const imageFile = {
            uri: selectedAsset.uri,
            type: selectedAsset.mimeType || "image/jpeg",
            name: fileName,
          };

          console.log("Image file được tạo:", imageFile);
          setImage(imageFile);
          setImagePreview(selectedAsset.uri);
        }
      } catch (error) {
        console.error("Lỗi khi chọn ảnh:", error);
        showToast("error", "Lỗi", "Không thể chọn ảnh sản phẩm");
      }
    }
  };

  // Chọn file source code
  const handleSourceFileChange = async (event) => {
    if (Platform.OS === "web") {
      const file = event.target.files[0];
      console.log("File source code được chọn:", file);
      if (file) {
        // Kiểm tra định dạng file (.zip, .rar)
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith(".zip") || fileName.endsWith(".rar")) {
          setSourceFile(file);
          setSourceFileName(file.name);
          console.log("File source code đã được set:", file.name);
        } else {
          showToast("error", "Lỗi", "Vui lòng chọn file .zip hoặc .rar");
        }
      }
    } else {
      // Mobile implementation
      try {
        const { DocumentPicker } = await import("expo-document-picker");

        // Sử dụng phương thức cập nhật hơn cho expo-document-picker
        const result = await DocumentPicker.getDocumentAsync({
          type: [
            "application/zip",
            "application/x-zip-compressed",
            "application/x-rar-compressed",
            "application/octet-stream",
          ],
          copyToCacheDirectory: true,
          multiple: false,
        });

        console.log("Document picker result:", result);

        // Xử lý kết quả theo phiên bản mới của DocumentPicker
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const selectedFile = result.assets[0];
          console.log("File source code đã chọn:", selectedFile);

          // Kiểm tra định dạng file
          const fileName = selectedFile.name.toLowerCase();
          if (fileName.endsWith(".zip") || fileName.endsWith(".rar")) {
            const sourceFileObj = {
              uri: selectedFile.uri,
              type: selectedFile.mimeType || "application/octet-stream",
              name: selectedFile.name,
            };
            console.log("Chuẩn bị lưu source file:", sourceFileObj);
            setSourceFile(sourceFileObj);
            setSourceFileName(selectedFile.name);
          } else {
            showToast("error", "Lỗi", "Vui lòng chọn file .zip hoặc .rar");
          }
        } else if (result.type === "success") {
          // Hỗ trợ ngược với phiên bản cũ của DocumentPicker
          console.log("File source code đã chọn (phiên bản cũ):", result);

          // Kiểm tra định dạng file
          const fileName = result.name.toLowerCase();
          if (fileName.endsWith(".zip") || fileName.endsWith(".rar")) {
            setSourceFile({
              uri: result.uri,
              type: result.mimeType || "application/octet-stream",
              name: result.name,
            });
            setSourceFileName(result.name);
          } else {
            showToast("error", "Lỗi", "Vui lòng chọn file .zip hoặc .rar");
          }
        }
      } catch (error) {
        console.error("Lỗi khi chọn file source code:", error);
        showToast("error", "Lỗi", "Không thể chọn file source code");
      }
    }
  };

  // Thêm danh mục mới
  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      showToast("error", "Lỗi", "Vui lòng nhập tên danh mục!");
      return;
    }

    try {
      setLoading(true);
      const result = await addCategory(newCategory);

      if (result.data) {
        setCategories([...categories, result.data]);
        setNewCategory("");
        showToast("success", "Thành công", "Thêm danh mục thành công!");
      } else {
        showToast(
          "error",
          "Lỗi",
          result.message || "Có lỗi xảy ra khi thêm danh mục!"
        );
      }
    } catch (error) {
      console.error("Lỗi khi thêm danh mục:", error);
      showToast("error", "Lỗi", "Lỗi kết nối server!");
    } finally {
      setLoading(false);
    }
  };

  // Thêm sản phẩm
  const handleSubmit = async (e) => {
    if (Platform.OS === "web" && e && e.preventDefault) {
      e.preventDefault();
    }

    // Kiểm tra các trường bắt buộc
    if (
      !productData.name ||
      !productData.price ||
      !productData.category ||
      !productData.description ||
      !productData.author
    ) {
      showToast("error", "Lỗi", "Vui lòng điền đầy đủ thông tin sản phẩm!");
      return;
    }

    if (!image) {
      showToast("error", "Lỗi", "Vui lòng chọn ảnh preview!");
      return;
    }

    if (!sourceFile) {
      showToast(
        "error",
        "Lỗi",
        "Vui lòng upload file source code (.zip/.rar)!"
      );
      return;
    }

    try {
      const formData = new FormData();

      // Chuyển đổi sang string để đảm bảo được gửi đúng định dạng
      formData.append("name", String(productData.name));
      formData.append("price", String(productData.price));
      formData.append("category_id", String(productData.category));
      formData.append("description", String(productData.description));
      formData.append("author", String(productData.author));
      formData.append("stock", String(productData.stock || "10"));

      console.log("Dữ liệu trước khi thêm vào FormData:", {
        name: productData.name,
        price: productData.price,
        category_id: productData.category,
        description: productData.description,
        author: productData.author,
        stock: productData.stock || 10,
      });

      // Thêm file ảnh và source code vào FormData
      if (Platform.OS === "web") {
        console.log("Đang thêm file vào FormData (Web):", {
          image: image ? image.name : "không có",
          sourceFile: sourceFile ? sourceFile.name : "không có",
        });
        formData.append("image", image);
        formData.append("file", sourceFile);
      } else {
        console.log("Đang thêm file vào FormData (Mobile):", {
          image: image ? image.name : "không có",
          sourceFile: sourceFile ? sourceFile.name : "không có",
        });

        // Đảm bảo file được thêm đúng định dạng trên mobile
        if (image && image.uri) {
          const imageName = image.uri.split("/").pop();
          const imageType = image.type || "image/jpeg";
          formData.append("image", {
            uri: image.uri,
            type: imageType,
            name: image.name || imageName,
          });
        }

        if (sourceFile && sourceFile.uri) {
          const fileName = sourceFile.uri.split("/").pop();
          const fileType = sourceFile.type || "application/octet-stream";
          formData.append("file", {
            uri: sourceFile.uri,
            type: fileType,
            name: sourceFile.name || fileName,
          });
        }
      }

      // Log FormData để kiểm tra
      console.log("FormData đã được tạo thành công");

      setLoading(true);
      const result = await addProduct(formData);

      console.log("Kết quả trả về từ API:", result);

      if (result && result.success) {
        showToast(
          "success",
          "Thành công",
          "Source code đã được thêm thành công!"
        );
        // Reset form
        setProductData({
          name: "",
          price: "",
          category: "",
          description: "",
          author: "",
          stock: "",
        });
        setImage(null);
        setImagePreview(null);
        setSourceFile(null);
        setSourceFileName("");

        // Chuyển hướng sau khi thêm thành công
        setTimeout(() => {
          navigation.navigate("Dashboard");
        }, 1000);
      } else {
        console.error("Lỗi không xác định:", result);
        showToast(
          "error",
          "Lỗi",
          result?.message || "Có lỗi xảy ra khi thêm sản phẩm!"
        );
      }
    } catch (error) {
      console.error("Lỗi gửi request:", error);
      let errorMessage = "Lỗi kết nối server!";
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showToast("error", "Lỗi", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Toast />

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Thêm Source Code Mới</Title>

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
              selectedValue={productData.category}
              onValueChange={(value) => handleChange("category", value)}
              style={styles.picker}
              enabled={!loading}
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

          <View style={styles.addCategoryContainer}>
            <TextInput
              placeholder="Thêm danh mục mới"
              value={newCategory}
              onChangeText={setNewCategory}
              style={[styles.input, styles.categoryInput]}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={handleAddCategory}
              style={[
                styles.addCategoryButton,
                loading && styles.disabledButton,
              ]}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Đang xử lý..." : "Thêm"}
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Mô tả chi tiết source code"
            value={productData.description}
            onChangeText={(value) => handleChange("description", value)}
            multiline
            style={[styles.input, styles.textArea]}
          />

          <TextInput
            placeholder="Số lượng (mặc định: 10)"
            value={productData.stock}
            onChangeText={(value) => handleChange("stock", value)}
            keyboardType="numeric"
            style={styles.input}
          />

          {/* File input cho Web - Upload ảnh preview */}
          {Platform.OS === "web" ? (
            <View style={styles.fileInputContainer}>
              <Text style={styles.fileInputLabel}>
                <Ionicons name="image-outline" size={18} color="#333" /> Ảnh
                preview:
              </Text>
              <View style={styles.webFileInputWrapper}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={styles.nativeFileInput}
                  disabled={loading}
                  id="imageFileInput"
                />
                <label
                  htmlFor="imageFileInput"
                  style={{
                    ...styles.webFileInputLabel,
                    backgroundColor: "#3498db",
                  }}
                >
                  Chọn ảnh preview
                </label>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.mobileFileButton}
              onPress={handleImageChange}
              disabled={loading}
            >
              <Ionicons name="image-outline" size={20} color="#fff" />
              <Text style={styles.mobileFileButtonText}>Chọn ảnh preview</Text>
            </TouchableOpacity>
          )}

          {/* Hiển thị ảnh đã chọn */}
          {imagePreview && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imagePreview }} style={styles.image} />
            </View>
          )}

          {/* File input cho Web - Upload source code */}
          {Platform.OS === "web" ? (
            <View style={styles.fileInputContainer}>
              <Text style={styles.fileInputLabel}>
                <Ionicons name="code-slash-outline" size={18} color="#333" />{" "}
                File source code (.zip/.rar):
              </Text>
              <View style={styles.webFileInputWrapper}>
                <input
                  type="file"
                  accept=".zip,.rar"
                  onChange={handleSourceFileChange}
                  style={styles.nativeFileInput}
                  disabled={loading}
                  id="sourceFileInput"
                />
                <label
                  htmlFor="sourceFileInput"
                  style={styles.webFileInputLabel}
                >
                  Chọn file source code
                </label>
              </View>
              {sourceFileName && (
                <View style={styles.webFileSelectedContainer}>
                  <Ionicons name="document" size={16} color="#4CAF50" />
                  <Text style={styles.fileSelectedText}>{sourceFileName}</Text>
                  <TouchableOpacity
                    style={styles.removeFileButton}
                    onPress={() => {
                      setSourceFile(null);
                      setSourceFileName("");
                      // Reset input
                      const input = document.getElementById("sourceFileInput");
                      if (input) input.value = "";
                    }}
                  >
                    <Ionicons name="close-circle" size={16} color="#FF5252" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.mobileFileButton, { backgroundColor: "#4CAF50" }]}
              onPress={handleSourceFileChange}
              disabled={loading}
            >
              <Ionicons name="code-slash-outline" size={20} color="#fff" />
              <Text style={styles.mobileFileButtonText}>
                Chọn file source code (.zip/.rar)
              </Text>
            </TouchableOpacity>
          )}

          {/* Hiển thị tên file source code đã chọn trên mobile */}
          {Platform.OS !== "web" && sourceFileName && (
            <View style={styles.fileInfoContainer}>
              <Ionicons name="document-attach" size={16} color="#4CAF50" />
              <Text style={styles.fileSelectedText}>{sourceFileName}</Text>
              <TouchableOpacity
                style={styles.removeFileButton}
                onPress={() => {
                  setSourceFile(null);
                  setSourceFileName("");
                }}
              >
                <Ionicons name="close-circle" size={16} color="#FF5252" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.submitButton, loading && styles.disabledButton]}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? "Đang xử lý..." : "Thêm Source Code"}
            </Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
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
  addCategoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryInput: {
    flex: 1,
    marginRight: 12,
    marginBottom: 0,
  },
  addCategoryButton: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: "#95a5a6",
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
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
    flexDirection: "row",
    alignItems: "center",
  },
  nativeFileInput: {
    paddingVertical: 8,
    opacity: 0,
    position: "absolute",
    zIndex: 1,
    width: "100%",
    height: "100%",
    cursor: "pointer",
  },
  webFileInputWrapper: {
    position: "relative",
    height: 40,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    marginBottom: 8,
  },
  webFileInputLabel: {
    display: "inline-block",
    backgroundColor: "#4CAF50",
    color: "#fff",
    padding: "10px 15px",
    borderRadius: 5,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "500",
  },
  webFileSelectedContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    padding: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  fileSelectedText: {
    marginLeft: 8,
    color: "#2E8B57",
    fontWeight: "500",
    flex: 1,
  },
  imagePreviewContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 8,
    resizeMode: "cover",
  },
  submitButton: {
    backgroundColor: "#2E8B57",
    paddingVertical: 14,
    borderRadius: 8,
    elevation: 3,
    marginTop: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
  },
  mobileFileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  mobileFileButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  fileInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    padding: 10,
    borderRadius: 6,
    marginVertical: 5,
  },
  removeFileButton: {
    marginLeft: "auto",
    padding: 5,
  },
});

export default AddProduct;
