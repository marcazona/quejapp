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
} from 'react-native';
import { router } from 'expo-router';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageCircle, 
  Star, 
  ChartBar as BarChart3, 
  ChartPie as PieChart, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Clock,
  Target,
  Award,
  DollarSign,
  AlertTriangle
} from 'lucide-react-native';
import { useCompanyAuth } from '@/contexts/CompanyAuthContext';

const { width } = Dimensions.get('window');

interface ReportMetric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  color: string;
  period: string;
}

interface ChartData {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie';
  data: any[];
  color: string;
}

const MetricCard = ({ metric }: { metric: ReportMetric }) => (
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

const ChartCard = ({ chart }: { chart: ChartData }) => (
  <View style={styles.chartCard}>
    <View style={styles.chartHeader}>
      <Text style={styles.chartTitle}>{chart.title}</Text>
      <TouchableOpacity style={styles.chartAction}>
        <Download size={16} color="#5ce1e6" />
      </TouchableOpacity>
    </View>
    <View style={styles.chartPlaceholder}>
      {chart.type === 'line' && <TrendingUp size={48} color="#666666" />}
      {chart.type === 'bar' && <BarChart3 size={48} color="#666666" />}
      {chart.type === 'pie' && <PieChart size={48} color="#666666" />}
      <Text style={styles.chartPlaceholderText}>
        {chart.title} visualization would be displayed here
      </Text>
    </View>
  </View>
);

const ReportsContent = () => {
  const { company } = useCompanyAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'customer' | 'performance' | 'financial'>('all');

  const metrics: ReportMetric[] = [
    {
      title: 'Total Conversations',
      value: '1,247',
      change: '+18.2%',
      trend: 'up',
      icon: <MessageCircle size={24} color="#3498DB" />,
      color: '#3498DB',
      period: 'Last 30 days',
    },
    {
      title: 'Resolution Rate',
      value: '94.2%',
      change: '+2.1%',
      trend: 'up',
      icon: <Target size={24} color="#27AE60" />,
      color: '#27AE60',
      period: 'Last 30 days',
    },
    {
      title: 'Avg Response Time',
      value: '2.3h',
      change: '-15.4%',
      trend: 'up',
      icon: <Clock size={24} color="#F39C12" />,
      color: '#F39C12',
      period: 'Last 30 days',
    },
    {
      title: 'Customer Satisfaction',
      value: '4.6/5',
      change: '+0.2',
      trend: 'up',
      icon: <Star size={24} color="#E67E22" />,
      color: '#E67E22',
      period: 'Last 30 days',
    },
    {
      title: 'Active Tickets',
      value: '156',
      change: '-8.3%',
      trend: 'up',
      icon: <AlertTriangle size={24} color="#E74C3C" />,
      color: '#E74C3C',
      period: 'Currently open',
    },
    {
      title: 'Revenue Impact',
      value: '$12.4K',
      change: '+22.7%',
      trend: 'up',
      icon: <DollarSign size={24} color="#9B59B6" />,
      color: '#9B59B6',
      period: 'Last 30 days',
    },
  ];

  const charts: ChartData[] = [
    {
      id: '1',
      title: 'Conversation Volume Trends',
      type: 'line',
      data: [],
      color: '#3498DB',
    },
    {
      id: '2',
      title: 'Ticket Categories Breakdown',
      type: 'pie',
      data: [],
      color: '#E67E22',
    },
    {
      id: '3',
      title: 'Response Time Distribution',
      type: 'bar',
      data: [],
      color: '#27AE60',
    },
    {
      id: '4',
      title: 'Customer Satisfaction Scores',
      type: 'line',
      data: [],
      color: '#9B59B6',
    },
  ];

  const filteredMetrics = selectedCategory === 'all' ? metrics : metrics.filter(metric => {
    switch (selectedCategory) {
      case 'customer':
        return ['Total Conversations', 'Customer Satisfaction', 'Avg Response Time'].includes(metric.title);
      case 'performance':
        return ['Resolution Rate', 'Avg Response Time', 'Active Tickets'].includes(metric.title);
      case 'financial':
        return ['Revenue Impact'].includes(metric.title);
      default:
        return true;
    }
  });

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
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerLeft}>
            <Text style={styles.pageTitle}>Reports & Analytics</Text>
            <Text style={styles.pageSubtitle}>
              Comprehensive insights for {company.name}
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.refreshButton}>
              <RefreshCw size={18} color="#5ce1e6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportButton}>
              <Download size={18} color="#FFFFFF" />
              <Text style={styles.exportButtonText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters Section */}
        <View style={styles.filtersSection}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Time Period</Text>
            <View style={styles.periodSelector}>
              {['7d', '30d', '90d', '1y'].map((period) => (
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

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Category</Text>
            <View style={styles.categorySelector}>
              {[
                { key: 'all', label: 'All Metrics' },
                { key: 'customer', label: 'Customer' },
                { key: 'performance', label: 'Performance' },
                { key: 'financial', label: 'Financial' },
              ].map((category) => (
                <TouchableOpacity
                  key={category.key}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.key && styles.activeCategoryButton
                  ]}
                  onPress={() => setSelectedCategory(category.key as any)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    selectedCategory === category.key && styles.activeCategoryButtonText
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        
        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
          <View style={styles.metricsGrid}>
            {filteredMetrics.map((metric, index) => (
              <MetricCard key={index} metric={metric} />
            ))}
          </View>
        </View>

        {/* Charts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Analytics</Text>
          <View style={styles.chartsGrid}>
            {charts.map((chart) => (
              <ChartCard key={chart.id} chart={chart} />
            ))}
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Award size={24} color="#5ce1e6" />
              <Text style={styles.summaryTitle}>Performance Highlights</Text>
            </View>
            <View style={styles.summaryContent}>
              <View style={styles.summaryItem}>
                <View style={styles.summaryBullet} />
                <Text style={styles.summaryText}>
                  Customer satisfaction increased by 12% this month, reaching an all-time high of 4.6/5
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <View style={styles.summaryBullet} />
                <Text style={styles.summaryText}>
                  Response time improved by 15.4%, now averaging 2.3 hours
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <View style={styles.summaryBullet} />
                <Text style={styles.summaryText}>
                  Resolution rate maintained at 94.2%, exceeding industry standards
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <View style={styles.summaryBullet} />
                <Text style={styles.summaryText}>
                  Revenue impact from customer support increased by 22.7% to $12.4K
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ReportsContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    flex: 1,
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
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#5ce1e6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  filtersSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: '#5ce1e6',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  activePeriodButtonText: {
    color: '#FFFFFF',
  },
  categorySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  activeCategoryButton: {
    backgroundColor: '#5ce1e6',
    borderColor: '#5ce1e6',
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  activeCategoryButtonText: {
    color: '#FFFFFF',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
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
  chartsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  chartCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    width: (width - 52) / 2,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  chartAction: {
    padding: 4,
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
  summaryCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryContent: {
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  summaryBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5ce1e6',
    marginTop: 6,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
});