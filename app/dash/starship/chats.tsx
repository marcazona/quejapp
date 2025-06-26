import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Send, MoveVertical as MoreVertical, Phone, Video } from 'lucide-react-native';

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
  sender?: string;
}

export default function ChatsScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Welcome to Starship Communications! How can I assist you today?',
      timestamp: new Date(Date.now() - 3600000),
      isOwn: false,
      sender: 'Mission Control',
    },
    {
      id: '2',
      text: 'Thanks! I need an update on the current mission status.',
      timestamp: new Date(Date.now() - 3000000),
      isOwn: true,
    },
    {
      id: '3',
      text: 'All systems are nominal. We are currently in orbit and preparing for the next phase.',
      timestamp: new Date(Date.now() - 2400000),
      isOwn: false,
      sender: 'Mission Control',
    },
    {
      id: '4',
      text: 'Perfect! What about the weather conditions for landing?',
      timestamp: new Date(Date.now() - 1800000),
      isOwn: true,
    },
    {
      id: '5',
      text: 'Weather looks favorable. Winds at 5 knots, visibility excellent.',
      timestamp: new Date(Date.now() - 1200000),
      isOwn: false,
      sender: 'Mission Control',
    },
  ]);
  
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        timestamp: new Date(),
        isOwn: true,
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
      
      // Simulate response after a delay
      setTimeout(() => {
        const response: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Message received. Processing your request...',
          timestamp: new Date(),
          isOwn: false,
          sender: 'Mission Control',
        };
        setMessages(prev => [...prev, response]);
      }, 1500);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isOwn ? styles.ownMessage : styles.otherMessage,
      ]}
    >
      {!message.isOwn && message.sender && (
        <Text style={styles.senderName}>{message.sender}</Text>
      )}
      <View
        style={[
          styles.messageBubble,
          message.isOwn ? styles.ownBubble : styles.otherBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.isOwn ? styles.ownMessageText : styles.otherMessageText,
          ]}
        >
          {message.text}
        </Text>
      </View>
      <Text
        style={[
          styles.messageTimestamp,
          message.isOwn ? styles.ownTimestamp : styles.otherTimestamp,
        ]}
      >
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.statusIndicator} />
          <View>
            <Text style={styles.headerTitle}>Mission Control</Text>
            <Text style={styles.headerSubtitle}>Online • Starship-1</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Phone size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Video size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <MoreVertical size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#666666"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Send
              size={20}
              color={inputText.trim() ? '#FFFFFF' : '#666666'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00FF88',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#2A2A2A',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#FFFFFF',
  },
  messageTimestamp: {
    fontSize: 12,
    marginTop: 6,
    opacity: 0.7,
  },
  ownTimestamp: {
    color: '#CCCCCC',
    textAlign: 'right',
    marginRight: 12,
  },
  otherTimestamp: {
    color: '#CCCCCC',
    textAlign: 'left',
    marginLeft: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#007AFF',
  },
  sendButtonInactive: {
    backgroundColor: '#2A2A2A',
  },
});