import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  TextInput,
  Image,
  Modal,
  Alert,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { TrendingUp, TrendingDown, Eye, Users, MessageCircle, Star, ChartBar as BarChart3, ChartPie as PieChart, Calendar, Download, Filter, RefreshCw, Clock, Target, Award, DollarSign, TriangleAlert as AlertTriangle, CreditCard as Edit3, Save, X, Plus, Building2, Globe, Phone, Mail, MapPin, Camera, Zap, Crown, Sparkles, Shield } from 'lucide-react-native';
import { useCompanyAuth } from '@/contexts/CompanyAuthContext';

const { width } = Dimensions.get('window');

interface BannerTemplate {
  id: string;
  name: string;
  preview: string;
  category: 'promotional' | 'seasonal' | 'announcement' | 'service';
  isPremium: boolean;
}

interface CompanyBanner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  template: string;
}

interface VisibilityBoost {
  id: string;
  type: 'featured' | 'priority' | 'highlighted' | 'premium';
  name: string;
  description: string;
  duration: string;
  price: number;
  benefits: string[];
  isActive: boolean;
}

const MarketingContent = () => {
  const { company } = useCompanyAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'banners' | 'visibility' | 'analytics'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<BannerTemplate | null>(null);

  // Company profile state
  const [profileData, setProfileData] = useState({
    name: company?.name || '',
    description: company?.description || '',
    industry: company?.industry || '',
    website: company?.website || '',
    phone: company?.phone || '',
    email: company?.email || '',
    logo_url: company?.logo_url || '',
    address: '',
    city: '',
    country: '',
    social_media: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
    },
    business_hours: {
      monday: '9:00 AM - 5:00 PM',
      tuesday: '9:00 AM - 5:00 PM',
      wednesday: '9:00 AM - 5:00 PM',
      thursday: '9:00 AM - 5:00 PM',
      friday: '9:00 AM - 5:00 PM',
      saturday: 'Closed',
      sunday: 'Closed',
    },
    features: {
      verified: company?.verified || false,
      premium: false,
      featured: false,
      priority_support: false,
    }
  });

  // Banner state
  const [banners, setBanners] = useState<CompanyBanner[]>([
    {
      id: '1',
      title: 'Summer Sale - 30% Off All Services',
      description: 'Limited time offer on all our premium services. Book now and save big!',
      imageUrl: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800&h=400',
      ctaText: 'Shop Now',
      ctaUrl: 'https://example.com/sale',
      isActive: true,
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      template: 'promotional',
    },
  ]);

  const [newBanner, setNewBanner] = useState<Partial<CompanyBanner>>({
    title: '',
    description: '',
    imageUrl: '',
    ctaText: '',
    ctaUrl: '',
    isActive: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Visibility boosts
  const [visibilityBoosts] = useState<VisibilityBoost[]>([
    {
      id: '1',
      type: 'featured',
      name: 'Featured Listing',
      description: 'Appear at the top of search results and category pages',
      duration: '30 days',
      price: 99,
      benefits: ['Top search placement', 'Featured badge', '3x more visibility'],
      isActive: false,
    },
    {
      id: '2',
      type: 'priority',
      name: 'Priority Support Badge',
      description: 'Show customers you provide priority customer service',
      duration: '90 days',
      price: 149,
      benefits: ['Priority badge', 'Faster response guarantee', 'Customer trust boost'],
      isActive: true,
    },
    {
      id: '3',
      type: 'highlighted',
      name: 'Highlighted Profile',
      description: 'Stand out with a premium highlighted profile design',
      duration: '60 days',
      price: 79,
      benefits: ['Premium design', 'Color highlights', 'Enhanced visibility'],
      isActive: false,
    },
    {
      id: '4',
      type: 'premium',
      name: 'Premium Package',
      description: 'Complete visibility package with all premium features',
      duration: '365 days',
      price: 499,
      benefits: ['All features included', 'Analytics dashboard', 'Priority support', 'Custom branding'],
      isActive: false,
    },
  ]);

  // Banner templates
  const bannerTemplates: BannerTemplate[] = [
    {
      id: '1',
      name: 'Promotional Sale',
      preview: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400&h=200',
      category: 'promotional',
      isPremium: false,
    },
    {
      id: '2',
      name: 'New Service Launch',
      preview: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400&h=200',
      category: 'announcement',
      isPremium: false,
    },
    {
      id: '3',
      name: 'Holiday Special',
      preview: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400&h=200',
      category: 'seasonal',
      isPremium: true,
    },
    {
      id: '4',
      name: 'Service Highlight',
      preview: 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=400&h=200',
      category: 'service',
      isPremium: true,
    },
  ];

  const handleSaveProfile = () => {
    // TODO: Implement save functionality
    Alert.alert('Success', 'Profile updated successfully!');
    setIsEditing(false);
  };

  const handleCreateBanner = () => {
    if (!newBanner.title || !newBanner.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const banner: CompanyBanner = {
      id: Date.now().toString(),
      title: newBanner.title!,
      description: newBanner.description!,
      imageUrl: newBanner.imageUrl || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800&h=400',
      ctaText: newBanner.ctaText || 'Learn More',
      ctaUrl: newBanner.ctaUrl || '#',
      isActive: newBanner.isActive!,
      startDate: newBanner.startDate!,
      endDate: newBanner.endDate!,
      template: selectedTemplate?.category || 'promotional',
    };

    setBanners([...banners, banner]);
    setNewBanner({
      title: '',
      description: '',
      imageUrl: '',
      ctaText: '',
      ctaUrl: '',
      isActive: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setSelectedTemplate(null);
    setShowBannerModal(false);
    Alert.alert('Success', 'Banner created successfully!');
  };

  const handlePurchaseBoost = (boost: VisibilityBoost) => {
    Alert.alert(
      'Purchase Visibility Boost',
      `Purchase ${boost.name} for $${boost.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: () => {
            Alert.alert('Success', `${boost.name} activated successfully!`);
          },
        },
      ]
    );
  };

  const TabButton = ({ 
    tab, 
    label, 
    icon 
  }: { 
    tab: typeof activeTab; 
    label: string; 
    icon: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      {icon}
      <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Company Profile</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Edit3 size={16} color="#5ce1e6" />
            <Text style={styles.editButtonText}>
              {isEditing ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Company Logo */}
        <View style={styles.imageSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.imageLabel}>Company Logo</Text>
            <View style={styles.logoPreview}>
              {profileData.logo_url ? (
                <Image source={{ uri: profileData.logo_url }} style={styles.logoImage} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Building2 size={32} color="#666666" />
                </View>
              )}
              {isEditing && (
                <TouchableOpacity style={styles.imageEditButton}>
                  <Camera size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>Basic Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Company Name</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={profileData.name}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
              editable={isEditing}
              placeholder="Enter company name"
              placeholderTextColor="#666666"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.textArea, !isEditing && styles.inputDisabled]}
              value={profileData.description}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, description: text }))}
              editable={isEditing}
              placeholder="Describe your company"
              placeholderTextColor="#666666"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Industry</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={profileData.industry}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, industry: text }))}
                editable={isEditing}
                placeholder="Industry"
                placeholderTextColor="#666666"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Website</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={profileData.website}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, website: text }))}
                editable={isEditing}
                placeholder="https://example.com"
                placeholderTextColor="#666666"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={profileData.phone}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, phone: text }))}
                editable={isEditing}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor="#666666"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={profileData.email}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, email: text }))}
                editable={isEditing}
                placeholder="contact@company.com"
                placeholderTextColor="#666666"
              />
            </View>
          </View>
        </View>

        {/* Features */}
        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>Profile Features</Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureInfo}>
                <Shield size={20} color="#27AE60" />
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Verified Business</Text>
                  <Text style={styles.featureDescription}>Show customers you're a verified business</Text>
                </View>
              </View>
              <View style={[styles.featureBadge, profileData.features.verified && styles.featureBadgeActive]}>
                <Text style={[styles.featureBadgeText, profileData.features.verified && styles.featureBadgeTextActive]}>
                  {profileData.features.verified ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureInfo}>
                <Crown size={20} color="#F39C12" />
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Premium Profile</Text>
                  <Text style={styles.featureDescription}>Enhanced visibility and premium features</Text>
                </View>
              </View>
              <View style={[styles.featureBadge, profileData.features.premium && styles.featureBadgeActive]}>
                <Text style={[styles.featureBadgeText, profileData.features.premium && styles.featureBadgeTextActive]}>
                  {profileData.features.premium ? 'Active' : 'Upgrade'}
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureInfo}>
                <Sparkles size={20} color="#E67E22" />
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Featured Listing</Text>
                  <Text style={styles.featureDescription}>Appear at the top of search results</Text>
                </View>
              </View>
              <View style={[styles.featureBadge, profileData.features.featured && styles.featureBadgeActive]}>
                <Text style={[styles.featureBadgeText, profileData.features.featured && styles.featureBadgeTextActive]}>
                  {profileData.features.featured ? 'Active' : 'Boost'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {isEditing && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
            <Save size={16} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  const renderBannersTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile Banners</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowBannerModal(true)}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Create Banner</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionDescription}>
          Create eye-catching banners to promote your services and special offers on your public profile.
        </Text>

        <View style={styles.bannersGrid}>
          {banners.map((banner) => (
            <View key={banner.id} style={styles.bannerCard}>
              <View style={styles.bannerImageContainer}>
                <Image source={{ uri: banner.imageUrl }} style={styles.bannerImage} />
                <View style={[styles.bannerStatus, banner.isActive ? styles.bannerActive : styles.bannerInactive]}>
                  <Text style={styles.bannerStatusText}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>{banner.title}</Text>
                <Text style={styles.bannerDescription} numberOfLines={2}>
                  {banner.description}
                </Text>
                
                <View style={styles.bannerMeta}>
                  <Text style={styles.bannerDates}>
                    {new Date(banner.startDate).toLocaleDateString()} - {new Date(banner.endDate).toLocaleDateString()}
                  </Text>
                  <View style={styles.bannerActions}>
                    <TouchableOpacity style={styles.bannerActionButton}>
                      <Edit3 size={14} color="#5ce1e6" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bannerActionButton}>
                      <Eye size={14} color="#666666" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderVisibilityTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visibility Boosts</Text>
        <Text style={styles.sectionDescription}>
          Increase your company's visibility and attract more customers with our premium features.
        </Text>

        <View style={styles.boostsGrid}>
          {visibilityBoosts.map((boost) => (
            <View key={boost.id} style={[styles.boostCard, boost.isActive && styles.boostCardActive]}>
              <View style={styles.boostHeader}>
                <View style={styles.boostIcon}>
                  {boost.type === 'featured' && <Star size={24} color="#F39C12" />}
                  {boost.type === 'priority' && <Zap size={24} color="#E74C3C" />}
                  {boost.type === 'highlighted' && <Sparkles size={24} color="#9B59B6" />}
                  {boost.type === 'premium' && <Crown size={24} color="#27AE60" />}
                </View>
                <View style={styles.boostInfo}>
                  <Text style={styles.boostName}>{boost.name}</Text>
                  <Text style={styles.boostDuration}>{boost.duration}</Text>
                </View>
                <View style={styles.boostPrice}>
                  <Text style={styles.boostPriceText}>${boost.price}</Text>
                </View>
              </View>

              <Text style={styles.boostDescription}>{boost.description}</Text>

              <View style={styles.boostBenefits}>
                {boost.benefits.map((benefit, index) => (
                  <View key={index} style={styles.boostBenefit}>
                    <View style={styles.boostBenefitBullet} />
                    <Text style={styles.boostBenefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.boostButton, boost.isActive && styles.boostButtonActive]}
                onPress={() => !boost.isActive && handlePurchaseBoost(boost)}
                disabled={boost.isActive}
              >
                <Text style={[styles.boostButtonText, boost.isActive && styles.boostButtonTextActive]}>
                  {boost.isActive ? 'Active' : 'Purchase'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderAnalyticsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Analytics</Text>
        <Text style={styles.sectionDescription}>
          Track your profile performance and customer engagement.
        </Text>

        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsCard}>
            <View style={styles.analyticsIcon}>
              <Eye size={24} color="#3498DB" />
            </View>
            <Text style={styles.analyticsValue}>2,847</Text>
            <Text style={styles.analyticsLabel}>Profile Views</Text>
            <Text style={styles.analyticsChange}>+12.5% this month</Text>
          </View>

          <View style={styles.analyticsCard}>
            <View style={styles.analyticsIcon}>
              <MessageCircle size={24} color="#27AE60" />
            </View>
            <Text style={styles.analyticsValue}>156</Text>
            <Text style={styles.analyticsLabel}>Customer Inquiries</Text>
            <Text style={styles.analyticsChange}>+8.3% this month</Text>
          </View>

          <View style={styles.analyticsCard}>
            <View style={styles.analyticsIcon}>
              <Star size={24} color="#F39C12" />
            </View>
            <Text style={styles.analyticsValue}>4.6</Text>
            <Text style={styles.analyticsLabel}>Average Rating</Text>
            <Text style={styles.analyticsChange}>+0.2 this month</Text>
          </View>

          <View style={styles.analyticsCard}>
            <View style={styles.analyticsIcon}>
              <Users size={24} color="#9B59B6" />
            </View>
            <Text style={styles.analyticsValue}>89</Text>
            <Text style={styles.analyticsLabel}>New Followers</Text>
            <Text style={styles.analyticsChange}>+15.7% this month</Text>
          </View>
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Profile Performance</Text>
          <View style={styles.chartPlaceholder}>
            <BarChart3 size={48} color="#666666" />
            <Text style={styles.chartPlaceholderText}>
              Detailed analytics charts would be displayed here
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  if (!company) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      {/* Header */}
      <View style={[styles.headerSection, { marginTop: 60 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.pageTitle}>Marketing & Profile</Text>
          <Text style={styles.pageSubtitle}>
            Manage your public presence and visibility
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.refreshButton}>
            <RefreshCw size={18} color="#5ce1e6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TabButton
          tab="profile"
          label="Profile"
          icon={<Building2 size={18} color={activeTab === 'profile' ? '#5ce1e6' : '#666666'} />}
        />
        <TabButton
          tab="banners"
          label="Banners"
          icon={<Camera size={18} color={activeTab === 'banners' ? '#5ce1e6' : '#666666'} />}
        />
        <TabButton
          tab="visibility"
          label="Visibility"
          icon={<Zap size={18} color={activeTab === 'visibility' ? '#5ce1e6' : '#666666'} />}
        />
        <TabButton
          tab="analytics"
          label="Analytics"
          icon={<BarChart3 size={18} color={activeTab === 'analytics' ? '#5ce1e6' : '#666666'} />}
        />
      </View>

      {/* Tab Content */}
      {activeTab === 'profile' && renderProfileTab()}
      {activeTab === 'banners' && renderBannersTab()}
      {activeTab === 'visibility' && renderVisibilityTab()}
      {activeTab === 'analytics' && renderAnalyticsTab()}

      {/* Banner Creation Modal */}
      <Modal
        visible={showBannerModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBannerModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBannerModal(false)}>
              <X size={24} color="#666666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Banner</Text>
            <TouchableOpacity onPress={handleCreateBanner}>
              <Text style={styles.modalSaveText}>Create</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Banner Title</Text>
              <TextInput
                style={styles.input}
                value={newBanner.title}
                onChangeText={(text) => setNewBanner(prev => ({ ...prev, title: text }))}
                placeholder="Enter banner title"
                placeholderTextColor="#666666"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.textArea}
                value={newBanner.description}
                onChangeText={(text) => setNewBanner(prev => ({ ...prev, description: text }))}
                placeholder="Describe your promotion"
                placeholderTextColor="#666666"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Call to Action</Text>
              <TextInput
                style={styles.input}
                value={newBanner.ctaText}
                onChangeText={(text) => setNewBanner(prev => ({ ...prev, ctaText: text }))}
                placeholder="e.g., Shop Now, Learn More"
                placeholderTextColor="#666666"
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Start Date</Text>
                <TextInput
                  style={styles.input}
                  value={newBanner.startDate}
                  onChangeText={(text) => setNewBanner(prev => ({ ...prev, startDate: text }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#666666"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>End Date</Text>
                <TextInput
                  style={styles.input}
                  value={newBanner.endDate}
                  onChangeText={(text) => setNewBanner(prev => ({ ...prev, endDate: text }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#666666"
                />
              </View>
            </View>

            <View style={styles.templateSection}>
              <Text style={styles.label}>Choose Template</Text>
              <View style={styles.templatesGrid}>
                {bannerTemplates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={[
                      styles.templateCard,
                      selectedTemplate?.id === template.id && styles.templateCardSelected
                    ]}
                    onPress={() => setSelectedTemplate(template)}
                  >
                    <Image source={{ uri: template.preview }} style={styles.templateImage} />
                    <Text style={styles.templateName}>{template.name}</Text>
                    {template.isPremium && (
                      <View style={styles.premiumBadge}>
                        <Crown size={12} color="#F39C12" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default MarketingContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerLeft: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  refreshButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#5ce1e6',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTabButton: {
    backgroundColor: '#2A2A2A',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabButtonText: {
    color: '#5ce1e6',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 24,
    lineHeight: 24,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#5ce1e6',
    fontSize: 14,
    fontWeight: '600',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#5ce1e6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  logoPreview: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  placeholderText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  imageEditButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#5ce1e6',
    borderRadius: 16,
    padding: 6,
  },
  formSection: {
    marginBottom: 32,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  inputDisabled: {
    backgroundColor: '#1A1A1A',
    color: '#CCCCCC',
  },
  textArea: {
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
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  featureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  featureBadge: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  featureBadgeActive: {
    backgroundColor: '#27AE60',
  },
  featureBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  featureBadgeTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#5ce1e6',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bannersGrid: {
    gap: 16,
  },
  bannerCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  bannerImageContainer: {
    position: 'relative',
    height: 120,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerStatus: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bannerActive: {
    backgroundColor: '#27AE60',
  },
  bannerInactive: {
    backgroundColor: '#E74C3C',
  },
  bannerStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bannerContent: {
    padding: 16,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  bannerDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 12,
    lineHeight: 20,
  },
  bannerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerDates: {
    fontSize: 12,
    color: '#666666',
  },
  bannerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bannerActionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#2A2A2A',
  },
  boostsGrid: {
    gap: 16,
  },
  boostCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  boostCardActive: {
    borderColor: '#27AE60',
    backgroundColor: '#1A2A1A',
  },
  boostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  boostIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  boostInfo: {
    flex: 1,
  },
  boostName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  boostDuration: {
    fontSize: 14,
    color: '#666666',
  },
  boostPrice: {
    alignItems: 'flex-end',
  },
  boostPriceText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#5ce1e6',
  },
  boostDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 16,
    lineHeight: 24,
  },
  boostBenefits: {
    marginBottom: 20,
  },
  boostBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  boostBenefitBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5ce1e6',
    marginRight: 12,
  },
  boostBenefitText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  boostButton: {
    backgroundColor: '#5ce1e6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  boostButtonActive: {
    backgroundColor: '#27AE60',
  },
  boostButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  boostButtonTextActive: {
    color: '#FFFFFF',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  analyticsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    width: (width - 52) / 2,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
  },
  analyticsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  analyticsValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  analyticsChange: {
    fontSize: 12,
    color: '#27AE60',
    textAlign: 'center',
  },
  chartSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 12,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5ce1e6',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  templateSection: {
    marginTop: 24,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    width: (width - 64) / 2,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2A2A2A',
    position: 'relative',
  },
  templateCardSelected: {
    borderColor: '#5ce1e6',
  },
  templateImage: {
    width: '100%',
    height: 80,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    padding: 12,
    textAlign: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F39C12',
    borderRadius: 12,
    padding: 4,
  },
});