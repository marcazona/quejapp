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
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { TrendingUp, TrendingDown, Users, Building2, MessageCircle, DollarSign, TriangleAlert as AlertTriangle, Eye, RefreshCw, Calendar, ChartBar as BarChart3, ChartPie as PieChart, Activity } from 'lucide-react-native';
import { useCosmosAuth } from '@/contexts/CosmosAuthContext';

const { width } = Dimensions.get('window');

interface DashboardMetric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  color: string;
  period: string;
}

interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

const MetricCard = ({ metric }: { metric: DashboardMetric }) => (
  <View style={[styles.metricCard, { borderLeftColor: metric.color, borderLeftWidth: 4 }]}>
    <View style={styles.metricHeader}>
      <View style={[styles.metricIcon, { backgroundColor: `${metric.color}20` }]}>
        {metric.icon}
      </View>
      <View style={styles.trendContainer}>
        {metric.trend === 'up' ? (
          <TrendingUp size={16} color="#27AE60" />
        ) : (
          <TrendingDown size={16} color="#E74C3C" />
        )}
        <Text style={[styles.trendText, { color: metric.trend === 'up' ? '#27AE60' : '#E74C3C' }]}>
          {metric.change}
        </Text>
      </View>
    </View>
    <Text style={styles.metricValue}>{metric.value}</Text>
    <Text style={styles.metricTitle}>{metric.title}</Text>
    <Text style={styles.metricPeriod}>{metric.period}</Text>
  </View>
);

const AlertCard = ({ alert }: { alert: SystemAlert }) => {
  const getAlertColor = () => {
    switch (alert.type) {
      case 'error': return '#E74C3C';
      case 'warning': return '#F39C12';
      case 'info': return '#3498DB';
      default: return '#666666';
    }
  };

  return (
    <View style={[styles.alertCard, { borderLeftColor: getAlertColor() }]}>
      <View style={styles.alertHeader}>
        <View style={styles.alertLeft}>
          <AlertTriangle size={16} color={getAlertColor()} />
          <Text style={styles.alertTitle}>{alert.title}</Text>
        </View>
        <Text style={styles.alertTime}>{alert.timestamp}</Text>
      </View>
      <Text style={styles.alertMessage}>{alert.message}</Text>
      {!alert.resolved && (
        <TouchableOpacity style={styles.resolveButton}>
          <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const DashboardContent = () => {
  const { admin } = useCosmosAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  const metrics: DashboardMetric[] = [
    {
      title: 'Total Users',
      value: '12,847',
      change: '+8.2%',
      trend: 'up',
      icon: <Users size={24} color="#3498DB" />,
      color: '#3498DB',
      period: 'Last 7 days',
    },
    {
      title: 'Active Companies',
      value: '1,234',
      change: '+12.5%',
      trend: 'up',
      icon: <Building2 size={24} color="#27AE60" />,
      color: '#27AE60',
      period: 'Last 7 days',
    },
    {
      title: 'Total Posts',
      value: '45,678',
      change: '+15.3%',
      trend: 'up',
      icon: <MessageCircle size={24} color="#9B59B6" />,
      color: '#9B59B6',
      period: 'Last 7 days',
    },
    {
      title: 'Platform Revenue',
      value: '$89,432',
      change: '+22.1%',
      trend: 'up',
      icon: <DollarSign size={24} color="#F39C12" />,
      color: '#F39C12',
      period: 'Last 7 days',
    },
    {
      title: 'Active Sessions',
      value: '3,456',
      change: '-2.1%',
      trend: 'down',
      icon: <Activity size={24} color="#E67E22" />,
      color: '#E67E22',
      period: 'Current',
    },
    {
      title: 'System Health',
      value: '99.8%',
      change: '+0.1%',
      trend: 'up',
      icon: <BarChart3 size={24} color="#1ABC9C" />,
      color: '#1ABC9C',
      period: 'Uptime',
    },
  ];

  const systemAlerts: SystemAlert[] = [
    {
      id: '1',
      type: 'warning',
      title: 'High Server Load',
      message: 'Server CPU usage is above 85% for the last 10 minutes',
      timestamp: '2 min ago',
      resolved: false,
    },
    {
      id: '2',
      type: 'info',
      title: 'Scheduled Maintenance',
      message: 'Database maintenance scheduled for tonight at 2:00 AM UTC',
      timestamp: '1 hour ago',
      resolved: false,
    },
    {
      id: '3',
      type: 'error',
      title: 'Payment Gateway Issue',
      message: 'Stripe webhook endpoint returning 500 errors',
      timestamp: '3 hours ago',
      resolved: true,
    },
  ];

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    loadDashboardData(true);
  }, [selectedPeriod]);

  if (!admin) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
        
        <View style={[styles.loadingContainer, { marginTop: 60 }]}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      <ScrollView 
        style={[styles.content, { marginTop: 60 }]} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B6B" />
        }
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerLeft}>
            <Text style={styles.pageTitle}>Dashboard Overview</Text>
            <Text style={styles.pageSubtitle}>
              Welcome back, {admin.name}
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <View style={styles.periodSelector}>
              {['24h', '7d', '30d', '90d'].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period && styles.activePeriodButton
                  ]}
                  onPress={() => setSelectedPeriod(period as any)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.activePeriodButtonText
                  ]}>
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity style={styles.refreshButton} onPress={() => loadDashboardData(true)}>
              <RefreshCw size={18} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
          <View style={styles.metricsGrid}>
            {metrics.map((metric, index) => (
              <MetricCard key={index} metric={metric} />
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/dash/cosmos/companies')}
            >
              <Building2 size={32} color="#27AE60" />
              <Text style={styles.actionTitle}>Manage Companies</Text>
              <Text style={styles.actionSubtitle}>Create, edit, or block companies</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/dash/cosmos/users')}
            >
              <Users size={32} color="#3498DB" />
              <Text style={styles.actionTitle}>User Management</Text>
              <Text style={styles.actionSubtitle}>View and manage user accounts</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/dash/cosmos/billing')}
            >
              <DollarSign size={32} color="#F39C12" />
              <Text style={styles.actionTitle}>Billing Overview</Text>
              <Text style={styles.actionSubtitle}>Monitor platform revenue</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/dash/cosmos/analytics')}
            >
              <BarChart3 size={32} color="#9B59B6" />
              <Text style={styles.actionTitle}>Analytics</Text>
              <Text style={styles.actionSubtitle}>Detailed platform insights</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* System Alerts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>System Alerts</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/dash/cosmos/warnings')}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.alertsList}>
            {systemAlerts.slice(0, 3).map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Building2 size={16} color="#27AE60" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>New company registered</Text>
                <Text style={styles.activityTime}>TechStart Inc. • 5 minutes ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Users size={16} color="#3498DB" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>User verification completed</Text>
                <Text style={styles.activityTime}>john.doe@email.com • 12 minutes ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <DollarSign size={16} color="#F39C12" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Payment processed</Text>
                <Text style={styles.activityTime}>$299 subscription • 1 hour ago</Text>
              </View>
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
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
    alignItems: 'center',
    gap: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 2,
  },
  periodButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  activePeriodButton: {
    backgroundColor: '#FF6B6B',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  activePeriodButtonText: {
    color: '#FFFFFF',
  },
  refreshButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#FF6B6B',
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
    borderRadius: 6,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    width: (width - 52) / 2,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
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
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  metricPeriod: {
    fontSize: 12,
    color: '#666666',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    width: (width - 52) / 2,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
  },
  alertsList: {
    gap: 12,
  },
  alertCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  alertTime: {
    fontSize: 12,
    color: '#666666',
  },
  alertMessage: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 12,
  },
  resolveButton: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  resolveButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  activityCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#666666',
  },
});