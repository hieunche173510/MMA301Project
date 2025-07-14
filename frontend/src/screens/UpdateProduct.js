import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateProduct } from "../services/api";

const UpdateProduct = ({ visible, onClose, product, onUpdate }) => {
  const [name] = useState(product?.name || ""); // Prevent editing the name
  const [price, setPrice] = useState(product?.price.toString() || "");
  const [stock, setStock] = useState(product?.stock.toString() || "");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!price || !stock) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Lỗi", "Bạn cần đăng nhập lại để thực hiện thao tác này");
        return;
      }

      const updatedData = {
        name, // Keep the product name unchanged
        price: parseFloat(price),
        stock: parseInt(stock, 10),
      };

      const response = await updateProduct(product._id, updatedData, token);

      Alert.alert("Thành công", "Cập nhật sản phẩm thành công!");
      onUpdate(response.product);
      onClose();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật sản phẩm");
      console.error("Lỗi cập nhật sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Cập nhật sản phẩm</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.productName}>{name}</Text>
          </View>

          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="Giá"
            keyboardType="numeric"
            placeholderTextColor="#888"
          />
          <TextInput
            style={styles.input}
            value={stock}
            onChangeText={setStock}
            placeholder="Số lượng"
            keyboardType="numeric"
            placeholderTextColor="#888"
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdate}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Đang cập nhật..." : "Cập nhật"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.buttonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: 300,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 8,
    borderRadius: 8,
    fontSize: 14,
    color: "#333",
  },
  productName: {
    width: "100%",
    padding: 10,
    marginVertical: 8,
    backgroundColor: "#f4f4f4",
    borderRadius: 8,
    fontSize: 14,
    color: "#333",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    width: "100%",
  },
  updateButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#40C4FF",
    marginRight: 8,
    alignItems: "center",
  },
  closeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#FF4D4F",
    marginLeft: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  inputContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f4f4f4",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default UpdateProduct;
