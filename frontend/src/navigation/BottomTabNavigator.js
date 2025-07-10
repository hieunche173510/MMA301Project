import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import Home from "../screens/Home";
import Profile from "../screens/Profile";
import Cart from "../screens/Cart";
import OrderList from "../screens/OrderList";
import Logout from "../screens/Logout";
import ChatScreen from "../screens/ChatScreen";

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          switch (route.name) {
            case "Trang chủ":
              iconName = "home";
              break;
            case "Giỏ hàng":
              iconName = "shopping-cart";
              break;
            case "Đơn hàng":
              iconName = "list";
              break;
            case "Chat":
              iconName = "message-circle";
              break;
            case "Tài khoản":
              iconName = "user";
              break;
            case "Đăng xuất":
              iconName = "log-out";
              break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#6A9E75",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Trang chủ" component={Home} />
      <Tab.Screen name="Giỏ hàng" component={Cart} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Tài khoản" component={Profile} />
      <Tab.Screen name="Đơn hàng" component={OrderList} />
      <Tab.Screen name="Đăng xuất" component={Logout} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
