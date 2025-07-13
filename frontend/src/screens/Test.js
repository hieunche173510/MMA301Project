import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentUser } from "../services/api";

const Checkout = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Try to get user from API first
        const response = await getCurrentUser();
        setUser(response);
      } catch (error) {
        console.error("❌ Lỗi khi lấy user từ API:", error);

        // Fallback to AsyncStorage
        try {
          const userData = await AsyncStorage.getItem("user");
          if (userData) {
            setUser(JSON.parse(userData));
          } else {
            console.log("⚠ Không tìm thấy thông tin user trong AsyncStorage!");
          }
        } catch (storageError) {
          console.error("❌ Lỗi khi lấy user từ AsyncStorage:", storageError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <View>
      {loading ? (
        <Text>Đang tải thông tin...</Text>
      ) : user ? (
        <View>
          <Text>👤 Tên: {user.name}</Text>
          <Text>📧 Email: {user.email}</Text>
          <Text>🔑 Vai trò: {user.role}</Text>
          {user.address && <Text>📍 Địa chỉ: {user.address}</Text>}
          {user.phoneNumber && <Text>📞 SĐT: {user.phoneNumber}</Text>}
        </View>
      ) : (
        <Text>Không tìm thấy thông tin người dùng</Text>
      )}
    </View>
  );
};

export default Checkout;
