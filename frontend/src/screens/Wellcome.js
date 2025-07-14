import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const Wellcome = ({ navigation }) => {
  return (
    <LinearGradient colors={["#FDF6EC", "#FFF"]} style={styles.container}>
      <Text style={styles.header}>Tiệm Sách Nhà Tớ</Text>
      {/* Hình ảnh trên cùng */}
      <View style={styles.imageContainer}>
        {/* <Image
          source={require("../assets/banner.png")} // Đảm bảo có hình trong thư mục assets
          style={styles.image}
          resizeMode="contain"
        /> */}
      </View>

      {/* Nội dung chính */}
      <View style={styles.content}>
        <Text style={styles.title}>📖 "Hôm nay là một ngày tuyệt vời để đắm chìm trong những trang sách!"</Text>
        <Text style={styles.subtitle}>📚 "Những cuốn sách hay nhất, mang tri thức đến tận tay bạn!"</Text>

        {/* Nút login */}
        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.signInText}>Đăng nhập</Text>
        </TouchableOpacity>

        {/* Nút Create an Account */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.registerText}>Đăng kí</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FDF6EC",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#D86F45",
    marginBottom: 20,
  },
  imageContainer: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: "40%",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  content: {
    position: "absolute",
    bottom: 80,
    width: "90%",
    alignItems: "center",
  },
  title: {
    fontSize: 27,
    fontWeight: "bold",
    textAlign: "center",
    color: "#D86F45",
  },
  subtitle: {
    fontSize: 17,
    color: "#8D6E63",
    textAlign: "center",
    marginBottom: 20,
  },
  signInButton: {
    backgroundColor: "#D86F45",
    paddingVertical: 16,
    width: "100%",
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  signInText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  registerButton: {
    backgroundColor: "#E0AFA0",
    paddingVertical: 16,
    width: "100%",
    borderRadius: 10,
    alignItems: "center",
  },
  registerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default Wellcome;
