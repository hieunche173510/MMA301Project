import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  initGeminiModel,
  sendMessageToGemini,
} from "../../services/ai/geminiService";

const ChatBox = () => {
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Xin chào! Tôi là trợ lý AI. Bạn có câu hỏi gì về source code không?",
      isUser: false,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    initGeminiModel();
  }, []);

  const handleSend = async () => {
    if (inputMessage.trim() === "") return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const reply = await sendMessageToGemini(inputMessage.trim());

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: reply,
        isUser: false,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại.",
          isUser: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.isUser ? styles.userBubble : styles.aiBubble,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>AI Assistant</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageListContent}
        style={styles.messageList}
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2196F3" />
          <Text style={styles.loadingText}>AI đang trả lời...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Nhập câu hỏi của bạn..."
          placeholderTextColor="#999"
          multiline
          onSubmitEditing={Keyboard.dismiss}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !inputMessage.trim() && styles.disabledButton,
          ]}
          onPress={handleSend}
          disabled={!inputMessage.trim()}
        >
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#2196F3",
    paddingVertical: 15,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#0d47a1",
  },
  headerText: { color: "white", fontSize: 18, fontWeight: "bold" },
  messageList: { flex: 1, paddingHorizontal: 10 },
  messageListContent: { paddingTop: 10, paddingBottom: 10 },
  messageBubble: {
    maxWidth: width * 0.75,
    padding: 12,
    borderRadius: 18,
    marginVertical: 5,
  },
  userBubble: {
    backgroundColor: "#2196F3",
    alignSelf: "flex-end",
    borderBottomRightRadius: 5,
  },
  aiBubble: {
    backgroundColor: "#E0E0E0",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 5,
  },
  messageText: { fontSize: 16, color: "#000" },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  loadingText: { marginLeft: 10, color: "#666", fontSize: 14 },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#2196F3",
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  disabledButton: { backgroundColor: "#B0BEC5" },
});

export default ChatBox;
