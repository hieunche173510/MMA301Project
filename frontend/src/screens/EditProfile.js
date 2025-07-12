import React, { useState, useEffect } from "react";
import { View, Text, Modal, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { TextInput, Button, Card } from "react-native-paper";
import { updateProfile } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const EditProfile = ({ route }) => {
  const { user } = route.params;
  const [name, setName] = useState(user.name);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber);
  const [address, setAddress] = useState(user.address);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); 
  const [modalVisible, setModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(-100)); 
  const navigation = useNavigation();

  useEffect(() => {
    if (modalVisible) {
      Animated.timing(fadeAnim, {
        toValue: 30,
        duration: 300,
        useNativeDriver: false,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: false,
        }).start(() => setModalVisible(false));
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [modalVisible]);

  const showToast = (message) => {
    setErrorMessage(message);
    setModalVisible(true);
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");


      if (!token) {
        showToast("Bạn chưa đăng nhập.");
        setLoading(false);
        return;
      }

      const userData = { name, phoneNumber, address };
      await updateProfile(token, userData);

      showToast("✅ Cập nhật hồ sơ thành công!");

      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error) {
      console.error("Lỗi cập nhật hồ sơ:", error.response?.data || error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Không thể cập nhật hồ sơ.";
      showToast(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#E8F5E9", "#FFFFFF"]} style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        <Card style={styles.card}>
          <TextInput label="Tên" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
          <TextInput label="Số điện thoại" value={phoneNumber} onChangeText={setPhoneNumber} mode="outlined" keyboardType="phone-pad" style={styles.input} />
          <TextInput label="Địa chỉ" value={address} onChangeText={setAddress} mode="outlined" style={styles.input} />
          <Button mode="contained" onPress={handleUpdateProfile} loading={loading} style={styles.button}>
            Cập nhật
          </Button>
        </Card>
      </View>

      {/* Toast Notification */}
      <Modal transparent visible={modalVisible} animationType="none">
        <Animated.View style={[styles.toast, { top: fadeAnim, backgroundColor: errorMessage.includes("✅") ? "#4CAF50" : "#F44336" }]}>
          <Text style={styles.toastText}>{errorMessage}</Text>
        </Animated.View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
    flex: 1,
    textAlign: "center",
  },
  formContainer: {
    padding: 20,
  },
  card: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    backgroundColor: "#6A9E75",
  },
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default EditProfile;
