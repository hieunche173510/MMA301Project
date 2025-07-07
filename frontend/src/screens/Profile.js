import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome";
import { useNavigation } from "@react-navigation/native";
import { getCurrentUser, changePassword } from "../services/api";

const ProfileDetail = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [message, setMessage] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await getCurrentUser();
        setUser(response);
      } catch (error) {
        setMessage(
          "Lỗi khi lấy thông tin người dùng: " +
            (error.message || "Không xác định")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setMessage("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      setUpdating(true);
      const response = await changePassword(currentPassword, newPassword);

      if (response && response.success) {
        setMessage(response.message || "Đổi mật khẩu thành công!");
        setShowChangePassword(false);
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setMessage(response?.message || "Đổi mật khẩu thất bại!");
      }
    } catch (error) {
      setMessage("Lỗi khi gửi request: " + (error.message || "Không xác định"));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Nút Quay lại */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={20} color="#007bff" />
        <Text style={styles.backText}>Quay lại</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : user ? (
        <View style={styles.card}>
          <Icon
            name="user-circle"
            size={80}
            color="#007bff"
            style={styles.avatar}
          />
          <Text style={styles.title}>Thông tin tài khoản</Text>
          <Text style={styles.info}>📧 Email: {user.email}</Text>
          <Text style={styles.info}>👤 Tên: {user.name}</Text>
          <Text style={styles.info}>🔑 Vai trò: {user.role}</Text>

          {/* Nút Đổi mật khẩu */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowChangePassword(!showChangePassword)}
          >
            <Text style={styles.info}>🔒 Đổi mật khẩu</Text>
            <Icon
              name={showChangePassword ? "chevron-up" : "chevron-down"}
              size={16}
              color="#007bff"
            />
          </TouchableOpacity>

          {/* Hiển thị form đổi mật khẩu khi bấm vào */}
          {showChangePassword && (
            <View>
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu hiện tại"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu mới"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleChangePassword}
                disabled={updating}
              >
                <Text style={styles.updateText}>
                  {updating ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Hiển thị thông báo */}
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      ) : (
        <Text>Không tìm thấy thông tin tài khoản.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  backText: {
    fontSize: 16,
    color: "#D87C4A", // Cam đất
    marginLeft: 8,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F1E7", // Nền kem nhạt
    padding: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    alignItems: "center",
  },
  avatar: {
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#B55229", // Cam đậm
    marginBottom: 10,
  },
  info: {
    fontSize: 16,
    color: "#444",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  input: {
    width: "100%",
    backgroundColor: "#F8F1E7",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#DCE6F7", // Xanh nhạt
  },
  updateButton: {
    backgroundColor: "#D87C4A", // Cam đất
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
    width: "100%",
  },
  updateText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  message: {
    marginTop: 10,
    color: "#D9534F", // Đỏ
    fontSize: 14,
    textAlign: "center",
  },
});

export default ProfileDetail;
