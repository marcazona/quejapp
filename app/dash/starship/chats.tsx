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
  Image,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, MoveVertical as MoreVertical, Send, Star, Gift, User, Globe, Eye, Smile, Frown, Meh, X, Plus, FileText, Clock, UserCheck, MessageSquare, Save } from 'lucide-react-native';
import { Search } from 'lucide-react-native';

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
  complianceHistory?: ComplianceEntry[];
}

interface ComplianceEntry {
  id: string;
  type: 'note' | 'status_change' | 'contact' | 'escalation';
  title: string;
  description: string;
  author: string;
  timestamp: string;
  metadata?: {
    oldStatus?: string;
    newStatus?: string;
    contactMethod?: string;
    priority?: string;
  };
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

interface ComplianceNote {
  id: string;
  customer_id: string;
  author: string;
  content: string;
  type: 'note' | 'status_change' | 'escalation' | 'resolution';
  timestamp: string;
  metadata?: {
    old_status?: string;
    new_status?: string;
    reason?: string;
  };
}

interface CustomerHistory {
  customer_id: string;
  conversations: Array<{
    id: string;
    date: string;
    status: string;
    messages_count: number;
    last_message: string;
    resolution_time?: string;
  }>;
  notes: ComplianceNote[];
  total_interactions: number;
  satisfaction_score: number;
  escalations_count: number;
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
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'open' | 'pending' | 'escalated' | 'closed'>('open');
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<CustomerHistory | null>(null);
  const [complianceSearchQuery, setComplianceSearchQuery] = useState('');
  const [newNote, setNewNote] = useState('');
  const [complianceHistory, setComplianceHistory] = useState<ComplianceEntry[]>([]);
  const [newComplianceNote, setNewComplianceNote] = useState('');

  // Initialize with mock data for testing
  useEffect(() => {
    const mockConversations: Conversation[] = [
      {
        id: '1',
        customer: {
          id: 'cust1',
          name: 'Sarah Johnson',
          avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
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
          complianceHistory: [
            {
              id: '1',
              type: 'contact',
              title: 'Initial Contact',
              description: 'Customer initiated chat regarding product inquiry',
              author: 'System',
              timestamp: '2024-01-15T10:30:00Z',
              metadata: {
                contactMethod: 'Live Chat'
              }
            },
            {
              id: '2',
              type: 'note',
              title: 'Customer Preference',
              description: 'Customer prefers email communication for follow-ups',
              author: 'John Smith',
              timestamp: '2024-01-15T10:45:00Z'
            },
            {
              id: '3',
              type: 'status_change',
              title: 'Status Updated',
              description: 'Conversation status changed from pending to active',
              author: 'Sarah Johnson',
              timestamp: '2024-01-15T11:00:00Z',
              metadata: {
                oldStatus: 'pending',
                newStatus: 'active'
              }
            }
          ]
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
        status: 'open',
      },
      {
        id: '2',
        customer: {
          id: 'cust2',
          name: 'Mike Chen',
          avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
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
          complianceHistory: [
            {
              id: '4',
              type: 'contact',
              title: 'Order Inquiry',
              description: 'Customer contacted regarding order status',
              author: 'System',
              timestamp: '2024-01-14T09:45:00Z',
              metadata: {
                contactMethod: 'Live Chat'
              }
            }
          ]
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
        status: 'closed',
      },
      {
        id: '3',
        customer: {
          id: 'cust3',
          name: 'Emma Davis',
          avatar: 'https://images.pexels.com/photos/1036622/pexels-photo-1036622.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
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
          complianceHistory: []
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
          avatar: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
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
          complianceHistory: []
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
        status: 'escalated',
      },
    ];

    setConversations(mockConversations);
    
    // Set company info
    setCompany({
      id: '1',
      name: 'TechCorp Solutions',
    });

    // Load compliance history for the first conversation
    if (mockConversations.length > 0) {
      setComplianceHistory(mockConversations[0].customer.complianceHistory || []);
    }
  }, []);

  // Update compliance history when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      setComplianceHistory(selectedConversation.customer.complianceHistory || []);
    }
  }, [selectedConversation]);

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

  const handleStatusChange = (newStatus: 'open' | 'pending' | 'escalated' | 'closed') => {
    if (!selectedConversation) return;
    
    const updatedConversation = {
      ...selectedConversation,
      status: newStatus
    };
    
    setSelectedConversation(updatedConversation);
    setConversations(prev => 
      prev.map(conv => conv.id === selectedConversation.id ? updatedConversation : conv)
    );
    
    setShowStatusModal(false);
    Alert.alert('Status Updated', `Conversation status changed to ${newStatus}`);
  };

  const handleComplianceClick = async () => {
    if (!selectedConversation) return;
    
    // Mock customer history data
    const mockHistory: CustomerHistory = {
      customer_id: selectedConversation.customer.id,
      conversations: [
        {
          id: 'conv_1',
          date: '2024-01-15',
          status: 'resolved',
          messages_count: 12,
          last_message: 'Thank you for your help!',
          resolution_time: '2h 15m',
        },
        {
          id: 'conv_2',
          date: '2024-01-10',
          status: 'resolved',
          messages_count: 8,
          last_message: 'Issue resolved successfully.',
          resolution_time: '1h 45m',
        },
        {
          id: 'conv_3',
          date: '2024-01-05',
          status: 'resolved',
          messages_count: 15,
          last_message: 'Perfect, everything works now.',
          resolution_time: '3h 20m',
        },
      ],
      notes: [
        {
          id: 'note_1',
          customer_id: selectedConversation.customer.id,
          author: 'John Smith',
          content: 'Customer is very satisfied with our service. Prefers email communication.',
          type: 'note',
          timestamp: '2024-01-15T14:30:00Z',
        },
        {
          id: 'note_2',
          customer_id: selectedConversation.customer.id,
          author: 'Sarah Johnson',
          content: 'Escalated to technical team due to complex integration issue.',
          type: 'escalation',
          timestamp: '2024-01-10T09:15:00Z',
          metadata: {
            reason: 'Technical complexity',
          },
        },
        {
          id: 'note_3',
          customer_id: selectedConversation.customer.id,
          author: 'Mike Davis',
          content: 'Status changed from pending to resolved after successful fix deployment.',
          type: 'status_change',
          timestamp: '2024-01-10T16:45:00Z',
          metadata: {
            old_status: 'pending',
            new_status: 'resolved',
          },
        },
      ],
      total_interactions: 3,
      satisfaction_score: 4.8,
      escalations_count: 1,
    };
    
    setCustomerHistory(mockHistory);
    setShowComplianceModal(true);
  };

  const handleAddComplianceNote = () => {
    if (!newComplianceNote.trim() || !customerHistory) return;
    
    const newNote: ComplianceNote = {
      id: `note_${Date.now()}`,
      customer_id: customerHistory.customer_id,
      author: 'Current User',
      content: newComplianceNote.trim(),
      type: 'note',
      timestamp: new Date().toISOString(),
    };
    
    setCustomerHistory(prev => prev ? {
      ...prev,
      notes: [newNote, ...prev.notes],
    } : null);
    
    setNewComplianceNote('');
    Alert.alert('Success', 'Compliance note added successfully');
  };

  const filteredHistory = customerHistory ? {
    ...customerHistory,
    conversations: customerHistory.conversations.filter(conv =>
      conv.last_message.toLowerCase().includes(complianceSearchQuery.toLowerCase()) ||
      conv.status.toLowerCase().includes(complianceSearchQuery.toLowerCase())
    ),
    notes: customerHistory.notes.filter(note =>
      note.content.toLowerCase().includes(complianceSearchQuery.toLowerCase()) ||
      note.author.toLowerCase().includes(complianceSearchQuery.toLowerCase())
    ),
  } : null;
  const handleAddNote = () => {
    if (!newNote.trim() || !selectedConversation) return;

    const note: ComplianceEntry = {
      id: Date.now().toString(),
      type: 'note',
      title: 'Customer Note',
      description: newNote.trim(),
      author: 'Current User',
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [note, ...complianceHistory];
    setComplianceHistory(updatedHistory);

    // Update the conversation with new compliance history
    const updatedConversation = {
      ...selectedConversation,
      customer: {
        ...selectedConversation.customer,
        complianceHistory: updatedHistory
      }
    };

    setSelectedConversation(updatedConversation);
    setConversations(prev =>
      prev.map(conv => conv.id === selectedConversation.id ? updatedConversation : conv)
    );

    setNewNote('');
    Alert.alert('Success', 'Note added successfully');
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

  const getComplianceIcon = (type: string) => {
    switch (type) {
      case 'note': return <MessageSquare size={16} color="#3498DB" />;
      case 'status_change': return <UserCheck size={16} color="#E67E22" />;
      case 'contact': return <User size={16} color="#27AE60" />;
      case 'escalation': return <AlertTriangle size={16} color="#E74C3C" />;
      default: return <FileText size={16} color="#666666" />;
    }
  };

  const formatComplianceTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
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
      case 'open': return '#27AE60';
      case 'closed': return '#95A5A6';
      case 'pending': return '#F39C12';
      case 'escalated': return '#E74C3C';
      default: return '#666666';
    }
  };

  return (
    <>
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
                  <TouchableOpacity 
                    style={[styles.chatStatusBadge, { backgroundColor: getStatusColor(selectedConversation.status) }]}
                    onPress={() => setShowStatusModal(true)}
                  >
                    <Text style={styles.chatStatusText}>{selectedConversation.status.toUpperCase()}</Text>
                  </TouchableOpacity>
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
                      {selectedConversation.customer.avatar && selectedConversation.customer.avatar.trim().length > 0 ? (
                        <Image 
                          source={{ uri: selectedConversation.customer.avatar || '' }} 
                          style={styles.customerCardAvatarImage} 
                        />
                      ) : (
                        <User size={32} color="#FFFFFF" />
                      )}
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
                      <Text style={styles.statLabel}>Points Balance</Text>
                      <Text style={styles.statValue}>
                        {selectedConversation.customer.loyaltyPoints}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.customerActions}>
                    <Text style={styles.actionsTitle}>Fidelity/Retention</Text>
                    
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
                      <Text style={styles.actionButtonText}>Award</Text>
                    </TouchableOpacity>
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

      {/* Status Change Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.statusModal}>
            <View style={styles.statusModalHeader}>
              <Text style={styles.statusModalTitle}>Change Status</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowStatusModal(false)}
              >
                <X size={20} color="#666666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.statusModalSubtitle}>
              Update conversation status for {selectedConversation?.customer.name}
            </Text>
            
            <View style={styles.statusOptions}>
              {[
                { value: 'open', label: 'Open', description: 'Active conversation requiring attention', color: '#27AE60' },
                { value: 'pending', label: 'Pending', description: 'Waiting for customer response', color: '#F39C12' },
                { value: 'escalated', label: 'Escalated', description: 'Requires manager or specialist attention', color: '#E74C3C' },
                { value: 'closed', label: 'Closed', description: 'Issue resolved and conversation complete', color: '#95A5A6' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.statusOption,
                    selectedStatus === option.value && styles.statusOptionSelected,
                    { borderColor: option.color }
                  ]}
                  onPress={() => setSelectedStatus(option.value as any)}
                >
                  <View style={styles.statusOptionContent}>
                    <View style={styles.statusOptionHeader}>
                      <View style={[styles.statusIndicator, { backgroundColor: option.color }]} />
                      <Text style={[
                        styles.statusOptionLabel,
                        selectedStatus === option.value && { color: option.color }
                      ]}>
                        {option.label}
                      </Text>
                    </View>
                    <Text style={styles.statusOptionDescription}>
                      {option.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.statusModalActions}>
              <TouchableOpacity
                style={styles.statusModalCancel}
                onPress={() => setShowStatusModal(false)}
              >
                <Text style={styles.statusModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.statusModalConfirm}
                onPress={() => handleStatusChange(selectedStatus)}
              >
                <Text style={styles.statusModalConfirmText}>Update Status</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Compliance Modal */}
      <Modal
        visible={showComplianceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowComplianceModal(false)}
      >
        <View style={styles.complianceModalOverlay}>
          <View style={styles.complianceModal}>
            <View style={styles.complianceModalHeader}>
              <Text style={styles.complianceModalTitle}>
                Compliance History - {selectedConversation?.customer.name}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowComplianceModal(false)}
              >
                <X size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            <View style={styles.complianceContent}>
              {/* Add Note Section */}
              <View style={styles.addNoteSection}>
                <Text style={styles.addNoteTitle}>Add New Note</Text>
                <View style={styles.noteInputContainer}>
                  <TextInput
                    style={styles.noteInput}
                    value={newNote}
                    onChangeText={setNewNote}
                    placeholder="Enter compliance note..."
                    placeholderTextColor="#666666"
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                  />
                  <TouchableOpacity
                    style={[styles.addNoteButton, !newNote.trim() && styles.addNoteButtonDisabled]}
                    onPress={handleAddNote}
                    disabled={!newNote.trim()}
                  >
                    <Save size={16} color="#FFFFFF" />
                    <Text style={styles.addNoteButtonText}>Add Note</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* History List */}
              <View style={styles.historySection}>
                <Text style={styles.historySectionTitle}>
                  Interaction History ({complianceHistory.length})
                </Text>
                
                {complianceHistory.length > 0 ? (
                  <FlatList
                    data={complianceHistory}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    style={styles.historyList}
                    renderItem={({ item }) => (
                      <View style={styles.historyItem}>
                        <View style={styles.historyItemHeader}>
                          <View style={styles.historyItemLeft}>
                            {getComplianceIcon(item.type)}
                            <Text style={styles.historyItemTitle}>{item.title}</Text>
                          </View>
                          <Text style={styles.historyItemTime}>
                            {formatComplianceTime(item.timestamp)}
                          </Text>
                        </View>
                        
                        <Text style={styles.historyItemDescription}>
                          {item.description}
                        </Text>
                        
                        <View style={styles.historyItemFooter}>
                          <Text style={styles.historyItemAuthor}>by {item.author}</Text>
                          {item.metadata && (
                            <View style={styles.historyItemMetadata}>
                              {item.metadata.oldStatus && item.metadata.newStatus && (
                                <Text style={styles.metadataText}>
                                  {item.metadata.oldStatus} → {item.metadata.newStatus}
                                </Text>
                              )}
                              {item.metadata.contactMethod && (
                                <Text style={styles.metadataText}>
                                  via {item.metadata.contactMethod}
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                  />
                ) : (
                  <View style={styles.emptyHistory}>
                    <FileText size={48} color="#666666" />
                    <Text style={styles.emptyHistoryTitle}>No History Yet</Text>
                    <Text style={styles.emptyHistoryText}>
                      Compliance notes and interaction history will appear here
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Compliance Modal */}
      <Modal
        visible={showComplianceModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowComplianceModal(false)}
      >
        <SafeAreaView style={styles.complianceModalContainer}>
          <View style={styles.complianceModalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowComplianceModal(false)}
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Text style={styles.complianceModalTitle}>
              Customer Compliance History
            </Text>
            
            <View style={styles.modalPlaceholder} />
          </View>

          {filteredHistory && (
            <ScrollView style={styles.complianceModalContent}>
              {/* Customer Summary */}
              <View style={styles.complianceSummary}>
                <Text style={styles.complianceSummaryTitle}>
                  {selectedConversation?.customer.name}
                </Text>
                <View style={styles.complianceStats}>
                  <View style={styles.complianceStat}>
                    <Text style={styles.complianceStatValue}>{filteredHistory.total_interactions}</Text>
                    <Text style={styles.complianceStatLabel}>Total Interactions</Text>
                  </View>
                  <View style={styles.complianceStat}>
                    <Text style={styles.complianceStatValue}>{filteredHistory.satisfaction_score}</Text>
                    <Text style={styles.complianceStatLabel}>Satisfaction Score</Text>
                  </View>
                  <View style={styles.complianceStat}>
                    <Text style={styles.complianceStatValue}>{filteredHistory.escalations_count}</Text>
                    <Text style={styles.complianceStatLabel}>Escalations</Text>
                  </View>
                </View>
              </View>

              {/* Search */}
              <View style={styles.complianceSearchContainer}>
                <View style={styles.complianceSearchBar}>
                  <Search size={16} color="#666666" />
                  <TextInput
                    style={styles.complianceSearchInput}
                    placeholder="Search conversations and notes..."
                    placeholderTextColor="#666666"
                    value={complianceSearchQuery}
                    onChangeText={setComplianceSearchQuery}
                  />
                </View>
              </View>

              {/* Add New Note */}
              <View style={styles.addNoteSection}>
                <Text style={styles.addNoteTitle}>Add Compliance Note</Text>
                <View style={styles.addNoteContainer}>
                  <TextInput
                    style={styles.addNoteInput}
                    placeholder="Enter compliance note..."
                    placeholderTextColor="#666666"
                    value={newComplianceNote}
                    onChangeText={setNewComplianceNote}
                    multiline
                    numberOfLines={3}
                  />
                  <TouchableOpacity
                    style={[styles.addNoteButton, !newComplianceNote.trim() && styles.addNoteButtonDisabled]}
                    onPress={handleAddComplianceNote}
                    disabled={!newComplianceNote.trim()}
                  >
                    <Save size={16} color="#FFFFFF" />
                    <Text style={styles.addNoteButtonText}>Add Note</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Conversation History */}
              <View style={styles.complianceSection}>
                <Text style={styles.complianceSectionTitle}>Conversation History</Text>
                {filteredHistory.conversations.map((conversation) => (
                  <View key={conversation.id} style={styles.complianceConversationItem}>
                    <View style={styles.complianceConversationHeader}>
                      <Text style={styles.complianceConversationDate}>
                        {new Date(conversation.date).toLocaleDateString()}
                      </Text>
                      <View style={[styles.complianceConversationStatus, { backgroundColor: getStatusColor(conversation.status) }]}>
                        <Text style={styles.complianceConversationStatusText}>
                          {conversation.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.complianceConversationMessage}>
                      "{conversation.last_message}"
                    </Text>
                    <View style={styles.complianceConversationMeta}>
                      <Text style={styles.complianceConversationMetaText}>
                        {conversation.messages_count} messages
                      </Text>
                      {conversation.resolution_time && (
                        <Text style={styles.complianceConversationMetaText}>
                          Resolved in {conversation.resolution_time}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Notes History */}
              <View style={styles.complianceSection}>
                <Text style={styles.complianceSectionTitle}>Compliance Notes</Text>
                {filteredHistory.notes.map((note) => (
                  <View key={note.id} style={styles.complianceNoteItem}>
                    <View style={styles.complianceNoteHeader}>
                      <View style={styles.complianceNoteAuthor}>
                        <UserCheck size={14} color="#5ce1e6" />
                        <Text style={styles.complianceNoteAuthorText}>{note.author}</Text>
                      </View>
                      <Text style={styles.complianceNoteTime}>
                        {new Date(note.timestamp).toLocaleString()}
                      </Text>
                    </View>
                    <Text style={styles.complianceNoteContent}>{note.content}</Text>
                    <View style={styles.complianceNoteFooter}>
                      <View style={[styles.complianceNoteType, { backgroundColor: 
                        note.type === 'note' ? '#3498DB' :
                        note.type === 'status_change' ? '#F39C12' :
                        note.type === 'escalation' ? '#E74C3C' : '#27AE60'
                      }]}>
                        <Text style={styles.complianceNoteTypeText}>
                          {note.type.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                      {note.metadata && (
                        <Text style={styles.complianceNoteMetadata}>
                          {note.metadata.old_status && note.metadata.new_status && 
                            `${note.metadata.old_status} → ${note.metadata.new_status}`}
                          {note.metadata.reason && `Reason: ${note.metadata.reason}`}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
    </>
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
    overflow: 'hidden',
  },
  customerCardAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
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
  statusModal: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  statusModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusModalSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 20,
  },
  statusOptions: {
    gap: 12,
    marginBottom: 24,
  },
  statusOption: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#3A3A3A',
  },
  statusOptionSelected: {
    backgroundColor: '#1A2A1A',
  },
  statusOptionContent: {
    gap: 8,
  },
  statusOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusOptionDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  statusModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  statusModalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  statusModalCancelText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: '600',
  },
  statusModalConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#5ce1e6',
    alignItems: 'center',
  },
  statusModalConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Compliance Modal Styles
  complianceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  complianceModal: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  complianceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  complianceModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  complianceContent: {
    flex: 1,
    padding: 24,
  },
  addNoteSection: {
    marginBottom: 24,
  },
  addNoteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  noteInputContainer: {
    gap: 12,
  },
  noteInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8E44AD',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addNoteButtonDisabled: {
    backgroundColor: '#3A3A3A',
    opacity: 0.5,
  },
  addNoteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  historySection: {
    flex: 1,
  },
  historySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  historyItemTime: {
    fontSize: 12,
    color: '#666666',
  },
  historyItemDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 8,
  },
  historyItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyItemAuthor: {
    fontSize: 12,
    color: '#5ce1e6',
    fontWeight: '500',
  },
  historyItemMetadata: {
    flexDirection: 'row',
    gap: 8,
  },
  metadataText: {
    fontSize: 11,
    color: '#999999',
    backgroundColor: '#3A3A3A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyHistory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Compliance Modal Styles
  complianceModalContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  complianceModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  complianceModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  modalPlaceholder: {
    width: 40,
  },
  complianceModalContent: {
    flex: 1,
    padding: 20,
  },
  complianceSummary: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  complianceSummaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  complianceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  complianceStat: {
    alignItems: 'center',
  },
  complianceStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#5ce1e6',
    marginBottom: 4,
  },
  complianceStatLabel: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  complianceSearchContainer: {
    marginBottom: 20,
  },
  complianceSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  complianceSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#FFFFFF',
  },
  addNoteSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  addNoteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  addNoteContainer: {
    gap: 12,
  },
  addNoteInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5ce1e6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addNoteButtonDisabled: {
    backgroundColor: '#3A3A3A',
    opacity: 0.5,
  },
  addNoteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  complianceSection: {
    marginBottom: 24,
  },
  complianceSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  complianceConversationItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  complianceConversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  complianceConversationDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  complianceConversationStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  complianceConversationStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  complianceConversationMessage: {
    fontSize: 14,
    color: '#CCCCCC',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  complianceConversationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  complianceConversationMetaText: {
    fontSize: 12,
    color: '#666666',
  },
  complianceNoteItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  complianceNoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  complianceNoteAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  complianceNoteAuthorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5ce1e6',
  },
  complianceNoteTime: {
    fontSize: 12,
    color: '#666666',
  },
  complianceNoteContent: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 12,
  },
  complianceNoteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  complianceNoteType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  complianceNoteTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  complianceNoteMetadata: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
});