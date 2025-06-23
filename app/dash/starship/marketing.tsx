import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, TrendingUp, TrendingDown, Eye, Users, MessageCircle, Star, ChartBar as BarChart3, ChartPie as PieChart, Calendar, Target, Zap, Award, DollarSign } from 'lucide-react-native';
import { useCompanyAuth } from '@/contexts/CompanyAuthContext';

const { width } = Dimensions.get('window');

interface MetricCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  color: string;
}

interface CampaignData {
  id: string;
  name: string;
  type: 'social' | 'email' | 'ads' | 'content';
  status: 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  startDate: string;
  endDate: string;
}

const MetricCard = ({ metric }: { metric: MetricCard }) => (
  <View style={styles.metricCard}>
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
  </View>
);

const CampaignCard = ({ campaign }: { campaign: CampaignData }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#27AE60';
      case 'paused': return '#F39C12';
      case 'completed': return '#95A5A6';
      default: return '#666666';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'social': return <Users size={16} color="#3498DB" />;
      case 'email': return <MessageCircle size={16} color="#E67E22" />;
      case 'ads': return <Target size={16} color="#E74C3C" />;
      case 'content': return <BarChart3 size={16} color="#9B59B6" />;
      default: return <Zap size={16} color="#666666" />;
    }
  };

  const ctr = campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : '0.00';
  const conversionRate = campaign.clicks > 0 ? ((campaign.conversions / campaign.clicks) * 100).toFixed(2) : '0.00';
  const budgetUsed = campaign.budget > 0 ? ((campaign.spent / campaign.budget) * 100).toFixed(0) : '0';

  return (
    <View style={styles.campaignCard}>
      <View style={styles.campaignHeader}>
        <View style={styles.campaignInfo}>
          <View style={styles.campaignType}>
            {getTypeIcon(campaign.type)}
            <Text style={styles.campaignTypeText}>{campaign.type.toUpperCase()}</Text>
          </View>
          <Text style={styles.campaignName}>{campaign.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(campaign.status) }]}>
          <Text style={styles.statusText}>{campaign.status}</Text>
        </View>
      </View>

      <View style={styles.campaignMetrics}>
        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Budget Used</Text>
            <Text style={styles.metricValue}>${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${budgetUsed}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Impressions</Text>
            <Text style={styles.metricValue}>{campaign.impressions.toLocaleString()}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Clicks</Text>
            <Text style={styles.metricValue}>{campaign.clicks.toLocaleString()}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>CTR</Text>
            <Text style={styles.metricValue}>{ctr}%</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Conversions</Text>
            <Text style={styles.metricValue}>{campaign.conversions}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Conv. Rate</Text>
            <Text style={styles.metricValue}>{conversionRate}%</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>CPC</Text>
            <Text style={styles.metricValue}>
              ${campaign.clicks > 0 ? (campaign.spent / campaign.clicks).toFixed(2) : '0.00'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.campaignFooter}>
        <Text style={styles.campaignDates}>
          {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
        </Text>
        <TouchableOpacity style={styles.viewCampaignButton}>
          <Text style={styles.viewCampaignText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const MarketingContent = () => {
  const { company } = useCompanyAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const metrics: MetricCard[] = [
    {
      title: 'Total Reach',
      value: '45.2K',
      change: '+12.5%',
      trend: 'up',
      icon: <Eye size={24} color="#3498DB" />,
      color: '#3498DB',
    },
    {
      title: 'Engagement Rate',
      value: '8.4%',
      change: '+2.1%',
      trend: 'up',
      icon: <Users size={24} color="#27AE60" />,
      color: '#27AE60',
    },
    {
      title: 'Click-Through Rate',
      value: '3.2%',
      change: '-0.5%',
      trend: 'down',
      icon: <Target size={24} color="#E67E22" />,
      color: '#E67E22',
    },
    {
      title: 'Conversion Rate',
      value: '2.8%',
      change: '+0.8%',
      trend: 'up',
      icon: <Award size={24} color="#9B59B6" />,
      color: '#9B59B6',
    },
    {
      title: 'Ad Spend',
      value: '$2,450',
      change: '+15.2%',
      trend: 'up',
      icon: <DollarSign size={24} color="#E74C3C" />,
      color: '#E74C3C',
    },
    {
      title: 'ROAS',
      value: '4.2x',
      change: '+0.3x',
      trend: 'up',
      icon: <TrendingUp size={24} color="#F39C12" />,
      color: '#F39C12',
    },
  ];

  const campaigns: CampaignData[] = [
    {
      id: '1',
      name: 'Summer Product Launch',
      type: 'ads',
      status: 'active',
      budget: 5000,
      spent: 3200,
      impressions: 125000,
      clicks: 4200,
      conversions: 156,
      startDate: '2024-06-01',
      endDate: '2024-06-30',
    },
    {
      id: '2',
      name: 'Email Newsletter Campaign',
      type: 'email',
      status: 'active',
      budget: 1500,
      spent: 890,
      impressions: 45000,
      clicks: 2100,
      conversions: 89,
      startDate: '2024-06-15',
      endDate: '2024-07-15',
    },
    {
      id: '3',
      name: 'Social Media Awareness',
      type: 'social',
      status: 'paused',
      budget: 2000,
      spent: 1200,
      impressions: 78000,
      clicks: 1800,
      conversions: 45,
      startDate: '2024-05-01',
      endDate: '2024-05-31',
    },
  ];

  if (!company) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      <ScrollView 
        style={[styles.content, { marginTop: 60 }]} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>Marketing & Analytics</Text>
          
          <View style={styles.periodSelector}>
            {['7d', '30d', '90d'].map((period) => (
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
        </View>
        
        {/* Overview Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          <View style={styles.metricsGrid}>
            {metrics.map((metric, index) => (
              <MetricCard key={index} metric={metric} />
            ))}
          </View>
        </View>

        {/* Charts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analytics Dashboard</Text>
          <View style={styles.chartsContainer}>
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <BarChart3 size={20} color="#5ce1e6" />
                <Text style={styles.chartTitle}>Traffic Sources</Text>
              </View>
              <View style={styles.chartPlaceholder}>
                <PieChart size={48} color="#666666" />
                <Text style={styles.chartPlaceholderText}>Chart visualization would go here</Text>
              </View>
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <TrendingUp size={20} color="#5ce1e6" />
                <Text style={styles.chartTitle}>Conversion Funnel</Text>
              </View>
              <View style={styles.chartPlaceholder}>
                <BarChart3 size={48} color="#666666" />
                <Text style={styles.chartPlaceholderText}>Funnel analysis would go here</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Active Campaigns */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Campaigns</Text>
            <TouchableOpacity style={styles.createCampaignButton}>
              <Text style={styles.createCampaignText}>Create Campaign</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.campaignsList}>
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </View>
        </View>

        {/* Insights & Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights & Recommendations</Text>
          <View style={styles.insightsContainer}>
            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <TrendingUp size={20} color="#27AE60" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Engagement Trending Up</Text>
                <Text style={styles.insightDescription}>
                  Your social media engagement has increased by 15% this week. Consider increasing your content frequency.
                </Text>
              </View>
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <Target size={20} color="#E67E22" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Optimize Ad Targeting</Text>
                <Text style={styles.insightDescription}>
                  Your ads are performing well with the 25-34 age group. Consider allocating more budget to this segment.
                </Text>
              </View>
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <Calendar size={20} color="#3498DB" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Best Posting Times</Text>
                <Text style={styles.insightDescription}>
                  Your audience is most active on weekdays between 2-4 PM. Schedule your posts accordingly.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activePeriodButton: {
    backgroundColor: '#5ce1e6',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  activePeriodButtonText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
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
  createCampaignButton: {
    backgroundColor: '#5ce1e6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createCampaignText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  },
  chartsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  chartCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chartPlaceholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
  },
  chartPlaceholderText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  campaignsList: {
    gap: 16,
  },
  campaignCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  campaignTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666666',
    textTransform: 'uppercase',
  },
  campaignName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  campaignMetrics: {
    gap: 12,
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5ce1e6',
    borderRadius: 2,
  },
  campaignFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  campaignDates: {
    fontSize: 12,
    color: '#666666',
  },
  viewCampaignButton: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewCampaignText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5ce1e6',
  },
  insightsContainer: {
    gap: 12,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
});