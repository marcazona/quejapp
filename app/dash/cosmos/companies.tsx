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
  TextInput,
  Modal,
  Alert,
  Image,
  Switch,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Building2, Plus, Search, Filter, MoveVertical as MoreVertical, Shield, Globe, Phone, Mail, MapPin, CreditCard as Edit, Trash2, Ban, CircleCheck as CheckCircle, X, Save } from 'lucide-react-native';
import { useCosmosAuth } from '@/contexts/CosmosAuthContext';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface Company {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  industry: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  rating: number | null;
  total_reviews: number;
  total_claims: number;
  verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CompanyCard = ({ 
  company, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onToggleVerification 
}: { 
  company: Company;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  onToggleStatus: (company: Company) => void;
  onToggleVerification: (company: Company) => void;
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <View style={styles.companyCard}>
      <View style={styles.companyHeader}>
        <View style={styles.companyInfo}>
          <View style={styles.companyLogoContainer}>
            {company.logo_url ? (
              <Image source={{ uri: company.logo_url }} style={styles.companyLogo} />
            ) : (
              <View style={styles.companyLogoPlaceholder}>
                <Building2 size={24} color="#666666" />
              </View>
            )}
            {company.verified && (
              <View style={styles.verifiedBadge}>
                <Shield size={12} color="#FFFFFF" />
              </View>
            )}
          </View>
          
          <View style={styles.companyDetails}>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text style={styles.companyIndustry}>{company.industry}</Text>
            <View style={styles.companyMeta}>
              <Text style={styles.companyMetaText}>
                {company.total_reviews || 0} reviews • {company.total_claims || 0} claims
              </Text>
              <View style={[
                styles.statusBadge, 
                company.is_active ? styles.activeBadge : styles.inactiveBadge
              ]}>
                <Text style={[
                  styles.statusText,
                  company.is_active ? styles.activeText : styles.inactiveText
                ]}>
                  {company.is_active ? 'Active' : 'Blocked'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.actionsButton}
          onPress={() => setShowActions(true)}
        >
          <MoreVertical size={20} color="#666666" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.companyDescription} numberOfLines={2}>
        {company.description}
      </Text>
      
      <View style={styles.companyContact}>
        {company.website && (
          <View style={styles.contactItem}>
            <Globe size={14} color="#666666" />
            <Text style={styles.contactText}>{company.website}</Text>
          </View>
        )}
        {company.email && (
          <View style={styles.contactItem}>
            <Mail size={14} color="#666666" />
            <Text style={styles.contactText}>{company.email}</Text>
          </View>
        )}
      </View>

      {/* Actions Modal */}
      <Modal
        visible={showActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActions(false)}
        >
          <View style={styles.actionsModal}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setShowActions(false);
                onEdit(company);
              }}
            >
              <Edit size={16} color="#3498DB" />
              <Text style={styles.actionText}>Edit Company</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setShowActions(false);
                onToggleVerification(company);
              }}
            >
              <Shield size={16} color={company.verified ? "#E67E22" : "#27AE60"} />
              <Text style={styles.actionText}>
                {company.verified ? 'Remove Verification' : 'Verify Company'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setShowActions(false);
                onToggleStatus(company);
              }}
            >
              <Ban size={16} color={company.is_active ? "#E67E22" : "#27AE60"} />
              <Text style={styles.actionText}>
                {company.is_active ? 'Block Company' : 'Unblock Company'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionItem, styles.deleteAction]}
              onPress={() => {
                setShowActions(false);
                onDelete(company);
              }}
            >
              <Trash2 size={16} color="#E74C3C" />
              <Text style={[styles.actionText, styles.deleteText]}>Delete Company</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const CompanyModal = ({ 
  visible, 
  company, 
  onClose, 
  onSave 
}: {
  visible: boolean;
  company: Company | null;
  onClose: () => void;
  onSave: (companyData: Partial<Company>) => void;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    website: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: '',
    logo_url: '',
    verified: false,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        description: company.description,
        industry: company.industry,
        website: company.website || '',
        phone: company.phone || '',
        email: company.email || '',
        address: company.address || '',
        city: company.city || '',
        country: company.country || '',
        logo_url: company.logo_url || '',
        verified: company.verified,
        is_active: company.is_active,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        industry: '',
        website: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        country: '',
        logo_url: '',
        verified: false,
        is_active: true,
      });
    }
    setErrors({});
  }, [company, visible]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    }
    
    if (!formData.industry.trim()) {
      newErrors.industry = 'Industry is required';
    }
    
    if (formData.website && !formData.website.includes('.')) {
      newErrors.website = 'Please enter a valid website URL';
    }
    
    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving company:', error);
      Alert.alert('Error', 'Failed to save company. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} disabled={saving}>
            <X size={24} color="#666666" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {company ? 'Edit Company' : 'Create Company'}
          </Text>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FF6B6B" />
            ) : (
              <Save size={20} color="#FF6B6B" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Company Name *</Text>
            <TextInput
              style={[styles.input, errors.name ? styles.inputError : null]}
              value={formData.name}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, name: text }));
                if (errors.name) {
                  setErrors(prev => ({ ...prev, name: undefined }));
                }
              }}
              placeholder="Enter company name"
              placeholderTextColor="#666666"
              editable={!saving}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.textArea}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Company description"
              placeholderTextColor="#666666"
              multiline
              numberOfLines={4}
              editable={!saving}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Industry *</Text>
            <TextInput
              style={[styles.input, errors.industry ? styles.inputError : null]}
              value={formData.industry}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, industry: text }));
                if (errors.industry) {
                  setErrors(prev => ({ ...prev, industry: undefined }));
                }
              }}
              placeholder="e.g., Technology, Healthcare"
              placeholderTextColor="#666666"
              editable={!saving}
            />
            {errors.industry && <Text style={styles.errorText}>{errors.industry}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={[styles.input, errors.website ? styles.inputError : null]}
              value={formData.website}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, website: text }));
                if (errors.website) {
                  setErrors(prev => ({ ...prev, website: undefined }));
                }
              }}
              placeholder="https://company.com"
              placeholderTextColor="#666666"
              keyboardType="url"
              editable={!saving}
            />
            {errors.website && <Text style={styles.errorText}>{errors.website}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : null]}
              value={formData.email}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, email: text }));
                if (errors.email) {
                  setErrors(prev => ({ ...prev, email: undefined }));
                }
              }}
              placeholder="contact@company.com"
              placeholderTextColor="#666666"
              keyboardType="email-address"
              editable={!saving}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              placeholder="+1 (555) 123-4567"
              placeholderTextColor="#666666"
              keyboardType="phone-pad"
              editable={!saving}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={formData.address}
              onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
              placeholder="123 Main Street"
              placeholderTextColor="#666666"
              editable={!saving}
            />
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                placeholder="New York"
                placeholderTextColor="#666666"
                editable={!saving}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Country</Text>
              <TextInput
                style={styles.input}
                value={formData.country}
                onChangeText={(text) => setFormData(prev => ({ ...prev, country: text }))}
                placeholder="USA"
                placeholderTextColor="#666666"
                editable={!saving}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Logo URL</Text>
            <TextInput
              style={styles.input}
              value={formData.logo_url}
              onChangeText={(text) => setFormData(prev => ({ ...prev, logo_url: text }))}
              placeholder="https://example.com/logo.png"
              placeholderTextColor="#666666"
              keyboardType="url"
              editable={!saving}
            />
          </View>

          <View style={styles.switchGroup}>
            <View style={styles.switchItem}>
              <Text style={styles.switchLabel}>Verified Company</Text>
              <Switch
                value={formData.verified}
                onValueChange={(value) => setFormData(prev => ({ ...prev, verified: value }))}
                trackColor={{ false: '#2A2A2A', true: '#FF6B6B' }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>

            <View style={styles.switchItem}>
              <Text style={styles.switchLabel}>Active Status</Text>
              <Switch
                value={formData.is_active}
                onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value }))}
                trackColor={{ false: '#2A2A2A', true: '#FF6B6B' }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const CompaniesContent = () => {
  const { admin } = useCosmosAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked'>('all');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading companies:', error);
        Alert.alert('Error', 'Failed to load companies');
        return;
      }

      console.log('Loaded companies:', data?.length || 0);
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      Alert.alert('Error', 'Failed to load companies');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateCompany = async (companyData: Partial<Company>) => {
    try {
      console.log('Creating company with data:', companyData);
      
      const { data, error } = await supabase
        .from('companies')
        .insert([{
          name: companyData.name,
          description: companyData.description || '',
          industry: companyData.industry,
          website: companyData.website || null,
          phone: companyData.phone || null,
          email: companyData.email || null,
          address: companyData.address || null,
          city: companyData.city || null,
          country: companyData.country || null,
          logo_url: companyData.logo_url || null,
          verified: companyData.verified || false,
          is_active: companyData.is_active !== undefined ? companyData.is_active : true,
          rating: null,
          total_reviews: 0,
          total_claims: 0,
        }])
        .select();

      if (error) {
        console.error('Error creating company:', error);
        Alert.alert('Error', `Failed to create company: ${error.message}`);
        return;
      }

      if (data && data.length > 0) {
        console.log('Company created successfully:', data[0]);
        setCompanies(prev => [data[0], ...prev]);
        Alert.alert('Success', 'Company created successfully');
      }
    } catch (error: any) {
      console.error('Error creating company:', error);
      Alert.alert('Error', `Failed to create company: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEditCompany = async (companyData: Partial<Company>) => {
    if (!editingCompany) return;

    try {
      console.log('Updating company with data:', companyData);
      
      const { data, error } = await supabase
        .from('companies')
        .update({
          name: companyData.name,
          description: companyData.description,
          industry: companyData.industry,
          website: companyData.website || null,
          phone: companyData.phone || null,
          email: companyData.email || null,
          address: companyData.address || null,
          city: companyData.city || null,
          country: companyData.country || null,
          logo_url: companyData.logo_url || null,
          verified: companyData.verified,
          is_active: companyData.is_active,
        })
        .eq('id', editingCompany.id)
        .select();

      if (error) {
        console.error('Error updating company:', error);
        Alert.alert('Error', `Failed to update company: ${error.message}`);
        return;
      }

      if (data && data.length > 0) {
        setCompanies(prev => prev.map(c => c.id === editingCompany.id ? data[0] : c));
        setEditingCompany(null);
        Alert.alert('Success', 'Company updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating company:', error);
      Alert.alert('Error', `Failed to update company: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteCompany = (company: Company) => {
    Alert.alert(
      'Delete Company',
      `Are you sure you want to delete "${company.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('companies')
                .delete()
                .eq('id', company.id);

              if (error) {
                console.error('Error deleting company:', error);
                Alert.alert('Error', `Failed to delete company: ${error.message}`);
                return;
              }

              setCompanies(prev => prev.filter(c => c.id !== company.id));
              Alert.alert('Success', 'Company deleted successfully');
            } catch (error: any) {
              console.error('Error deleting company:', error);
              Alert.alert('Error', `Failed to delete company: ${error.message || 'Unknown error'}`);
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (company: Company) => {
    const newStatus = !company.is_active;
    const action = newStatus ? 'unblock' : 'block';
    
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Company`,
      `Are you sure you want to ${action} "${company.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('companies')
                .update({ is_active: newStatus })
                .eq('id', company.id);

              if (error) {
                console.error('Error updating company status:', error);
                Alert.alert('Error', `Failed to update company status: ${error.message}`);
                return;
              }

              setCompanies(prev => prev.map(c => 
                c.id === company.id ? { ...c, is_active: newStatus } : c
              ));
              Alert.alert('Success', `Company ${action}ed successfully`);
            } catch (error: any) {
              console.error('Error updating company status:', error);
              Alert.alert('Error', `Failed to update company status: ${error.message || 'Unknown error'}`);
            }
          },
        },
      ]
    );
  };

  const handleToggleVerification = async (company: Company) => {
    const newVerified = !company.verified;
    const action = newVerified ? 'verify' : 'remove verification from';
    
    Alert.alert(
      `${newVerified ? 'Verify' : 'Remove Verification'}`,
      `Are you sure you want to ${action} "${company.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: newVerified ? 'Verify' : 'Remove',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('companies')
                .update({ verified: newVerified })
                .eq('id', company.id);

              if (error) {
                console.error('Error updating company verification:', error);
                Alert.alert('Error', `Failed to update company verification: ${error.message}`);
                return;
              }

              setCompanies(prev => prev.map(c => 
                c.id === company.id ? { ...c, verified: newVerified } : c
              ));
              Alert.alert('Success', `Company verification ${newVerified ? 'added' : 'removed'} successfully`);
            } catch (error: any) {
              console.error('Error updating company verification:', error);
              Alert.alert('Error', `Failed to update company verification: ${error.message || 'Unknown error'}`);
            }
          },
        },
      ]
    );
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadCompanies();
  }, []);

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.industry.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && company.is_active) ||
                         (filterStatus === 'blocked' && !company.is_active);
    
    return matchesSearch && matchesFilter;
  });

  if (!admin) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      <View style={[styles.content, { marginTop: 60 }]}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerLeft}>
            <Text style={styles.pageTitle}>Company Management</Text>
            <Text style={styles.pageSubtitle}>
              {companies.length} companies • {companies.filter(c => c.is_active).length} active
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Create Company</Text>
          </TouchableOpacity>
        </View>

        {/* Search and Filters */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={20} color="#666666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search companies..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#666666"
            />
          </View>
          
          <View style={styles.filterButtons}>
            {['all', 'active', 'blocked'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  filterStatus === filter && styles.activeFilterButton
                ]}
                onPress={() => setFilterStatus(filter as any)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filterStatus === filter && styles.activeFilterButtonText
                ]}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Companies List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B6B" />
            <Text style={styles.loadingText}>Loading companies...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.companiesList} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B6B" />
            }
          >
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  onEdit={setEditingCompany}
                  onDelete={handleDeleteCompany}
                  onToggleStatus={handleToggleStatus}
                  onToggleVerification={handleToggleVerification}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Building2 size={64} color="#3A3A3A" />
                <Text style={styles.emptyTitle}>No companies found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? 'Try adjusting your search terms' : 'Create your first company to get started'}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity 
                    style={styles.createEmptyButton}
                    onPress={() => setShowCreateModal(true)}
                  >
                    <Plus size={16} color="#FFFFFF" />
                    <Text style={styles.createEmptyButtonText}>Create Company</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Create/Edit Modal */}
      <CompanyModal
        visible={showCreateModal || !!editingCompany}
        company={editingCompany}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCompany(null);
        }}
        onSave={editingCompany ? handleEditCompany : handleCreateCompany}
      />
    </View>
  );
};

export default CompaniesContent;

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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
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
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  activeFilterButton: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
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
  companiesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  companyCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  companyInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  companyLogoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  companyLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#27AE60',
    borderRadius: 8,
    padding: 2,
  },
  companyDetails: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  companyIndustry: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
  },
  companyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  companyMetaText: {
    fontSize: 12,
    color: '#666666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#27AE60',
  },
  inactiveBadge: {
    backgroundColor: '#E74C3C',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  activeText: {
    color: '#FFFFFF',
  },
  inactiveText: {
    color: '#FFFFFF',
  },
  actionsButton: {
    padding: 8,
  },
  companyDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 12,
  },
  companyContact: {
    gap: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 12,
    color: '#666666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsModal: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 8,
    margin: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    minWidth: 200,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  deleteAction: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    marginTop: 4,
    paddingTop: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  deleteText: {
    color: '#E74C3C',
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
  saveButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
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
  inputError: {
    borderColor: '#E74C3C',
    borderWidth: 1,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
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
  switchGroup: {
    gap: 16,
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  createEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createEmptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});