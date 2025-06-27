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
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Building2, Mail, Phone, Globe, MapPin, Bell, Shield, Users, CreditCard, Settings as SettingsIcon, Save, Pencil, Key, Trash2, LogOut } from 'lucide-react-native';
import { useCompanyAuth } from '@/contexts/CompanyAuthContext';

interface CompanySettings {
  name: string;
  description: string;
  industry: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  newTickets: boolean;
  newReviews: boolean;
  newChats: boolean;
  weeklyReports: boolean;
  marketingUpdates: boolean;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
  ipWhitelist: boolean;
}

const SettingsContent = () => {
  const { company, signOut } = useCompanyAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'notifications' | 'security' | 'billing'>('company');

  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: company?.name || '',
    description: company?.description || '',
    industry: company?.industry || '',
    website: company?.website || '',
    phone: company?.phone || '',
    email: company?.email || '',
    address: '',
    city: '',
    country: '',
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    newTickets: true,
    newReviews: true,
    newChats: true,
    weeklyReports: false,
    marketingUpdates: false,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: 30,
    ipWhitelist: false,
  });

  const handleSaveCompanySettings = () => {
    // TODO: Implement save functionality
    Alert.alert('Success', 'Company settings saved successfully!');
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/dash/starship');
            } catch (error) {
              console.error('Sign out error:', error);
            }
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

  const renderCompanySettings = () => (
    <View style={styles.settingsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Company Information</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Pencil size={16} color="#5ce1e6" />
          <Text style={styles.editButtonText}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Company Name</Text>
        <TextInput
          style={[styles.input, !isEditing && styles.inputDisabled]}
          value={companySettings.name}
          onChangeText={(text) => setCompanySettings(prev => ({ ...prev, name: text }))}
          editable={isEditing}
          placeholder="Enter company name"
          placeholderTextColor="#666666"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.textArea, !isEditing && styles.inputDisabled]}
          value={companySettings.description}
          onChangeText={(text) => setCompanySettings(prev => ({ ...prev, description: text }))}
          editable={isEditing}
          placeholder="Enter company description"
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
            value={companySettings.industry}
            onChangeText={(text) => setCompanySettings(prev => ({ ...prev, industry: text }))}
            editable={isEditing}
            placeholder="Industry"
            placeholderTextColor="#666666"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Website</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={companySettings.website}
            onChangeText={(text) => setCompanySettings(prev => ({ ...prev, website: text }))}
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
            value={companySettings.phone}
            onChangeText={(text) => setCompanySettings(prev => ({ ...prev, phone: text }))}
            editable={isEditing}
            placeholder="+1 (555) 123-4567"
            placeholderTextColor="#666666"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={companySettings.email}
            onChangeText={(text) => setCompanySettings(prev => ({ ...prev, email: text }))}
            editable={isEditing}
            placeholder="contact@company.com"
            placeholderTextColor="#666666"
          />
        </View>
      </View>

      {isEditing && (
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveCompanySettings}>
          <Save size={16} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderNotificationSettings = () => (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>Notification Preferences</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Email Notifications</Text>
          <Text style={styles.settingDescription}>Receive notifications via email</Text>
        </View>
        <Switch
          value={notificationSettings.emailNotifications}
          onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, emailNotifications: value }))}
          trackColor={{ false: '#2A2A2A', true: '#5ce1e6' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Text style={styles.settingDescription}>Receive push notifications in browser</Text>
        </View>
        <Switch
          value={notificationSettings.pushNotifications}
          onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, pushNotifications: value }))}
          trackColor={{ false: '#2A2A2A', true: '#5ce1e6' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <Text style={styles.subsectionTitle}>Notification Types</Text>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>New Tickets</Text>
          <Text style={styles.settingDescription}>Get notified when new tickets are created</Text>
        </View>
        <Switch
          value={notificationSettings.newTickets}
          onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, newTickets: value }))}
          trackColor={{ false: '#2A2A2A', true: '#5ce1e6' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>New Reviews</Text>
          <Text style={styles.settingDescription}>Get notified when customers leave reviews</Text>
        </View>
        <Switch
          value={notificationSettings.newReviews}
          onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, newReviews: value }))}
          trackColor={{ false: '#2A2A2A', true: '#5ce1e6' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>New Chat Messages</Text>
          <Text style={styles.settingDescription}>Get notified when customers send messages</Text>
        </View>
        <Switch
          value={notificationSettings.newChats}
          onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, newChats: value }))}
          trackColor={{ false: '#2A2A2A', true: '#5ce1e6' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Weekly Reports</Text>
          <Text style={styles.settingDescription}>Receive weekly analytics reports</Text>
        </View>
        <Switch
          value={notificationSettings.weeklyReports}
          onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, weeklyReports: value }))}
          trackColor={{ false: '#2A2A2A', true: '#5ce1e6' }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );

  const renderSecuritySettings = () => (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>Security & Privacy</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
          <Text style={styles.settingDescription}>Add an extra layer of security to your account</Text>
        </View>
        <Switch
          value={securitySettings.twoFactorAuth}
          onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: value }))}
          trackColor={{ false: '#2A2A2A', true: '#5ce1e6' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Login Alerts</Text>
          <Text style={styles.settingDescription}>Get notified of new login attempts</Text>
        </View>
        <Switch
          value={securitySettings.loginAlerts}
          onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, loginAlerts: value }))}
          trackColor={{ false: '#2A2A2A', true: '#5ce1e6' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton}>
          <Key size={16} color="#5ce1e6" />
          <Text style={styles.actionButtonText}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Shield size={16} color="#5ce1e6" />
          <Text style={styles.actionButtonText}>View Login History</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
        <TouchableOpacity style={styles.dangerButton}>
          <Trash2 size={16} color="#E74C3C" />
          <Text style={styles.dangerButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBillingSettings = () => (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>Billing & Subscription</Text>
      
      <View style={styles.planCard}>
        <View style={styles.planHeader}>
          <Text style={styles.planName}>Professional Plan</Text>
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>ACTIVE</Text>
          </View>
        </View>
        <Text style={styles.planPrice}>$49/month</Text>
        <Text style={styles.planDescription}>
          Includes unlimited tickets, live chat, analytics, and priority support
        </Text>
        <TouchableOpacity style={styles.upgradeButton}>
          <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.billingInfo}>
        <Text style={styles.subsectionTitle}>Payment Method</Text>
        <View style={styles.paymentMethod}>
          <CreditCard size={20} color="#5ce1e6" />
          <Text style={styles.paymentMethodText}>•••• •••• •••• 4242</Text>
          <TouchableOpacity style={styles.updatePaymentButton}>
            <Text style={styles.updatePaymentText}>Update</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.billingHistory}>
        <Text style={styles.subsectionTitle}>Recent Invoices</Text>
        <View style={styles.invoice}>
          <Text style={styles.invoiceDate}>Dec 1, 2024</Text>
          <Text style={styles.invoiceAmount}>$49.00</Text>
          <TouchableOpacity style={styles.downloadButton}>
            <Text style={styles.downloadButtonText}>Download</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.invoice}>
          <Text style={styles.invoiceDate}>Nov 1, 2024</Text>
          <Text style={styles.invoiceAmount}>$49.00</Text>
          <TouchableOpacity style={styles.downloadButton}>
            <Text style={styles.downloadButtonText}>Download</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (!company) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      <View style={[styles.mainContent, { marginTop: 60 }]}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <Text style={styles.pageTitle}>Settings</Text>
          
          <TabButton
            tab="company"
            label="Company"
            icon={<Building2 size={18} color={activeTab === 'company' ? '#5ce1e6' : '#666666'} />}
          />
          <TabButton
            tab="notifications"
            label="Notifications"
            icon={<Bell size={18} color={activeTab === 'notifications' ? '#5ce1e6' : '#666666'} />}
          />
          <TabButton
            tab="security"
            label="Security"
            icon={<Shield size={18} color={activeTab === 'security' ? '#5ce1e6' : '#666666'} />}
          />
          <TabButton
            tab="billing"
            label="Billing"
            icon={<CreditCard size={18} color={activeTab === 'billing' ? '#5ce1e6' : '#666666'} />}
          />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'company' && renderCompanySettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
          {activeTab === 'security' && renderSecuritySettings()}
          {activeTab === 'billing' && renderBillingSettings()}
        </ScrollView>
      </View>
    </View>
  );
};

export default SettingsContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  signOutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 200,
    backgroundColor: '#1A1A1A',
    borderRightWidth: 1,
    borderRightColor: '#2A2A2A',
    padding: 20,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  activeTabButton: {
    backgroundColor: '#2A2A2A',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabButtonText: {
    color: '#5ce1e6',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  settingsSection: {
    maxWidth: 600,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 16,
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
  formGroup: {
    marginBottom: 20,
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#5ce1e6',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  actionButtons: {
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5ce1e6',
  },
  dangerZone: {
    marginTop: 40,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  dangerZoneTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E74C3C',
    marginBottom: 16,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#2A1A1A',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E74C3C',
  },
  planCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: 24,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planBadge: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#5ce1e6',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 16,
    lineHeight: 20,
  },
  upgradeButton: {
    backgroundColor: '#5ce1e6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  billingInfo: {
    marginBottom: 24,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  paymentMethodText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  updatePaymentButton: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  updatePaymentText: {
    color: '#5ce1e6',
    fontSize: 14,
    fontWeight: '600',
  },
  billingHistory: {},
  invoice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  invoiceDate: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  invoiceAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 16,
  },
  downloadButton: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  downloadButtonText: {
    color: '#5ce1e6',
    fontSize: 12,
    fontWeight: '600',
  },
});