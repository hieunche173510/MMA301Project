import React, { useEffect, useState } from "react";
import { View, FlatList, Alert, StyleSheet } from "react-native";
import { Card, Paragraph, Title } from "react-native-paper";
import { useRoute } from "@react-navigation/native";
import { getUserOrdersByAdmin } from "../services/api";

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const route = useRoute(); // Lấy tham số từ route
  const { userId } = route.params;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await getUserOrdersByAdmin(userId);
      if (response && response.data) {
        setOrders(response.data);
      }
    } catch (error) {
      Alert.alert("Lỗi", error.message || "Không thể tải danh sách đơn hàng");
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Danh sách đơn hàng</Title>
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Paragraph>Mã đơn hàng: {item._id}</Paragraph>
              <Paragraph>Tổng tiền: {item.totalPrice} VND</Paragraph>
              <Paragraph>Trạng thái: {item.status}</Paragraph>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F5F1", padding: 10 },
  title: { textAlign: "center", marginBottom: 10 },
  card: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "white",
  },
});

export default UserOrders;
