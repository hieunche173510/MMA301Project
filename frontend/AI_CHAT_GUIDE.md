# Hướng Dẫn Sử Dụng AI Chat

## Giới Thiệu

Tính năng AI Chat sử dụng model Gemini Flash (gemini-1.5-flash) của Google để tạo trợ lý AI giúp người dùng giải đáp các thắc mắc về source code, lập trình, và các vấn đề liên quan. Nếu model Flash không khả dụng, hệ thống sẽ tự động chuyển sang model Gemini Pro (gemini-pro) làm phương án dự phòng.

## Cài Đặt

1. **Tạo API Key**:

   - Truy cập [Google AI Studio](https://aistudio.google.com/)
   - Đăng nhập và tạo API Key mới
   - Copy API Key vừa tạo

2. **Cấu hình API Key**:
   - Mở file `.env` trong thư mục `frontend`
   - Thay thế giá trị mặc định bằng API Key của bạn:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

## Chạy Ứng Dụng

1. **Khởi động backend**:

   ```bash
   cd ../BE_MMA
   npm start
   ```

2. **Khởi động frontend**:

   ```bash
   cd ../frontend
   npm start
   ```

3. **Truy cập AI Chat**:
   - Nhấn vào tab "Chat" ở bottom navigation
   - Hoặc nhấn vào nút chat nổi (floating button) ở màn hình Home

## Cách Sử Dụng

1. **Nhập câu hỏi** vào khung chat và nhấn nút gửi
2. **AI sẽ phản hồi** với thông tin, hướng dẫn, hoặc giải pháp
3. **Các câu hỏi gợi ý**:
   - "Làm thế nào để cài đặt và chạy source code React Native?"
   - "Tôi gặp lỗi khi cài đặt dependencies, cần làm gì?"
   - "Tôi nên sử dụng source code nào cho ứng dụng học trực tuyến?"

## Xử Lý Sự Cố

- **Không kết nối được AI**:
  - Kiểm tra API key trong file .env và đảm bảo nó hợp lệ
  - Đảm bảo API key có quyền truy cập vào model Gemini Flash hoặc Gemini Pro
  - Kiểm tra giới hạn quota của API key
- **Phản hồi chậm**:
  - Đảm bảo kết nối internet ổn định
  - Model Flash thường phản hồi nhanh hơn so với các model khác
- **Lỗi khởi tạo**:
  - Khởi động lại ứng dụng và kiểm tra console để xem log lỗi
  - Xóa bộ nhớ cache của ứng dụng nếu cần

## Lưu Ý

- AI Chat sử dụng quota của API Key Gemini, nên sử dụng hợp lý
- Gemini Flash (gemini-1.5-flash) tiết kiệm chi phí hơn so với các model cũ
- Các câu trả lời được tạo tự động và có thể cần kiểm tra lại
- Không nên chia sẻ API Key với người khác
- Nếu model Flash không khả dụng, hệ thống sẽ tự động chuyển sang model Pro
