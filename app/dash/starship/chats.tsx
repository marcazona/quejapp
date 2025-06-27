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
import { ArrowLeft, MoveVertical as MoreVertical, Send, Star, Gift, User, Globe, Eye, Smile, Frown, Meh, X, Plus, FileText, Clock, UserCheck, MessageSquare, Save, AlertTriangle } from 'lucide-react-native';
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

[Rest of the code remains the same...]

const styles = StyleSheet.create({
  [All styles remain the same...]
});