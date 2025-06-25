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
  // ... [rest of the component code remains exactly the same]
}

const styles = StyleSheet.create({
  // ... [styles object remains exactly the same]
});