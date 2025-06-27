import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Search, Plus, MoreVertical, Heart, MessageCircle, Share } from 'lucide-react-native';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
}

export default function PostsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [posts] = useState<Post[]>([
    {
      id: '1',
      title: 'Welcome to Starship Dashboard',
      content: 'This is your first post in the dashboard. You can create, edit, and manage all your posts from here.',
      author: 'Admin',
      date: '2024-01-15',
      likes: 24,
      comments: 8,
      shares: 3,
    },
    {
      id: '2',
      title: 'Getting Started Guide',
      content: 'Learn how to make the most of your dashboard with these helpful tips and tricks.',
      author: 'Support Team',
      date: '2024-01-14',
      likes: 18,
      comments: 12,
      shares: 5,
    },
  ]);

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Posts</Text>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#666"
        />
      </View>

      {/* Posts List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredPosts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.postInfo}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postMeta}>
                  By {post.author} • {post.date}
                </Text>
              </View>
              <TouchableOpacity style={styles.moreButton}>
                <MoreVertical size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.postContent}>{post.content}</Text>

            <View style={styles.postActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Heart size={18} color="#666" />
                <Text style={styles.actionText}>{post.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MessageCircle size={18} color="#666" />
                <Text style={styles.actionText}>{post.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Share size={18} color="#666" />
                <Text style={styles.actionText}>{post.shares}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  addButton: {
    backgroundColor: '#007bff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postInfo: {
    flex: 1,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  postMeta: {
    fontSize: 14,
    color: '#6c757d',
  },
  moreButton: {
    padding: 4,
  },
  postContent: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});