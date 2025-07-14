# Source Code Marketplace Project

This is a marketplace application for buying and selling source code packages, built with React Native/Expo for the frontend and Node.js/Express for the backend.

## Getting Started

### Running the Backend

1. Navigate to the backend directory

   ```bash
   cd ../BE_MMA
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Start the backend server

   ```bash
   npm start
   ```

   The server will run on port 9999 by default.

### Running the Frontend

1. Navigate to the frontend directory

   ```bash
   cd ../frontend
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Start the frontend

   ```bash
   npm run start
   ```

   or

   ```bash
   npx expo start
   ```

## Important Notes

- Make sure to update the `API_BASE_URL` in `src/services/api.js` to match your local IP address
- The default backend port is 9999
- You need to have both backend and frontend running for the application to work properly

## Features

- Browse source code packages by category
- Search for specific source code
- Upload source code packages as a seller
- Purchase and download source code
- Admin dashboard for managing products and orders
- User authentication and profile management

## Technology Stack

- Frontend: React Native with Expo
- Backend: Node.js with Express
- Database: MongoDB
- Authentication: JWT
- File Storage: Local filesystem

## App Screenshots

- Home Screen: Browse source code packages
- Product Detail: View source code details and purchase options
- Cart: Manage selected items
- Checkout: Complete the purchase process
- Admin: Manage products and orders

## AI Chat Assistant Feature

This application includes an AI Chat assistant powered by Google's Gemini Flash model (gemini-1.5-flash) to help users with questions about source code. The system automatically falls back to Gemini Pro if Flash is not available.

### Setup

1. Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/)

2. Create or edit the `.env` file in the frontend directory:

   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Install the required dependencies:
   ```bash
   npm install @google/generative-ai react-native-dotenv --force
   ```

### Using the AI Chat

- Access the chat from the bottom navigation tabs
- Or use the floating chat button on the Home screen
- Ask questions about:
  - How to use specific source code
  - General programming queries
  - Troubleshooting common issues

### Note

The AI assistant requires a valid Gemini API key to function. If you encounter any issues with the chat feature, check your API key configuration in the `.env` file.
