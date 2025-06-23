import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import {
  Wallet,
  Plus,
  Minus,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Gift,
  Award,
  History,
  Send,
  Download,
  DollarSign,
  Zap,
  Shield,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react-native';

interface Transaction {
  id: string;
  type: 'reward' | 'purchase' | 'refund' | 'cashout' | 'bonus' | 'deposit';
  amount: number;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  category: string;
}

interface Reward {
  id: string;
  title: string;
  points: number;
  value: number;
  category: string;
  discount?: number;
  popular?: boolean;
}

interface WalletStats {
  totalEarned: number;
  totalSpent: number;
  monthlyGrowth: number;
  availableRewards: number;
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'reward',
    amount: 50,
    description: 'Profile completion bonus',
    timestamp: '2h ago',
    status: 'completed',
    category: 'Bonus',
  },
  {
    id: '2',
    type: 'deposit',
    amount: 100,
    description: 'Wallet top-up via card',
    timestamp: '1d ago',
    status: 'completed',
    category: 'Deposit',
  },
  {
    id: '3',
    type: 'purchase',
    amount: -25,
    description: 'Premium boost purchase',
    timestamp: '2d ago',
    status: 'completed',
    category: 'Premium',
  },
  {
    id: '4',
    type: 'bonus',
    amount: 15,
    description: 'Daily login streak bonus',
    timestamp: '3d ago',
    status: 'completed',
    category: 'Bonus',
  },
  {
    id: '5',
    type: 'cashout',
    amount: -75,
    description: 'Withdrawal to bank account',
    timestamp: '5d ago',
    status: 'completed',
    category: 'Withdrawal',
  },
];

const mockRewards: Reward[] = [
  {
    id: '1',
    title: 'Profile Boost',
    points: 500,
    value: 10,
    category: 'Premium',
    popular: true,
  },
  {
    id: '2',
    title: 'Super Like Pack',
    points: 300,
    value: 5,
    category: 'Features',
    discount: 20,
  },
  {
    id: '3',
    title: 'Gift Card $25',
    points: 2500,
    value: 25,
    category: 'Cash',
  },
  {
    id: '4',
    title: 'Premium Week',
    points: 700,
    value: 15,
    category: 'Premium',
    popular: true,
  },
];

const walletStats: WalletStats = {
  totalEarned: 847.50,
  totalSpent: 325.00,
  monthlyGrowth: 18.5,
  availableRewards: 12,
};

const TransactionIcon = ({ type, status }: { type: Transaction['type']; status: Transaction['status'] }) => {
  const getColor = () => {
    if (status === 'pending') return '#E67E22';
    if (status === 'failed') return '#E74C3C';
    
    switch (type) {
      case 'reward':
      case 'bonus':
      case 'deposit':
        return '#27AE60';
      case 'purchase':
      case 'cashout':
        return '#E74C3C';
      default:
        return '#666666';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'reward':
        return <Gift size={20} color={getColor()} />;
      case 'bonus':
        return <Zap size={20} color={getColor()} />;
      case 'deposit':
        return <ArrowDownLeft size={20} color={getColor()} />;
      case 'purchase':
        return <Minus size={20} color={getColor()} />;
      case 'cashout':
        return <ArrowUpRight size={20} color={getColor()} />;
      default:
        return <DollarSign size={20} color={getColor()} />;
    }
  };

  return getIcon();
};

const TransactionCard = ({ transaction }: { transaction: Transaction }) => {
  const isPositive = transaction.amount > 0;
  
  const getStatusColor = () => {
    switch (transaction.status) {
      case 'completed':
        return '#27AE60';
      case 'pending':
        return '#E67E22';
      case 'failed':
        return '#E74C3C';
    }
  };

  return (
    <View style={styles.transactionCard}>
      <View style={styles.transactionLeft}>
        <View style={[
          styles.transactionIconContainer,
          { backgroundColor: isPositive ? '#1A2A1A' : '#2A1A1A' }
        ]}>
          <TransactionIcon type={transaction.type} status={transaction.status} />
        </View>
        
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>{transaction.description}</Text>
          <View style={styles.transactionMeta}>
            <Text style={styles.transactionTime}>{transaction.timestamp}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{transaction.status}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          { color: isPositive ? '#27AE60' : '#E74C3C' }
        ]}>
          {isPositive ? '+' : ''}${Math.abs(transaction.amount)}
        </Text>
        <Text style={styles.transactionCategory}>{transaction.category}</Text>
      </View>
    </View>
  );
};

const RewardCard = ({ reward }: { reward: Reward }) => {
  return (
    <TouchableOpacity style={[styles.rewardCard, reward.popular && styles.popularReward]}>
      {reward.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>Popular</Text>
        </View>
      )}
      
      <View style={styles.rewardHeader}>
        <Award size={24} color="#8E44AD" />
        <Text style={styles.rewardTitle}>{reward.title}</Text>
      </View>
      
      <View style={styles.rewardDetails}>
        <View style={styles.rewardPoints}>
          <Text style={styles.pointsText}>{reward.points} points</Text>
          {reward.discount && (
            <Text style={styles.discountText}>{reward.discount}% off</Text>
          )}
        </View>
        <Text style={styles.rewardValue}>${reward.value} value</Text>
      </View>
      
      <View style={styles.rewardFooter}>
        <View style={styles.rewardCategory}>
          <Text style={styles.rewardCategoryText}>{reward.category}</Text>
        </View>
        <TouchableOpacity style={styles.redeemButton}>
          <Text style={styles.redeemButtonText}>Redeem</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const StatCard = ({ icon, title, value, subtitle, color }: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: `${color}33` }]}>
      {icon}
    </View>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statSubtitle}>{subtitle}</Text>
  </View>
);

export default function WalletScreen() {
  const [balance] = useState(522.50);
  const [points] = useState(1850);
  const [activeTab, setActiveTab] = useState<'transactions' | 'rewards' | 'stats'>('transactions');

  const monthlyChange = 12.5;
  const isPositiveChange = monthlyChange > 0;

  const TabButton = ({ tab, label, icon }: { tab: typeof activeTab; label: string; icon: React.ReactNode }) => (
    <TouchableOpacity
      style={[styles.tab, activeTab === tab && styles.activeTab]}
      onPress={() => setActiveTab(tab)}
    >
      {icon}
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {label}
      </Text>
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
              <Text style={styles.headerTitle}>Wallet</Text>
              <Text style={styles.headerSubtitle}>Manage your balance & rewards</Text>
            </View>
            <TouchableOpacity style={styles.historyButton}>
              <History size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Balance Section */}
        <View style={styles.balanceSection}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <View style={styles.balanceLeft}>
                <Wallet size={28} color="#5ce1e6" />
                <Text style={styles.balanceLabel}>Available Balance</Text>
              </View>
              <Shield size={20} color="#27AE60" />
            </View>
            
            <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
            
            <View style={styles.balanceChange}>
              {isPositiveChange ? (
                <TrendingUp size={16} color="#27AE60" />
              ) : (
                <TrendingDown size={16} color="#E74C3C" />
              )}
              <Text style={[
                styles.changeText,
                { color: isPositiveChange ? '#27AE60' : '#E74C3C' }
              ]}>
                {isPositiveChange ? '+' : ''}{monthlyChange}% this month
              </Text>
            </View>
          </View>

          <View style={styles.pointsCard}>
            <View style={styles.pointsHeader}>
              <Award size={20} color="#E67E22" />
              <Text style={styles.pointsLabel}>Reward Points</Text>
            </View>
            
            <Text style={styles.pointsAmount}>{points.toLocaleString()}</Text>
            <Text style={styles.pointsValue}>≈ ${(points * 0.01).toFixed(2)} value</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Plus size={18} color="#0A0A0A" />
            <Text style={styles.actionButtonText}>Add Funds</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
            <Download size={18} color="#5ce1e6" />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Container */}
        <View style={styles.tabContainer}>
          <TabButton 
            tab="transactions" 
            label="Transactions" 
            icon={<CreditCard size={18} color={activeTab === 'transactions' ? '#5ce1e6' : '#666666'} />} 
          />
          <TabButton 
            tab="rewards" 
            label="Rewards" 
            icon={<Gift size={18} color={activeTab === 'rewards' ? '#5ce1e6' : '#666666'} />} 
          />
          <TabButton 
            tab="stats" 
            label="Stats" 
            icon={<TrendingUp size={18} color={activeTab === 'stats' ? '#5ce1e6' : '#666666'} />} 
          />
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'transactions' && (
            <View>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              {mockTransactions.map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))}
            </View>
          )}

          {activeTab === 'rewards' && (
            <View>
              <Text style={styles.sectionTitle}>Available Rewards</Text>
              <View style={styles.rewardsGrid}>
                {mockRewards.map((reward) => (
                  <RewardCard key={reward.id} reward={reward} />
                ))}
              </View>
            </View>
          )}

          {activeTab === 'stats' && (
            <View>
              <Text style={styles.sectionTitle}>Wallet Statistics</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  icon={<DollarSign size={20} color="#27AE60" />}
                  title="Total Earned"
                  value={`$${walletStats.totalEarned.toFixed(2)}`}
                  subtitle="All time"
                  color="#27AE60"
                />
                <StatCard
                  icon={<TrendingUp size={20} color="#5ce1e6" />}
                  title="Monthly Growth"
                  value={`${walletStats.monthlyGrowth}%`}
                  subtitle="This month"
                  color="#5ce1e6"
                />
                <StatCard
                  icon={<Gift size={20} color="#E67E22" />}
                  title="Available Rewards"
                  value={walletStats.availableRewards.toString()}
                  subtitle="Ready to claim"
                  color="#E67E22"
                />
                <StatCard
                  icon={<Clock size={20} color="#E74C3C" />}
                  title="Total Spent"
                  value={`$${walletStats.totalSpent.toFixed(2)}`}
                  subtitle="All time"
                  color="#E74C3C"
                />
              </View>
            </View>
          )}
        </View>
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
    backgroundColor: '#1A1A1A',
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
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888888',
    marginTop: 2,
  },
  historyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  content: {
    flex: 1,
  },
  balanceSection: {
    padding: 20,
    gap: 16,
  },
  balanceCard: {
    backgroundColor: '#1A1A1A',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888888',
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -1,
  },
  balanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pointsCard: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  pointsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pointsAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E67E22',
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5ce1e6',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#5ce1e6',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#5ce1e6',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#2A2A2A',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#5ce1e6',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionTime: {
    fontSize: 12,
    color: '#666666',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0A0A0A',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  rewardsGrid: {
    gap: 12,
  },
  rewardCard: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    position: 'relative',
  },
  popularReward: {
    borderColor: '#8E44AD',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#8E44AD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rewardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rewardPoints: {
    gap: 4,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5ce1e6',
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#27AE60',
  },
  rewardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#27AE60',
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardCategory: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rewardCategoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888888',
  },
  redeemButton: {
    backgroundColor: '#5ce1e6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  redeemButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 16,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888888',
    textAlign: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
  },
});