import React, { useEffect, useState } from "react";
import { View, FlatList, Alert, StyleSheet } from "react-native";
import { Card, Text, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { getUsers } from "../services/api";

const ListUser = () => {
  const [users, setUsers] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      if (response && Array.isArray(response)) {
        setUsers(response.filter((user) => user.role === "user"));
      } else {
        Alert.alert("Lỗi", "Không thể tải danh sách người dùng");
      }
    } catch (error) {
      Alert.alert("Lỗi", error.message || "Không thể kết nối đến máy chủ");
    }
  };

  const handleViewOrders = (userId) => {
    navigation.navigate("UserOrders", { userId });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>

              <View style={styles.rowContainer}>
                <View style={styles.statusContainer}>
                  <Text style={styles.statusText}>active</Text>
                </View>
                <Button
                  mode="contained"
                  style={styles.smallButton}
                  labelStyle={styles.buttonText}
                  onPress={() => handleViewOrders(item._id)}
                >
                  View Order
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", padding: 10 },
  card: {
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "white",
    elevation: 3,
  },
  userName: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  userEmail: { fontSize: 14, color: "#666", marginBottom: 8 },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusContainer: {
    backgroundColor: "#28a745",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  statusText: { color: "#FFF", fontWeight: "bold", fontSize: 12 },
  smallButton: {
    backgroundColor: "#007bff",
    borderRadius: 5,
    paddingVertical: 2,
    paddingHorizontal: 8,
    minWidth: 90,
  },
  buttonText: { fontSize: 12 },
});

export default ListUser;
