import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { registerUser } from "../services/api";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleRegister = async () => {
    if (!email || !name || !password) {
      setErrorMessage("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMessage("Email không hợp lệ!");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Mật khẩu phải có ít nhất 8 ký tự!");
      return;
    }
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await registerUser(name, email, password);
      await AsyncStorage.setItem("user", JSON.stringify(response.user));
      setLoading(false);
      navigation.navigate("Home");
    } catch (error) {
      setLoading(false);
      setErrorMessage(
        error.response?.data?.message || "Không thể kết nối đến máy chủ."
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>Đăng ký tài khoản</Text>
        <Text style={styles.subtitle}>
          Nhập thông tin của bạn để tạo tài khoản
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Họ và Tên"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Đăng ký</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginText}>
            Bạn đã có tài khoản? <Text style={styles.loginLink}>Đăng nhập</Text>
          </Text>
        </TouchableOpacity>
        <Image
          source={require("../../assets/images/book-login.jpg")}
          style={styles.bottomImage}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#FAF3E0",
  },
  container: {
    alignItems: "center",
    paddingTop: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#D86F45",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#8D6E63",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 8,
    marginVertical: 8,
    borderColor: "#E0AFA0",
    borderWidth: 1,
    fontSize: 16,
  },
  button: {
    width: "100%",
    backgroundColor: "#D86F45",
    padding: 14,
    borderRadius: 8,
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
  loginText: {
    fontSize: 14,
    color: "#8D6E63",
    marginTop: 10,
  },
  loginLink: {
    color: "#D86F45",
    fontWeight: "bold",
  },
});

export default Register;
