import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "@env";

let geminiModel = null;

export const initGeminiModel = async () => {
  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_gemini_api_key_here") {
      console.error("Missing or invalid Gemini API Key");
      return false;
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    try {
      geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log("Gemini Flash model initialized.");
      return true;
    } catch (err) {
      console.warn("Fallback to gemini-pro due to error:", err);
      geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });
      console.log("Gemini Pro model initialized.");
      return true;
    }
  } catch (error) {
    console.error("Gemini initialization failed:", error);
    return false;
  }
};

export const sendMessageToGemini = async (message) => {
  try {
    if (!geminiModel) {
      const success = await initGeminiModel();
      if (!success) {
        return "Không thể kết nối với AI. Vui lòng kiểm tra cấu hình.";
      }
    }

    const prompt = `Bạn là trợ lý AI cho lập trình viên source code. Hãy trả lời ngắn gọn, dễ hiểu:\n\n${message}`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text || "Không có phản hồi từ AI.";
  } catch (error) {
    console.error("Gemini response error:", error);
    return "Xin lỗi, tôi không thể xử lý yêu cầu lúc này.";
  }
};
