# API Documentation - Source Code Marketplace

## Overview

Backend API cho nền tảng bán source code với các tính năng upload, download, và quản lý sản phẩm.

## Authentication

Sử dụng JWT token trong header: `Authorization: Bearer TOKEN`

## Categories

```json
{
  "67bd34e69680bd56be08e176": "Mobile App",
  "67bd34f89680bd56be08e178": "Web Development",
  "67bd3f66196f4a65378cd053": "Desktop App",
  "67cf9c0755bcd1ae8e8c0b5b": "Game Development"
}
```

## Product APIs

### 1. Tạo sản phẩm mới

```http
POST /api/product/create
Content-Type: multipart/form-data

Body:
- name: "React Native Weather App"
- category_id: "67bd34e69680bd56be08e176"
- author: "Developer XYZ"
- stock: 10
- description: "Complete weather app with API integration"
- price: 299000
- image: [FILE] (ảnh preview .jpg/.png)
- file: [FILE] (source code .zip/.rar)
```

### 2. Lấy tất cả sản phẩm

```http
GET /api/product/
```

### 3. Lấy chi tiết sản phẩm

```http
GET /api/product/detail/:id
```

### 4. Tìm kiếm sản phẩm

```http
GET /api/product/search?name=React&category_id=CATEGORY_ID&minPrice=100000&maxPrice=500000
```

### 5. Cập nhật sản phẩm

```http
PUT /api/product/:id
Content-Type: multipart/form-data

Body:
- name: "Updated Name" (optional)
- image: [FILE] (optional)
- file: [FILE] (optional)
- ... (other fields)
```

### 6. Xóa sản phẩm

```http
DELETE /api/product/:id
```

### 7. Kiểm tra quyền download

```http
GET /api/product/check-access/:id?user_id=USER_ID

Response:
{
  "hasAccess": true,
  "message": "Bạn có quyền download file này!",
  "downloadUrl": "/api/product/download/PRODUCT_ID?user_id=USER_ID"
}
```

### 8. Download source code

```http
GET /api/product/download/:id?user_id=USER_ID
```

## File Access

### Static Files

- **Images**: `GET /uploads/filename.jpg` (công khai)
- **Source Files**: Chỉ qua API download (có kiểm soát quyền)

## Sample Products

```json
[
  {
    "name": "React Native Weather App",
    "category": "Mobile App",
    "price": 145000,
    "file": "/uploads/file-test.zip"
  },
  {
    "name": "Vue.js E-commerce Dashboard",
    "category": "Web Development",
    "price": 145000,
    "file": "/uploads/file-test.zip"
  }
]
```

## Error Handling

- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid token)
- **403**: Forbidden (no access rights)
- **404**: Not Found
- **500**: Server Error
