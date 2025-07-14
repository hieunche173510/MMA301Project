// Test API endpoints for Source Code Products

## 1. Tạo sản phẩm mới (Source Code)

POST /api/product/create
Content-Type: multipart/form-data

Body (form-data):

- name: "React Native Todo App"
- category_id: "67bd34f89680bd56be08e178"
- author: "Developer XYZ"
- stock: 10
- description: "Complete React Native Todo App with AsyncStorage"
- price: 299000
- image: [file] (ảnh preview .jpg/.png)
- file: [file] (source code .zip/.rar)

## 2. Lấy chi tiết sản phẩm

GET /api/product/detail/:id

## 3. Kiểm tra quyền download

GET /api/product/check-access/:id?user_id=USER_ID

## 4. Download file source code

GET /api/product/download/:id?user_id=USER_ID

## 5. Cập nhật sản phẩm

PUT /api/product/:id
Content-Type: multipart/form-data

Body (form-data):

- name: "React Native Todo App v2"
- image: [file] (ảnh mới - optional)
- file: [file] (source code mới - optional)
- ... (các field khác)

## 6. Truy cập file tĩnh

GET /uploads/filename.zip (truy cập trực tiếp file)
GET /uploads/filename.jpg (truy cập ảnh)
