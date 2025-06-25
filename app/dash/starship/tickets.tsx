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
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, MoveVertical as MoreVertical, Send, Star, User, Globe, Eye, Smile, Frown, Meh, X, Plus, Search, Filter, Calendar, Tag, MessageCircle, TriangleAlert as AlertTriangle, Clock, Shield, ThumbsUp, ThumbsDown } from 'lucide-react-native';

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
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'new' | 'in_progress' | 'resolved'>('all');

  // Initialize with mock data
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
          joinDate: '2023-03-15',
          totalPosts: 8,
          verified: true,
        },
        type: 'review',
        title: 'Excellent customer service experience!',
        content: 'I had an amazing experience with your customer service team. They were responsive, helpful, and went above and beyond to resolve my issue. The product quality is outstanding and delivery was faster than expected. Highly recommend this company to anyone looking for reliable service.',
        category: 'Customer Service',
        priority: 'medium',
        status: 'new',
        rating: 5,
        replies: [
          {
            id: 'reply1',
            content: 'Thank you so much for this wonderful feedback, Sarah! We\'re thrilled to hear about your positive experience.',
            timestamp: '10:30 AM',
            isFromCompany: true,
            authorName: 'Customer Success Team',
          }
        ],
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:35:00Z',
        tags: ['customer-service', 'delivery', 'quality'],
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
          lastPageSeen: '/support/returns',
          currentMood: 'sad',
          sessionDuration: '8 minutes',
          deviceType: 'Mobile',
          location: 'San Francisco, CA',
          joinDate: '2023-07-22',
          totalPosts: 3,
          verified: false,
        },
        type: 'claim',
        title: 'Product arrived damaged - need replacement',
        content: 'I received my order yesterday but the product was damaged during shipping. The packaging was intact but the item inside was broken. I need a replacement as soon as possible since this was a gift for someone. Order number: #12345',
        category: 'Product Quality',
        priority: 'high',
        status: 'in_progress',
        replies: [
          {
            id: 'reply2',
            content: 'Hi Mike, we sincerely apologize for this issue. We\'re processing a replacement immediately and will expedite shipping.',
            timestamp: '9:45 AM',
            isFromCompany: true,
            authorName: 'Support Team',
          },
          {
            id: 'reply3',
            content: 'Thank you for the quick response. When can I expect the replacement?',
            timestamp: '9:50 AM',
            isFromCompany: false,
            authorName: 'Mike Chen',
          }
        ],
        createdAt: '2024-01-14T09:30:00Z',
        updatedAt: '2024-01-14T09:50:00Z',
        tags: ['damaged', 'replacement', 'shipping'],
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
          lastPageSeen: '/account/billing',
          currentMood: 'neutral',
          sessionDuration: '25 minutes',
          deviceType: 'Tablet',
          location: 'Chicago, IL',
          joinDate: '2022-11-08',
          totalPosts: 15,
          verified: true,
        },
        type: 'question',
        title: 'How to update billing information?',
        content: 'I need to update my billing address and payment method for my subscription. I couldn\'t find the option in my account settings. Could someone guide me through the process?',
        category: 'Account Management',
        priority: 'low',
        status: 'resolved',
        replies: [
          {
            id: 'reply4',
            content: 'Hi Emma! You can update your billing information by going to Account Settings > Billing > Payment Methods. Let me know if you need further assistance.',
            timestamp: 'Yesterday 2:30 PM',
            isFromCompany: true,
            authorName: 'Account Manager',
          },
          {
            id: 'reply5',
            content: 'Perfect! Found it and updated successfully. Thank you!',
            timestamp: 'Yesterday 2:45 PM',
            isFromCompany: false,
            authorName: 'Emma Davis',
          }
        ],
        createdAt: '2024-01-13T14:20:00Z',
        updatedAt: '2024-01-13T14:45:00Z',
        tags: ['billing', 'account', 'payment'],
        upvotes: 8,
        downvotes: 1,
        views: 67,
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
          lastPageSeen: '/products/compare',
          currentMood: 'neutral',
          sessionDuration: '5 minutes',
          deviceType: 'Mobile',
          location: 'Miami, FL',
          joinDate: '2023-12-01',
          totalPosts: 2,
          verified: false,
        },
        type: 'complaint',
        title: 'Slow website performance on mobile',
        content: 'The website is extremely slow on mobile devices. Pages take forever to load and sometimes crash. This makes it very difficult to browse products and complete purchases. Please fix this issue.',
        category: 'Technical Issues',
        priority: 'medium',
        status: 'new',
        replies: [],
        createdAt: '2024-01-12T16:10:00Z',
        updatedAt: '2024-01-12T16:10:00Z',
        tags: ['mobile', 'performance', 'technical'],
        upvotes: 5,
        downvotes: 0,
        views: 23,
      },
    ];

    setPosts(mockPosts);
    setSelectedPost(mockPosts[0]);
    
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
      authorName: 'Support Team',
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

  const handleStatusChange = (postId: string, newStatus: Post['status']) => {
    const updatedPost = posts.find(p => p.id === postId);
    if (!updatedPost) return;

    const updated = { ...updatedPost, status: newStatus, updatedAt: new Date().toISOString() };
    
    setPosts(prev => prev.map(p => p.id === postId ? updated : p));
    if (selectedPost?.id === postId) {
      setSelectedPost(updated);
    }

    Alert.alert('Status Updated', `Post status changed to ${newStatus}`);
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'happy': return <Smile size={16} color="#27AE60" />;
      case 'sad': return <Frown size={16} color="#E74C3C" />;
      case 'neutral': return <Meh size={16} color="#F39C12" />;
      default: return <Meh size={16} color="#666666" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'review': return <Star size={16} color="#F39C12" />;
      case 'claim': return <AlertTriangle size={16} color="#E74C3C" />;
      case 'question': return <MessageCircle size={16} color="#3498DB" />;
      case 'complaint': return <TriangleAlert size={16} color="#E67E22" />;
      default: return <MessageCircle size={16} color="#666666" />;
    }
  };

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

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.customer.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || post.type === selectedFilter;
    const matchesStatus = selectedStatus === 'all' || post.status === selectedStatus;
    
    return matchesSearch && matchesFilter && matchesStatus;
  });

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
            {company?.name || 'Company'} Community
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
          <View style={styles.searchSection}>
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
                <Text style={styles.postPreview} numberOfLines={2}>{item.content}</Text>

                <View style={styles.postMeta}>
                  <View style={styles.customerInfo}>
                    <User size={12} color="#666666" />
                    <Text style={styles.customerName}>{item.customer.name}</Text>
                  </View>
                  <Text style={styles.postTime}>{formatDate(item.createdAt)}</Text>
                </View>

                <View style={styles.postStats}>
                  <View style={styles.statItem}>
                    <ThumbsUp size={12} color="#27AE60" />
                    <Text style={styles.statText}>{item.upvotes}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <MessageCircle size={12} color="#3498DB" />
                    <Text style={styles.statText}>{item.replies.length}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Eye size={12} color="#666666" />
                    <Text style={styles.statText}>{item.views}</Text>
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
              {/* Post Content Area */}
              <View style={styles.postContentArea}>
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
                        const statuses: Post['status'][] = ['new', 'in_progress', 'resolved', 'closed'];
                        const currentIndex = statuses.indexOf(selectedPost.status);
                        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                        handleStatusChange(selectedPost.id, nextStatus);
                      }}
                    >
                      <Text style={styles.statusButtonText}>{selectedPost.status.replace('_', ' ').toUpperCase()}</Text>
                    </TouchableOpacity>
                </View>

                {/* Post Content */}
                <ScrollView style={styles.postContent} showsVerticalScrollIndicator={false}>
                  <Text style={styles.postText}>{selectedPost.content}</Text>
                  
                  {selectedPost.rating && (
                    <View style={styles.ratingSection}>
                      <Text style={styles.ratingLabel}>Rating:</Text>
                      <View style={styles.stars}>
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
                    <View style={styles.tagsSection}>
                      <Text style={styles.tagsLabel}>Tags:</Text>
                      <View style={styles.tags}>
                        {selectedPost.tags.map((tag, index) => (
                          <View key={index} style={styles.tag}>
                            <Tag size={12} color="#5ce1e6" />
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
                      <View
                        key={reply.id}
                        style={[
                          styles.replyContainer,
                          reply.isFromCompany ? styles.companyReply : styles.customerReply
                        ]}
                      >
                        <View style={styles.replyHeader}>
                          <Text style={styles.replyAuthor}>{reply.authorName}</Text>
                          <Text style={styles.replyTime}>{reply.timestamp}</Text>
                        </View>
                        <Text style={styles.replyText}>{reply.content}</Text>
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
                    placeholderTextColor="#666666"
                    multiline
                    maxLength={1000}
                  />
                  <TouchableOpacity
                    onPress={handleSendReply}
                    style={[styles.sendButton, !newReply.trim() && styles.sendButtonDisabled]}
                    disabled={!newReply.trim()}
                  >
                    <Send size={20} color={newReply.trim() ? '#FFFFFF' : '#666666'} />
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

                  {/* Customer Stats */}
                  <View style={styles.customerStats}>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Total Spent</Text>
                      <Text style={styles.statValue}>
                        ${selectedPost.customer.totalSpent.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Loyalty Points</Text>
                      <Text style={styles.statValue}>
                        {selectedPost.customer.loyaltyPoints}
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Total Posts</Text>
                      <Text style={styles.statValue}>
                        {selectedPost.customer.totalPosts}
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Member Since</Text>
                      <Text style={styles.statValue}>
                        {new Date(selectedPost.customer.joinDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  {/* Current Session */}
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionInfoTitle}>Current Session</Text>
                    
                    <View style={styles.sessionItem}>
                      <Globe size={14} color="#5ce1e6" />
                      <View style={styles.sessionItemContent}>
                        <Text style={styles.sessionItemLabel}>Last Page</Text>
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
                        <Text style={styles.sessionItemLabel}>Mood</Text>
                        <Text style={styles.sessionItemValue}>
                          {selectedPost.customer.currentMood.charAt(0).toUpperCase() + 
                           selectedPost.customer.currentMood.slice(1)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.sessionItem}>
                      <Clock size={14} color="#9B59B6" />
                      <View style={styles.sessionItemContent}>
                        <Text style={styles.sessionItemLabel}>Session Time</Text>
                        <Text style={styles.sessionItemValue}>
                          {selectedPost.customer.sessionDuration}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noPostSelected}>
              <MessageCircle size={64} color="#666666" />
              <Text style={styles.noPostText}>Select a post to view details</Text>
              <Text style={styles.noPostSubtext}>
                Choose from {posts.length} customer posts
              </Text>
            </View>
          )}
        </View>
      </View>
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
    marginTop: 60,
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
  searchSection: {
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
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  postTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 18,
  },
  postPreview: {
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
  postContentArea: {
    flex: 2,
    backgroundColor: '#0A0A0A',
  },
  postDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
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
    gap: 8,
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
    lineHeight: 26,
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
  postContent: {
    flex: 1,
    padding: 20,
  },
  postText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 20,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '600',
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  tagsSection: {
    marginBottom: 20,
  },
  tagsLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#5ce1e6',
  },
  tagText: {
    fontSize: 12,
    color: '#5ce1e6',
    fontWeight: '500',
  },
  repliesSection: {
    marginBottom: 20,
  },
  repliesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  replyContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  companyReply: {
    backgroundColor: '#1A2A1A',
    borderLeftWidth: 4,
    borderLeftColor: '#27AE60',
  },
  customerReply: {
    backgroundColor: '#1A1A2A',
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  replyTime: {
    fontSize: 12,
    color: '#666666',
  },
  replyText: {
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
    backgroundColor: '#2A2A2A',
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
  customerStats: {
    marginBottom: 16,
  },
  statRow: {
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
  sessionInfo: {
    gap: 12,
  },
  sessionInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5ce1e6',
    marginBottom: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  sessionItemContent: {
    flex: 1,
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
});