import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Chọn URL mặc định dựa trên platform
const getDefaultBaseUrl = () => {
  if (Platform.OS === "web") {
    // Web sẽ sử dụng localhost
    return "http://localhost:9999/api";
  } else if (Platform.OS === "android") {
    // Android emulator sẽ sử dụng 10.0.2.2 để truy cập localhost của máy host
    return "http://10.0.2.2:9999/api";
  } else {
    // iOS hoặc thiết bị thật cần dùng địa chỉ IP của máy chủ
    // Thay đổi IP này thành địa chỉ IP thực của máy tính đang chạy backend
    return "http://192.168.1.2:9999/api"; // Thay bằng IP thực của bạn
  }
};

// Khởi tạo với URL mặc định
let API_BASE_URL = getDefaultBaseUrl();
let BASE_URL = API_BASE_URL.replace("/api", "");

// Cấu hình instance axios để tái sử dụng
let api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Hàm để thiết lập các interceptors
const setupInterceptors = () => {
  // Thêm interceptor để log các request
  api.interceptors.request.use((request) => {
    console.log("Starting Request", {
      url: request.url,
      method: request.method,
      data: request.data,
    });
    return request;
  });

  // Thêm interceptor để log các response
  api.interceptors.response.use(
    (response) => {
      console.log("Response:", response.data);
      return response;
    },
    (error) => {
      console.error("Request Failed:", error.config);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      }
      return Promise.reject(error);
    }
  );
};

// Thiết lập interceptors lần đầu
setupInterceptors();

// Sau khi app khởi động, kiểm tra xem có URL đã lưu trong AsyncStorage không
const initApiBaseUrl = async () => {
  try {
    const savedUrl = await AsyncStorage.getItem("API_BASE_URL");
    if (savedUrl) {
      console.log("Sử dụng API_BASE_URL đã lưu:", savedUrl);
      API_BASE_URL = savedUrl;
      BASE_URL = API_BASE_URL.replace("/api", "");

      // Khởi tạo lại axios instance
      api = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Thêm lại các interceptors
      setupInterceptors();
    }
  } catch (error) {
    console.log("Không thể đọc API_BASE_URL từ AsyncStorage:", error);
  }
};

// Gọi hàm khởi tạo
initApiBaseUrl();

// Export API_BASE_URL để sử dụng ở nơi khác
export { API_BASE_URL };

// Hàm để cập nhật API_BASE_URL động và khởi tạo lại axios instance
export const updateApiBaseUrl = async (newUrl) => {
  try {
    // Lưu URL mới
    API_BASE_URL = newUrl;

    // Cập nhật BASE_URL
    const BASE_URL_NEW = API_BASE_URL.replace("/api", "");

    // Tạo lại axios instance với URL mới
    api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Thêm lại các interceptors
    setupInterceptors();

    // Lưu URL mới vào AsyncStorage để sử dụng khi khởi động lại app
    await AsyncStorage.setItem("API_BASE_URL", API_BASE_URL);

    console.log("Đã cập nhật API_BASE_URL thành:", API_BASE_URL);
    return true;
  } catch (error) {
    console.error("Lỗi khi cập nhật API_BASE_URL:", error);
    return false;
  }
};

// Hàm helper để lấy đường dẫn hình ảnh đúng
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  return `${BASE_URL}${imagePath}`;
};

// Đăng ký tài khoản
export const register = async (name, email, password) => {
  return api.post("/auth/register", { name, email, password });
};

// Đăng nhập
export const login = async (email, password) => {
  return api.post("/auth/login", { email, password });
};

// Lấy danh sách sản phẩm (source code)
export const getProducts = async () => {
  try {
    const response = await api.get("/product");
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", error);
    throw error;
  }
};

// Lấy chi tiết sản phẩm
export const getProductDetail = async (productId) => {
  try {
    const response = await api.get(`/product/detail/${productId}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
    throw error;
  }
};

// Kiểm tra quyền download source code
export const checkProductAccess = async (productId, userId) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Không tìm thấy token!");

    const response = await api.get(
      `/product/check-access/${productId}?user_id=${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Lỗi khi kiểm tra quyền truy cập:", error);
    return { hasAccess: false, message: "Không có quyền truy cập" };
  }
};

// Download source code
export const downloadSourceCode = async (downloadUrl) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Không tìm thấy token!");

    // Kiểm tra nếu downloadUrl đã là URL đầy đủ
    if (downloadUrl.startsWith("http")) {
      return downloadUrl;
    }

    // Nếu không, thêm baseUrl vào
    const baseUrl = API_BASE_URL.replace("/api", "");
    const fullUrl = `${baseUrl}${downloadUrl}`;

    // Thêm token vào URL nếu cần
    const urlWithToken = fullUrl.includes("?")
      ? `${fullUrl}&token=${token}`
      : `${fullUrl}?token=${token}`;

    // Trả về URL để mở trong browser hoặc WebView
    return urlWithToken;
  } catch (error) {
    console.error("Lỗi khi tải source code:", error);
    throw error;
  }
};

// Xóa sản phẩm (Chỉ Admin)
export const deleteProduct = async (productId, token) => {
  return api.delete(`/product/${productId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Cập nhật sản phẩm (Chỉ Admin)
export const updateProduct = async (productId, updatedData, token) => {
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // Xử lý multipart/form-data nếu có file
  if (updatedData instanceof FormData) {
    headers["Content-Type"] = "multipart/form-data";
  }

  return api.put(`/product/${productId}`, updatedData, { headers });
};

// Thêm sản phẩm mới (Chỉ Admin)
export const addProduct = async (productData) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Không tìm thấy token!");

    // Debug formData trước khi gửi
    console.log("FormData trước khi gửi:");
    if (productData instanceof FormData) {
      for (let pair of productData.entries()) {
        console.log(pair[0] + ": ", pair[1]);
      }
    }

    const response = await api.post("/product/create", productData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("Kết quả từ server:", response.data);

    // Đảm bảo trả về response.data và kiểm tra cấu trúc
    if (response.data && response.status >= 200 && response.status < 300) {
      return response.data; // Trả về dữ liệu khi thành công
    } else {
      // Nếu response có status code thành công nhưng không có dữ liệu
      throw new Error("Phản hồi không có dữ liệu");
    }
  } catch (error) {
    console.error("Lỗi khi thêm sản phẩm:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      // Trả về lỗi từ server nếu có
      throw error.response.data;
    } else if (error.request) {
      console.error("Request was made but no response:", error.request);
      throw new Error("Không nhận được phản hồi từ server");
    }
    throw error;
  }
};

// Tìm kiếm sản phẩm
export const searchProducts = async (searchParams) => {
  try {
    const { name, category_id, minPrice, maxPrice } = searchParams;
    let url = "/product/search?";

    if (name) url += `name=${encodeURIComponent(name)}&`;
    if (category_id) url += `category_id=${category_id}&`;
    if (minPrice) url += `minPrice=${minPrice}&`;
    if (maxPrice) url += `maxPrice=${maxPrice}&`;

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi tìm kiếm sản phẩm:", error);
    throw error;
  }
};

// Lấy danh mục sản phẩm
export const getCategories = async () => {
  try {
    const response = await api.get("/cate");

    // Kiểm tra cấu trúc phản hồi
    if (Array.isArray(response.data)) {
      // Nếu phản hồi là mảng, trả về cấu trúc { data: [...] }
      return { data: response.data };
    } else if (response.data && Array.isArray(response.data.data)) {
      // Nếu phản hồi đã có cấu trúc { data: [...] }
      return response.data;
    } else if (response.data) {
      // Trường hợp khác, bọc dữ liệu trong một object
      return { data: [response.data] };
    }

    // Mặc định trả về mảng rỗng
    return { data: [] };
  } catch (error) {
    console.error("Lỗi khi lấy danh mục:", error);
    return { data: [] }; // Trả về mảng rỗng thay vì throw error
  }
};

// Tạo danh mục mới
export const addCategory = async (categoryName) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Không tìm thấy token!");

    const response = await api.post(
      "/categories/create",
      { name: categoryName },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi thêm danh mục:", error);
    throw error;
  }
};

// Lấy thông tin user (Profile)
export const getUserProfile = async (token) => {
  return api.get("/users/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Cập nhật hồ sơ user
export const updateProfile = async (token, userData) => {
  return api.put("/users/update-profile", userData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Thêm sản phẩm vào giỏ hàng
export const addToCart = async (token, productId, quantity = 1) => {
  try {
    // Lấy user_id từ API thay vì AsyncStorage
    let userId = null;
    try {
      // Sử dụng API để lấy thông tin người dùng hiện tại
      const userResponse = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (userResponse && userResponse.data) {
        userId = userResponse.data._id || userResponse.data.id;
        console.log("Đã lấy được userId từ API:", userId);
      }
    } catch (e) {
      console.error("Lỗi khi lấy thông tin user từ API:", e);

      // Thử phương án dự phòng - lấy từ AsyncStorage
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          userId = user._id || user.id;
          console.log("Đã lấy được userId từ AsyncStorage:", userId);
        }
      } catch (storageError) {
        console.error("Lỗi khi lấy thông tin từ AsyncStorage:", storageError);
      }
    }

    // Kiểm tra nếu không có userId
    if (!userId) {
      throw new Error(
        "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại."
      );
    }

    // Sửa lại cấu trúc dữ liệu gửi đi theo đúng yêu cầu của backend
    const response = await api.post(
      "/cart/add",
      {
        user_id: userId,
        products: [{ product_id: productId, quantity }],
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Lỗi API addToCart:", error.response?.data || error.message);
    throw error;
  }
};

// Lấy danh sách sản phẩm trong giỏ hàng
export const getCart = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      console.error("Không tìm thấy token! Vui lòng đăng nhập.");
      return null;
    }

    // Lấy thông tin người dùng hiện tại
    let userId = null;
    try {
      const userResponse = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (userResponse && userResponse.data) {
        userId = userResponse.data._id || userResponse.data.id;
      } else {
        // Nếu không lấy được thông tin từ API, thử từ AsyncStorage
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          userId = user._id || user.id;
        }
      }
    } catch (e) {
      console.error("Lỗi khi lấy thông tin user cho getCart:", e);
    }

    if (!userId) {
      throw new Error("Không tìm thấy thông tin người dùng cho giỏ hàng");
    }

    console.log("Đang lấy giỏ hàng cho user:", userId);

    try {
      // Thay đổi để lấy giỏ hàng cho user hiện tại
      const response = await api.get(`/cart/selected/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(
        "API /cart/selected response:",
        JSON.stringify(response.data, null, 2)
      );

      return {
        success: true,
        data: {
          items: response.data.selectedItems || [],
          total: response.data.total_price || 0,
        },
      };
    } catch (cartError) {
      // Nếu không có sản phẩm nào trong giỏ hàng, trả về một giỏ hàng trống thay vì báo lỗi
      console.log(
        "Không có sản phẩm nào trong giỏ hàng hoặc có lỗi:",
        cartError.message
      );
      return {
        success: true,
        data: {
          items: [],
          total: 0,
        },
      };
    }
  } catch (error) {
    console.error("Lỗi API getCart:", error.response?.data || error.message);
    throw error;
  }
};

// Xóa sản phẩm khỏi giỏ hàng
export const removeFromCart = async (token, productId) => {
  try {
    // Lấy user_id từ token hoặc AsyncStorage
    let userId = null;
    try {
      // Sử dụng API để lấy thông tin người dùng hiện tại
      const userResponse = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (userResponse && userResponse.data) {
        userId = userResponse.data._id || userResponse.data.id;
      }
    } catch (e) {
      console.error("Lỗi khi lấy thông tin user từ API:", e);

      // Thử phương án dự phòng - lấy từ AsyncStorage
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          userId = user._id || user.id;
        }
      } catch (storageError) {
        console.error("Lỗi khi lấy thông tin từ AsyncStorage:", storageError);
      }
    }

    if (!userId) {
      throw new Error("Không tìm thấy thông tin người dùng để xóa sản phẩm!");
    }

    // Gọi API xóa sản phẩm khỏi giỏ hàng với phương thức đúng
    const response = await api.post(
      `/cart/remove`,
      { user_id: userId, product_id: productId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Lỗi API removeFromCart:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Lấy tổng tiền giỏ hàng
export const getCartTotal = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Token không tồn tại!");

    const response = await api.get("/cart/total", {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data.total;
  } catch (error) {
    console.error(
      "Lỗi API getCartTotal:",
      error.response?.data || error.message
    );
    return 0;
  }
};

// Cập nhật số lượng sản phẩm trong giỏ hàng
export const updateCartItem = async (productId, quantity, token) => {
  try {
    const response = await api.put(
      `/cart/update-quantity`,
      { product_id: productId, quantity },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Lỗi API updateCartItem:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Tạo đơn hàng
export const createOrder = async (token, orderData) => {
  try {
    const response = await api.post("/order", orderData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Lỗi API createOrder:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Lấy đơn hàng của người dùng
export const getOrdersByUser = async (token) => {
  try {
    // Lấy thông tin người dùng hiện tại để có userId
    const userData = await getCurrentUser();
    if (!userData || !userData.id) {
      throw new Error("Không thể lấy thông tin người dùng");
    }

    // Gọi API với userId đúng cấu trúc endpoint
    const response = await api.get(`/order/user/${userData.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Lỗi API getOrdersByUser:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Lấy chi tiết đơn hàng
export const getOrderDetail = async (orderId) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      throw new Error("Không tìm thấy token, vui lòng đăng nhập lại!");
    }

    const response = await api.get(`/user/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Lỗi API getOrderDetail:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Đăng nhập người dùng
export const loginUser = async (email, password) => {
  try {
    console.log("🔶 Đang đăng nhập với Axios:", `${API_BASE_URL}/auth/login`);
    const response = await api.post("/auth/login", { email, password });
    console.log("✅ Đăng nhập thành công với Axios");
    return response.data;
  } catch (error) {
    console.error(
      "❌ Lỗi API login với Axios:",
      error.response?.data || error.message
    );

    // Nếu axios thất bại, thử với fetch
    try {
      console.log("🔄 Thử đăng nhập với Fetch API...");
      const fetchResult = await loginUserWithFetch(email, password);
      console.log("✅ Đăng nhập thành công với Fetch API");
      return fetchResult;
    } catch (fetchError) {
      console.error(
        "❌ Cả Axios và Fetch đều thất bại, thử với nhiều endpoints..."
      );

      // Thử với nhiều endpoints khác nhau
      try {
        const multiEndpointResult = await tryMultipleLoginEndpoints(
          email,
          password
        );

        // Nếu thành công với URL khác, cập nhật lại API_BASE_URL
        if (multiEndpointResult.successUrl) {
          console.log(
            `⚠️ Đăng nhập thành công với URL: ${multiEndpointResult.successUrl}`
          );
          console.log(
            `⚠️ Nên cập nhật API_BASE_URL trong api.js thành: ${multiEndpointResult.successUrl.replace(
              "/auth/login",
              ""
            )}`
          );
        }

        return multiEndpointResult.data;
      } catch (finalError) {
        console.error("❌ Tất cả phương pháp đăng nhập đều thất bại.");
        throw new Error(
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra xem backend server đã chạy chưa và địa chỉ IP trong api.js đã đúng chưa."
        );
      }
    }
  }
};

// Đăng ký người dùng mới
export const registerUser = async (name, email, password) => {
  try {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi API register:", error.response?.data || error.message);
    throw error;
  }
};

// Lấy thông tin người dùng hiện tại
export const getCurrentUser = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      throw new Error("Không tìm thấy token!");
    }

    const response = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Lỗi API getCurrentUser:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Lấy tất cả sản phẩm và danh mục cho trang Home
export const getHomeData = async () => {
  try {
    // Dùng Promise.allSettled thay vì Promise.all để không fail nếu một API lỗi
    const [categoryResSettled, productResSettled] = await Promise.allSettled([
      api.get("/cate"),
      api.get("/product"),
    ]);

    // Xử lý kết quả cho danh mục
    let categories = [];
    if (categoryResSettled.status === "fulfilled") {
      const categoryRes = categoryResSettled.value;
      // Xử lý nhiều định dạng phản hồi có thể có
      if (Array.isArray(categoryRes.data)) {
        categories = categoryRes.data;
      } else if (categoryRes.data && Array.isArray(categoryRes.data.data)) {
        categories = categoryRes.data.data;
      } else if (categoryRes.data) {
        categories = [categoryRes.data];
      }
    }

    // Xử lý kết quả cho sản phẩm
    let products = [];
    if (productResSettled.status === "fulfilled") {
      const productRes = productResSettled.value;
      // Xử lý nhiều định dạng phản hồi có thể có
      if (Array.isArray(productRes.data)) {
        products = productRes.data;
      } else if (productRes.data && Array.isArray(productRes.data.data)) {
        products = productRes.data.data;
      } else if (productRes.data) {
        products = [productRes.data];
      }
    }

    return {
      categories: categories,
      products: products,
    };
  } catch (error) {
    console.error("Lỗi API getHomeData:", error);
    // Trả về mảng rỗng cho cả hai để tránh crash app
    return {
      categories: [],
      products: [],
    };
  }
};

// Quên mật khẩu - gửi OTP
export const forgotPassword = async (email) => {
  try {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  } catch (error) {
    console.error(
      "Lỗi API forgotPassword:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Xác nhận OTP
export const verifyOTP = async (email, otp) => {
  try {
    const response = await api.post("/auth/verify-otp", { email, otp });
    return response.data;
  } catch (error) {
    console.error("Lỗi API verifyOTP:", error.response?.data || error.message);
    throw error;
  }
};

// Đặt lại mật khẩu
export const resetPassword = async (email, newPassword, token) => {
  try {
    const response = await api.post("/auth/reset-password", {
      email,
      newPassword,
      token,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Lỗi API resetPassword:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// API cho quản lý đơn hàng (Admin)
export const getOrdersByStatus = async (status) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Không tìm thấy token!");

    const response = await api.get(`/order/order-status/${status}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Lỗi API getOrdersByStatus:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getAllOrderStatus = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Không tìm thấy token!");

    const response = await api.get("/order/order-status", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Lỗi API getAllOrderStatus:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Không tìm thấy token!");

    const response = await api.put(
      `/order/update-status/${orderId}`,
      { status },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Lỗi API updateOrderStatus:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// API cho quản lý người dùng (Admin)
export const getUsers = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Không tìm thấy token!");

    const response = await api.get("/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi API getUsers:", error.response?.data || error.message);
    throw error;
  }
};

// API cho quản lý đơn hàng của người dùng
export const getUserOrdersByAdmin = async (userId) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Không tìm thấy token!");

    const response = await api.get(`/admin/orders/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Lỗi API getUserOrdersByAdmin:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// API lấy sản phẩm đã chọn trong giỏ hàng
export const getSelectedCartItems = async (userId) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Không tìm thấy token!");

    const response = await api.get(`/cart/selected/${userId}`);
    return response.data;
  } catch (error) {
    console.error(
      "Lỗi API getSelectedCartItems:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// API thanh toán đơn hàng
export const checkoutOrder = async (orderData) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Không tìm thấy token!");

    // Kiểm tra dữ liệu trước khi gửi
    if (!orderData.user_id) {
      throw new Error("Thiếu user_id trong đơn hàng");
    }

    if (!orderData.payment_method) {
      throw new Error("Thiếu phương thức thanh toán");
    }

    if (
      !orderData.items ||
      !Array.isArray(orderData.items) ||
      orderData.items.length === 0
    ) {
      throw new Error("Không có sản phẩm nào để thanh toán");
    }

    // Kiểm tra tất cả các item có đủ thông tin cần thiết không
    const validItems = orderData.items.every(
      (item) => item.product_id && item.price && item.quantity !== undefined
    );

    if (!validItems) {
      console.error("Dữ liệu items không hợp lệ:", orderData.items);
      throw new Error("Một số sản phẩm trong giỏ hàng không có đủ thông tin");
    }

    // Log dữ liệu chi tiết để debug
    console.log("Checkout order data:", JSON.stringify(orderData, null, 2));

    const response = await api.post("/order/checkout", orderData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Log kết quả thành công
    console.log("✅ Checkout API response:", response.data);

    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi gọi API checkout:", error);
    console.error(
      "Lỗi API checkoutOrder:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// API đổi mật khẩu
export const changePassword = async (oldPassword, newPassword) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Không tìm thấy token!");

    const response = await api.post(
      "/auth/change-password",
      {
        oldPassword,
        newPassword,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Lỗi API changePassword:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Kiểm tra kết nối đến server
export const checkServerConnection = async () => {
  try {
    // Sử dụng đường dẫn cơ bản của server mà không có /api
    const serverUrl = BASE_URL;
    console.log("Đang kiểm tra kết nối đến:", serverUrl);

    const response = await axios.get(`${serverUrl}`, {
      timeout: 5000,
      validateStatus: (status) => true, // Chấp nhận mọi mã trạng thái để kiểm tra kết nối
    });

    console.log("Kết quả kiểm tra server:", response.status);

    // Trả về true nếu server đang chạy (bất kỳ mã HTTP nào cũng được)
    return {
      connected: true,
      status: response.status,
      url: serverUrl,
    };
  } catch (error) {
    console.error("Lỗi kết nối đến server:", error.message);
    return {
      connected: false,
      error: error.message,
      url: BASE_URL,
    };
  }
};

// Kiểm tra trạng thái backend server
export const checkBackendStatus = async () => {
  // Tạo danh sách URLs để thử kết nối
  const possibleBaseUrls = [
    BASE_URL,
    "http://localhost:9999",
    "http://127.0.0.1:9999",
    "http://10.0.2.2:9999",
    // Thêm nhiều địa chỉ IP phổ biến của mạng nội bộ
    "http://192.168.1.2:9999",
    "http://192.168.1.3:9999",
    "http://192.168.1.4:9999",
    "http://192.168.1.5:9999",
    "http://192.168.1.10:9999",
    "http://192.168.1.18:9999",
    "http://192.168.1.19:9999",
    "http://192.168.1.100:9999",
    "http://192.168.0.1:9999",
    "http://192.168.0.10:9999",
    "http://192.168.0.100:9999",
  ];

  const results = [];

  for (const baseUrl of possibleBaseUrls) {
    try {
      console.log(`Đang kiểm tra server tại: ${baseUrl}`);

      // Không sử dụng api instance vì chúng ta đang kiểm tra nhiều URLs khác nhau
      const response = await axios.get(`${baseUrl}`, {
        timeout: 3000,
        validateStatus: () => true, // Chấp nhận mọi mã trạng thái
      });

      results.push({
        url: baseUrl,
        status: response.status,
        working: response.status < 500, // Coi bất kỳ phản hồi nào dưới 500 là "working"
        responseSize: response.data ? JSON.stringify(response.data).length : 0,
      });

      console.log(
        `Server tại ${baseUrl} đã phản hồi với mã: ${response.status}`
      );
    } catch (error) {
      console.log(`Không thể kết nối tới ${baseUrl}: ${error.message}`);
      results.push({
        url: baseUrl,
        working: false,
        error: error.message,
      });
    }
  }

  // Tìm URL đầu tiên đang hoạt động
  const workingServer = results.find((result) => result.working);

  return {
    allResults: results,
    workingServer: workingServer || null,
    recommendedBaseUrl: workingServer ? workingServer.url + "/api" : null,
  };
};

// Hàm đăng nhập sử dụng Fetch API thay vì Axios (backup)
export const loginUserWithFetch = async (email, password) => {
  try {
    console.log("Đang đăng nhập với Fetch API:", `${BASE_URL}/api/auth/login`);

    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw { response: { status: response.status, data } };
    }

    return data;
  } catch (error) {
    console.error("Lỗi đăng nhập với Fetch API:", error);
    throw error;
  }
};

// Thử với nhiều cấu hình URL khác nhau để xác định vấn đề
export const tryMultipleLoginEndpoints = async (email, password) => {
  const possibleUrls = [
    `${BASE_URL}/api/auth/login`,
    `http://localhost:9999/api/auth/login`,
    `http://127.0.0.1:9999/api/auth/login`,
    `http://10.0.2.2:9999/api/auth/login`,
    // Nếu bạn biết chính xác địa chỉ IP của máy chủ, thêm vào đây
    `http://192.168.1.18:9999/api/auth/login`,
    `http://192.168.1.19:9999/api/auth/login`,
  ];

  const results = [];

  for (const url of possibleUrls) {
    try {
      console.log(`Đang thử đăng nhập với URL: ${url}`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        timeout: 3000, // Thời gian timeout ngắn để kiểm tra nhanh
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { text: responseText };
      }

      results.push({
        url,
        success: response.ok,
        status: response.status,
        data,
      });

      if (response.ok) {
        console.log(`✅ Thành công với URL: ${url}`);
        return { successUrl: url, data };
      }
    } catch (error) {
      console.log(`❌ Lỗi với URL ${url}:`, error.message);
      results.push({
        url,
        success: false,
        error: error.message,
      });
    }
  }

  console.log("Kết quả thử kết nối các endpoints:", results);
  throw new Error("Không thể kết nối đến bất kỳ endpoint đăng nhập nào");
};

// Chú thích: Chức năng cập nhật API_BASE_URL đã được định nghĩa trước đó trong file này
// (xem phần export const updateApiBaseUrl)

// Tạo giỏ hàng mới cho user nếu chưa có
export const createCart = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      console.error("Không tìm thấy token! Vui lòng đăng nhập.");
      return null;
    }

    // Lấy thông tin người dùng hiện tại
    let userId = null;
    try {
      const userResponse = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (userResponse && userResponse.data) {
        userId = userResponse.data._id || userResponse.data.id;
      } else {
        // Nếu không lấy được thông tin từ API, thử từ AsyncStorage
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          userId = user._id || user.id;
        }
      }
    } catch (e) {
      console.error("Lỗi khi lấy thông tin user cho createCart:", e);
    }

    if (!userId) {
      throw new Error("Không tìm thấy thông tin người dùng");
    }

    const response = await api.post(
      "/cart/create",
      { user_id: userId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("Kết quả tạo giỏ hàng:", response.data);

    return {
      success: true,
      message: response.data.message,
      data: response.data.cart,
    };
  } catch (error) {
    console.error("Lỗi API createCart:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tạo giỏ hàng",
    };
  }
};

// Kiểm tra trạng thái thanh toán
export const checkPaymentStatus = async (orderId, forceMarkAsPaid = false) => {
  try {
    // Validate input
    if (!orderId) {
      console.error("❌ Missing orderId in checkPaymentStatus");
      return {
        success: false,
        paid: false,
        message: "Thiếu thông tin đơn hàng!",
      };
    }

    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Không tìm thấy token!");

    console.log(
      "Kiểm tra trạng thái thanh toán cho đơn hàng:",
      orderId,
      "forceMarkAsPaid:",
      forceMarkAsPaid
    );

    if (forceMarkAsPaid) {
      // Trường hợp thanh toán ngay - gọi API đánh dấu đã thanh toán
      console.log(
        "🔄 Đánh dấu thanh toán thành công trực tiếp cho đơn hàng:",
        orderId
      );

      try {
        const response = await api.post(
          `/payment/mark-as-paid/${orderId}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("✅ Kết quả đánh dấu thanh toán:", response.data);
        return {
          success: true,
          paid: true,
          message: "Đơn hàng đã được đánh dấu là đã thanh toán",
        };
      } catch (markError) {
        console.error(
          "❌ Lỗi khi đánh dấu thanh toán:",
          markError.response?.data || markError.message
        );
        throw markError; // Re-throw để catch bên ngoài xử lý
      }
    } else {
      // Trường hợp thông thường - kiểm tra trạng thái thanh toán
      try {
        const response = await api.get(`/payment/check-status/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("🔍 Kết quả kiểm tra thanh toán:", response.data);
        return response.data;
      } catch (checkError) {
        console.error(
          "❌ Lỗi khi kiểm tra trạng thái:",
          checkError.response?.data || checkError.message
        );
        throw checkError; // Re-throw để catch bên ngoài xử lý
      }
    }
  } catch (error) {
    console.error(
      "❌ Lỗi khi kiểm tra trạng thái thanh toán:",
      error.response?.data || error.message
    );
    // Trả về chi tiết lỗi đầy đủ hơn để giúp debug
    return {
      success: false,
      paid: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Không thể kiểm tra trạng thái thanh toán",
      error: {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
      },
    };
  }
};
