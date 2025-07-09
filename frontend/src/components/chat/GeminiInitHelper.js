import React, { useEffect, useState } from "react";
import { View, Text, Modal, StyleSheet, TouchableOpacity } from "react-native";
import { initGeminiModel } from "../../services/ai/geminiService";
import { GEMINI_API_KEY } from "@env";

const GeminiInitHelper = () => {
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    checkGeminiSetup();
  }, []);

  const checkGeminiSetup = async () => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_gemini_api_key_here") {
      setErrorMessage(
        "Chưa cấu hình API Key của Gemini. Vui lòng kiểm tra file .env và thêm API key hợp lệ từ Google AI Studio."
      );
      setShowModal(true);
      return;
    }

    const initSuccess = await initGeminiModel();
    if (!initSuccess) {
      setErrorMessage(
        "Không thể khởi tạo Gemini AI. Vui lòng kiểm tra:\n\n1. API key hợp lệ\n2. Kết nối internet\n3. Quota API còn đủ\n\nNếu vẫn lỗi, hãy thử tạo API key mới từ Google AI Studio."
      );
      setShowModal(true);
    }
  };

  return (
    <Modal transparent visible={showModal} animationType="fade">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Cảnh báo AI Chat</Text>
          <Text style={styles.modalMessage}>{errorMessage}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowModal(false)}
          >
            <Text style={styles.closeButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "80%",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f44336",
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default GeminiInitHelper;
