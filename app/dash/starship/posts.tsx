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
  ScrollView,
  Image,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, MoveVertical as MoreVertical, Send, Star, User, Globe, Eye, Smile, Frown, Meh, X, Plus, Search, Filter, Calendar, Tag, MessageCircle, TriangleAlert as AlertTriangle, Clock, Shield, ThumbsUp, ThumbsDown, Gift, FileText, UserCheck, Save } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MIN_SIDEBAR_WIDTH = 280;
const MAX_SIDEBAR_WIDTH = SCREEN_WIDTH * 0.4;

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
  joinDate: string;
  totalPosts: number;
  verified: boolean;
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

interface PostReply {
  id: string;
  content: string;
  timestamp: string;
  isFromCompany: boolean;
  authorName: string;
}

interface Post {
  id: string;
  customer: Customer;
  type: 'review' | 'claim' | 'question' | 'complaint';
  title: string;
  content: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  rating?: number;
  attachments?: string[];
  replies: PostReply[];
  createdAt: string;
  updatedAt: string;
  tags: string[];
  upvotes: number;
  downvotes: number;
  views: number;
}

interface Company {
  id: string;
  name: string;
}

export default function PostsScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newReply, setNewReply] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isDragging, setIsDragging] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'review' | 'claim' | 'question' | 'complaint'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'new' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [customPointsAmount, setCustomPointsAmount] = useState('');
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [complianceHistory, setComplianceHistory] = useState<ComplianceEntry[]>([]);

  // Initialize with mock data for testing
  useEffect(() => {
    const mockPosts: Post[] = [
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
          joinDate: '2023-01-15',
          totalPosts: 8,
          verified: true,
          complianceHistory: [
            {
              id: '1',
              type: 'contact',
              title: 'Post Submitted',
              description: 'Customer submitted a positive review post',
              author: 'System',
              timestamp: '2024-01-15T10:30:00Z',
              metadata: {
                contactMethod: 'Web Form'
              }
            },
            {
              id: '2',
              type: 'status_change',
              title: 'Status Updated',
              description: 'Post status changed from new to resolved',
              author: 'John Smith',
              timestamp: '2024-01-15T12:30:00Z',
              metadata: {
                oldStatus: 'new',
                newStatus: 'resolved'
              }
            }
          ]
        },
        type: 'review',
        title: 'Excellent customer service experience!',
        content: 'I had an amazing experience with your customer service team. They were very helpful and resolved my issue quickly. The product quality is also outstanding. Highly recommend!',
        category: 'Customer Service',
        priority: 'medium',
        status: 'resolved',
        rating: 5,
        replies: [
          {
            id: 'reply1',
            content: 'Thank you so much for your wonderful feedback! We\'re thrilled to hear about your positive experience.',
            timestamp: '2 hours ago',
            isFromCompany: true,
            authorName: 'John Smith (Support Team)',
          },
        ],
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T12:30:00Z',
        tags: ['customer-service', 'positive'],
        upvotes: 12,
        downvotes: 0,
        views: 45,
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
          joinDate: '2023-03-22',
          totalPosts: 3,
          verified: false,
          complianceHistory: [
            {
              id: '3',
              type: 'contact',
              title: 'Claim Submitted',
              description: 'Customer submitted a product damage claim',
              author: 'System',
              timestamp: '2024-01-14T09:45:00Z',
              metadata: {
                contactMethod: 'Web Form'
              }
            },
            {
              id: '4',
              type: 'note',
              title: 'Follow-up Required',
              description: 'Customer requires replacement product within 2-3 business days',
              author: 'Sarah Johnson',
              timestamp: '2024-01-14T14:45:00Z'
            }
          ]
        },
        type: 'claim',
        title: 'Product arrived damaged',
        content: 'I received my order yesterday but the product was damaged during shipping. The packaging was intact but the item inside was broken. I need a replacement or refund.',
        category: 'Product Quality',
        priority: 'high',
        status: 'in_progress',
        replies: [
          {
            id: 'reply2',
            content: 'We sincerely apologize for this issue. We\'re processing a replacement for you right away. You should receive it within 2-3 business days.',
            timestamp: '1 hour ago',
            isFromCompany: true,
            authorName: 'Sarah Johnson (Support Team)',
          },
        ],
        createdAt: '2024-01-14T09:45:00Z',
        updatedAt: '2024-01-14T14:45:00Z',
        tags: ['product-damage', 'shipping'],
        upvotes: 3,
        downvotes: 0,
        views: 28,
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
          joinDate: '2022-11-08',
          totalPosts: 15,
          verified: true,
          complianceHistory: []
        },
        type: 'question',
        title: 'How to upgrade to premium plan?',
        content: 'I\'m interested in upgrading to your premium plan but I can\'t find clear information about the process. Can someone guide me through the steps?',
        category: 'Account',
        priority: 'medium',
        status: 'new',
        replies: [],
        createdAt: '2024-01-13T16:20:00Z',
        updatedAt: '2024-01-13T16:20:00Z',
        tags: ['premium', 'upgrade'],
        upvotes: 1,
        downvotes: 0,
        views: 15,
      },
    ];

    setPosts(mockPosts);
    
    // Set company info
    setCompany({
      id: '1',
      name: 'TechCorp Solutions',
    });
  }, []);

  const handleSendReply = () => {
    if (!newReply.trim() || !selectedPost) return;

    const reply: PostReply = {
      id: Date.now().toString(),
      content: newReply.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isFromCompany: true,
      authorName: 'Current User (Support Team)',
    };

    const updatedPost = {
      ...selectedPost,
      replies: [...selectedPost.replies, reply],
      updatedAt: new Date().toISOString(),
    };

    setSelectedPost(updatedPost);
    setPosts(prev =>
      prev.map(post => post.id === selectedPost.id ? updatedPost : post)
    );
    setNewReply('');
  };

  const handleStatusChange = (postId: string, newStatus: 'new' | 'in_progress' | 'resolved' | 'closed') => {
    const updatedPost = {
      ...selectedPost!,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    setSelectedPost(updatedPost);
    setPosts(prev => 
      prev.map(post => post.id === postId ? updatedPost : post)
    );

    Alert.alert('Success', `Post status updated to ${newStatus}`);
  };

  const handleAwardCoins = (customerId: string, amount: number) => {
    if (!selectedPost) return;

    const updatedCustomer = {
      ...selectedPost.customer,
      loyaltyPoints: selectedPost.customer.loyaltyPoints + amount
    };

    const updatedPost = {
      ...selectedPost,
      customer: updatedCustomer
    };
    
    setSelectedPost(updatedPost);
    setPosts(prev => 
      prev.map(post => post.id === selectedPost.id ? updatedPost : post)
    );

    Alert.alert('Success', `Awarded ${amount} loyalty points to ${selectedPost.customer.name}`);
  };

  const handleCustomPointsAward = () => {
    if (!selectedPost || !customPointsAmount.trim()) return;
    
    const amount = parseInt(customPointsAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive number');
      return;
    }
    
    if (amount > 1000) {
      Alert.alert('Amount Too High', 'Maximum award amount is 1000 points');
      return;
    }
    
    handleAwardCoins(selectedPost.customer.id, amount);
    setCustomPointsAmount('');
    setShowPointsModal(false);
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !selectedPost) return;

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

    // Update the post with new compliance history
    const updatedPost = {
      ...selectedPost,
      customer: {
        ...selectedPost.customer,
        complianceHistory: updatedHistory
      }
    };

    setSelectedPost(updatedPost);
    setPosts(prev =>
      prev.map(post => post.id === selectedPost.id ? updatedPost : post)
    );

    setNewNote('');
    Alert.alert('Success', 'Note added successfully');
  };

  // Update compliance history when post changes
  useEffect(() => {
    if (selectedPost) {
      setComplianceHistory(selectedPost.customer.complianceHistory || []);
    }
  }, [selectedPost]);

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
      case 'new': return '#E67E22';
      case 'in_progress': return '#3498DB';
      case 'resolved': return '#27AE60';
      case 'closed': return '#95A5A6';
      default: return '#666666';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#E74C3C';
      case 'high': return '#E67E22';
      case 'medium': return '#F39C12';
      case 'low': return '#27AE60';
      default: return '#666666';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'review': return <Star size={16} color="#F39C12" />;
      case 'claim': return <AlertTriangle size={16} color="#E74C3C" />;
      case 'question': return <MessageCircle size={16} color="#3498DB" />;
      case 'complaint': return <ThumbsDown size={16} color="#E74C3C" />;
      default: return <MessageCircle size={16} color="#666666" />;
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.customer.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || post.type === selectedFilter;
    const matchesStatus = selectedStatus === 'all' || post.status === selectedStatus;
    
    return matchesSearch && matchesFilter && matchesStatus;
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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
          <Text style={styles.headerTitle}>Customer Posts</Text>
          <Text style={styles.headerSubtitle}>
            {company?.name || 'Company'} Support
          </Text>
        </View>
        
        <TouchableOpacity style={styles.headerAction}>
          <MoreVertical size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Posts Sidebar */}
        <View style={[styles.sidebar, { width: sidebarWidth }]}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Posts</Text>
            <Text style={styles.postCount}>{filteredPosts.length}</Text>
          </View>

          {/* Search and Filters */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={16} color="#666666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search posts..."
                placeholderTextColor="#666666"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.filters}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['all', 'review', 'claim', 'question', 'complaint'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.filterChip,
                      selectedFilter === filter && styles.activeFilterChip
                    ]}
                    onPress={() => setSelectedFilter(filter as any)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      selectedFilter === filter && styles.activeFilterChipText
                    ]}>
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          
          <FlatList
            data={filteredPosts}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.postItem,
                  selectedPost?.id === item.id && styles.selectedPost
                ]}
                onPress={() => setSelectedPost(item)}
              >
                <View style={styles.postHeader}>
                  <View style={styles.postType}>
                    {getTypeIcon(item.type)}
                    <Text style={styles.postTypeText}>{item.type.toUpperCase()}</Text>
                  </View>
                  <View style={styles.postBadges}>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                      <Text style={styles.badgeText}>{item.priority}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                      <Text style={styles.badgeText}>{item.status.replace('_', ' ')}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.postContent} numberOfLines={3}>{item.content}</Text>

                <View style={styles.postMeta}>
                  <View style={styles.customerInfo}>
                    <User size={12} color="#666666" />
                    <Text style={styles.customerName}>{item.customer.name}</Text>
                  </View>
                  <Text style={styles.postTime}>{formatDate(item.createdAt)}</Text>
                </View>

                {item.rating && (
                  <View style={styles.ratingContainer}>
                    <View style={styles.stars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={12}
                          color={star <= item.rating! ? '#F39C12' : '#2A2A2A'}
                          fill={star <= item.rating! ? '#F39C12' : 'transparent'}
                        />
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.postStats}>
                  <View style={styles.statItem}>
                    <ThumbsUp size={12} color="#27AE60" />
                    <Text style={styles.statText}>{item.upvotes}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Eye size={12} color="#666666" />
                    <Text style={styles.statText}>{item.views}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <MessageCircle size={12} color="#3498DB" />
                    <Text style={styles.statText}>{item.replies.length}</Text>
                  </View>
                </View>
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

        {/* Main Post Area */}
        <View style={styles.mainArea}>
          {selectedPost ? (
            <View style={styles.postContainer}>
              {/* Post Details Area */}
              <View style={styles.postDetailsArea}>
                {/* Post Header */}
                <View style={styles.postDetailHeader}>
                  <View style={styles.postDetailLeft}>
                    <View style={styles.postDetailType}>
                      {getTypeIcon(selectedPost.type)}
                      <Text style={styles.postDetailTypeText}>{selectedPost.type.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.postDetailTitle}>{selectedPost.title}</Text>
                    <Text style={styles.postDetailCategory}>{selectedPost.category}</Text>
                  </View>
                  <View style={styles.postDetailActions}>
                    <TouchableOpacity 
                      style={[styles.statusButton, { backgroundColor: getStatusColor(selectedPost.status) }]}
                      onPress={() => {
                        Alert.alert(
                          'Change Status',
                          'Select new status:',
                          [
                            { text: 'New', onPress: () => handleStatusChange(selectedPost.id, 'new') },
                            { text: 'In Progress', onPress: () => handleStatusChange(selectedPost.id, 'in_progress') },
                            { text: 'Resolved', onPress: () => handleStatusChange(selectedPost.id, 'resolved') },
                            { text: 'Closed', onPress: () => handleStatusChange(selectedPost.id, 'closed') },
                            { text: 'Cancel', style: 'cancel' },
                          ]
                        );
                      }}
                    >
                      <Text style={styles.statusButtonText}>{selectedPost.status.replace('_', ' ').toUpperCase()}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Post Content */}
                <ScrollView style={styles.postContentArea} showsVerticalScrollIndicator={false}>
                  <Text style={styles.postDetailContent}>{selectedPost.content}</Text>

                  {selectedPost.rating && (
                    <View style={styles.postRating}>
                      <Text style={styles.ratingLabel}>Rating:</Text>
                      <View style={styles.ratingStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            color={star <= selectedPost.rating! ? '#F39C12' : '#2A2A2A'}
                            fill={star <= selectedPost.rating! ? '#F39C12' : 'transparent'}
                          />
                        ))}
                      </View>
                    </View>
                  )}

                  {selectedPost.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      <Text style={styles.tagsLabel}>Tags:</Text>
                      <View style={styles.tags}>
                        {selectedPost.tags.map((tag, index) => (
                          <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Replies */}
                  <View style={styles.repliesSection}>
                    <Text style={styles.repliesTitle}>Replies ({selectedPost.replies.length})</Text>
                    {selectedPost.replies.map((reply) => (
                      <View key={reply.id} style={styles.replyItem}>
                        <View style={styles.replyHeader}>
                          <Text style={styles.replyAuthor}>{reply.authorName}</Text>
                          <Text style={styles.replyTime}>{reply.timestamp}</Text>
                        </View>
                        <Text style={styles.replyContent}>{reply.content}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>

                {/* Reply Input */}
                <View style={styles.replyInput}>
                  <TextInput
                    style={styles.replyTextInput}
                    value={newReply}
                    onChangeText={setNewReply}
                    placeholder="Type your reply..."
                    placeholderTextColor="#666"
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity
                    style={[styles.sendButton, !newReply.trim() && styles.sendButtonDisabled]}
                    onPress={handleSendReply}
                    disabled={!newReply.trim()}
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
                      <View style={styles.customerNameRow}>
                        <Text style={styles.customerCardName}>
                          {selectedPost.customer.name}
                        </Text>
                        {selectedPost.customer.verified && (
                          <Shield size={14} color="#27AE60" />
                        )}
                      </View>
                      <Text style={styles.customerCardEmail}>
                        {selectedPost.customer.email}
                      </Text>
                      {selectedPost.customer.phone && (
                        <Text style={styles.customerCardPhone}>
                          {selectedPost.customer.phone}
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
                          {selectedPost.customer.lastPageSeen}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.sessionItem}>
                      <View style={styles.moodIconContainer}>
                        {getMoodIcon(selectedPost.customer.currentMood)}
                      </View>
                      <View style={styles.sessionItemContent}>
                        <Text style={styles.sessionItemLabel}>Current Mood</Text>
                        <Text style={[
                          styles.sessionItemValue,
                          { color: getMoodColor(selectedPost.customer.currentMood) }
                        ]}>
                          {selectedPost.customer.currentMood.charAt(0).toUpperCase() + 
                           selectedPost.customer.currentMood.slice(1)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.sessionItem}>
                      <User size={14} color="#3498DB" />
                      <View style={styles.sessionItemContent}>
                        <Text style={styles.sessionItemLabel}>Device & Location</Text>
                        <Text style={styles.sessionItemValue}>
                          {selectedPost.customer.deviceType} • {selectedPost.customer.location}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.customerStats}>
                    <View style={styles.statsSeparator} />
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Points Balance</Text>
                      <Text style={styles.statValue}>
                        {selectedPost.customer.loyaltyPoints}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.customerActions}>
                    <View style={styles.actionsSeparator} />
                    <Text style={styles.actionsTitle}>Fidelity/Retention</Text>
                    
                    <View style={styles.quickActions}>
                      <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={() => handleAwardCoins(selectedPost.customer.id, 5)}
                      >
                        <Text style={styles.quickActionText}>+5</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={() => handleAwardCoins(selectedPost.customer.id, 10)}
                      >
                        <Text style={styles.quickActionText}>+10</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={() => handleAwardCoins(selectedPost.customer.id, 25)}
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
                      onPress={() => handleAwardCoins(selectedPost.customer.id, 50)}
                    >
                      <Gift size={16} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Award</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.complianceButton}
                      onPress={() => setShowComplianceModal(true)}
                    >
                      <FileText size={16} color="#FFFFFF" />
                      <Text style={styles.complianceButtonText}>Compliance</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noPostSelected}>
              <MessageCircle size={64} color="#666666" />
              <Text style={styles.noPostText}>Select a post to view details</Text>
              <Text style={styles.noPostSubtext}>
                Choose from {filteredPosts.length} posts
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
              Award points to {selectedPost?.customer.name}
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
                Compliance History - {selectedPost?.customer.name}
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
  postCount: {
    fontSize: 14,
    color: '#5ce1e6',
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#FFFFFF',
  },
  filters: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  activeFilterChip: {
    backgroundColor: '#5ce1e6',
    borderColor: '#5ce1e6',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  activeFilterChipText: {
    color: '#FFFFFF',
  },
  postItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  selectedPost: {
    backgroundColor: '#2A2A2A',
    borderRightWidth: 3,
    borderRightColor: '#5ce1e6',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666666',
  },
  postBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  postTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 18,
  },
  postContent: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 8,
    lineHeight: 16,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerName: {
    fontSize: 11,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  postTime: {
    fontSize: 11,
    color: '#666666',
  },
  ratingContainer: {
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  postStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: '#666666',
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
  postContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  postDetailsArea: {
    flex: 2,
    backgroundColor: '#0A0A0A',
  },
  postDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  postDetailLeft: {
    flex: 1,
  },
  postDetailType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  postDetailTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  postDetailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  postDetailCategory: {
    fontSize: 14,
    color: '#5ce1e6',
    fontWeight: '500',
  },
  postDetailActions: {
    alignItems: 'flex-end',
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postContentArea: {
    flex: 1,
    padding: 16,
  },
  postDetailContent: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 20,
  },
  postRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '600',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  tagsContainer: {
    marginBottom: 20,
  },
  tagsLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '600',
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  tagText: {
    fontSize: 12,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  repliesSection: {
    marginBottom: 20,
  },
  repliesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  replyItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  replyAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5ce1e6',
  },
  replyTime: {
    fontSize: 12,
    color: '#666666',
  },
  replyContent: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  replyInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    gap: 12,
  },
  replyTextInput: {
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
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  customerCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
    paddingTop: 16,
  },
  statsSeparator: {
    height: 1,
    backgroundColor: '#3A3A3A',
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#999999',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  customerActions: {
    paddingTop: 16,
    gap: 12,
  },
  actionsSeparator: {
    height: 1,
    backgroundColor: '#3A3A3A',
    marginBottom: 8,
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
  complianceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8E44AD',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  complianceButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noPostSelected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noPostText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  noPostSubtext: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
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
});