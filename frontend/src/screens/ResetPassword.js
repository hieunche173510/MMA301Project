import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { resetPassword } from "../services/api";

export default function ResetPassword({ navigation, route }) {
  const { email } = route.params; // Nhận email từ màn OTP
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    } else if (!/(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      setError("Mật khẩu phải chứa chữ, số và ký tự đặc biệt!");
      return;
    } else if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp");
      return;
    }

    setError(""); // Xóa lỗi nếu hợp lệ
    setLoading(true);

    try {
      // Token có thể null vì quy trình đặt lại mật khẩu thông qua OTP đã xác thực người dùng
      const response = await resetPassword(email, password, null);

      if (response && response.success) {
        Alert.alert("Thành công", "Mật khẩu đã được đặt lại!");
        navigation.navigate("Login"); // Chuyển về trang Login
      } else {
        Alert.alert("Lỗi", response?.message || "Không thể đặt lại mật khẩu!");
      }
    } catch (error) {
      Alert.alert("Lỗi kết nối", "Không thể kết nối đến server!");
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

      <Text style={styles.title}>Đặt lại mật khẩu</Text>
      <Text style={styles.subText}>Nhập mật khẩu mới của bạn.</Text>

      <TextInput
        style={styles.input}
        placeholder="Mật khẩu mới"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Nhập lại mật khẩu"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={styles.button}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Xác nhận</Text>
        )}
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
    backgroundColor: "#FDF6EC",
    padding: 20,
    paddingTop: 40,
    alignItems: "center",
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#D86F45",
    textAlign: "center",
    marginBottom: 10,
  },
  subText: {
    fontSize: 14,
    color: "#8D6E63",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0AFA0",
    borderRadius: 10,
    backgroundColor: "#FFF",
    marginBottom: 10,
    fontSize: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  error: {
    color: "red",
    marginBottom: 10,
    fontSize: 14,
  },
  button: {
    width: "100%",
    backgroundColor: "#D86F45",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  bottomImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
    marginTop: 20,
  },
});
