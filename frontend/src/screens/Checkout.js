import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Linking,
  Platform,
  Clipboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser"; // Dùng để mở link VNPay trên điện thoại
import {
  getCurrentUser,
  getSelectedCartItems,
  checkoutOrder,
  getImageUrl,
  API_BASE_URL,
  checkPaymentStatus as apiCheckPaymentStatus,
} from "../services/api";

// Hàm helper để kiểm tra hệ điều hành và trình duyệt trên web
const getBrowserInfo = () => {
  if (Platform.OS !== "web") return { os: Platform.OS, browser: "native" };

  if (typeof window === "undefined" || !window.navigator) {
    return { os: "unknown", browser: "unknown" };
  }

  const userAgent = window.navigator.userAgent;
  let browser = "unknown";
  let os = "unknown";

  // Kiểm tra hệ điều hành
  if (userAgent.indexOf("Windows") !== -1) os = "Windows";
  else if (userAgent.indexOf("Mac") !== -1) os = "MacOS";
  else if (userAgent.indexOf("Android") !== -1) os = "Android";
  else if (
    userAgent.indexOf("iOS") !== -1 ||
    userAgent.indexOf("iPhone") !== -1 ||
    userAgent.indexOf("iPad") !== -1
  )
    os = "iOS";
  else if (userAgent.indexOf("Linux") !== -1) os = "Linux";

  // Kiểm tra trình duyệt
  if (userAgent.indexOf("Chrome") !== -1) browser = "Chrome";
  else if (userAgent.indexOf("Firefox") !== -1) browser = "Firefox";
  else if (userAgent.indexOf("Safari") !== -1) browser = "Safari";
  else if (userAgent.indexOf("Edge") !== -1) browser = "Edge";
  else if (
    userAgent.indexOf("MSIE") !== -1 ||
    userAgent.indexOf("Trident") !== -1
  )
    browser = "IE";

  return { os, browser };
};

// Hàm helper để mở URL thanh toán phù hợp với từng môi trường
const openPaymentUrl = async (url, onReturn) => {
  try {
    // Lưu URL thanh toán vào AsyncStorage để có thể sử dụng sau này
    await AsyncStorage.setItem("payment_url", url);

    if (Platform.OS === "web") {
      // Trên web, mở cửa sổ mới
      const { os, browser } = getBrowserInfo();
      console.log(`🌐 Mở URL thanh toán trên ${os} - ${browser}`);

      if (typeof window !== "undefined") {
        const paymentWindow = window.open(url, "_blank");
        if (!paymentWindow) {
          throw new Error("Popup bị chặn");
        }
      } else {
        throw new Error("Window không khả dụng");
      }
      return { type: "opened", platform: "web" };
    } else if (await Linking.canOpenURL(url)) {
      // Sử dụng Linking nếu có thể
      console.log("🔗 Sử dụng Linking để mở URL");
      await Linking.openURL(url);
      return { type: "opened", platform: "native-linking" };
    } else {
      // Sử dụng WebBrowser của expo nếu Linking không khả dụng
      console.log("🌐 Sử dụng WebBrowser để mở URL");
      const result = await WebBrowser.openBrowserAsync(url, {
        enableBarCollapsing: true,
        showInRecents: true,
        toolbarColor: "#D35400",
        controlsColor: "#FFF",
      });
      return result;
    }
  } catch (error) {
    console.error("❌ Lỗi khi mở URL thanh toán:", error);
    throw error;
  }
};

const Checkout = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0); // Thêm state để lưu tổng tiền
  const [orderInfo, setOrderInfo] = useState(null); // Thêm state để lưu thông tin đơn hàng

  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();

        console.log("🚀 Dữ liệu người dùng từ API:", userData);

        if (userData && (userData.id || userData._id)) {
          // Cập nhật user dưới dạng object thay vì chỉ lấy ID
          setUser({
            id: userData.id || userData._id,
            name: userData.name || "Không có tên",
            phone: userData.phone || "Không có số điện thoại",
            address: userData.address || "Không có địa chỉ",
          });

          // Lấy giỏ hàng cho user này
          fetchOrders(userData.id || userData._id);
        } else {
          throw new Error("Không thể lấy thông tin người dùng!");
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const fetchOrders = async (userId) => {
    try {
      setLoading(true);
      const result = await getSelectedCartItems(userId);

      console.log("🔹 Dữ liệu từ API:", JSON.stringify(result, null, 2));

      // Giữ nguyên user nếu đã có hoặc cập nhật từ API
      setUser((prevUser) => ({
        ...prevUser, // Giữ nguyên thông tin cũ
        id: result.user_id?.id || prevUser.id,
        name: result.user_id?.name || prevUser.name,
        phone: result.user_id?.phone || prevUser.phone,
        address: result.user_id?.address || prevUser.address,
      }));

      // Cập nhật danh sách đơn hàng
      setOrders(
        result.selectedItems?.map((item) => ({
          product_id: item.product_id?._id || item.product_id, // Bảo đảm có product_id
          name: item.product_id?.name || "Không có tên",
          image: item.product_id?.image || "/default_image.png",
          quantity: item.quantity || 0,
          price: item.product_id?.price || item.price || 0,
          selected: true,
        })) || []
      );

      setTotalPrice(result.total_price || 0); // Cập nhật tổng tiền vào state

      setLoading(false);
    } catch (error) {
      setError(error.message);
      console.error("❌ Lỗi khi lấy dữ liệu từ API:", error.message);
      setLoading(false);
    }
  };

  const handleCheckout = async (paymentMethod) => {
    if (!user || !user.id) {
      Alert.alert(
        "Lỗi",
        "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại."
      );
      return;
    }

    if (!orders || orders.length === 0) {
      Alert.alert("Lỗi", "Giỏ hàng trống!");
      return;
    }

    console.log(
      "📤 Gửi yêu cầu checkout với user_id:",
      user.id,
      "và payment_method:",
      paymentMethod
    );

    try {
      // Hiện loading
      setLoading(true);

      // Kiểm tra các item có đủ thông tin không
      const validItems = orders.map((item) => ({
        product_id: item.product_id,
        name: item.name || "Unknown Product",
        price: item.price || 0,
        quantity: item.quantity || 1,
        image: item.image || "",
        selected: true, // Đảm bảo tất cả item đều được chọn
      }));

      // Log thông tin chi tiết trước khi gửi
      console.log(
        "Danh sách sản phẩm sẽ gửi:",
        JSON.stringify(validItems, null, 2)
      );

      // Gọi API checkout để xử lý đơn hàng
      const data = await checkoutOrder({
        user_id: user.id,
        payment_method: paymentMethod,
        items: validItems,
      });
      console.log("✅ Kết quả từ API checkout:", data);

      // Kiểm tra và log thông tin order_id
      if (data && data.order_id) {
        console.log("📋 Order ID đã nhận từ API checkout:", data.order_id);
        console.log("📋 Loại dữ liệu của Order ID:", typeof data.order_id);
      } else {
        console.warn("⚠️ Không có order_id trong kết quả checkout!", data);
      }

      setModalVisible(false);
      setLoading(false); // Xử lý thanh toán VNPay
      if (paymentMethod === "VNPay" && data && data.paymentUrl) {
        try {
          console.log("🌐 Mở URL thanh toán VNPay:", data.paymentUrl);

          // Kiểm tra URL VNPay trước khi mở
          const validatePaymentUrl = (url) => {
            try {
              // Kiểm tra xem URL có hợp lệ không
              const urlObj = new URL(url);

              // Kiểm tra xem URL có phải là HTTPS không (yêu cầu bảo mật)
              if (urlObj.protocol !== "https:") {
                console.warn("⚠️ URL thanh toán không sử dụng HTTPS:", url);
              }

              // Kiểm tra xem có phải URL của VNPay không
              if (
                !url.includes("vnpay") &&
                !url.includes("sandbox.vnpayment.vn")
              ) {
                console.warn(
                  "⚠️ URL thanh toán có thể không phải của VNPay:",
                  url
                );
              }

              return true;
            } catch (error) {
              console.error(
                "❌ URL thanh toán không hợp lệ:",
                error.message,
                url
              );
              return false;
            }
          };

          // Nếu URL hợp lệ, mở trình duyệt web để thanh toán
          if (validatePaymentUrl(data.paymentUrl)) {
            Alert.alert(
              "Chuyển đến thanh toán",
              "Bạn sẽ được chuyển đến trang thanh toán VNPay. Sau khi hoàn thành thanh toán, hãy quay lại ứng dụng.",
              [
                { text: "Hủy", style: "cancel" },
                {
                  text: "Tiếp tục",
                  onPress: async () => {
                    try {
                      // Lưu thông tin đơn hàng vào AsyncStorage để có thể kiểm tra khi quay lại
                      await AsyncStorage.setItem(
                        "pendingOrder",
                        JSON.stringify({
                          orderId: data.order_id,
                          paymentMethod: "VNPay",
                          timestamp: Date.now(),
                        })
                      );
                      console.log(
                        "⚠️ Chuẩn bị mở URL thanh toán:",
                        data.paymentUrl
                      );

                      // Kiểm tra URL trước khi mở
                      if (!validatePaymentUrl(data.paymentUrl)) {
                        throw new Error("URL thanh toán không hợp lệ!");
                      }

                      try {
                        // Sử dụng hàm helper để mở URL thanh toán
                        const openResult = await openPaymentUrl(
                          data.paymentUrl
                        );
                        console.log("Kết quả mở URL thanh toán:", openResult);

                        // Xử lý theo từng loại kết quả
                        if (openResult.platform === "web") {
                          // Trên web, hiển thị hướng dẫn sau khi mở cửa sổ
                          setTimeout(() => {
                            Alert.alert(
                              "Kiểm tra thanh toán",
                              "Vui lòng hoàn tất thanh toán trong cửa sổ mới. Sau khi thanh toán xong, hãy quay lại trang này và kiểm tra trạng thái đơn hàng.",
                              [
                                {
                                  text: "Đã thanh toán",
                                  onPress: () => {
                                    if (data.order_id) {
                                      AsyncStorage.setItem(
                                        "checking_payment",
                                        "true"
                                      );
                                      checkPaymentStatusLocal(
                                        data.order_id
                                      ).finally(() => {
                                        AsyncStorage.removeItem(
                                          "checking_payment"
                                        );
                                      });
                                    }
                                  },
                                },
                                {
                                  text: "Xem đơn hàng",
                                  onPress: () =>
                                    navigation.navigate("OrderList"),
                                },
                              ]
                            );
                          }, 1000);
                        } else if (openResult.type === "dismiss") {
                          // Người dùng đã quay lại từ WebBrowser trên mobile
                          setTimeout(() => {
                            Alert.alert(
                              "Kiểm tra thanh toán",
                              "Bạn đã hoàn thành thanh toán chưa?",
                              [
                                {
                                  text: "Đã thanh toán",
                                  onPress: () => {
                                    if (data.order_id) {
                                      checkPaymentStatusLocal(data.order_id);
                                    }
                                  },
                                },
                                {
                                  text: "Xem đơn hàng",
                                  onPress: () =>
                                    navigation.navigate("OrderList"),
                                },
                              ]
                            );
                          }, 500);
                        }
                      } catch (browserError) {
                        console.error(
                          "❌ Lỗi khi mở trình duyệt:",
                          browserError
                        );

                        // Phương án dự phòng - hiển thị URL và hướng dẫn người dùng
                        Alert.alert(
                          "Không thể mở trình duyệt tự động",
                          `Vui lòng sao chép link sau và mở trong trình duyệt: ${data.paymentUrl}`,
                          [
                            {
                              text: "Sao chép link",
                              onPress: () => {
                                // Sử dụng Clipboard để sao chép URL vào clipboard
                                Clipboard.setString(data.paymentUrl);
                                Alert.alert(
                                  "Đã sao chép",
                                  "Đường dẫn thanh toán đã được sao chép vào clipboard"
                                );

                                // Lưu cả vào AsyncStorage để có thể truy cập sau này nếu cần
                                AsyncStorage.setItem(
                                  "payment_url",
                                  data.paymentUrl
                                );
                              },
                            },
                            { text: "Đóng" },
                          ]
                        );
                      }

                      // Delay hiển thị Alert để tránh xung đột với quá trình mở trình duyệt
                      setTimeout(async () => {
                        // Kiểm tra xem đã đang hiện thị Alert kiểm tra thanh toán không
                        const isCheckingPayment = await AsyncStorage.getItem(
                          "checking_payment"
                        );

                        if (!isCheckingPayment) {
                          // Người dùng đã quay lại ứng dụng (có thể đã thanh toán hoặc hủy)
                          Alert.alert(
                            "Trạng thái thanh toán",
                            "Vui lòng chọn hành động tiếp theo:",
                            [
                              {
                                text: "Kiểm tra thanh toán",
                                onPress: () => {
                                  if (data.order_id) {
                                    checkPaymentStatusLocal(data.order_id);
                                  } else {
                                    Alert.alert(
                                      "Lỗi",
                                      "Không thể lấy thông tin đơn hàng"
                                    );
                                  }
                                },
                              },
                              {
                                text: "Xem đơn hàng",
                                onPress: () => navigation.navigate("OrderList"),
                              },
                              {
                                text: "Về trang chủ",
                                onPress: () => navigation.navigate("Home"),
                              },
                            ]
                          );
                        }
                      }, 2500);
                    } catch (webError) {
                      console.error("❌ Lỗi khi mở WebBrowser:", webError);
                      Alert.alert(
                        "Lỗi",
                        "Không thể mở trang thanh toán. Vui lòng thử lại sau."
                      );
                    }
                  },
                },
              ]
            );
          } else {
            Alert.alert(
              "Lỗi",
              "URL thanh toán không hợp lệ. Vui lòng thử lại sau."
            );
          }
        } catch (webError) {
          console.error("❌ Lỗi khi xử lý thanh toán:", webError);
          Alert.alert(
            "Lỗi",
            "Không thể mở trang thanh toán. Vui lòng thử lại sau."
          );
        }
      } else if (paymentMethod === "COD") {
        // Thanh toán COD giả lập - đánh dấu đơn hàng thanh toán thành công ngay lập tức
        try {
          console.log("🔄 Xử lý thanh toán COD cho đơn hàng:", data);

          // Kiểm tra xem có order_id trong response không
          if (!data.order_id) {
            console.log(
              "Không tìm thấy order_id trong response, chuyển hướng đến trang đơn hàng"
            );
            // Nếu không có order_id, nghĩa là BE đã xử lý thanh toán COD luôn
            // Hiển thị thông báo và chuyển hướng đến trang OrderList
            Alert.alert(
              "Đặt hàng thành công",
              "Đơn hàng của bạn đã được đặt thành công. Bạn có thể xem đơn hàng trong danh sách đơn hàng.",
              [
                {
                  text: "Xem đơn hàng",
                  onPress: () => navigation.navigate("OrderList"),
                },
              ]
            );
            return;
          }

          setLoading(true); // Hiển thị loading trong quá trình xử lý
          console.log(
            "Cập nhật trạng thái thanh toán cho đơn hàng:",
            data.order_id
          );

          // Gọi API để cập nhật trạng thái đơn hàng thành "Paid"
          const paymentResult = await apiCheckPaymentStatus(
            data.order_id,
            true
          ); // true để yêu cầu cập nhật trạng thái thành công

          setLoading(false);
          console.log("Kết quả cập nhật trạng thái thanh toán:", paymentResult);

          if (paymentResult && paymentResult.success) {
            // Hiển thị thông báo thanh toán thành công
            Alert.alert(
              "Thanh toán thành công",
              "Thanh toán đã được xử lý! Đơn hàng của bạn đã được thanh toán thành công và source code đã sẵn sàng để download.",
              [
                {
                  text: "Xem đơn hàng và download",
                  onPress: () => navigation.navigate("OrderList"),
                },
              ]
            );
          } else {
            console.warn("Kết quả không thành công:", paymentResult);
            // Nếu không thành công, vẫn điều hướng đến trang đơn hàng
            Alert.alert(
              "Đặt hàng thành công",
              "Đơn hàng đã được đặt nhưng cập nhật trạng thái không thành công. Vui lòng kiểm tra đơn hàng của bạn.",
              [
                {
                  text: "Xem đơn hàng",
                  onPress: () => navigation.navigate("OrderList"),
                },
              ]
            );
          }
        } catch (error) {
          setLoading(false);
          console.error("❌ Lỗi khi xử lý thanh toán COD:", error);
          // Ngay cả khi có lỗi, vẫn điều hướng đến trang đơn hàng
          Alert.alert(
            "Đặt hàng thành công",
            "Đơn hàng đã được đặt nhưng có lỗi xảy ra trong quá trình xử lý thanh toán. Vui lòng kiểm tra đơn hàng của bạn.",
            [
              {
                text: "Xem đơn hàng",
                onPress: () => navigation.navigate("OrderList"),
              },
            ]
          );
        }
      } else if (paymentMethod === "Credit") {
        // Thanh toán thẻ tín dụng (chức năng sắp ra mắt)
        Alert.alert(
          "Tính năng sắp ra mắt",
          "Thanh toán bằng thẻ tín dụng đang được phát triển. Vui lòng sử dụng VNPay để thanh toán.",
          [
            {
              text: "OK",
              onPress: () => setModalVisible(true),
            },
          ]
        );
      } else {
        // Xử lý trường hợp khác hoặc lỗi
        Alert.alert("Thông báo", data?.message || "Đặt hàng thành công!", [
          { text: "OK", onPress: () => navigation.navigate("Home") },
        ]);
      }
    } catch (error) {
      setLoading(false);
      console.error("❌ Lỗi khi gọi API checkout:", error);
      Alert.alert(
        "Lỗi đặt hàng",
        error.response?.data?.message ||
          error.message ||
          "Không thể đặt hàng. Vui lòng thử lại sau."
      );
    }
  };

  // Function to check payment status after returning from VNPay
  const checkPaymentStatusLocal = async (orderId, forceMarkAsPaid = false) => {
    try {
      // Kiểm tra nếu không có orderId
      if (!orderId) {
        console.warn("Không có orderId để kiểm tra trạng thái thanh toán");
        Alert.alert(
          "Không thể kiểm tra thanh toán",
          "Không có thông tin đơn hàng để kiểm tra. Vui lòng xem danh sách đơn hàng của bạn.",
          [
            {
              text: "Xem đơn hàng",
              onPress: () => navigation.navigate("OrderList"),
            },
          ]
        );
        return;
      }

      console.log("Kiểm tra trạng thái thanh toán cho đơn hàng:", orderId);
      console.log("forceMarkAsPaid:", forceMarkAsPaid);

      // Gọi API từ services/api.js để kiểm tra trạng thái thanh toán
      const result = await apiCheckPaymentStatus(orderId, forceMarkAsPaid);
      console.log("Kết quả kiểm tra thanh toán:", result);

      if (result && result.success) {
        if (result.paid) {
          // Payment successful
          Alert.alert(
            "Thanh toán thành công",
            "Đơn hàng của bạn đã được thanh toán thành công!",
            [
              {
                text: "Xem đơn hàng",
                onPress: () => navigation.navigate("OrderList"),
              },
            ]
          );
        } else {
          // Payment failed or pending
          Alert.alert(
            "Thanh toán chưa hoàn tất",
            "Đơn hàng của bạn chưa được thanh toán thành công. Vui lòng kiểm tra lại.",
            [
              {
                text: "Thử lại",
                onPress: () => navigation.navigate("Cart"),
              },
              {
                text: "Xem đơn hàng",
                onPress: () => navigation.navigate("OrderList"),
              },
            ]
          );
        }
      } else {
        console.warn("Kết quả kiểm tra không thành công:", result);
        throw new Error(
          result?.message || "Không thể kiểm tra trạng thái thanh toán"
        );
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra trạng thái thanh toán:", error);
      Alert.alert(
        "Lỗi",
        "Không thể kiểm tra trạng thái thanh toán. Vui lòng kiểm tra đơn hàng của bạn.",
        [
          {
            text: "Xem đơn hàng",
            onPress: () => navigation.navigate("OrderList"),
          },
        ]
      );
    }
  };

  // Kiểm tra trạng thái thanh toán khi người dùng quay lại ứng dụng
  useFocusEffect(
    useCallback(() => {
      const checkPendingOrder = async () => {
        try {
          const pendingOrderData = await AsyncStorage.getItem("pendingOrder");

          // Không làm gì nếu không có đơn hàng đang chờ
          if (!pendingOrderData) return;

          const pendingOrder = JSON.parse(pendingOrderData);
          const { orderId, timestamp } = pendingOrder;

          // Chỉ kiểm tra nếu đơn hàng chưa quá cũ (10 phút)
          const isRecent = Date.now() - timestamp < 10 * 60 * 1000;

          if (isRecent && orderId) {
            // Kiểm tra nếu không đang trong quá trình kiểm tra thanh toán
            const isCheckingPayment = await AsyncStorage.getItem(
              "checking_payment"
            );
            if (!isCheckingPayment) {
              // Xóa pendingOrder sau khi đã xử lý
              await AsyncStorage.removeItem("pendingOrder");

              // Chờ một chút trước khi hiển thị Alert để tránh xung đột với các Alert khác
              setTimeout(() => {
                Alert.alert(
                  "Kiểm tra thanh toán",
                  "Bạn có muốn kiểm tra trạng thái thanh toán cho đơn hàng không?",
                  [
                    {
                      text: "Có",
                      onPress: () => checkPaymentStatusLocal(orderId),
                    },
                    {
                      text: "Xem đơn hàng",
                      onPress: () => navigation.navigate("OrderList"),
                    },
                    {
                      text: "Không",
                      style: "cancel",
                    },
                  ]
                );
              }, 1000);
            }
          } else if (!isRecent) {
            // Xóa đơn hàng cũ
            await AsyncStorage.removeItem("pendingOrder");
          }
        } catch (error) {
          console.error("Lỗi khi kiểm tra đơn hàng đang chờ:", error);
        }
      };

      checkPendingOrder();

      return () => {}; // Cleanup function
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#B55229" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Checkout</Text>
      </View>

      {/* Nội dung chính */}
      {loading ? (
        <ActivityIndicator size="large" color="#D87C4A" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Thông tin khách hàng */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
            <Text style={styles.boldText}>Tên: {user.name}</Text>
            <Text style={styles.lightText}>Địa chỉ: {user.address}</Text>
            <Text style={styles.lightText}>Số điện thoại: {user.phone}</Text>
          </View>

          {/* Giỏ hàng */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Giỏ hàng</Text>
            {orders.length === 0 ? (
              <Text style={{ textAlign: "center", marginTop: 20 }}>
                Không có sản phẩm nào
              </Text>
            ) : (
              orders.map((item, index) => (
                <View key={index} style={styles.orderItem}>
                  {/* Ảnh sản phẩm */}
                  {item.image ? (
                    <Image
                      source={{ uri: getImageUrl(item.image) }}
                      style={styles.itemImage}
                      onError={() => console.log("🚨 Lỗi ảnh:", item.image)}
                    />
                  ) : (
                    <Text>📷 Không có ảnh</Text>
                  )}

                  {/* Thông tin sản phẩm */}
                  <View style={styles.productInfo}>
                    <Text style={styles.boldText}>{item.name}</Text>
                    <Text style={styles.lightText}>
                      Số lượng: {item.quantity}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Tổng tiền */}
          <View style={styles.footer}>
            <Text style={styles.totalPrice}>
              Tổng tiền:{" "}
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(totalPrice)}
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.buttonText}>Thanh toán</Text>
            </TouchableOpacity>

            {/* Modal chọn phương thức thanh toán */}
            <Modal visible={modalVisible} transparent animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>
                    Chọn phương thức thanh toán
                  </Text>

                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => handleCheckout("VNPay")}
                  >
                    <Text style={styles.optionText}>
                      <Ionicons name="card-outline" size={18} color="#1A73E8" />{" "}
                      Thanh toán qua VNPay
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      { backgroundColor: "#4CAF50" },
                    ]}
                    onPress={() => handleCheckout("COD")}
                  >
                    <Text style={[styles.optionText, { color: "#FFFFFF" }]}>
                      <Ionicons name="cash-outline" size={18} color="#FFFFFF" />{" "}
                      Thanh toán ngay
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      { backgroundColor: "#f0f0f0" },
                    ]}
                    disabled={true}
                  >
                    <Text style={[styles.optionText, { color: "#888" }]}>
                      <Ionicons name="card-outline" size={18} color="#888" />{" "}
                      Thẻ tín dụng (sắp ra mắt)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelText}>Hủy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#FAF3E0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#B55229",
  },
  section: {
    marginBottom: 20,
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  boldText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  lightText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  productInfo: {
    flex: 1, // Chiếm hết phần còn lại
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#D35400",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  // Hộp modal chính
  modalContent: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  // Tiêu đề modal
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#D35400",
    textAlign: "center",
    marginBottom: 15,
  },
  // Input chung
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FAF3E0",
    marginBottom: 12,
  },
  // Input dành cho địa chỉ (có thể mở rộng)
  textArea: {
    textAlignVertical: "top",
  },
  // Container chứa nút bấm
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  // Nút bấm
  button: {
    backgroundColor: "#D35400",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Nút Hủy có màu khác
  cancelButton: {
    backgroundColor: "#A5A5A5",
  },
  // Chữ trên nút
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Styles for payment options
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A73E8",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  optionText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelText: {
    color: "#D35400",
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
    fontWeight: "500",
  },
});

export default Checkout;
