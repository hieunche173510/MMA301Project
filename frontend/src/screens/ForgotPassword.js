import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { forgotPassword } from "../services/api";

export default function ForgotPassword({ navigation }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    setError(""); // Reset lỗi trước khi gọi API

    if (!email.includes("@") || !email.includes(".")) {
      setError("Email không hợp lệ");
      return;
    }

    try {
      setLoading(true);
      const response = await forgotPassword(email);

      if (response && response.success) {
        Alert.alert("Thành công", "OTP đã gửi, kiểm tra email!");
        navigation.navigate("OTP", { email });
      } else {
        setError(response?.message || "Có lỗi xảy ra khi gửi OTP");
      }
    } catch (error) {
      console.error("Lỗi kết nối:", error);
      setError("Lỗi mạng hoặc server không phản hồi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/logo.png")}
        style={styles.logo}
      />

      <Text style={styles.title}>Quên mật khẩu?</Text>
      <Text style={styles.subtitle}>
        Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nhập email của bạn"
        placeholderTextColor="#666"
        keyboardType="email-address"
        onChangeText={(text) => setEmail(text)}
        value={email}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={styles.button}
        onPress={handleResetPassword}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Đang gửi..." : "Gửi mã OTP"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>← Quay lại đăng nhập</Text>
      </TouchableOpacity>
      <Image
        source={require("../../assets/images/book-login.jpg")}
        style={styles.bottomImage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F9EDE6", // Màu nền giống Login
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#A65B3C",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#D17842", // Màu giống nút "Đăng nhập"
    paddingVertical: 14,
    width: "100%",
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    color: "#D17842",
    fontSize: 16,
  },
  error: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
  },
  bottomImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
    marginTop: 10, // Để nó không đè lên nội dung
  },
});
