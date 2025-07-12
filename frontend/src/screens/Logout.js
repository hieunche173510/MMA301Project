// screens/Logout.js
import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Logout = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const handleLogout = async () => {
      // Xử lý xóa token hoặc thông tin đăng nhập tại đây
      await AsyncStorage.removeItem("userToken"); // Ví dụ với AsyncStorage

      // Điều hướng về màn hình đăng nhập
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    };

    handleLogout();
  }, [navigation]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#6A9E75" />
      <Text>Đang đăng xuất...</Text>
    </View>
  );
};

export default Logout;
