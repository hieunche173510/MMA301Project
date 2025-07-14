// import React from "react";
// import { NavigationContainer } from "@react-navigation/native";
// import { createStackNavigator } from "@react-navigation/stack";
// import Login from "./src/screens/Login";
// import Register from "./src/screens/Register";
// import Wellcome from "./src/screens/Wellcome";
// import BottomTabNavigator from "./src/navigation/BottomTabNavigator";
// import EditProfile from "./src/screens/EditProfile";
// import ProductDetail from "./src/screens/ProductDetail";
// import DashBoard from "./src/screens/Dashboard";
// import AddProduct from "./src/screens/AddProduct";
// import Checkout from "./src/screens/Checkout";
// import EditProduct from "./src/screens/EditProduct";

// import Toast from 'react-native-toast-message';
// import ForgotPassword from "./src/screens/ForgotPassword";
// import OTPScreen from "./src/screens/OTPScreen";
// import ResetPassword from "./src/screens/ResetPassword";
// import OrderList from "./src/screens/OrderList";
// import AdminDashBoard from "./src/screens/AdminDashboard";

// const Stack = createStackNavigator();

// const App = () => {
//   return (
//     <NavigationContainer>
//       <Stack.Navigator screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="Wellcome" component={Wellcome} />
//         <Stack.Screen name="Login" component={Login} />
//         <Stack.Screen name="Register" component={Register} />
//         <Stack.Screen name="EditProfile" component={EditProfile} />
//         <Stack.Screen name="ProductDetail" component={ProductDetail} />
//         <Stack.Screen name="AddProduct" component={AddProduct} />
//         <Stack.Screen name="EditProduct" component={EditProduct} />
//         <Stack.Screen name ="Checkout" component={Checkout}/>
//         <Stack.Screen name="Dashboard" component={DashBoard} />
//         <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
//         <Stack.Screen name="OTP" component={OTPScreen} />
//         <Stack.Screen name="ResetPassword" component={ResetPassword} />
//         <Stack.Screen name="OrderList" component={OrderList}/>
//         <Stack.Screen name="Admin" component={AdminDashBoard} />
//         <Stack.Screen name="Home" component={BottomTabNavigator} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default App;
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Login from "./src/screens/Login";
import Register from "./src/screens/Register";
import Wellcome from "./src/screens/Wellcome";
import BottomTabNavigator from "./src/navigation/BottomTabNavigator";
import EditProfile from "./src/screens/EditProfile";
import ProductDetail from "./src/screens/ProductDetail";
import DashBoard from "./src/screens/Dashboard";
import AddProduct from "./src/screens/AddProduct";
import Checkout from "./src/screens/Checkout";
import EditProduct from "./src/screens/EditProduct";
import ForgotPassword from "./src/screens/ForgotPassword";
import OTPScreen from "./src/screens/OTPScreen";
import ResetPassword from "./src/screens/ResetPassword";
import OrderList from "./src/screens/OrderList";
import AdminDashBoard from "./src/screens/AdminDashboard";
import ChatScreen from "./src/screens/ChatScreen";
import GeminiInitHelper from "./src/components/chat/GeminiInitHelper";

const Stack = createStackNavigator();

const App = () => {
  const [initialRoute, setInitialRoute] = useState("Login");

  // Kiểm tra trạng thái đăng nhập và điều hướng phù hợp
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const lastRoute = await AsyncStorage.getItem("lastRoute");

        if (token && lastRoute) {
          setInitialRoute(lastRoute); // Nếu có token, quay lại màn hình trước đó
        } else {
          setInitialRoute("Login"); // Nếu không có token, quay lại màn hình Login
        }
      } catch (e) {
        console.error("Auth Check Error:", e);
        setInitialRoute("Login");
      }
    };

    checkAuth();
  }, []);

  return (
    <NavigationContainer>
      <GeminiInitHelper />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Wellcome" component={Wellcome} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="ProductDetail" component={ProductDetail} />
        <Stack.Screen name="AddProduct" component={AddProduct} />
        <Stack.Screen name="EditProduct" component={EditProduct} />
        <Stack.Screen name="Checkout" component={Checkout} />
        <Stack.Screen name="Dashboard" component={DashBoard} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="OTP" component={OTPScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPassword} />
        <Stack.Screen name="OrderList" component={OrderList} />
        <Stack.Screen name="Admin" component={AdminDashBoard} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Home" component={BottomTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
