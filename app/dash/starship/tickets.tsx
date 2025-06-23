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
  TextInput,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  TriangleAlert as AlertTriangle, 
  Star, 
  Clock, 
  CircleCheck as CheckCircle, 
  Circle as XCircle,
  MessageCircle,
  User,
  Calendar,
  Tag,
  Send
} from 'lucide-react-native';
import { useCompanyAuth } from '@/contexts/CompanyAuthContext';

interface Ticket {
  id: string;
  type: 'claim' | 'review';
  title: string;
  description: string;
  status: 'new' | 'pending' | 'in_progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  updatedAt: string;
  rating?: number;
  isVerifiedPurchase?: boolean;
  coinsAwarded?: number;
  resolutionNotes?: string;
}

const TicketCard = ({ ticket, onPress }: { ticket: Ticket; onPress: () => void }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#E67E22';
      case 'pending': return '#F39C12';
      case 'in_progress': return '#3498DB';
      case 'resolved': return '#27AE60';
      case 'rejected': return '#E74C3C';
      default: return '#666666';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#E74C3C';
      case 'high': return '#E67E22';
      case 'medium': return '#F39C12';
      case 'low': return '#27AE60';
      default: return '#666666';
    }
  };

  const getTypeIcon = () => {
    return ticket.type === 'claim' ? (
      <AlertTriangle size={16} color="#E67E22" />
    ) : (
      <Star size={16} color="#F39C12" />
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <TouchableOpacity style={styles.ticketCard} onPress={onPress}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketType}>
          {getTypeIcon()}
          <Text style={styles.ticketTypeText}>{ticket.type.toUpperCase()}</Text>
        </View>
        <View style={styles.ticketBadges}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
            <Text style={styles.badgeText}>{ticket.priority}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
            <Text style={styles.badgeText}>{ticket.status.replace('_', ' ')}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.ticketTitle}>{ticket.title}</Text>
      <Text style={styles.ticketDescription} numberOfLines={2}>{ticket.description}</Text>

      <View style={styles.ticketMeta}>
        <View style={styles.customerInfo}>
          <User size={14} color="#666666" />
          <Text style={styles.customerName}>{ticket.customerName}</Text>
        </View>
        <View style={styles.ticketDate}>
          <Calendar size={14} color="#666666" />
          <Text style={styles.dateText}>{formatDate(ticket.createdAt)}</Text>
        </View>
      </View>

      {ticket.type === 'review' && ticket.rating && (
        <View style={styles.ratingContainer}>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={12}
                color={star <= ticket.rating! ? '#F39C12' : '#2A2A2A'}
                fill={star <= ticket.rating! ? '#F39C12' : 'transparent'}
              />
            ))}
          </View>
          {ticket.isVerifiedPurchase && (
            <Text style={styles.verifiedText}>Verified Purchase</Text>
          )}
        </View>
      )}

      {ticket.coinsAwarded && (
        <View style={styles.coinsContainer}>
          <Text style={styles.coinsText}>+{ticket.coinsAwarded} coins awarded</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const TicketDetailModal = ({ 
  ticket, 
  visible, 
  onClose, 
  onUpdateStatus 
}: { 
  ticket: Ticket | null; 
  visible: boolean; 
  onClose: () => void;
  onUpdateStatus: (ticketId: string, status: string, notes?: string) => void;
}) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  if (!ticket) return null;

  const handleUpdateStatus = () => {
    if (selectedStatus) {
      onUpdateStatus(ticket.id, selectedStatus, resolutionNotes);
      setSelectedStatus('');
      setResolutionNotes('');
      onClose();
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: '#F39C12' },
    { value: 'in_progress', label: 'In Progress', color: '#3498DB' },
    { value: 'resolved', label: 'Resolved', color: '#27AE60' },
    { value: 'rejected', label: 'Rejected', color: '#E74C3C' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Ticket Details</Text>
          <TouchableOpacity onPress={handleUpdateStatus} disabled={!selectedStatus}>
            <Text style={[styles.modalSave, !selectedStatus && styles.modalSaveDisabled]}>
              Update
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.ticketDetailHeader}>
            <Text style={styles.ticketDetailTitle}>{ticket.title}</Text>
            <Text style={styles.ticketDetailCategory}>{ticket.category}</Text>
          </View>

          <View style={styles.customerSection}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <Text style={styles.customerDetailName}>{ticket.customerName}</Text>
            <Text style={styles.customerDetailEmail}>{ticket.customerEmail}</Text>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.ticketDetailDescription}>{ticket.description}</Text>
          </View>

          {ticket.resolutionNotes && (
            <View style={styles.resolutionSection}>
              <Text style={styles.sectionTitle}>Previous Resolution Notes</Text>
              <Text style={styles.resolutionText}>{ticket.resolutionNotes}</Text>
            </View>
          )}

          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>Update Status</Text>
            <View style={styles.statusOptions}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.statusOption,
                    selectedStatus === option.value && styles.statusOptionSelected,
                    { borderColor: option.color }
                  ]}
                  onPress={() => setSelectedStatus(option.value)}
                >
                  <Text style={[
                    styles.statusOptionText,
                    selectedStatus === option.value && { color: option.color }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Resolution Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes about the resolution..."
              placeholderTextColor="#666666"
              value={resolutionNotes}
              onChangeText={setResolutionNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const TicketsContent = () => {
  const { company } = useCompanyAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'claims' | 'reviews'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'new' | 'pending' | 'resolved'>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: '1',
      type: 'claim',
      title: 'Product defect issue',
      description: 'Received a damaged product and need replacement or refund. The packaging was intact but the product inside was broken.',
      status: 'new',
      priority: 'high',
      category: 'Product Quality',
      customerName: 'Emma Davis',
      customerEmail: 'emma.davis@email.com',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      coinsAwarded: 50,
    },
    {
      id: '2',
      type: 'review',
      title: 'Excellent service!',
      description: 'Really impressed with the quality and professionalism. The team went above and beyond to ensure everything was perfect.',
      status: 'resolved',
      priority: 'medium',
      category: 'Service Quality',
      customerName: 'Sarah Johnson',
      customerEmail: 'sarah.johnson@email.com',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      rating: 5,
      isVerifiedPurchase: true,
    },
    {
      id: '3',
      type: 'claim',
      title: 'Billing inquiry',
      description: 'Question about subscription charges that appeared on my account. Need clarification on the billing cycle.',
      status: 'in_progress',
      priority: 'medium',
      category: 'Billing',
      customerName: 'Mike Chen',
      customerEmail: 'mike.chen@email.com',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      resolutionNotes: 'Contacted customer to clarify billing details.',
    },
    {
      id: '4',
      type: 'review',
      title: 'Good experience overall',
      description: 'Service was good, though there was a slight delay in delivery. Would use again but hoping for faster shipping next time.',
      status: 'resolved',
      priority: 'low',
      category: 'Delivery',
      customerName: 'Alex Rodriguez',
      customerEmail: 'alex.rodriguez@email.com',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      updatedAt: new Date(Date.now() - 259200000).toISOString(),
      rating: 4,
      isVerifiedPurchase: true,
    },
  ]);

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'claims' && ticket.type === 'claim') ||
                         (selectedFilter === 'reviews' && ticket.type === 'review');
    
    const matchesStatus = selectedStatus === 'all' || ticket.status === selectedStatus;
    
    return matchesSearch && matchesFilter && matchesStatus;
  });

  const handleTicketPress = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = (ticketId: string, status: string, notes?: string) => {
    setTickets(prev => prev.map(ticket => 
      ticket.id === ticketId 
        ? { 
            ...ticket, 
            status: status as any, 
            updatedAt: new Date().toISOString(),
            resolutionNotes: notes || ticket.resolutionNotes
          }
        : ticket
    ));
  };

  const getFilterCounts = () => {
    const all = tickets.length;
    const claims = tickets.filter(t => t.type === 'claim').length;
    const reviews = tickets.filter(t => t.type === 'review').length;
    return { all, claims, reviews };
  };

  const counts = getFilterCounts();

  if (!company) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      {/* Search and Filters */}
      <View style={[styles.searchSection, { marginTop: 60 }]}>
        <Text style={styles.pageTitle}>Manage Tickets & Claims</Text>
        
        <View style={styles.searchBar}>
          <Search size={20} color="#666666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tickets..."
            placeholderTextColor="#666666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[styles.filterChipText, selectedFilter === 'all' && styles.filterChipTextActive]}>
                All ({counts.all})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'claims' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('claims')}
            >
              <Text style={[styles.filterChipText, selectedFilter === 'claims' && styles.filterChipTextActive]}>
                Claims ({counts.claims})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'reviews' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('reviews')}
            >
              <Text style={[styles.filterChipText, selectedFilter === 'reviews' && styles.filterChipTextActive]}>
                Reviews ({counts.reviews})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.statusFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {['all', 'new', 'pending', 'resolved'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.statusChip, selectedStatus === status && styles.statusChipActive]}
                onPress={() => setSelectedStatus(status as any)}
              >
                <Text style={[styles.statusChipText, selectedStatus === status && styles.statusChipTextActive]}>
                  {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Tickets List */}
      <ScrollView style={styles.ticketsList} showsVerticalScrollIndicator={false}>
        {filteredTickets.length > 0 ? (
          filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onPress={() => handleTicketPress(ticket)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <AlertTriangle size={48} color="#666666" />
            <Text style={styles.emptyTitle}>No tickets found</Text>
            <Text style={styles.emptyMessage}>
              {searchQuery ? 'Try adjusting your search or filters' : 'No tickets match the current filters'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Ticket Detail Modal */}
      <TicketDetailModal
        ticket={selectedTicket}
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onUpdateStatus={handleUpdateStatus}
      />
    </View>
  );
};

export default TicketsContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  searchSection: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  filters: {
    marginBottom: 12,
  },
  filterScroll: {
    paddingRight: 20,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  filterChipActive: {
    backgroundColor: '#5ce1e6',
    borderColor: '#5ce1e6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  statusFilters: {
    marginBottom: 8,
  },
  statusChip: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  statusChipActive: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
  },
  ticketsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  ticketCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666666',
    textTransform: 'uppercase',
  },
  ticketBadges: {
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
  ticketTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  ticketDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 12,
  },
  ticketMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: 12,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  ticketDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#666666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  verifiedText: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '500',
  },
  coinsContainer: {
    alignSelf: 'flex-start',
  },
  coinsText: {
    fontSize: 12,
    color: '#F39C12',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Modal Styles
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
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSave: {
    fontSize: 16,
    color: '#5ce1e6',
    fontWeight: '600',
  },
  modalSaveDisabled: {
    color: '#666666',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  ticketDetailHeader: {
    marginBottom: 24,
  },
  ticketDetailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  ticketDetailCategory: {
    fontSize: 16,
    color: '#5ce1e6',
    fontWeight: '600',
  },
  customerSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  customerDetailName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  customerDetailEmail: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  ticketDetailDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
  },
  resolutionSection: {
    marginBottom: 24,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  resolutionText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  statusSection: {
    marginBottom: 24,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#3A3A3A',
  },
  statusOptionSelected: {
    backgroundColor: '#1A1A1A',
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  notesSection: {
    marginBottom: 24,
  },
  notesInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    minHeight: 100,
  },
});