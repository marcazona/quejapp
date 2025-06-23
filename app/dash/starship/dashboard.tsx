import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { 
  ChartBar as BarChart3, 
  MessageCircle, 
  TriangleAlert as AlertTriangle, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  Building2,
  Shield,
  Mail,
  Phone,
  Globe,
  Calendar,
  ArrowRight,
} from 'lucide-react-native';
import { useCompanyAuth } from '@/contexts/CompanyAuthContext';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  totalReviews: number;
  averageRating: number;
  activeChats: number;
  responseTime: string;
  satisfactionRate: number;
}

interface RecentActivity {
  id: string;
  type: 'ticket' | 'review' | 'chat';
  title: string;
  description: string;
  time: string;
  status: 'new' | 'pending' | 'resolved';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue, 
  color = '#5ce1e6',
  isWide = false
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: string;
  isWide?: boolean;
}) => (
  <View style={[
    styles.statCard, 
    isWide ? styles.wideStatCard : null,
    { borderLeftColor: color, borderLeftWidth: 4 }
  ]}>
    <View style={styles.statHeader}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        {icon}
      </View>
      {trend && (
        <View style={styles.trendContainer}>
          {trend === 'up' ? (
            <TrendingUp size={16} color="#27AE60" />
          ) : (
            <TrendingDown size={16} color="#E74C3C" />
          )}
          <Text style={[styles.trendText, { color: trend === 'up' ? '#27AE60' : '#E74C3C' }]}>
            {trendValue}
          </Text>
        </View>
      )}
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statSubtitle}>{subtitle}</Text>
  </View>
);

const ActivityCard = ({ activity }: { activity: RecentActivity }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#E67E22';
      case 'pending': return '#F39C12';
      case 'resolved': return '#27AE60';
      default: return '#666666';
    }
  };

  const getPriorityColor = (priority?: string) => {
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
      case 'ticket': return <AlertTriangle size={16} color="#E67E22" />;
      case 'review': return <Star size={16} color="#F39C12" />;
      case 'chat': return <MessageCircle size={16} color="#3498DB" />;
      default: return <Clock size={16} color="#666666" />;
    }
  };

  return (
    <View style={styles.activityCard}>
      <View style={styles.activityLeft}>
        <View style={[
          styles.activityIconContainer,
          { backgroundColor: activity.type === 'ticket' ? '#E67E2220' : 
                            activity.type === 'review' ? '#F39C1220' : '#3498DB20' }
        ]}>
          {getTypeIcon(activity.type)}
        </View>
      </View>
      
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <View style={styles.activityBadges}>
            {activity.priority && (
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(activity.priority) }]}>
                <Text style={styles.badgeText}>{activity.priority}</Text>
              </View>
            )}
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activity.status) }]}>
              <Text style={styles.badgeText}>{activity.status}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.activityDescription}>{activity.description}</Text>
        <Text style={styles.activityTime}>{activity.time}</Text>
      </View>
    </View>
  );
};

const QuickActionCard = ({
  title,
  subtitle,
  icon,
  badge,
  onPress
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
    <View style={styles.quickActionContent}>
      <View style={styles.quickActionIcon}>
        {icon}
      </View>
      <View style={styles.quickActionTexts}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
    </View>
    <View style={styles.quickActionArrow}>
      <ArrowRight size={16} color="#5ce1e6" />
    </View>
    {badge && (
      <View style={styles.quickActionBadge}>
        <Text style={styles.quickActionBadgeText}>{badge}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const DashboardContent = () => {
  const { company, isLoading } = useCompanyAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 156,
    openTickets: 23,
    resolvedTickets: 133,
    totalReviews: 89,
    averageRating: 4.2,
    activeChats: 7,
    responseTime: '2.3h',
    satisfactionRate: 94,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'ticket',
      title: 'Product defect claim',
      description: 'Customer reported damaged product on delivery',
      time: '2 hours ago',
      status: 'new',
      priority: 'high',
    },
    {
      id: '2',
      type: 'review',
      title: 'New 5-star review',
      description: 'Excellent service and fast delivery!',
      time: '4 hours ago',
      status: 'resolved',
    },
    {
      id: '3',
      type: 'chat',
      title: 'Live chat session',
      description: 'Customer inquiry about return policy',
      time: '6 hours ago',
      status: 'resolved',
    },
    {
      id: '4',
      type: 'ticket',
      title: 'Billing inquiry',
      description: 'Question about subscription charges',
      time: '1 day ago',
      status: 'pending',
      priority: 'medium',
    },
  ]);

  const navigateToSection = (section: string) => {
    router.push(`/dash/starship/${section}`);
  };

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5ce1e6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!company) {
    router.replace('/dash/starship');
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>Welcome back!</Text>
            <Text style={styles.welcomeSubtitle}>
              Here's what's happening with <Text style={styles.companyNameHighlight}>{company.name}</Text> today
            </Text>
          </View>
          {company.logo_url && (
            <Image source={{ uri: company.logo_url }} style={styles.companyLogo} />
          )}
        </View>
        
        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Tickets"
              value={stats.totalTickets.toString()}
              subtitle={`${stats.openTickets} open, ${stats.resolvedTickets} resolved`}
              icon={<AlertTriangle size={24} color="#E67E22" />}
              trend="up"
              trendValue="+12%"
              color="#E67E22"
            />
            <StatCard
              title="Reviews"
              value={stats.totalReviews.toString()}
              subtitle={`${stats.averageRating}/5 average rating`}
              icon={<Star size={24} color="#F39C12" />}
              trend="up"
              trendValue="+8%"
              color="#F39C12"
            />
            <StatCard
              title="Active Chats"
              value={stats.activeChats.toString()}
              subtitle={`${stats.responseTime} avg response`}
              icon={<MessageCircle size={24} color="#3498DB" />}
              trend="down"
              trendValue="-5%"
              color="#3498DB"
            />
            <StatCard
              title="Satisfaction"
              value={`${stats.satisfactionRate}%`}
              subtitle="Customer satisfaction rate"
              icon={<TrendingUp size={24} color="#27AE60" />}
              trend="up"
              trendValue="+3%"
              color="#27AE60"
              isWide={true}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <QuickActionCard
              title="Manage Tickets"
              subtitle="Handle claims & support requests"
              icon={<AlertTriangle size={24} color="#E67E22" />}
              badge={stats.openTickets.toString()}
              onPress={() => navigateToSection('tickets')}
            />
            
            <QuickActionCard
              title="Live Chats"
              subtitle="Respond to customer messages"
              icon={<MessageCircle size={24} color="#3498DB" />}
              badge={stats.activeChats.toString()}
              onPress={() => navigateToSection('chats')}
            />
            
            <QuickActionCard
              title="Marketing"
              subtitle="Analytics & campaigns"
              icon={<BarChart3 size={24} color="#9B59B6" />}
              onPress={() => navigateToSection('marketing')}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityList}>
            {recentActivity.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </View>
        </View>

        {/* Company Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>
          <View style={styles.companyCard}>
            <View style={styles.companyHeader}>
              <View style={styles.companyLogoContainer}>
                {company.logo_url ? (
                  <Image source={{ uri: company.logo_url }} style={styles.companyCardLogo} />
                ) : (
                  <View style={styles.companyLogoPlaceholder}>
                    <Building2 size={24} color="#5ce1e6" />
                  </View>
                )}
              </View>
              <View style={styles.companyDetails}>
                <Text style={styles.companyCardName}>{company.name}</Text>
                <Text style={styles.companyIndustry}>{company.industry}</Text>
                {company.verified && (
                  <View style={styles.verifiedBadge}>
                    <Shield size={12} color="#27AE60" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.companyDescription}>{company.description}</Text>
            <View style={styles.companyContacts}>
              {company.email && (
                <View style={styles.contactItem}>
                  <Mail size={16} color="#5ce1e6" />
                  <Text style={styles.contactText}>{company.email}</Text>
                </View>
              )}
              {company.phone && (
                <View style={styles.contactItem}>
                  <Phone size={16} color="#5ce1e6" />
                  <Text style={styles.contactText}>{company.phone}</Text>
                </View>
              )}
              {company.website && (
                <View style={styles.contactItem}>
                  <Globe size={16} color="#5ce1e6" />
                  <Text style={styles.contactText}>{company.website}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default DashboardContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  content: {
    flex: 1,
    marginTop: 60, // Space for the tab bar
  },
  contentContainer: {
    paddingBottom: 40,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 16,
    margin: 20,
    marginBottom: 0,
    borderLeftWidth: 4,
    borderLeftColor: '#5ce1e6',
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 22,
  },
  companyNameHighlight: {
    color: '#5ce1e6',
    fontWeight: '600',
  },
  companyLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginLeft: 16,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#5ce1e6',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    width: (width - 52) / 2,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  wideStatCard: {
    width: '100%',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#666666',
  },
  quickActions: {
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionTexts: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  quickActionArrow: {
    padding: 8,
  },
  quickActionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#E67E22',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quickActionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activityList: {
    gap: 12,
  },
  activityCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    flexDirection: 'row',
  },
  activityLeft: {
    marginRight: 16,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  activityBadges: {
    flexDirection: 'row',
    gap: 6,
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
  activityDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
    lineHeight: 20,
  },
  activityTime: {
    fontSize: 12,
    color: '#666666',
  },
  companyCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  companyLogoContainer: {
    marginRight: 16,
  },
  companyCardLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  companyLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyDetails: {
    flex: 1,
  },
  companyCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  companyIndustry: {
    fontSize: 14,
    color: '#5ce1e6',
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '600',
  },
  companyDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 16,
  },
  companyContacts: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});