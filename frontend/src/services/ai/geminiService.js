import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "@env";

// Khởi tạo Google Generative AI
let geminiModel = null;

/**
 * Khởi tạo model Gemini
 */
export const initGeminiModel = () => {
  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_gemini_api_key_here") {
      console.error("Invalid or missing Gemini API key in .env file");
      return false;
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Thử khởi tạo model Gemini 1.5 Flash (rẻ hơn và nhanh hơn)
    try {
      geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log("Gemini Flash (gemini-1.5-flash) initialized successfully");
      return true;
    } catch (flashError) {
      console.warn(
        "Failed to initialize gemini-1.5-flash, trying fallback to gemini-pro:",
        flashError
      );

      // Fallback to gemini-pro if flash is not available
      try {
        geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        console.log("Fallback to Gemini Pro successful");
        return true;
      } catch (proError) {
        console.error("Failed to initialize fallback model:", proError);
        return false;
      }
    }
  } catch (error) {
    console.error("Error initializing Gemini model:", error);
    return false;
  }
};

/**
 * Gửi tin nhắn đến Gemini và nhận phản hồi
 * @param {string} message - Tin nhắn từ người dùng
 * @returns {Promise<string>} - Phản hồi từ Gemini
 */
export const sendMessageToGemini = async (message) => {
  try {
    // Nếu chưa có model hoặc model đã bị lỗi, thử khởi tạo lại
    if (!geminiModel) {
      const initSuccess = initGeminiModel();
      if (!initSuccess) {
        return "Không thể kết nối với dịch vụ AI. Vui lòng kiểm tra cài đặt API key và kết nối mạng của bạn.";
      }
    }

    // Tạo nội dung bối cảnh để Gemini hiểu đây là trợ lý cho marketplace source code
    const prompt = `
    Bạn là trợ lý AI của marketplace source code. Người dùng có thể mua bán các source code cho phát triển web/app.
    
    Nếu người dùng hỏi về cách sử dụng source code, hãy tư vấn:
    - Kiểm tra các file README hoặc tài liệu hướng dẫn trong source code
    - Kiểm tra yêu cầu hệ thống và dependencies
    - Các bước cài đặt và chạy ứng dụng thông thường
    
    Nếu người dùng gặp vấn đề kỹ thuật, hãy gợi ý các giải pháp thông dụng.
    
    Hãy trả lời ngắn gọn, súc tích nhưng đầy đủ thông tin.
    
    Câu hỏi của người dùng là: ${message}
    `;

    try {
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Đảm bảo phản hồi không rỗng
      if (!text || text.trim() === "") {
        throw new Error("Empty response from AI");
      }

      return text;
    } catch (aiError) {
      console.error("Error generating AI content:", aiError);

      // Thử lại một lần nữa với prompt đơn giản hơn nếu lỗi
      try {
        const simpleResult = await geminiModel.generateContent(
          `Trả lời ngắn gọn và hữu ích cho câu hỏi này: ${message}`
        );
        const simpleResponse = await simpleResult.response;
        return (
          simpleResponse.text() ||
          "Xin lỗi, tôi không thể xử lý yêu cầu phức tạp này."
        );
      } catch (retryError) {
        throw retryError; // Ném lỗi để xử lý ở catch bên ngoài
      }
    }
  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    return "Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này. Vui lòng thử lại sau hoặc kiểm tra kết nối mạng của bạn.";
  }
};

export default {
  initGeminiModel,
  sendMessageToGemini,
};
