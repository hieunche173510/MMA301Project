import React, { useState, useRef } from "react";
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
import { verifyOTP } from "../services/api";

export default function OTPScreen({ navigation, route }) {
  const { email } = route.params;
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const handleOTPChange = (index, value) => {
    let newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    try {
      const otpString = otp.join("");
      const response = await verifyOTP(email, otpString);

      if (response && response.success) {
        Alert.alert("Thành công", "OTP hợp lệ!");
        navigation.navigate("ResetPassword", { email });
      } else {
        Alert.alert("Lỗi", response?.message || "OTP không hợp lệ!");
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

      <Text style={styles.title}>Xác nhận OTP</Text>
      <Text style={styles.subText}>Mã OTP đã gửi đến email:</Text>
      <Text style={styles.email}>{email}</Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            style={styles.otpBox}
            keyboardType="numeric"
            maxLength={1}
            onChangeText={(value) => handleOTPChange(index, value)}
            value={digit}
            ref={(ref) => (inputRefs.current[index] = ref)}
          />
        ))}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Xác nhận</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity>
        <Text style={styles.link}>Gửi lại mã OTP</Text>
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
  },
  subText: {
    fontSize: 14,
    color: "#8D6E63",
    textAlign: "center",
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#D17842",
    textAlign: "center",
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  otpBox: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#E0AFA0",
    textAlign: "center",
    fontSize: 24,
    borderRadius: 10,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
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
  link: {
    marginTop: 10,
    color: "#D17842",
    fontSize: 16,
    textAlign: "center",
  },
  bottomImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
    marginTop: 20,
  },
});
