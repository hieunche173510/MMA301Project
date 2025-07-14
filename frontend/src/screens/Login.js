import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loginUser,
  API_BASE_URL,
  checkServerConnection,
  checkBackendStatus,
  updateApiBaseUrl,
} from "../services/api";

const Login = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [checking, setChecking] = useState(true);
  const [serverStatus, setServerStatus] = useState(null);
  const [serverIp, setServerIp] = useState("");

  // Kiểm tra kết nối server khi component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setChecking(true);

        // Kiểm tra kết nối server
        const connectionStatus = await checkServerConnection();
        console.log("Trạng thái kết nối server:", connectionStatus);

        if (!connectionStatus.connected) {
          console.log(
            "Không thể kết nối đến server, kiểm tra các URLs khác..."
          );

          // Thử kiểm tra các URLs khác
          const backendStatus = await checkBackendStatus();
          console.log("Kết quả kiểm tra backend:", backendStatus);

          setServerStatus(backendStatus);

          if (backendStatus.workingServer) {
            Alert.alert(
              "Tìm thấy server hoạt động",
              `Server đang chạy tại: ${backendStatus.workingServer.url}\nNên cập nhật API_BASE_URL trong api.js`,
              [{ text: "OK" }]
            );
          } else {
            Alert.alert(
              "Không thể kết nối đến server",
              "Vui lòng đảm bảo rằng backend server đang chạy và địa chỉ IP trong api.js là chính xác.",
              [{ text: "OK" }]
            );
          }
        } else {
          setServerStatus({ connected: true });
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra kết nối server:", error);
      } finally {
        setChecking(false);
      }
    };

    checkConnection();
  }, []);

  // Hàm kiểm tra và đảm bảo vai trò admin được xử lý đúng
  const checkAndHandleAdminRole = (role) => {
    // Log để debug
    console.log("Kiểm tra vai trò:", role);

    // Kiểm tra không phân biệt chữ hoa/thường
    if (typeof role === "string") {
      const normalizedRole = role.toLowerCase();
      console.log("Vai trò sau khi chuẩn hóa:", normalizedRole);

      // Trả về true nếu là admin (chấp nhận nhiều định dạng khác nhau)
      return (
        normalizedRole === "admin" ||
        normalizedRole === "administrator" ||
        normalizedRole.includes("admin")
      );
    }

    // Trường hợp role không phải string
    console.log("Vai trò không phải là string:", typeof role);
    return false;
  };

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

      // Trích xuất thông tin và đảm bảo role luôn có giá trị
      const { token, role: serverRole, userId, email: userEmail } = result;
      const role = serverRole || "Customer"; // Fallback nếu không có role

      console.log("Thông tin từ server:", { role, token: !!token, userId });

      // Sử dụng hàm kiểm tra vai trò
      const isAdmin = checkAndHandleAdminRole(role);
      console.log("Kiểm tra admin:", isAdmin);

      // Xác định điều hướng dựa trên vai trò
      const targetRoute = isAdmin ? "Admin" : "Home";

      // Lưu thông tin vào AsyncStorage
      await AsyncStorage.multiSet([
        ["token", token],
        ["role", role],
        ["isAdmin", isAdmin ? "true" : "false"], // Lưu dạng boolean để dễ kiểm tra
        ["lastRoute", targetRoute],
        ["userId", userId || ""], // Đảm bảo lưu userId nếu có
      ]);

      console.log("DEBUG - Thông tin lưu vào AsyncStorage:", {
        token: "***hidden***",
        role,
        isAdmin: isAdmin ? "true" : "false",
        lastRoute: targetRoute,
        userId: userId || "",
      });

      console.log("Đã lưu thông tin đăng nhập, chuyển hướng đến:", targetRoute);

      // Chuyển hướng theo vai trò
      navigation.navigate(targetRoute);
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

  // Hàm xử lý cập nhật địa chỉ IP server thủ công
  const handleUpdateServerIp = async () => {
    if (!serverIp.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập địa chỉ IP server!");
      return;
    }

    try {
      // Cập nhật API_BASE_URL với IP mới
      const newUrl = `http://${serverIp}:9999/api`;
      await updateApiBaseUrl(newUrl);

      Alert.alert("Thành công", `Đã cập nhật địa chỉ server thành: ${newUrl}`, [
        { text: "OK", onPress: () => navigation.replace("Login") },
      ]);
    } catch (error) {
      console.error("Lỗi khi cập nhật địa chỉ IP:", error);
      Alert.alert("Lỗi", "Không thể cập nhật địa chỉ IP server!");
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

      {checking ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D86F45" />
          <Text style={styles.loadingText}>
            Đang kiểm tra kết nối server...
          </Text>
        </View>
      ) : serverStatus && !serverStatus.connected ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Không thể kết nối đến server</Text>
          <Text style={styles.errorDetail}>
            API_BASE_URL hiện tại: {API_BASE_URL}
          </Text>
          {serverStatus.workingServer && (
            <Text style={styles.errorDetail}>
              Server hoạt động tại: {serverStatus.workingServer.url}
            </Text>
          )}
          <Text style={styles.errorTip}>
            Gợi ý: Kiểm tra xem backend server có đang chạy không và địa chỉ IP
            trong api.js đã chính xác chưa.
          </Text>

          <View style={styles.manualIpContainer}>
            <TextInput
              style={styles.ipInput}
              placeholder="Nhập địa chỉ IP server (192.168.x.x)"
              placeholderTextColor="#aaa"
              onChangeText={(text) => setServerIp(text)}
              value={serverIp}
            />

            <TouchableOpacity
              style={styles.ipUpdateButton}
              onPress={handleUpdateServerIp}
            >
              <Text style={styles.buttonTextSmall}>Cập nhật</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.replace("Login")}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
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

          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text style={styles.registerText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      )}

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
  // Styles mới cho kiểm tra kết nối
  loadingContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#8D6E63",
  },
  errorContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  errorDetail: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 5,
  },
  errorTip: {
    fontSize: 14,
    color: "#8D6E63",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 15,
    fontStyle: "italic",
  },
  retryButton: {
    backgroundColor: "#D86F45",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Styles cho phần nhập IP thủ công
  manualIpContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
    paddingHorizontal: 5,
  },
  ipInput: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 10,
    borderRadius: 8,
    borderColor: "#E0AFA0",
    borderWidth: 1,
    marginRight: 10,
    fontSize: 14,
  },
  ipUpdateButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  buttonTextSmall: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default Login;
