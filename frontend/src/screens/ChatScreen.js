import React from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import ChatBox from "../components/chat/ChatBox";

const ChatScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      <View style={styles.content}>
        <ChatBox />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
  },
});

export default ChatScreen;
