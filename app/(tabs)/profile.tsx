import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  StatusBar,
  Platform,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  FlatList,
  Animated,
  PanResponder,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, CreditCard as Edit3, Camera, Settings, Shield, Heart, MessageCircle, MapPin, Calendar, Phone, Mail, User, Save, X, Plus, Trash2, Star, Move, Grid3x3, GripVertical } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPhotos, updateUserPhotos } from '@/lib/database';

const { width, height } = Dimensions.get('window');

interface EditableField {
  key: string;
  label: string;
  value: string;
  type: 'text' | 'phone' | 'email' | 'date';
  editable: boolean;
}

interface Photo {
  id: string;
  uri: string;
  isMain: boolean;
  order: number;
}

const PhotoUploadModal = ({ 
  visible, 
  onClose, 
  photos, 
  onPhotosUpdate 
}: {
  visible: boolean;
  onClose: () => void;
  photos: Photo[];
  onPhotosUpdate: (photos: Photo[]) => void;
}) => {
  const [localPhotos, setLocalPhotos] = useState<Photo[]>(photos);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const gridSize = (width - 60) / 2; // 2 columns with padding
  const maxPhotos = 5;

  // Update local photos when props change
  React.useEffect(() => {
    setLocalPhotos(photos);
  }, [photos]);
  const handleAddPhoto = () => {
    if (localPhotos.length >= maxPhotos) {
      Alert.alert('Maximum Photos', `You can only upload up to ${maxPhotos} photos.`);
      return;
    }

    // Simulate photo picker - in real app, use expo-image-picker
    const photoUrls = [
      'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=400&h=600',
      'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400&h=600',
      'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=400&h=600',
      'https://images.pexels.com/photos/1036622/pexels-photo-1036622.jpeg?auto=compress&cs=tinysrgb&w=400&h=600',
      'https://images.pexels.com/photos/1239288/pexels-photo-1239288.jpeg?auto=compress&cs=tinysrgb&w=400&h=600',
    ];
    
    const randomUrl = photoUrls[Math.floor(Math.random() * photoUrls.length)];
    
    const newPhoto: Photo = {
      id: Date.now().toString(),
      uri: randomUrl,
      isMain: localPhotos.length === 0,
      order: localPhotos.length,
    };

    setLocalPhotos([...localPhotos, newPhoto]);
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const photoToDelete = localPhotos.find(p => p.id === photoId);
            const wasMainPhoto = photoToDelete?.isMain;
            
            // Remove the photo
            let updatedPhotos = localPhotos.filter(p => p.id !== photoId);
            
            // Reorder remaining photos
            updatedPhotos = updatedPhotos.map((p, index) => ({ 
              ...p, 
              order: index 
            }));
            
            // If deleted photo was main and there are remaining photos, make first photo main
            if (wasMainPhoto && updatedPhotos.length > 0) {
              updatedPhotos = updatedPhotos.map((p, index) => ({
                ...p,
                isMain: index === 0
              }));
            }
            
            setLocalPhotos(updatedPhotos);
          },
        },
      ]
    );
  };

  const handleSetMainPhoto = (photoId: string) => {
    const updatedPhotos = localPhotos.map(p => ({
      ...p,
      isMain: p.id === photoId,
    }));
    setLocalPhotos(updatedPhotos);
  };

  const handleReorderPhotos = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || 
        fromIndex >= localPhotos.length || toIndex >= localPhotos.length) {
      return;
    }
    
    const updatedPhotos = [...localPhotos];
    const [movedPhoto] = updatedPhotos.splice(fromIndex, 1);
    updatedPhotos.splice(toIndex, 0, movedPhoto);
    
    // Update order indices
    const reorderedPhotos = updatedPhotos.map((p, index) => ({
      ...p,
      order: index,
    }));
    
    setLocalPhotos(reorderedPhotos);
  };

  const handleSave = () => {
    onPhotosUpdate(localPhotos);
    onClose();
  };

  const handleCancel = () => {
    // Reset to original photos
    setLocalPhotos(photos);
    onClose();
  };
  const PhotoGridItem = ({ photo, index }: { photo: Photo; index: number }) => {

    return (
      <View
        style={[
          styles.photoGridItem,
          {
            width: gridSize,
            height: gridSize * 1.3,
          },
        ]}
      >
        <Image source={{ uri: photo.uri }} style={styles.photoGridImage} />
        
        {/* Main photo indicator */}
        {photo.isMain && (
          <View style={styles.mainPhotoIndicator}>
            <Star size={16} color="#FFD700" fill="#FFD700" />
            <Text style={styles.mainPhotoText}>Main</Text>
          </View>
        )}
        
        {/* Photo actions */}
        <View style={styles.photoActions}>
          <TouchableOpacity
            style={styles.photoActionButton}
            onPress={() => handleSetMainPhoto(photo.id)}
          >
            <Star size={16} color={photo.isMain ? "#FFD700" : "#FFFFFF"} fill={photo.isMain ? "#FFD700" : "transparent"} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.photoActionButton, styles.deleteButton]}
            onPress={() => handleDeletePhoto(photo.id)}
          >
            <Trash2 size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {/* Photo order */}
        <View style={styles.photoOrder}>
          <Text style={styles.photoOrderText}>{index + 1}</Text>
        </View>
      </View>
    );
  };

  const AddPhotoButton = () => (
    <TouchableOpacity
      style={[styles.photoGridItem, styles.addPhotoButton, { width: gridSize, height: gridSize * 1.3 }]}
      onPress={handleAddPhoto}
    >
      <Plus size={32} color="#666666" />
      <Text style={styles.addPhotoText}>Add Photo</Text>
    </TouchableOpacity>
  );

  const ReorderButton = ({ direction, onPress, disabled }: { 
    direction: 'up' | 'down'; 
    onPress: () => void; 
    disabled: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.reorderButton, disabled && styles.reorderButtonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.reorderButtonText, disabled && styles.reorderButtonTextDisabled]}>
        {direction === 'up' ? '↑' : '↓'}
      </Text>
    </TouchableOpacity>
  );
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.photoModalContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        
        {/* Header */}
        <SafeAreaView style={styles.photoModalHeader}>
          <View style={styles.photoModalHeaderContent}>
            <TouchableOpacity onPress={handleCancel} style={styles.photoModalCloseButton}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Text style={styles.photoModalTitle}>Manage Photos</Text>
            
            <TouchableOpacity onPress={handleSave} style={styles.photoModalSaveButton}>
              <Text style={styles.photoModalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        
        {/* Instructions */}
        <View style={styles.photoInstructions}>
          <Text style={styles.instructionsTitle}>Photo Guidelines</Text>
          <Text style={styles.instructionsText}>
            • Upload up to {maxPhotos} photos{'\n'}
            • Tap the star to set as main photo{'\n'}
            • Use arrow buttons to reorder photos{'\n'}
            • Your main photo will be shown first
          </Text>
        </View>
        
        {/* Photo Grid */}
        <ScrollView style={styles.photoGridContainer} showsVerticalScrollIndicator={false}>
          {localPhotos.length > 0 ? (
            <View style={styles.photoList}>
              {localPhotos.map((photo, index) => (
                <View key={photo.id} style={styles.photoListItem}>
                  <View style={styles.photoItemContainer}>
                    <Image source={{ uri: photo.uri }} style={styles.photoListImage} />
                    
                    {/* Main photo indicator */}
                    {photo.isMain && (
                      <View style={styles.mainPhotoIndicator}>
                        <Star size={14} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.mainPhotoText}>Main</Text>
                      </View>
                    )}
                    
                    {/* Photo order */}
                    <View style={styles.photoOrder}>
                      <Text style={styles.photoOrderText}>{index + 1}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.photoControls}>
                    <View style={styles.photoControlsLeft}>
                      <Text style={styles.photoControlsTitle}>Photo {index + 1}</Text>
                      {photo.isMain && (
                        <Text style={styles.photoControlsSubtitle}>Main Photo</Text>
                      )}
                    </View>
                    
                    <View style={styles.photoControlsRight}>
                      {/* Reorder buttons */}
                      <View style={styles.reorderControls}>
                        <ReorderButton
                          direction="up"
                          onPress={() => handleReorderPhotos(index, index - 1)}
                          disabled={index === 0}
                        />
                        <ReorderButton
                          direction="down"
                          onPress={() => handleReorderPhotos(index, index + 1)}
                          disabled={index === localPhotos.length - 1}
                        />
                      </View>
                      
                      {/* Action buttons */}
                      <View style={styles.photoActionControls}>
                        <TouchableOpacity
                          style={[styles.controlButton, photo.isMain && styles.controlButtonActive]}
                          onPress={() => handleSetMainPhoto(photo.id)}
                        >
                          <Star size={16} color={photo.isMain ? "#FFD700" : "#666666"} fill={photo.isMain ? "#FFD700" : "transparent"} />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[styles.controlButton, styles.deleteControlButton]}
                          onPress={() => handleDeletePhoto(photo.id)}
                        >
                          <Trash2 size={16} color="#E74C3C" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Camera size={48} color="#666666" />
              <Text style={styles.emptyStateTitle}>No Photos Yet</Text>
              <Text style={styles.emptyStateText}>Add your first photo to get started</Text>
            </View>
          )}
          
          {/* Photo count */}
          <View style={styles.photoCount}>
            <Text style={styles.photoCountText}>
              {localPhotos.length} of {maxPhotos} photos
            </Text>
          </View>
        </ScrollView>
        
        {/* Bottom Actions */}
        <View style={styles.photoModalActions}>
          <TouchableOpacity style={styles.photoModalActionButton} onPress={handleAddPhoto}>
            <Camera size={20} color="#5ce1e6" />
            <Text style={styles.photoModalActionText}>Add Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function ProfileScreen() {
  const { user, updateProfile, signOut, isLoading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  // Load user photos on component mount
  useEffect(() => {
    if (user?.id) {
      loadUserPhotos();
    }
  }, [user?.id]);

  const loadUserPhotos = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingPhotos(true);
      const userPhotos = await getUserPhotos(user.id);
      
      // Transform database photos to local Photo format
      const transformedPhotos: Photo[] = userPhotos.map(photo => ({
        id: photo.id,
        uri: photo.photo_url,
        isMain: photo.is_primary || false,
        order: photo.order_index || 0,
      }));
      
      setPhotos(transformedPhotos);
    } catch (error: any) {
      console.error('Error loading user photos:', error);
      Alert.alert('Error', 'Failed to load photos');
    } finally {
      setLoadingPhotos(false);
    }
  };

  const profileFields: EditableField[] = [
    {
      key: 'first_name',
      label: 'First Name',
      value: user?.first_name || '',
      type: 'text',
      editable: true,
    },
    {
      key: 'last_name',
      label: 'Last Name',
      value: user?.last_name || '',
      type: 'text',
      editable: true,
    },
    {
      key: 'phone',
      label: 'Phone',
      value: user?.phone || '',
      type: 'phone',
      editable: true,
    },
    {
      key: 'birth_date',
      label: 'Birth Date',
      value: user?.birth_date ? new Date(user.birth_date).toLocaleDateString() : '',
      type: 'date',
      editable: false,
    },
  ];

  const handleEditField = (field: EditableField) => {
    if (!field.editable) return;
    
    setEditingField(field);
    setTempValue(field.value);
    setShowEditModal(true);
  };

  const handleSaveField = async () => {
    if (!editingField || !tempValue.trim()) return;

    try {
      await updateProfile({
        [editingField.key]: tempValue.trim(),
      });
      
      setShowEditModal(false);
      setEditingField(null);
      setTempValue('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSigningOut(true);
              await signOut();
              router.replace('/(auth)/signin');
            } catch (error: any) {
              setIsSigningOut(false);
              Alert.alert('Error', error.message || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handlePhotosUpdate = async (updatedPhotos: Photo[]) => {
    if (!user?.id) return;
    
    try {
      // Transform local photos to database format
      const photosToUpdate = updatedPhotos.map(photo => ({
        photo_url: photo.uri,
        is_primary: photo.isMain,
        order_index: photo.order,
      }));
      
      await updateUserPhotos(user.id, photosToUpdate);
      setPhotos(updatedPhotos);
      
      Alert.alert('Success', 'Photos updated successfully!');
    } catch (error: any) {
      console.error('Error updating photos:', error);
      Alert.alert('Error', 'Failed to update photos');
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const age = user?.birth_date ? calculateAge(user.birth_date) : null;
  const mainPhoto = photos.find(p => p.isMain);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      {/* Header */}
      <View style={styles.headerContainer}>
        <SafeAreaView style={styles.safeAreaHeader}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Profile</Text>
            
            <TouchableOpacity style={styles.settingsButton}>
              <Settings size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {mainPhoto ? (
              <Image source={{ uri: mainPhoto.uri }} style={styles.avatar} />
            ) : user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={48} color="#666666" />
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={() => setShowPhotoModal(true)}
            >
              <Camera size={16} color="#FFFFFF" />
            </TouchableOpacity>
            
            {user?.verified && (
              <View style={styles.verifiedBadge}>
                <Shield size={16} color="#FFFFFF" />
              </View>
            )}
            
            {/* Photo count indicator */}
            {(photos.length > 0 || loadingPhotos) && (
              <View style={styles.photoCountBadge}>
                <Text style={styles.photoCountBadgeText}>
                  {loadingPhotos ? '...' : photos.length}
                </Text>
              </View>
            )}
          </View>
          
          <Text style={styles.profileName}>
            {user?.first_name} {user?.last_name}
            {age && <Text style={styles.profileAge}>, {age}</Text>}
          </Text>
          
          {/* Photo preview strip */}
          {photos.length > 1 && (
            <View style={styles.photoPreviewStrip}>
              {photos.slice(0, 4).map((photo, index) => (
                <View key={photo.id} style={styles.photoPreviewItem}>
                  <Image source={{ uri: photo.uri }} style={styles.photoPreviewImage} />
                  {photo.isMain && (
                    <View style={styles.photoPreviewMainIndicator}>
                      <Star size={8} color="#FFD700" fill="#FFD700" />
                    </View>
                  )}
                </View>
              ))}
              {photos.length > 4 && (
                <View style={[styles.photoPreviewItem, styles.photoPreviewMore]}>
                  <Text style={styles.photoPreviewMoreText}>+{photos.length - 4}</Text>
                </View>
              )}
            </View>
          )}
          
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.total_posts || 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.total_likes || 0}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Edit3 size={18} color="#5ce1e6" />
              <Text style={styles.editButtonText}>
                {isEditing ? 'Done' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.fieldsList}>
            {profileFields.map((field) => (
              <TouchableOpacity
                key={field.key}
                style={[
                  styles.fieldItem,
                  !field.editable && styles.fieldItemDisabled
                ]}
                onPress={() => isEditing && handleEditField(field)}
                disabled={!isEditing || !field.editable}
              >
                <View style={styles.fieldLeft}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <Text style={[
                    styles.fieldValue,
                    !field.value && styles.fieldValueEmpty
                  ]}>
                    {field.value || 'Not set'}
                  </Text>
                </View>
                
                {isEditing && field.editable && (
                  <Edit3 size={16} color="#666666" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.actionsList}>
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: '#E67E22' }]}>
                  <Settings size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.actionText}>Account Settings</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: '#8E44AD' }]}>
                  <Shield size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.actionText}>Privacy & Security</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem} onPress={handleSignOut}>
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: '#E74C3C' }]}>
                  <ArrowLeft size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.actionText, styles.signOutText]}>
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Edit Field Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <X size={24} color="#666666" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>
              Edit {editingField?.label}
            </Text>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveField}
              disabled={authLoading}
            >
              <Save size={20} color="#5ce1e6" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>{editingField?.label}</Text>
            <TextInput
              style={styles.textInput}
              value={tempValue}
              onChangeText={setTempValue}
              placeholder={`Enter ${editingField?.label.toLowerCase()}`}
              placeholderTextColor="#666666"
              keyboardType={editingField?.type === 'phone' ? 'phone-pad' : 'default'}
              autoCapitalize={editingField?.type === 'text' ? 'words' : 'none'}
              autoFocus
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Photo Upload Modal */}
      <PhotoUploadModal
        visible={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        photos={photos}
        onPhotosUpdate={handlePhotosUpdate}
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#1A1A1A',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#5ce1e6',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#5ce1e6',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#5ce1e6',
    borderRadius: 16,
    padding: 8,
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#27AE60',
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  photoCountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#8E44AD',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  photoCountBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  profileAge: {
    fontWeight: '400',
    color: '#CCCCCC',
  },
  photoPreviewStrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  photoPreviewItem: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPreviewImage: {
    width: '100%',
    height: '100%',
  },
  photoPreviewMainIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 2,
  },
  photoPreviewMore: {
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreviewMoreText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  profileStats: {
    flexDirection: 'row',
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#1A1A1A',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#5ce1e6',
    fontSize: 14,
    fontWeight: '600',
  },
  fieldsList: {
    gap: 16,
  },
  fieldItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
  },
  fieldItemDisabled: {
    opacity: 0.6,
  },
  fieldLeft: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  fieldValueEmpty: {
    color: '#666666',
    fontStyle: 'italic',
  },
  actionsList: {
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  signOutText: {
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
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  // Photo Modal Styles
  photoModalContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  photoModalHeader: {
    backgroundColor: '#1A1A1A',
  },
  photoModalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  photoModalCloseButton: {
    padding: 8,
  },
  photoModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  photoModalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#5ce1e6',
    borderRadius: 8,
  },
  photoModalSaveText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  photoInstructions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  photoGridContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  photoList: {
    paddingVertical: 20,
  },
  photoListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  photoItemContainer: {
    position: 'relative',
    marginRight: 16,
  },
  photoListImage: {
    width: 80,
    height: 100,
    borderRadius: 8,
  },
  photoControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoControlsLeft: {
    flex: 1,
  },
  photoControlsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  photoControlsSubtitle: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '500',
  },
  photoControlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reorderControls: {
    gap: 4,
  },
  reorderButton: {
    width: 32,
    height: 32,
    backgroundColor: '#2A2A2A',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
  reorderButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reorderButtonTextDisabled: {
    color: '#666666',
  },
  photoActionControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 36,
    height: 36,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#FFD700',
  },
  deleteControlButton: {
    backgroundColor: '#E74C3C',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  photoCount: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  photoCountText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  photoModalActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  photoModalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#2A2A2A',
    paddingVertical: 16,
    borderRadius: 12,
  },
  photoModalActionText: {
    color: '#5ce1e6',
    fontSize: 16,
    fontWeight: '600',
  },
  // Photo Grid Item Styles (for grid layout)
  photoGridItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoGridImage: {
    width: '100%',
    height: '100%',
  },
  mainPhotoIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mainPhotoText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '600',
  },
  photoActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    gap: 4,
  },
  photoActionButton: {
    width: 28,
    height: 28,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(231,76,60,0.9)',
  },
  photoOrder: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 24,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoOrderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addPhotoButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderWidth: 2,
    borderColor: '#3A3A3A',
    borderStyle: 'dashed',
  },
  addPhotoText: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
});