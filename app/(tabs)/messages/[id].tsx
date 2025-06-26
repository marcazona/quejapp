import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { ArrowLeft, Send, MessageCircle, Shield, Plus, ThumbsUp, ThumbsDown, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'user' | 'company';
  content: string;
  message_type: 'text' | 'image' | 'file';
  read_at: string | null;
  created_at: string;
  reactions?: MessageReaction[];
}

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  verified: boolean;
}

interface LiveMoodData {
  totalVotes: number;
  positiveVotes: number;
  negativeVotes: number;
  userVote: 'positive' | 'negative' | null;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

// Customer service related emojis
const REACTION_EMOJIS = [
  { emoji: '👍', label: 'Helpful' },
  { emoji: '❤️', label: 'Love it' },
  { emoji: '😊', label: 'Happy' },
  { emoji: '🙏', label: 'Thank you' },
  { emoji: '⭐', label: 'Excellent' },
];

// LiveMood component for chat
const ChatLiveMood = ({ companyId, companyName }: { companyId: string; companyName: string }) => {
  const { user } = useAuth();
  const [moodData, setMoodData] = useState<LiveMoodData>({
    totalVotes: 247,
    positiveVotes: 156,
    negativeVotes: 91,
    userVote: null,
    trend: 'up',
    lastUpdated: new Date().toISOString(),
  });
  const [isVoting, setIsVoting] = useState(false);
  const [showMoodSection, setShowMoodSection] = useState(true);

  // Load user's existing vote when component mounts
  useEffect(() => {
    loadUserVote();
  }, [companyId, user]);

  const loadUserVote = async () => {
    if (!user) return;
    
    try {
      // Check localStorage for user's vote on this company
      const storageKey = `livemood_vote_${companyId}_${user.id}`;
      let existingVote: string | null = null;
      
      if (Platform.OS === 'web') {
        existingVote = localStorage.getItem(storageKey);
      } else {
        existingVote = await AsyncStorage.getItem(storageKey);
      }
      
      if (existingVote) {
        const voteData = JSON.parse(existingVote);
        setMoodData(prev => ({
          ...prev,
          userVote: voteData.vote,
        }));
      }
    } catch (error) {
      console.error('Error loading user vote:', error);
    }
  };

  const saveUserVote = async (vote: 'positive' | 'negative' | null) => {
    if (!user) return;
    
    try {
      const storageKey = `livemood_vote_${companyId}_${user.id}`;
      
      if (vote === null) {
        if (Platform.OS === 'web') {
          localStorage.removeItem(storageKey);
        } else {
          await AsyncStorage.removeItem(storageKey);
        }
      } else {
        const voteData = {
          vote,
          timestamp: new Date().toISOString(),
          companyId,
          userId: user.id,
        };
        if (Platform.OS === 'web') {
          localStorage.setItem(storageKey, JSON.stringify(voteData));
        } else {
          await AsyncStorage.setItem(storageKey, JSON.stringify(voteData));
        }
      }
    } catch (error) {
      console.error('Error saving user vote:', error);
    }
  };

  const positivePercentage = moodData.totalVotes > 0 ? (moodData.positiveVotes / moodData.totalVotes) * 100 : 0;
  const negativePercentage = moodData.totalVotes > 0 ? (moodData.negativeVotes / moodData.totalVotes) * 100 : 0;

  const handleVote = async (voteType: 'positive' | 'negative') => {
    if (!user) {
      // Show sign-in prompt
      return;
    }
    
    if (isVoting) return;

    setIsVoting(true);

    try {
      const previousVote = moodData.userVote;
      const newVote = previousVote === voteType ? null : voteType;

      setMoodData(prev => {
        let newPositiveVotes = prev.positiveVotes;
        let newNegativeVotes = prev.negativeVotes;
        let newTotalVotes = prev.totalVotes;

        // Remove previous vote if exists
        if (prev.userVote === 'positive') {
          newPositiveVotes--;
          newTotalVotes--;
        } else if (prev.userVote === 'negative') {
          newNegativeVotes--;
          newTotalVotes--;
        }

        // Add new vote if it's different from previous
        if (newVote !== null) {
          if (newVote === 'positive') {
            newPositiveVotes++;
          } else {
            newNegativeVotes++;
          }
          newTotalVotes++;
        }

        // Calculate trend
        const newPositivePercentage = newTotalVotes > 0 ? (newPositiveVotes / newTotalVotes) * 100 : 0;
        const oldPositivePercentage = prev.totalVotes > 0 ? (prev.positiveVotes / prev.totalVotes) * 100 : 0;
        
        let newTrend: 'up' | 'down' | 'stable' = 'stable';
        if (newPositivePercentage > oldPositivePercentage + 2) {
          newTrend = 'up';
        } else if (newPositivePercentage < oldPositivePercentage - 2) {
          newTrend = 'down';
        }

        return {
          totalVotes: newTotalVotes,
          positiveVotes: newPositiveVotes,
          negativeVotes: newNegativeVotes,
          userVote: newVote,
          trend: newTrend,
          lastUpdated: new Date().toISOString(),
        };
      });

      // Save vote to localStorage for persistence
      await saveUserVote(newVote);
      
      // Simulate API call to backend
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error('Failed to submit vote:', error);
      // Revert the vote on error
      setMoodData(prev => ({
        ...prev,
        userVote: previousVote,
      }));
      await saveUserVote(previousVote);
    } finally {
      setIsVoting(false);
    }
  };

  const getTrendIcon = () => {
    switch (moodData.trend) {
      case 'up':
        return <TrendingUp size={12} color="#27AE60" />;
      case 'down':
        return <TrendingDown size={12} color="#E74C3C" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (moodData.trend) {
      case 'up':
        return '#27AE60';
      case 'down':
        return '#E74C3C';
      default:
        return '#666666';
    }
  };

  if (!showMoodSection) return null;

  return (
    <View style={styles.chatLiveMoodContainer}>
      <View style={styles.chatLiveMoodHeader}>
        <View style={styles.chatLiveMoodTitleRow}>
          <Text style={styles.chatLiveMoodTitle}>LiveMood</Text>
          <View style={styles.chatLiveMoodTrend}>
            {getTrendIcon()}
            <Text style={[styles.chatLiveMoodTrendText, { color: getTrendColor() }]}>
              {moodData.trend === 'up' ? 'Improving' : moodData.trend === 'down' ? 'Declining' : 'Stable'}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.chatLiveMoodClose}
          onPress={() => setShowMoodSection(false)}
        >
          <Text style={styles.chatLiveMoodCloseText}>×</Text>
        </TouchableOpacity>
      </View>

      {/* Compact Mood Bar */}
      <View style={styles.chatMoodBar}>
        <View 
          style={[
            styles.chatMoodBarFill, 
            styles.chatMoodBarPositive,
            { width: `${positivePercentage}%` }
          ]} 
        />
        <View 
          style={[
            styles.chatMoodBarFill, 
            styles.chatMoodBarNegative,
            { width: `${negativePercentage}%`, right: 0, position: 'absolute' }
          ]} 
        />
      </View>

      {/* Compact Stats */}

      {/* Voting Buttons */}
      <View style={styles.chatMoodVoting}>
        <View style={styles.chatMoodVotingButtons}>
          <TouchableOpacity
            style={[
              styles.chatMoodVoteButton,
              styles.chatMoodVoteButtonPositive,
              moodData.userVote === 'positive' && styles.chatMoodVoteButtonActive,
              isVoting && styles.chatMoodVoteButtonDisabled,
            ]}
            onPress={() => handleVote('positive')}
            disabled={isVoting}
          >
            <ThumbsUp 
              size={16} 
              color={moodData.userVote === 'positive' ? '#FFFFFF' : '#27AE60'} 
              fill={moodData.userVote === 'positive' ? '#FFFFFF' : 'transparent'}
            />
            <Text style={[
              styles.chatMoodVoteButtonText,
              moodData.userVote === 'positive' && styles.chatMoodVoteButtonTextActive
            ]}>
              Good
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chatMoodVoteButton,
              styles.chatMoodVoteButtonNegative,
              moodData.userVote === 'negative' && styles.chatMoodVoteButtonActive,
              isVoting && styles.chatMoodVoteButtonDisabled,
            ]}
            onPress={() => handleVote('negative')}
            disabled={isVoting}
          >
            <ThumbsDown 
              size={16} 
              color={moodData.userVote === 'negative' ? '#FFFFFF' : '#E74C3C'} 
              fill={moodData.userVote === 'negative' ? '#FFFFFF' : 'transparent'}
            />
            <Text style={[
              styles.chatMoodVoteButtonText,
              moodData.userVote === 'negative' && styles.chatMoodVoteButtonTextActive
            ]}>
              Bad
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {moodData.userVote && (
        <Text style={styles.chatMoodVoteStatus}>
          You voted: {moodData.userVote === 'positive' ? 'Good' : 'Bad'} • Tap again to change
        </Text>
      )}
    </View>
  );
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [showReactionModal, setShowReactionModal] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Hide tab bar when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Hide tab bar when entering chat
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' }
      });

      // Show tab bar when leaving chat
      return () => {
        navigation.getParent()?.setOptions({
          tabBarStyle: {
            backgroundColor: '#1A1A1A',
            borderTopWidth: 1,
            borderTopColor: '#2A2A2A',
            paddingBottom: 8,
            paddingTop: 8,
            height: 70,
            display: 'flex'
          }
        });
      };
    }, [navigation])
  );

  useEffect(() => {
    if (id) {
      loadChatData();
    }
  }, [id]);

  const loadChatData = async () => {
    try {
      setLoading(true);
      
      // Extract company ID from conversation ID
      const conversationId = id || '';
      let companyId = '1'; // Default fallback
      
      // Parse company ID from conversation ID format: conv_companyId_userId_timestamp
      if (conversationId.startsWith('conv_')) {
        const parts = conversationId.split('_');
        if (parts.length >= 2) {
          companyId = parts[1];
        }
      }
      
      // Mock company data based on company ID
      const companies = {
        '1': {
          id: '1',
          name: 'TechCorp Solutions',
          logo_url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
          verified: true,
        },
        '2': {
          id: '2',
          name: 'GreenEarth Foods',
          logo_url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
          verified: true,
        },
        '3': {
          id: '3',
          name: 'Urban Fashion Co.',
          logo_url: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
          verified: false,
        },
        '4': {
          id: '4',
          name: 'HealthFirst Clinic',
          logo_url: 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
          verified: true,
        },
        '5': {
          id: '5',
          name: 'EcoClean Services',
          logo_url: 'https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
          verified: true,
        },
        '6': {
          id: '6',
          name: 'AutoFix Garage',
          logo_url: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
          verified: false,
        },
      };
      
      const mockCompany = companies[companyId as keyof typeof companies] || companies['1'];
      
      // Mock messages
      const mockMessages: ChatMessage[] = [
        {
          id: '1',
          conversation_id: conversationId,
          sender_id: 'company',
          sender_type: 'company',
          content: `Hello! Welcome to ${mockCompany.name}. How can we assist you today?`,
          message_type: 'text',
          read_at: null,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          reactions: [
            {
              id: 'r1',
              message_id: '1',
              user_id: 'user',
              emoji: '👍',
              created_at: new Date().toISOString(),
            }
          ],
        },
        {
          id: '2',
          conversation_id: conversationId,
          sender_id: 'user',
          sender_type: 'user',
          content: 'Hi, I have a question about your services.',
          message_type: 'text',
          read_at: new Date().toISOString(),
          created_at: new Date(Date.now() - 1800000).toISOString(),
        },
      ];

      setCompany(mockCompany);
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(prevMessages => 
      prevMessages.map(message => {
        if (message.id === messageId) {
          const existingReactions = message.reactions || [];
          const existingReaction = existingReactions.find(r => r.user_id === 'user' && r.emoji === emoji);
          
          if (existingReaction) {
            // Remove reaction if it already exists
            return {
              ...message,
              reactions: existingReactions.filter(r => r.id !== existingReaction.id)
            };
          } else {
            // Add new reaction
            const newReaction: MessageReaction = {
              id: `r_${Date.now()}`,
              message_id: messageId,
              user_id: 'user',
              emoji,
              created_at: new Date().toISOString(),
            };
            return {
              ...message,
              reactions: [...existingReactions, newReaction]
            };
          }
        }
        return message;
      })
    );
    setShowReactionModal(false);
    setSelectedMessageId(null);
  };

  const openReactionModal = (messageId: string) => {
    setSelectedMessageId(messageId);
    setShowReactionModal(true);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      conversation_id: id || '',
      sender_id: 'user',
      sender_type: 'user',
      content: newMessage.trim(),
      message_type: 'text',
      read_at: null,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    // Simulate company response after a delay
    setTimeout(() => {
      const companyResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        conversation_id: id || '',
        sender_id: 'company',
        sender_type: 'company',
        content: 'Thank you for your message. Our team will get back to you shortly.',
        message_type: 'text',
        read_at: null,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, companyResponse]);
      
      // Scroll to bottom again
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 2000);
  };

  const handleBackPress = () => {
    // Navigate back to messages list instead of just going back
    router.push('/(tabs)/messages');
  };

  const handleCompanyPress = () => {
    if (company?.id) {
      router.push(`/company/${company.id}`);
    }
  };
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender_type === 'user';
    const canReact = item.sender_type === 'company'; // Only allow reactions on company messages
    
    const handleLongPress = () => {
      if (canReact) {
        openReactionModal(item.id);
      }
    };
    
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.companyMessage]}>
        <TouchableOpacity
          style={[styles.messageBubble, isUser ? styles.userBubble : styles.companyBubble]}
          onLongPress={handleLongPress}
          delayLongPress={500}
          activeOpacity={canReact ? 0.8 : 1}
        >
          <Text style={[styles.messageText, isUser ? styles.userText : styles.companyText]}>
            {item.content}
          </Text>
          <Text style={[styles.timeText, isUser ? styles.userTimeText : styles.companyTimeText]}>
            {formatTime(item.created_at)}
          </Text>
        </TouchableOpacity>
        
        {/* Reactions */}
        {item.reactions && item.reactions.length > 0 && (
          <View style={[styles.reactionsContainer, isUser ? styles.userReactions : styles.companyReactions]}>
            {item.reactions.map((reaction) => (
              <TouchableOpacity
                key={reaction.id}
                style={styles.reactionBubble}
                onPress={() => handleReaction(item.id, reaction.emoji)}
              >
                <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const ReactionModal = () => (
    <Modal
      visible={showReactionModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowReactionModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowReactionModal(false)}
      >
        <View style={styles.reactionModal}>
          <Text style={styles.reactionModalTitle}>React with emoji</Text>
          <View style={styles.reactionOptions}>
            {REACTION_EMOJIS.map((reaction, index) => (
              <TouchableOpacity
                key={index}
                style={styles.reactionOption}
                onPress={() => selectedMessageId && handleReaction(selectedMessageId, reaction.emoji)}
              >
                <Text style={styles.reactionOptionEmoji}>{reaction.emoji}</Text>
                <Text style={styles.reactionOptionLabel}>{reaction.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.reactionModalHint}>Press and hold company messages to react</Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5ce1e6" />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <TouchableOpacity 
            style={styles.companyNameContainer}
            onPress={handleCompanyPress}
            activeOpacity={0.7}
          >
            <Text style={styles.companyName}>{company?.name || 'Company Chat'}</Text>
            {company?.verified && (
              <Shield size={16} color="#27AE60" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* LiveMood Section */}
      {company && (
        <ChatLiveMood companyId={company.id} companyName={company.name} />
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#666666"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            disabled={!newMessage.trim()}
          >
            <Send size={20} color={newMessage.trim() ? '#FFFFFF' : '#666666'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      <ReactionModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  companyNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Chat LiveMood Styles
  chatLiveMoodContainer: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  chatLiveMoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chatLiveMoodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  chatLiveMoodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chatLiveMoodTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  chatLiveMoodTrendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chatLiveMoodClose: {
    padding: 2,
  },
  chatLiveMoodCloseText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '300',
  },
  chatMoodBar: {
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
    position: 'relative',
  },
  chatMoodBarFill: {
    height: '100%',
    position: 'absolute',
    top: 0,
  },
  chatMoodBarPositive: {
    backgroundColor: '#27AE60',
    left: 0,
  },
  chatMoodBarNegative: {
    backgroundColor: '#E74C3C',
  },
  chatMoodStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chatMoodStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  chatMoodStatText: {
    fontSize: 11,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  chatMoodVoting: {
    marginBottom: 4,
  },
  chatMoodVotingTitle: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  chatMoodVotingButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  chatMoodVoteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  chatMoodVoteButtonPositive: {
    borderColor: '#27AE60',
    backgroundColor: 'transparent',
  },
  chatMoodVoteButtonNegative: {
    borderColor: '#E74C3C',
    backgroundColor: 'transparent',
  },
  chatMoodVoteButtonActive: {
    backgroundColor: '#27AE60',
  },
  chatMoodVoteButtonDisabled: {
    opacity: 0.5,
  },
  chatMoodVoteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chatMoodVoteButtonTextActive: {
    color: '#FFFFFF',
  },
  chatMoodVoteStatus: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
    marginTop: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  companyMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#5ce1e6',
    borderBottomRightRadius: 4,
  },
  companyBubble: {
    backgroundColor: '#2A2A2A',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
    color: '#FFFFFF',
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 4,
  },
  userReactions: {
    justifyContent: 'flex-end',
  },
  companyReactions: {
    justifyContent: 'flex-start',
  },
  reactionBubble: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  reactionEmoji: {
    fontSize: 14,
  },
  inputContainer: {
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionModal: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  reactionModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  reactionOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  reactionOption: {
    alignItems: 'center',
    padding: 8,
  },
  reactionOptionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  reactionOptionLabel: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  reactionModalHint: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
});