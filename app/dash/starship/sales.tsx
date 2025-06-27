import React, { useState, useEffect } from 'react';
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
  Image,
  Modal,
  Alert,
  FlatList,
  Switch,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { ShoppingBag, Plus, Search, Filter, Tag, DollarSign, Pencil, Trash2, Eye, Share2, MessageCircle, ChevronRight, X, Save, Camera, Package, Briefcase, ChartBar as BarChart4, Clock, ArrowUpRight, Megaphone, Zap } from 'lucide-react-native';
import { useCompanyAuth } from '@/contexts/CompanyAuthContext';

const { width } = Dimensions.get('window');

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  imageUrl: string;
  isActive: boolean;
  inStock: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  views: number;
  sales: number;
  type: 'product' | 'service';
  options?: ProductOption[];
  shareLink?: string;
}

interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

interface Category {
  id: string;
  name: string;
  count: number;
}

const SalesScreen = () => {
  const { company } = useCompanyAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'promotions'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    imageUrl: '',
    isActive: true,
    inStock: true,
    tags: [],
    type: 'product',
  });
  const [newTag, setNewTag] = useState('');

  // Load mock data
  useEffect(() => {
    if (company) {
      loadMockData();
    }
  }, [company]);

  const loadMockData = () => {
    setIsLoading(true);
    
    // Mock products
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Premium Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
        price: 199.99,
        discountPrice: 149.99,
        category: 'Electronics',
        imageUrl: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
        isActive: true,
        inStock: true,
        tags: ['wireless', 'audio', 'premium'],
        createdAt: '2024-05-15T10:30:00Z',
        updatedAt: '2024-06-01T14:45:00Z',
        views: 1245,
        sales: 87,
        type: 'product',
        options: [
          {
            id: 'opt1',
            name: 'Color',
            values: ['Black', 'White', 'Blue']
          }
        ],
        shareLink: 'https://quejapp.com/p/premium-wireless-headphones',
      },
      {
        id: '2',
        name: 'Technical Support - 1 Hour',
        description: 'Professional technical support for your devices and software. One hour of dedicated assistance.',
        price: 79.99,
        category: 'Services',
        imageUrl: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
        isActive: true,
        inStock: true,
        tags: ['support', 'technical', 'assistance'],
        createdAt: '2024-05-20T09:15:00Z',
        updatedAt: '2024-05-20T09:15:00Z',
        views: 543,
        sales: 32,
        type: 'service',
        shareLink: 'https://quejapp.com/p/technical-support-1-hour',
      },
      {
        id: '3',
        name: 'Smart Home Starter Kit',
        description: 'Everything you need to start your smart home journey. Includes smart hub, 2 smart bulbs, and 1 smart plug.',
        price: 129.99,
        discountPrice: 99.99,
        category: 'Smart Home',
        imageUrl: 'https://images.pexels.com/photos/1034812/pexels-photo-1034812.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
        isActive: true,
        inStock: false,
        tags: ['smart home', 'IoT', 'starter kit'],
        createdAt: '2024-04-10T11:20:00Z',
        updatedAt: '2024-06-05T16:30:00Z',
        views: 876,
        sales: 54,
        type: 'product',
        shareLink: 'https://quejapp.com/p/smart-home-starter-kit',
      },
      {
        id: '4',
        name: 'Website Development Package',
        description: 'Complete website development service including design, development, and basic SEO setup.',
        price: 1499.99,
        category: 'Services',
        imageUrl: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
        isActive: true,
        inStock: true,
        tags: ['web development', 'design', 'SEO'],
        createdAt: '2024-05-05T14:00:00Z',
        updatedAt: '2024-05-05T14:00:00Z',
        views: 321,
        sales: 8,
        type: 'service',
        shareLink: 'https://quejapp.com/p/website-development-package',
      },
    ];
    
    // Extract categories from products
    const productCategories = Array.from(new Set(mockProducts.map(p => p.category))).map(
      category => ({
        id: category.toLowerCase().replace(/\s+/g, '-'),
        name: category,
        count: mockProducts.filter(p => p.category === category).length
      })
    );
    
    setProducts(mockProducts);
    setFilteredProducts(mockProducts);
    setCategories(productCategories);
    setIsLoading(false);
  };

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products;
    
    if (searchQuery) {
      filtered = filtered.filter(
        product => 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.description || !newProduct.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name,
      description: newProduct.description,
      price: newProduct.price,
      discountPrice: newProduct.discountPrice,
      category: newProduct.category || 'Uncategorized',
      imageUrl: newProduct.imageUrl || 'https://images.pexels.com/photos/1034812/pexels-photo-1034812.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
      isActive: newProduct.isActive ?? true,
      inStock: newProduct.inStock ?? true,
      tags: newProduct.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      sales: 0,
      type: newProduct.type || 'product',
      shareLink: `https://quejapp.com/p/${newProduct.name?.toLowerCase().replace(/\s+/g, '-')}`,
    };

    // Update categories if needed
    const categoryExists = categories.some(c => c.name === product.category);
    if (!categoryExists) {
      setCategories([
        ...categories,
        {
          id: product.category.toLowerCase().replace(/\s+/g, '-'),
          name: product.category,
          count: 1
        }
      ]);
    } else {
      setCategories(
        categories.map(c => 
          c.name === product.category 
            ? { ...c, count: c.count + 1 } 
            : c
        )
      );
    }

    setProducts([...products, product]);
    setShowAddModal(false);
    setNewProduct({
      name: '',
      description: '',
      price: 0,
      category: '',
      imageUrl: '',
      isActive: true,
      inStock: true,
      tags: [],
      type: 'product',
    });
    setNewTag('');
    
    Alert.alert('Success', `${product.type === 'product' ? 'Product' : 'Service'} added successfully!`);
  };

  const handleDeleteProduct = (productId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            const productToDelete = products.find(p => p.id === productId);
            if (productToDelete) {
              // Update category count
              setCategories(
                categories.map(c => 
                  c.name === productToDelete.category 
                    ? { ...c, count: Math.max(0, c.count - 1) } 
                    : c
                ).filter(c => c.count > 0) // Remove category if count becomes 0
              );
              
              // Remove product
              setProducts(products.filter(p => p.id !== productId));
              Alert.alert('Success', 'Item deleted successfully');
            }
          }
        }
      ]
    );
  };

  const handleShareProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowShareModal(true);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !newProduct.tags?.includes(newTag.trim())) {
      setNewProduct({
        ...newProduct,
        tags: [...(newProduct.tags || []), newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewProduct({
      ...newProduct,
      tags: newProduct.tags?.filter(t => t !== tag) || []
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getDiscountPercentage = (original: number, discounted?: number) => {
    if (!discounted) return null;
    const percentage = ((original - discounted) / original) * 100;
    return Math.round(percentage);
  };

  const renderProductsTab = () => (
    <View style={styles.tabContent}>
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#666666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products and services..."
            placeholderTextColor="#666666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#666666" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === null && styles.categoryChipActive,
            { backgroundColor: selectedCategory === null ? '#5ce1e6' : '#2A2A2A' }
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[
            styles.categoryChipText,
            selectedCategory === null && styles.categoryChipTextActive,
            { color: selectedCategory === null ? '#0A0A0A' : '#FFFFFF' }
          ]}>
            All
          </Text>
          <View style={styles.categoryCount}>
            <Text style={styles.categoryCountText}>{products.length}</Text>
          </View>
        </TouchableOpacity>
        
        {categories.slice(0, showAllCategories ? categories.length : 3).map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.name && styles.categoryChipActive,
              { backgroundColor: selectedCategory === category.name ? '#5ce1e6' : '#2A2A2A' }
            ]}
            onPress={() => setSelectedCategory(
              selectedCategory === category.name ? null : category.name
            )}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category.name && styles.categoryChipTextActive,
              { color: selectedCategory === category.name ? '#0A0A0A' : '#FFFFFF' }
            ]}>
              {category.name}
            </Text>
            <View style={styles.categoryCount}>
              <Text style={styles.categoryCountText}>{category.count}</Text>
            </View>
          </TouchableOpacity>
        ))}
        
        {categories.length > 3 && (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              { backgroundColor: '#2A2A2A' }
            ]}
            onPress={() => setShowAllCategories(!showAllCategories)}
          >
            <Text style={[
              styles.categoryChipText,
              { color: '#5ce1e6' }
            ]}>
              {showAllCategories ? 'Show Less' : 'Show More'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Products List */}
      <View style={styles.productsContainer}>
        <View style={styles.productsHeader}>
          <Text style={styles.productsTitle}>
            {selectedCategory ? selectedCategory : 'All Items'} 
            <Text style={styles.productsCount}> ({filteredProducts.length})</Text>
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>

        {filteredProducts.length > 0 ? (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.productCard}>
                <View style={styles.productImageContainer}>
                  <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
                  {item.discountPrice && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>
                        {getDiscountPercentage(item.price, item.discountPrice)}% OFF
                      </Text>
                    </View>
                  )}
                  <View style={[
                    styles.statusBadge,
                    item.isActive ? styles.activeBadge : styles.inactiveBadge
                  ]}>
                    <Text style={styles.statusText}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                  <View style={[
                    styles.typeBadge,
                    item.type === 'service' ? styles.serviceBadge : styles.productBadge
                  ]}>
                    <Text style={styles.typeText}>
                      {item.type === 'service' ? 'Service' : 'Product'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.productContent}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                  
                  <View style={styles.productPriceRow}>
                    {item.discountPrice ? (
                      <View style={styles.priceContainer}>
                        <Text style={styles.originalPrice}>{formatCurrency(item.price)}</Text>
                        <Text style={styles.discountPrice}>{formatCurrency(item.discountPrice)}</Text>
                      </View>
                    ) : (
                      <Text style={styles.price}>{formatCurrency(item.price)}</Text>
                    )}
                    
                    <View style={styles.stockStatus}>
                      <View style={[
                        styles.stockIndicator,
                        item.inStock ? styles.inStockIndicator : styles.outOfStockIndicator
                      ]} />
                      <Text style={styles.stockText}>
                        {item.inStock ? 'In Stock' : 'Out of Stock'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.productStats}>
                    <View style={styles.statItem}>
                      <Eye size={14} color="#666666" />
                      <Text style={styles.statText}>{item.views}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <ShoppingBag size={14} color="#666666" />
                      <Text style={styles.statText}>{item.sales}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.productActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Pencil size={16} color="#5ce1e6" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleShareProduct(item)}
                    >
                      <Share2 size={16} color="#F39C12" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteProduct(item.id)}
                    >
                      <Trash2 size={16} color="#E74C3C" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
          />
        ) : (
          <View style={styles.emptyState}>
            <ShoppingBag size={64} color="#3A3A3A" />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptyMessage}>
              {searchQuery 
                ? 'Try adjusting your search or filters' 
                : 'Add your first product or service to get started'}
            </Text>
            <TouchableOpacity 
              style={styles.emptyAddButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.emptyAddButtonText}>Add New Item</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderOrdersTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.comingSoonContainer}>
        <ShoppingBag size={64} color="#3A3A3A" />
        <Text style={styles.comingSoonTitle}>Orders Coming Soon</Text>
        <Text style={styles.comingSoonMessage}>
          Track and manage customer orders directly from this dashboard. This feature will be available in the next update.
        </Text>
      </View>
    </View>
  );

  const renderPromotionsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.comingSoonContainer}>
        <Megaphone size={64} color="#3A3A3A" />
        <Text style={styles.comingSoonTitle}>Promotions Coming Soon</Text>
        <Text style={styles.comingSoonMessage}>
          Create and manage special offers, discounts, and promotional campaigns. This feature will be available in the next update.
        </Text>
      </View>
    </View>
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
          <Text style={styles.pageTitle}>Sales Dashboard</Text>
          <Text style={styles.pageSubtitle}>
            Manage your products, services and orders
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerAction}>
            <BarChart4 size={20} color="#5ce1e6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'products' && styles.activeTabButton]}
          onPress={() => setActiveTab('products')}
        >
          <Package size={18} color={activeTab === 'products' ? '#5ce1e6' : '#666666'} />
          <Text style={[styles.tabButtonText, activeTab === 'products' && styles.activeTabButtonText]}>
            Products & Services
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'orders' && styles.activeTabButton]}
          onPress={() => setActiveTab('orders')}
        >
          <ShoppingBag size={18} color={activeTab === 'orders' ? '#5ce1e6' : '#666666'} />
          <Text style={[styles.tabButtonText, activeTab === 'orders' && styles.activeTabButtonText]}>
            Orders
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'promotions' && styles.activeTabButton]}
          onPress={() => setActiveTab('promotions')}
        >
          <Megaphone size={18} color={activeTab === 'promotions' ? '#5ce1e6' : '#666666'} />
          <Text style={[styles.tabButtonText, activeTab === 'promotions' && styles.activeTabButtonText]}>
            Promotions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'products' && renderProductsTab()}
      {activeTab === 'orders' && renderOrdersTab()}
      {activeTab === 'promotions' && renderPromotionsTab()}

      {/* Add Product Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X size={24} color="#666666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Add {newProduct.type === 'service' ? 'Service' : 'Product'}
            </Text>
            <TouchableOpacity onPress={handleAddProduct}>
              <Save size={24} color="#5ce1e6" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Type Selection */}
            <View style={styles.typeSelection}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newProduct.type === 'product' && styles.activeTypeButton
                ]}
                onPress={() => setNewProduct({...newProduct, type: 'product'})}
              >
                <Package size={20} color={newProduct.type === 'product' ? '#FFFFFF' : '#666666'} />
                <Text style={[
                  styles.typeButtonText,
                  newProduct.type === 'product' && styles.activeTypeButtonText
                ]}>
                  Product
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newProduct.type === 'service' && styles.activeTypeButton
                ]}
                onPress={() => setNewProduct({...newProduct, type: 'service'})}
              >
                <Briefcase size={20} color={newProduct.type === 'service' ? '#FFFFFF' : '#666666'} />
                <Text style={[
                  styles.typeButtonText,
                  newProduct.type === 'service' && styles.activeTypeButtonText
                ]}>
                  Service
                </Text>
              </TouchableOpacity>
            </View>

            {/* Basic Information */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Basic Information</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={newProduct.name}
                  onChangeText={(text) => setNewProduct({...newProduct, name: text})}
                  placeholder={`Enter ${newProduct.type} name`}
                  placeholderTextColor="#666666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={styles.textArea}
                  value={newProduct.description}
                  onChangeText={(text) => setNewProduct({...newProduct, description: text})}
                  placeholder={`Describe your ${newProduct.type}`}
                  placeholderTextColor="#666666"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Price</Text>
                  <View style={styles.priceInputContainer}>
                    <DollarSign size={16} color="#666666" />
                    <TextInput
                      style={styles.priceInput}
                      value={newProduct.price ? newProduct.price.toString() : ''}
                      onChangeText={(text) => {
                        const price = parseFloat(text) || 0;
                        setNewProduct({...newProduct, price});
                      }}
                      placeholder="0.00"
                      placeholderTextColor="#666666"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Discount Price (Optional)</Text>
                  <View style={styles.priceInputContainer}>
                    <DollarSign size={16} color="#666666" />
                    <TextInput
                      style={styles.priceInput}
                      value={newProduct.discountPrice ? newProduct.discountPrice.toString() : ''}
                      onChangeText={(text) => {
                        const discountPrice = parseFloat(text) || undefined;
                        setNewProduct({...newProduct, discountPrice});
                      }}
                      placeholder="0.00"
                      placeholderTextColor="#666666"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <TextInput
                  style={styles.input}
                  value={newProduct.category}
                  onChangeText={(text) => setNewProduct({...newProduct, category: text})}
                  placeholder="e.g., Electronics, Services, Clothing"
                  placeholderTextColor="#666666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Image URL</Text>
                <TextInput
                  style={styles.input}
                  value={newProduct.imageUrl}
                  onChangeText={(text) => setNewProduct({...newProduct, imageUrl: text})}
                  placeholder="https://example.com/image.jpg"
                  placeholderTextColor="#666666"
                />
              </View>
            </View>

            {/* Tags */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Tags</Text>
              <Text style={styles.formSectionDescription}>
                Add tags to help customers find your {newProduct.type}
              </Text>
              
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  value={newTag}
                  onChangeText={setNewTag}
                  placeholder="Add a tag"
                  placeholderTextColor="#666666"
                  onSubmitEditing={handleAddTag}
                />
                <TouchableOpacity 
                  style={styles.addTagButton}
                  onPress={handleAddTag}
                >
                  <Plus size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.tagsContainer}>
                {newProduct.tags?.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity 
                      style={styles.removeTagButton}
                      onPress={() => handleRemoveTag(tag)}
                    >
                      <X size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Status */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Status</Text>
              
              <View style={styles.switchContainer}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Active</Text>
                  <Text style={styles.switchDescription}>
                    {newProduct.isActive 
                      ? `This ${newProduct.type} will be visible to customers` 
                      : `This ${newProduct.type} will be hidden from customers`}
                  </Text>
                </View>
                <Switch
                  value={newProduct.isActive}
                  onValueChange={(value) => setNewProduct({...newProduct, isActive: value})}
                  trackColor={{ false: '#2A2A2A', true: '#5ce1e6' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              
              <View style={styles.switchContainer}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>
                    {newProduct.type === 'product' ? 'In Stock' : 'Available'}
                  </Text>
                  <Text style={styles.switchDescription}>
                    {newProduct.inStock 
                      ? `This ${newProduct.type} is available for purchase` 
                      : `This ${newProduct.type} is out of stock/unavailable`}
                  </Text>
                </View>
                <Switch
                  value={newProduct.inStock}
                  onValueChange={(value) => setNewProduct({...newProduct, inStock: value})}
                  trackColor={{ false: '#2A2A2A', true: '#5ce1e6' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.shareModalOverlay}>
          <View style={styles.shareModalContainer}>
            <View style={styles.shareModalHeader}>
              <Text style={styles.shareModalTitle}>Share {selectedProduct?.type}</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <X size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            
            {selectedProduct && (
              <View style={styles.shareModalContent}>
                <View style={styles.shareProductPreview}>
                  <Image source={{ uri: selectedProduct.imageUrl }} style={styles.shareProductImage} />
                  <View style={styles.shareProductInfo}>
                    <Text style={styles.shareProductName}>{selectedProduct.name}</Text>
                    <Text style={styles.shareProductPrice}>
                      {selectedProduct.discountPrice 
                        ? formatCurrency(selectedProduct.discountPrice) 
                        : formatCurrency(selectedProduct.price)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.shareLink}>
                  <Text style={styles.shareLinkLabel}>Direct Link</Text>
                  <View style={styles.shareLinkContainer}>
                    <Text style={styles.shareLinkText} numberOfLines={1}>
                      {selectedProduct.shareLink}
                    </Text>
                    <TouchableOpacity style={styles.copyButton}>
                      <Text style={styles.copyButtonText}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <Text style={styles.shareOptionsTitle}>Share via</Text>
                <View style={styles.shareOptions}>
                  <TouchableOpacity style={styles.shareOption}>
                    <View style={[styles.shareOptionIcon, { backgroundColor: '#3b5998' }]}>
                      <Text style={styles.shareIconText}>f</Text>
                    </View>
                    <Text style={styles.shareOptionText}>Facebook</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.shareOption}>
                    <View style={[styles.shareOptionIcon, { backgroundColor: '#1DA1F2' }]}>
                      <Text style={styles.shareIconText}>t</Text>
                    </View>
                    <Text style={styles.shareOptionText}>Twitter</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.shareOption}>
                    <View style={[styles.shareOptionIcon, { backgroundColor: '#25D366' }]}>
                      <Text style={styles.shareIconText}>w</Text>
                    </View>
                    <Text style={styles.shareOptionText}>WhatsApp</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.shareOption}>
                    <View style={[styles.shareOptionIcon, { backgroundColor: '#5ce1e6' }]}>
                      <MessageCircle size={16} color="#FFFFFF" />
                    </View>
                    <Text style={styles.shareOptionText}>Chat</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity style={styles.promoteButton}>
                  <Zap size={16} color="#FFFFFF" />
                  <Text style={styles.promoteButtonText}>Promote in Offers Page</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SalesScreen;

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
  headerAction: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
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
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  filterButton: {
    backgroundColor: '#5ce1e6',
    borderRadius: 12,
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    marginBottom: 12,
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  categoriesContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 8,
  },
  categoryChipActive: {
    borderColor: '#5ce1e6',
    borderWidth: 2,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
     color: '#FFFFFF',
  },
  categoryChipTextActive: {
    fontWeight: '700',
     color: '#0A0A0A',
  },
  categoryCount: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  productsContainer: {
    flex: 1,
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  productsCount: {
    color: '#666666',
    fontWeight: '400',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5ce1e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  productsList: {
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  productImageContainer: {
    position: 'relative',
    height: 150,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#E74C3C',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeBadge: {
    backgroundColor: '#27AE60',
  },
  inactiveBadge: {
    backgroundColor: '#95A5A6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  typeBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  productBadge: {
    backgroundColor: '#3498DB',
  },
  serviceBadge: {
    backgroundColor: '#9B59B6',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  productContent: {
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 12,
    lineHeight: 20,
  },
  productPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'column',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5ce1e6',
  },
  originalPrice: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
    textDecorationLine: 'line-through',
  },
  discountPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5ce1e6',
  },
  stockStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inStockIndicator: {
    backgroundColor: '#27AE60',
  },
  outOfStockIndicator: {
    backgroundColor: '#E74C3C',
  },
  stockText: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  productStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 8,
  },
  deleteButton: {
    backgroundColor: '#2A1A1A',
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
  emptyMessage: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5ce1e6',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  emptyAddButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  modalContent: {
    flex: 1,
    padding: 20,
  },
  typeSelection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  activeTypeButton: {
    backgroundColor: '#5ce1e6',
    borderColor: '#5ce1e6',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  activeTypeButtonText: {
    color: '#FFFFFF',
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  formSectionDescription: {
    fontSize: 14,
    color: '#CCCCCC',
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
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  textArea: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  priceInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  addTagButton: {
    backgroundColor: '#5ce1e6',
    borderRadius: 8,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  removeTagButton: {
    backgroundColor: '#3A3A3A',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  shareModalContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  shareModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  shareModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareModalContent: {
    padding: 20,
  },
  shareProductPreview: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  shareProductImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  shareProductInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  shareProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  shareProductPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5ce1e6',
  },
  shareLink: {
    marginBottom: 20,
  },
  shareLinkLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  shareLinkContainer: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  shareLinkText: {
    flex: 1,
    fontSize: 14,
    color: '#CCCCCC',
    marginRight: 8,
  },
  copyButton: {
    backgroundColor: '#3A3A3A',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5ce1e6',
  },
  shareOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  shareOption: {
    alignItems: 'center',
    gap: 8,
  },
  shareOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareOptionText: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  promoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5ce1e6',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  promoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 12,
  },
  comingSoonMessage: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
  },
});