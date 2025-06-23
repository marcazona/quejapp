import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
  StatusBar,
  PanResponder,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, MoveVertical as MoreVertical, Send, Star, Gift, User, Globe, Eye, Smile, Frown, Meh, X, Plus } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MIN_SIDEBAR_WIDTH = 250;
const MAX_SIDEBAR_WIDTH = SCREEN_WIDTH * 0.5;

interface Customer {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  phone?: string;
  totalSpent: number;
  loyaltyPoints: number;
  lastActive: string;
  lastPageSeen: string;
  currentMood: 'happy' | 'neutral' | 'sad';
  sessionDuration: string;
  deviceType: string;
  location: string;
}

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isFromCustomer: boolean;
  isRead: boolean;
}

interface Conversation {
  id: string;
  customer: Customer;
  messages: Message[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'active' | 'resolved' | 'pending';
}

interface Company {
  id: string;
  name: string;
}

export default function ChatsScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isDragging, setIsDragging] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [customPointsAmount, setCustomPointsAmount] = useState('');

  // Initialize with mock data for testing
  useEffect(() => {
    const mockConversations: Conversation[] = [
      {
        id: '1',
        customer: {
          id: 'cust1',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
          phone: '+1-555-0123',
          totalSpent: 1250.00,
          loyaltyPoints: 340,
          lastActive: '2 minutes ago',
          lastPageSeen: '/products/wireless-headphones',
          currentMood: 'happy',
          sessionDuration: '12 minutes',
          deviceType: 'Desktop',
          location: 'New York, NY',
        },
        messages: [
          {
            id: 'msg1',
            text: 'Hi, I have a question about my recent order.',
            timestamp: '10:30 AM',
            isFromCustomer: true,
            isRead: true,
          },
          {
            id: 'msg2',
            text: 'Hello Sarah! I\'d be happy to help you with your order. What specific question do you have?',
            timestamp: '10:32 AM',
            isFromCustomer: false,
            isRead: true,
          },
          {
            id: 'msg3',
            text: 'I received the wrong size for one of the items. How can I exchange it?',
            timestamp: '10:35 AM',
            isFromCustomer: true,
            isRead: false,
          },
        ],
        lastMessage: 'I received the wrong size for one of the items. How can I exchange it?',
        lastMessageTime: '10:35 AM',
        unreadCount: 1,
        status: 'active',
      },
      {
        id: '2',
        customer: {
          id: 'cust2',
          name: 'Mike Chen',
          email: 'mike.chen@email.com',
          phone: '+1-555-0456',
          totalSpent: 890.50,
          loyaltyPoints: 125,
          lastActive: '15 minutes ago',
          lastPageSeen: '/order-tracking',
          currentMood: 'neutral',
          sessionDuration: '8 minutes',
          deviceType: 'Mobile',
          location: 'San Francisco, CA',
        },
        messages: [
          {
            id: 'msg4',
            text: 'When will my order be shipped?',
            timestamp: '9:45 AM',
            isFromCustomer: true,
            isRead: true,
          },
          {
            id: 'msg5',
            text: 'Hi Mike! Your order #12345 is being prepared and will ship within 24 hours. You\'ll receive a tracking number via email.',
            timestamp: '9:50 AM',
            isFromCustomer: false,
            isRead: true,
          },
          {
            id: 'msg6',
            text: 'Perfect, thank you for the quick response!',
            timestamp: '9:52 AM',
            isFromCustomer: true,
            isRead: true,
          },
        ],
        lastMessage: 'Perfect, thank you for the quick response!',
        lastMessageTime: '9:52 AM',
        unreadCount: 0,
        status: 'resolved',
      },
      {
        id: '3',
        customer: {
          id: 'cust3',
          name: 'Emma Davis',
          email: 'emma.davis@email.com',
          phone: '+1-555-0789',
          totalSpent: 2100.75,
          loyaltyPoints: 580,
          lastActive: '1 hour ago',
          lastPageSeen: '/premium-services',
          currentMood: 'happy',
          sessionDuration: '25 minutes',
          deviceType: 'Tablet',
          location: 'Chicago, IL',
        },
        messages: [
          {
            id: 'msg7',
            text: 'I\'m interested in your premium service package. Can you tell me more about it?',
            timestamp: '8:20 AM',
            isFromCustomer: true,
            isRead: true,
          },
          {
            id: 'msg8',
            text: 'Absolutely! Our premium package includes priority support, exclusive discounts, and early access to new products. Would you like me to send you the detailed brochure?',
            timestamp: '8:25 AM',
            isFromCustomer: false,
            isRead: true,
          },
        ],
        lastMessage: 'Absolutely! Our premium package includes priority support, exclusive discounts, and early access to new products. Would you like me to send you the detailed brochure?',
        lastMessageTime: '8:25 AM',
        unreadCount: 0,
        status: 'pending',
      },
      {
        id: '4',
        customer: {
          id: 'cust4',
          name: 'Alex Rodriguez',
          email: 'alex.rodriguez@email.com',
          phone: '+1-555-0321',
          totalSpent: 450.25,
          loyaltyPoints: 95,
          lastActive: '3 hours ago',
          lastPageSeen: '/account/billing',
          currentMood: 'sad',
          sessionDuration: '5 minutes',
          deviceType: 'Mobile',
          location: 'Miami, FL',
        },
        messages: [
          {
            id: 'msg9',
            text: 'Hi, I need to update my billing address.',
            timestamp: 'Yesterday 4:30 PM',
            isFromCustomer: true,
            isRead: true,
          },
          {
            id: 'msg10',
            text: 'I can help you with that! Please provide your new billing address and I\'ll update it in our system.',
            timestamp: 'Yesterday 4:35 PM',
            isFromCustomer: false,
            isRead: true,
          },
          {
            id: 'msg11',
            text: 'My new address is 123 Oak Street, Springfield, IL 62701',
            timestamp: 'Yesterday 4:40 PM',
            isFromCustomer: true,
            isRead: false,
          },
        ],
        lastMessage: 'My new address is 123 Oak Street, Springfield, IL 62701',
        lastMessageTime: 'Yesterday 4:40 PM',
        unreadCount: 1,
        status: 'active',
      },
    ];

    setConversations(mockConversations);
    
    // Set company info
    setCompany({
      id: '1',
      name: 'TechCorp Solutions',
    });
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isFromCustomer: false,
      isRead: true,
    };

    const updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, message],
      lastMessage: message.text,
      lastMessageTime: message.timestamp,
    };

    setSelectedConversation(updatedConversation);
    setConversations(prev =>
      prev.map(conv => conv.id === selectedConversation.id ? updatedConversation : conv)
    );
    setNewMessage('');
  };

  const handleAwardCoins = (customerId: string, amount: number) => {
    if (!selectedConversation) return;

    const updatedCustomer = {
      ...selectedConversation.customer,
      loyaltyPoints: selectedConversation.customer.loyaltyPoints + amount
    };

    const updatedConversation = {
      ...selectedConversation,
      customer: updatedCustomer
    };
    
    setSelectedConversation(updatedConversation);
    setConversations(prev => 
      prev.map(conv => conv.id === selectedConversation.id ? updatedConversation : conv)
    );

    Alert.alert('Success', `Awarded ${amount} loyalty points to ${selectedConversation.customer.name}`);
  };

  const handleCustomPointsAward = () => {
    if (!selectedConversation || !customPointsAmount.trim()) return;
    
    const amount = parseInt(customPointsAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive number');
      return;
    }
    
    if (amount > 1000) {
      Alert.alert('Amount Too High', 'Maximum award amount is 1000 points');
      return;
    }
    
    handleAwardCoins(selectedConversation.customer.id, amount);
    setCustomPointsAmount('');
    setShowPointsModal(false);
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'happy': return <Smile size={16} color="#27AE60" />;
      case 'sad': return <Frown size={16} color="#E74C3C" />;
      case 'neutral': return <Meh size={16} color="#F39C12" />;
      default: return <Meh size={16} color="#666666" />;
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'happy': return '#27AE60';
      case 'sad': return '#E74C3C';
      case 'neutral': return '#F39C12';
      default: return '#666666';
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (evt, gestureState) => {
        const newWidth = sidebarWidth + gestureState.dx;
        if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
          setSidebarWidth(newWidth);
        }
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
    })
  ).current;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#27AE60';
      case 'resolved': return '#95A5A6';
      case 'pending': return '#F39C12';
      default: return '#666666';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Customer Chats</Text>
          <Text style={styles.headerSubtitle}>
            {company?.name || 'Company'} Support
          </Text>
        </View>
        
        <TouchableOpacity style={styles.headerAction}>
          <MoreVertical size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Conversations Sidebar */}
        <View style={[styles.sidebar, { width: sidebarWidth }]}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Conversations</Text>
            <Text style={styles.conversationCount}>{conversations.length}</Text>
          </View>
          
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.conversationItem,
                  selectedConversation?.id === item.id && styles.selectedConversation
                ]}
                onPress={() => setSelectedConversation(item)}
              >
                <View style={styles.conversationHeader}>
                  <View style={styles.customerAvatar}>
                    <User size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.conversationInfo}>
                    <View style={styles.conversationTopRow}>
                      <Text style={styles.customerName} numberOfLines={1}>
                        {item.customer.name}
                      </Text>
                      <Text style={styles.messageTime}>{item.lastMessageTime}</Text>
                    </View>
                    <Text style={styles.lastMessage} numberOfLines={2}>
                      {item.lastMessage}
                    </Text>
                    <View style={styles.conversationMeta}>
                      <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
                      <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                  </View>
                </View>
                
                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Resize Handle */}
        <View
          style={[styles.resizeHandle, isDragging && styles.resizeHandleActive]}
          {...panResponder.panHandlers}
        >
          <View style={styles.resizeIndicator} />
        </View>

        {/* Main Chat Area */}
        <View style={styles.mainArea}>
          {selectedConversation ? (
            <View style={styles.chatContainer}>
              {/* Chat Messages Area */}
              <View style={styles.chatMessagesArea}>
                {/* Chat Header */}
                <View style={styles.chatHeader}>
                  <View style={styles.chatHeaderLeft}>
                    <View style={styles.chatAvatar}>
                      <User size={24} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={styles.chatHeaderName}>
                        {selectedConversation.customer.name}
                      </Text>
                      <Text style={styles.chatHeaderStatus}>
                        Last active: {selectedConversation.customer.lastActive}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.chatStatusBadge, { backgroundColor: getStatusColor(selectedConversation.status) }]}>
                    <Text style={styles.chatStatusText}>{selectedConversation.status.toUpperCase()}</Text>
                  </View>
                </View>

                {/* Messages */}
                <FlatList
                  data={selectedConversation.messages}
                  keyExtractor={(item) => item.id}
                  style={styles.messagesList}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <View
                      style={[
                        styles.messageContainer,
                        item.isFromCustomer ? styles.customerMessage : styles.supportMessage
                      ]}
                    >
                      <Text style={styles.messageText}>{item.text}</Text>
                      <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
                    </View>
                  )}
                />

                {/* Message Input */}
                <View style={styles.messageInput}>
                  <TextInput
                    style={styles.textInput}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Type your message..."
                    placeholderTextColor="#666"
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity
                    style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
                    onPress={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Customer Info Panel */}
              <View style={styles.customerInfoPanel}>
                <Text style={styles.customerInfoTitle}>Customer Details</Text>
                
                <View style={styles.customerCard}>
                  <View style={styles.customerCardHeader}>
                    <View style={styles.customerCardAvatar}>
                      <User size={32} color="#FFFFFF" />
                    </View>
                    <View style={styles.customerCardInfo}>
                      <Text style={styles.customerCardName}>
                        {selectedConversation.customer.name}
                      </Text>
                      <Text style={styles.customerCardEmail}>
                        {selectedConversation.customer.email}
                      </Text>
                      {selectedConversation.customer.phone && (
                        <Text style={styles.customerCardPhone}>
                          {selectedConversation.customer.phone}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Current Session Info */}
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionInfoTitle}>Current Session</Text>
                    
                    <View style={styles.sessionItem}>
                      <Globe size={14} color="#5ce1e6" />
                      <View style={styles.sessionItemContent}>
                        <Text style={styles.sessionItemLabel}>Last Page Seen</Text>
                        <Text style={styles.sessionItemValue}>
                          {selectedConversation.customer.lastPageSeen}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.sessionItem}>
                      <View style={styles.moodIconContainer}>
                        {getMoodIcon(selectedConversation.customer.currentMood)}
                      </View>
                      <View style={styles.sessionItemContent}>
                        <Text style={styles.sessionItemLabel}>Current Mood</Text>
                        <Text style={[
                          styles.sessionItemValue,
                          { color: getMoodColor(selectedConversation.customer.currentMood) }
                        ]}>
                          {selectedConversation.customer.currentMood.charAt(0).toUpperCase() + 
                           selectedConversation.customer.currentMood.slice(1)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.sessionItem}>
                      <Eye size={14} color="#9B59B6" />
                      <View style={styles.sessionItemContent}>
                        <Text style={styles.sessionItemLabel}>Session Duration</Text>
                        <Text style={styles.sessionItemValue}>
                          {selectedConversation.customer.sessionDuration}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.sessionItem}>
                      <User size={14} color="#3498DB" />
                      <View style={styles.sessionItemContent}>
                        <Text style={styles.sessionItemLabel}>Device & Location</Text>
                        <Text style={styles.sessionItemValue}>
                          {selectedConversation.customer.deviceType} • {selectedConversation.customer.location}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.customerStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Total Spent</Text>
                      <Text style={styles.statValue}>
                        ${selectedConversation.customer.totalSpent.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Loyalty Points</Text>
                      <Text style={styles.statValue}>
                        {selectedConversation.customer.loyaltyPoints}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Last Active</Text>
                      <Text style={styles.statValue}>
                        {selectedConversation.customer.lastActive}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.customerActions}>
                    <Text style={styles.actionsTitle}>Award Loyalty Points</Text>
                    
                    <View style={styles.quickActions}>
                      <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={() => handleAwardCoins(selectedConversation.customer.id, 5)}
                      >
                        <Text style={styles.quickActionText}>+5</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={() => handleAwardCoins(selectedConversation.customer.id, 10)}
                      >
                        <Text style={styles.quickActionText}>+10</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={() => handleAwardCoins(selectedConversation.customer.id, 25)}
                      >
                        <Text style={styles.quickActionText}>+25</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.quickActionButton, styles.customActionButton]}
                        onPress={() => setShowPointsModal(true)}
                      >
                        <Plus size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.primaryActionButton}
                      onPress={() => handleAwardCoins(selectedConversation.customer.id, 50)}
                    >
                      <Gift size={16} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Award 50 Points (Bonus)</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noChatSelected}>
              <User size={64} color="#666666" />
              <Text style={styles.noChatText}>Select a conversation to start chatting</Text>
              <Text style={styles.noChatSubtext}>
                Choose from {conversations.length} active conversations
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Custom Points Award Modal */}
      <Modal
        visible={showPointsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPointsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pointsModal}>
            <View style={styles.pointsModalHeader}>
              <Text style={styles.pointsModalTitle}>Award Custom Points</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPointsModal(false)}
              >
                <X size={20} color="#666666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.pointsModalSubtitle}>
              Award points to {selectedConversation?.customer.name}
            </Text>
            
            <View style={styles.pointsInputContainer}>
              <TextInput
                style={styles.pointsInput}
                value={customPointsAmount}
                onChangeText={setCustomPointsAmount}
                placeholder="Enter amount (1-1000)"
                placeholderTextColor="#666666"
                keyboardType="numeric"
                maxLength={4}
                autoFocus
              />
              <Text style={styles.pointsInputLabel}>Points</Text>
            </View>
            
            <View style={styles.pointsModalActions}>
              <TouchableOpacity
                style={styles.pointsModalCancel}
                onPress={() => setShowPointsModal(false)}
              >
                <Text style={styles.pointsModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.pointsModalConfirm,
                  !customPointsAmount.trim() && styles.pointsModalConfirmDisabled
                ]}
                onPress={handleCustomPointsAward}
                disabled={!customPointsAmount.trim()}
              >
                <Gift size={16} color="#FFFFFF" />
                <Text style={styles.pointsModalConfirmText}>Award Points</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    marginTop: 60, // Account for tab bar
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 2,
  },
  headerAction: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    backgroundColor: '#1A1A1A',
    borderRightWidth: 1,
    borderRightColor: '#2A2A2A',
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  conversationCount: {
    fontSize: 14,
    color: '#5ce1e6',
    fontWeight: '600',
  },
  conversationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    position: 'relative',
  },
  selectedConversation: {
    backgroundColor: '#2A2A2A',
    borderRightWidth: 3,
    borderRightColor: '#5ce1e6',
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  messageTime: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
    lineHeight: 18,
  },
  conversationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#999999',
    textTransform: 'capitalize',
  },
  unreadBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#5ce1e6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resizeHandle: {
    width: 4,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'col-resize',
  },
  resizeHandleActive: {
    backgroundColor: '#5ce1e6',
  },
  resizeIndicator: {
    width: 2,
    height: 40,
    backgroundColor: '#666666',
    borderRadius: 1,
  },
  mainArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  chatContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  chatMessagesArea: {
    flex: 2,
    backgroundColor: '#0A0A0A',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatHeaderName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chatHeaderStatus: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  chatStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chatStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '75%',
  },
  customerMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
  },
  supportMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#5ce1e6',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
  },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  messageTimestamp: {
    fontSize: 12,
    color: '#CCCCCC',
    marginTop: 6,
    opacity: 0.7,
  },
  messageInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  sendButton: {
    backgroundColor: '#5ce1e6',
    borderRadius: 20,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#3A3A3A',
    opacity: 0.5,
  },
  customerInfoPanel: {
    width: 300,
    backgroundColor: '#1A1A1A',
    borderLeftWidth: 1,
    borderLeftColor: '#2A2A2A',
    padding: 16,
  },
  customerInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  customerCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  customerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerCardAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerCardInfo: {
    flex: 1,
  },
  customerCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  customerCardEmail: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 2,
  },
  customerCardPhone: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  sessionInfo: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  sessionInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5ce1e6',
    marginBottom: 12,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sessionItemContent: {
    flex: 1,
    marginLeft: 8,
  },
  sessionItemLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 2,
  },
  sessionItemValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  moodIconContainer: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerStats: {
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  statLabel: {
    fontSize: 14,
    color: '#999999',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  customerActions: {
    gap: 12,
  },
  actionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#3A3A3A',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  customActionButton: {
    backgroundColor: '#5ce1e6',
    borderColor: '#5ce1e6',
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5ce1e6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noChatSelected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noChatText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  noChatSubtext: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pointsModal: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  pointsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pointsModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    padding: 4,
  },
  pointsModalSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 20,
  },
  pointsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  pointsInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pointsInputLabel: {
    fontSize: 14,
    color: '#999999',
    marginLeft: 8,
  },
  pointsModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  pointsModalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  pointsModalCancelText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: '600',
  },
  pointsModalConfirm: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#5ce1e6',
    gap: 8,
  },
  pointsModalConfirmDisabled: {
    backgroundColor: '#3A3A3A',
    opacity: 0.5,
  },
  pointsModalConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});