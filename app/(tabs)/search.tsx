import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Image,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Search, Filter, MapPin, Users, Heart, MessageCircle, Shield, Zap, Clock, FileSliders as Sliders, X, User } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { calculateAge } from '@/lib/database';

// Simplified user profile type for search
interface FullUserProfile {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  photos?: Array<{
    photo_url: string;
    is_primary: boolean | null;
  }>;
  dating_profile?: {
    bio?: string;
    height?: number;
    body_type?: string;
    ethnicity?: string;
    interests?: string[];
    is_online?: boolean;
    is_verified?: boolean;
    last_seen?: string;
  };
  verified?: boolean;
  distance?: number;
}

const { width } = Dimensions.get('window');

const SearchResultCard = ({ user, onPress, onMessage }: { 
  user: FullUserProfile; 
  onPress: () => void;
  onMessage: () => void;
}) => {
  const [isFavorited, setIsFavorited] = useState(false);

  const age = calculateAge(user.birth_date);
  const primaryPhoto = user.photos?.find(p => p.is_primary) || user.photos?.[0];
  const datingProfile = user.dating_profile;
  const isOnline = datingProfile?.is_online || false;
  const lastSeen = datingProfile?.last_seen;
  const bio = datingProfile?.bio || '';
  const interests = datingProfile?.interests || [];

  const getLastSeenText = () => {
    if (isOnline) return 'Online';
    if (!lastSeen) return 'Recently';
    
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Recently';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return 'A while ago';
  };

  return (
    <TouchableOpacity style={styles.resultCard} onPress={onPress}>
      <View style={styles.cardImageContainer}>
        {primaryPhoto ? (
          <Image source={{ uri: primaryPhoto.photo_url }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <User size={48} color="#666666" />
          </View>
        )}
        
        {/* Online indicator */}
        {isOnline && <View style={styles.onlineIndicator} />}
        
        {/* Badges */}
        <View style={styles.badgeContainer}>
          {(user.verified || datingProfile?.is_verified) && (
            <View style={styles.verifiedBadge}>
              <Shield size={10} color="#FFFFFF" />
            </View>
          )}
        </View>
        
        {/* Distance */}
        {user.distance !== undefined && (
          <View style={styles.distanceOverlay}>
            <MapPin size={12} color="#FFFFFF" />
            <Text style={styles.distanceText}>
              {user.distance < 1 ? `${Math.round(user.distance * 1000)}m` : `${user.distance.toFixed(1)}km`}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.userNameContainer}>
            <Text style={styles.cardUserName}>
              {user.first_name} {user.last_name}{age ? `, ${age}` : ''}
            </Text>
            <View style={styles.lastSeenContainer}>
              <Clock size={12} color="#666666" />
              <Text style={styles.lastSeenText}>{getLastSeenText()}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => setIsFavorited(!isFavorited)}
          >
            <Heart 
              size={20} 
              color={isFavorited ? "#E74C3C" : "#666666"} 
              fill={isFavorited ? "#E74C3C" : "transparent"}
            />
          </TouchableOpacity>
        </View>
        
        {bio && (
          <Text style={styles.cardBio} numberOfLines={2}>
            {bio}
          </Text>
        )}
        
        <View style={styles.userStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Height</Text>
            <Text style={styles.statValue}>
              {datingProfile?.height ? `${datingProfile.height}cm` : 'N/A'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Body</Text>
            <Text style={styles.statValue}>{datingProfile?.body_type || 'N/A'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Ethnicity</Text>
            <Text style={styles.statValue}>{datingProfile?.ethnicity || 'N/A'}</Text>
          </View>
        </View>
        
        {interests.length > 0 && (
          <View style={styles.interestsContainer}>
            {interests.slice(0, 3).map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
            {interests.length > 3 && (
              <Text style={styles.moreInterests}>+{interests.length - 3}</Text>
            )}
          </View>
        )}
        
        <TouchableOpacity style={styles.messageButton} onPress={onMessage}>
          <MessageCircle size={16} color="#FFFFFF" />
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function SearchScreen() {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'online' | 'nearby' | 'verified'>('all');
  const [searchResults, setSearchResults] = useState<FullUserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // For now, return empty results since we're focusing on companies
      setSearchResults([]);
      setHasSearched(true);
    } catch (error: any) {
      console.error('Error searching users:', error);
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    performSearch();
  };

  const handleUserPress = (user: FullUserProfile) => {
    console.log('View profile:', user.first_name, user.last_name);
  };

  const handleMessage = (user: FullUserProfile) => {
    console.log('Message user:', user.first_name, user.last_name);
  };

  const FilterButton = ({ type, label, count }: { 
    type: typeof activeFilter; 
    label: string; 
    count?: number;
  }) => (
    <TouchableOpacity
      style={[styles.filterChip, activeFilter === type && styles.activeFilterChip]}
      onPress={() => setActiveFilter(type)}
    >
      <Text style={[styles.filterChipText, activeFilter === type && styles.activeFilterChipText]}>
        {label}
      </Text>
      {count !== undefined && (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      {/* Header */}
      <View style={styles.headerContainer}>
        <SafeAreaView style={styles.safeAreaHeader}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Search</Text>
              <Text style={styles.headerSubtitle}>Find your perfect match</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Sliders size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#666666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666666"
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#666666" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollView}>
          <FilterButton type="all" label="All" />
          <FilterButton type="online" label="Online" />
          <FilterButton type="nearby" label="Nearby" />
          <FilterButton type="verified" label="Verified" />
        </ScrollView>
      </View>

      {/* Results */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5ce1e6" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : hasSearched ? (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
              </Text>
              {searchQuery.length > 0 && (
                <Text style={styles.searchQueryText}>for "{searchQuery}"</Text>
              )}
            </View>

            {searchResults.length > 0 ? (
              <View style={styles.resultsGrid}>
                {searchResults.map((user) => (
                  <SearchResultCard
                    key={user.id}
                    user={user}
                    onPress={() => handleUserPress(user)}
                    onMessage={() => handleMessage(user)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Users size={64} color="#3A3A3A" />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptySubtitle}>
                  Try adjusting your search or filters
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.initialState}>
            <Search size={64} color="#3A3A3A" />
            <Text style={styles.initialTitle}>Discover Amazing People</Text>
            <Text style={styles.initialSubtitle}>
              Search by name or use filters to find your perfect match
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  headerContainer: {
    backgroundColor: '#1A1A1A',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  safeAreaHeader: {
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1A1A1A',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  searchButton: {
    backgroundColor: '#5ce1e6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  filterScrollView: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    gap: 6,
  },
  activeFilterChip: {
    backgroundColor: '#5ce1e6',
    borderColor: '#8E44AD',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CCCCCC',
  },
  activeFilterChipText: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: '#666666',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchQueryText: {
    fontSize: 16,
    color: '#666666',
  },
  resultsGrid: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  resultCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
  },
  cardImageContainer: {
    position: 'relative',
    height: 200,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#27AE60',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 6,
  },
  verifiedBadge: {
    backgroundColor: '#27AE60',
    borderRadius: 10,
    padding: 4,
  },
  distanceOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  distanceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userNameContainer: {
    flex: 1,
  },
  cardUserName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  lastSeenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastSeenText: {
    fontSize: 12,
    color: '#666666',
  },
  favoriteButton: {
    padding: 8,
  },
  cardBio: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 12,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 2,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  interestTag: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  interestText: {
    fontSize: 12,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  moreInterests: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    alignSelf: 'center',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5ce1e6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  initialState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  initialTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  initialSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
});