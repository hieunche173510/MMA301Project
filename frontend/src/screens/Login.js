import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser } from "../services/api";
import { API_BASE_URL } from "../services/api";

const Login = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // const handleLogin = async () => {
  //   if (!email.trim() || !password.trim()) {
  //     setErrorMessage("Vui lòng nhập email và mật khẩu!");
  //     return;
  //   }

  //   try {
  //     const response = await fetch("http://localhost:9999/api/auth/login", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ email, password }),
  //     });
  //     const data = await response.json();

  //     if (response.ok) {
  //       setErrorMessage("");
  //       await AsyncStorage.setItem("token", data.token);
  //       await AsyncStorage.setItem("role", data.role);
  //       navigation.navigate(data.role === "Admin" ? "Admin" : "Home");
  //     } else {
  //       setErrorMessage(data.message || "Đăng nhập thất bại!");
  //     }
  //   } catch (error) {
  //     setErrorMessage("Không thể kết nối đến máy chủ!");
  //   }
  // };
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Vui lòng nhập email và mật khẩu!");
      return;
    }

    try {
      console.log("Đang gửi yêu cầu đăng nhập với email:", email);
      console.log("API_BASE_URL:", API_BASE_URL);

      const result = await loginUser(email, password);
      console.log("Kết quả đăng nhập:", result);

      const { token, role } = result;

      // Lưu thông tin vào AsyncStorage
      await AsyncStorage.multiSet([
        ["token", token],
        ["role", role],
        ["lastRoute", role === "Admin" ? "Admin" : "Home"],
      ]);

      console.log(
        "Đã lưu thông tin đăng nhập, chuyển hướng đến:",
        role === "Admin" ? "Admin" : "Home"
      );

      // Chuyển hướng theo vai trò
      navigation.navigate(role === "Admin" ? "Admin" : "Home");
    } catch (error) {
      console.error("Login Error:", error);
      if (error.response) {
        console.error("Error Status:", error.response.status);
        console.error("Error Data:", error.response.data);
      }
      setErrorMessage(
        error.response?.data?.message || "Không thể kết nối đến máy chủ!"
      );
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/logo.png")}
        style={styles.logo}
      />

      <Text style={styles.welcomeText}>Chào mừng trở lại!</Text>
      <Text style={styles.subText}>Hãy nhập thông tin để đăng nhập</Text>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#aaa"
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          onChangeText={setPassword}
        />

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.registerText}>Quên mật khẩu?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>

      {/* View này có flexShrink để tránh bị đẩy xuống ảnh */}
      <View style={styles.registerContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.registerText}>
            Bạn chưa có tài khoản?{" "}
            <Text style={styles.registerLink}>Đăng ký</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Image
        source={require("../../assets/images/book-login.jpg")}
        style={styles.bottomImage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF6EC",
    padding: 20,
    paddingTop: 40,
  },
  formContainer: {
    flexGrow: 1, // Đảm bảo form sẽ chiếm khoảng trống còn lại
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: "center",
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#D86F45",
    textAlign: "center",
  },
  subText: {
    fontSize: 14,
    color: "#8D6E63",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    borderColor: "#E0AFA0",
    borderWidth: 1,
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
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  registerContainer: {
    alignItems: "center",
    paddingVertical: 10,
    flexShrink: 1, // Đảm bảo nó không bị đẩy xuống dưới ảnh
  },
  registerText: {
    fontSize: 14,
    color: "#8D6E63",
  },
  registerLink: {
    color: "#D86F45",
    fontWeight: "bold",
  },
  bottomImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
    marginTop: 10, // Để nó không đè lên nội dung
  },
});

export default Login;
