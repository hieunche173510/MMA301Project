// import React from "react";
// import { createDrawerNavigator } from "@react-navigation/drawer";
// import { NavigationContainer } from "@react-navigation/native";
// import { Appbar, Button } from "react-native-paper";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// import ListProduct from "./ListProduct";
// import ListUser from "./ListUser";

// const Drawer = createDrawerNavigator();

// const CustomHeader = ({ navigation }) => {
//   return (
//     <Appbar.Header style={{ backgroundColor: "#6A9E75" }}>
//       <Appbar.Action icon="menu" onPress={() => navigation.openDrawer()} />
//       <Appbar.Content title="Admin Dashboard" />
//       <Button
//         mode="contained"
//         buttonColor="#D9534F"
//         textColor="white"
//         onPress={() => {
//           AsyncStorage.removeItem("token");
//           navigation.replace("Login");
//         }}
//       >
//         Đăng xuất
//       </Button>
//     </Appbar.Header>
//   );
// };

// const Dashboard = () => {
//   return (
//       <Drawer.Navigator
//         initialRouteName="ListProduct"
//         screenOptions={{ header: (props) => <CustomHeader {...props} /> }}
//       >
//         <Drawer.Screen name="ListProduct" component={ListProduct} />
//         <Drawer.Screen name="ListUser" component={ListUser} />
//       </Drawer.Navigator>
//   );

// };

// export default Dashboard;

import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import { Appbar, Button } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";

import ListProduct from "./ListProduct";
import ListUser from "./ListUser";
import UserOrders from "./UserOrders"; // Import màn hình UserOrders

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

const CustomHeader = ({ navigation }) => {
  return (
    <Appbar.Header style={{ backgroundColor: "#6A9E75" }}>
      <Appbar.Action icon="menu" onPress={() => navigation.openDrawer()} />
      <Appbar.Content title="Admin Dashboard" />
      <Button
        mode="contained"
        buttonColor="#D9534F"
        textColor="white"
        onPress={() => {
          AsyncStorage.removeItem("token");
          navigation.replace("Login");
        }}
      >
        Đăng xuất
      </Button>
    </Appbar.Header>
  );
};

// Drawer Navigator chứa ListProduct & ListUser
const DrawerNavigator = () => (
  <Drawer.Navigator
    initialRouteName="ListProduct"
    screenOptions={{ header: (props) => <CustomHeader {...props} /> }}
  >
    <Drawer.Screen name="ListProduct" component={ListProduct} />
    <Drawer.Screen name="ListUser" component={ListUser} />
  </Drawer.Navigator>
);

// Stack Navigator bọc Drawer để có thể navigate đến UserOrders
const Dashboard = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Drawer" component={DrawerNavigator} />
    <Stack.Screen name="UserOrders" component={UserOrders} />
  </Stack.Navigator>
);

export default Dashboard;
