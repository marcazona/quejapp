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
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ShoppingBag, Search, Filter, Plus, Trash2, Tag, DollarSign, Package, ArrowUpRight, Clock, X, Save, Camera, Grid2x2 as Grid, Eye, MessageCircle, Share, Zap, Pencil, Share2, ChevronRight, Briefcase, ArrowUp, ArrowDown, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Megaphone } from 'lucide-react-native';
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
  featured?: boolean;
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

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'unpaid' | 'refunded';
  createdAt: string;
}

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  options?: Record<string, string>;
}

interface SalesMetric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [productView, setProductView] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'sales' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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
        featured: true,
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
        featured: true,
      },
      {
        id: '5',
        name: 'Bluetooth Speaker',
        description: 'Portable Bluetooth speaker with 20W output and 12-hour battery life. Water-resistant design.',
        price: 89.99,
        discountPrice: 69.99,
        category: 'Electronics',
        imageUrl: 'https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
        isActive: true,
        inStock: true,
        tags: ['bluetooth', 'audio', 'portable'],
        createdAt: '2024-05-25T08:30:00Z',
        updatedAt: '2024-05-25T08:30:00Z',
        views: 732,
        sales: 41,
        type: 'product',
        shareLink: 'https://quejapp.com/p/bluetooth-speaker',
      },
      {
        id: '6',
        name: 'Data Recovery Service',
        description: 'Professional data recovery service for hard drives, SSDs, and memory cards. 95% success rate.',
        price: 249.99,
        category: 'Services',
        imageUrl: 'https://images.pexels.com/photos/117729/pexels-photo-117729.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
        isActive: true,
        inStock: true,
        tags: ['data recovery', 'technical', 'emergency'],
        createdAt: '2024-05-18T13:45:00Z',
        updatedAt: '2024-05-18T13:45:00Z',
        views: 289,
        sales: 15,
        type: 'service',
        shareLink: 'https://quejapp.com/p/data-recovery-service',
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
    
    // Mock orders
    const mockOrders: Order[] = [
      {
        id: 'ORD-1001',
        customerName: 'Sarah Johnson',
        customerEmail: 'sarah.j@example.com',
        items: [
          {
            id: 'ITEM-1',
            productId: '1',
            name: 'Premium Wireless Headphones',
            price: 149.99,
            quantity: 1,
          }
        ],
        total: 149.99,
        status: 'completed',
        paymentStatus: 'paid',
        createdAt: '2024-06-10T14:30:00Z',
      },
      {
        id: 'ORD-1002',
        customerName: 'Michael Chen',
        customerEmail: 'michael.c@example.com',
        items: [
          {
            id: 'ITEM-2',
            productId: '3',
            name: 'Smart Home Starter Kit',
            price: 99.99,
            quantity: 1,
          },
          {
            id: 'ITEM-3',
            productId: '5',
            name: 'Bluetooth Speaker',
            price: 69.99,
            quantity: 2,
          }
        ],
        total: 239.97,
        status: 'processing',
        paymentStatus: 'paid',
        createdAt: '2024-06-12T09:15:00Z',
      },
      {
        id: 'ORD-1003',
        customerName: 'Emma Davis',
        customerEmail: 'emma.d@example.com',
        items: [
          {
            id: 'ITEM-4',
            productId: '4',
            name: 'Website Development Package',
            price: 1499.99,
            quantity: 1,
          }
        ],
        total: 1499.99,
        status: 'pending',
        paymentStatus: 'unpaid',
        createdAt: '2024-06-13T16:45:00Z',
      },
    ];
    
    setProducts(mockProducts);
    setFilteredProducts(mockProducts);
    setCategories(productCategories);
    setOrders(mockOrders);
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
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return sortOrder === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case 'price':
          const aPrice = a.discountPrice || a.price;
          const bPrice = b.discountPrice || b.price;
          return sortOrder === 'asc' ? aPrice - bPrice : bPrice - aPrice;
        case 'sales':
          return sortOrder === 'asc' ? a.sales - b.sales : b.sales - a.sales;
        case 'date':
          return sortOrder === 'asc' 
            ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
            : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });
    
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products, sortBy, sortOrder]);

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

  const handleEditProduct = () => {
    if (!selectedProduct) return;
    
    // Update product in the products array
    const updatedProducts = products.map(p => 
      p.id === selectedProduct.id ? selectedProduct : p
    );
    
    setProducts(updatedProducts);
    setShowEditModal(false);
    Alert.alert('Success', 'Item updated successfully!');
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

  const handleEditProductModal = (product: Product) => {
    setSelectedProduct({...product});
    setShowEditModal(true);
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

  const handleToggleSort = (sortType: 'name' | 'price' | 'sales' | 'date') => {
    if (sortBy === sortType) {
      // Toggle sort order if already sorting by this field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to descending
      setSortBy(sortType);
      setSortOrder('desc');
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getDiscountPercentage = (original: number, discounted?: number) => {
    if (!discounted) return null;
    const percentage = ((original - discounted) / original) * 100;
    return Math.round(percentage);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSalesMetrics = (): SalesMetric[] => {
    return [
      {
        title: 'Total Sales',
        value: '$2,845.94',
        change: '+12.5%',
        trend: 'up',
        icon: <ShoppingBag size={24} color="#3498DB" />,
        color: '#3498DB',
      },
      {
        title: 'Total Orders',
        value: '24',
        change: '+8.3%',
        trend: 'up',
        icon: <Package size={24} color="#27AE60" />,
        color: '#27AE60',
      },
      {
        title: 'Conversion Rate',
        value: '3.2%',
        change: '-0.5%',
        trend: 'down',
        icon: <ArrowUpRight size={24} color="#E67E22" />,
        color: '#E67E22',
      },
      {
        title: 'Average Order',
        value: '$118.58',
        change: '+5.2%',
        trend: 'up',
        icon: <DollarSign size={24} color="#9B59B6" />,
        color: '#9B59B6',
      },
    ];
  };

  const renderProductsTab = () => (
    <View style={styles.tabContent}>
      {/* Sales Metrics */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.metricsContainer}
        contentContainerStyle={styles.metricsContent}
      >
        {getSalesMetrics().map((metric, index) => (
          <View key={index} style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIcon, { backgroundColor: `${metric.color}20` }]}>
                {metric.icon}
              </View>
              <View style={styles.metricTrend}>
                {metric.trend === 'up' ? (
                  <ArrowUp size={14} color="#27AE60" />
                ) : metric.trend === 'down' ? (
                  <ArrowDown size={14} color="#E74C3C" />
                ) : null}
                <Text style={[
                  styles.metricTrendText,
                  { color: metric.trend === 'up' ? '#27AE60' : metric.trend === 'down' ? '#E74C3C' : '#666666' }
                ]}>
                  {metric.change}
                </Text>
              </View>
            </View>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricTitle}>{metric.title}</Text>
          </View>
        ))}
      </ScrollView>

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
        
        <TouchableOpacity 
          style={styles.viewToggleButton}
          onPress={() => setProductView(productView === 'list' ? 'grid' : 'list')}
        >
          <Grid size={20} color="#FFFFFF" />
        </TouchableOpacity>
        
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
            selectedCategory === null && styles.categoryChipActive
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[
            styles.categoryChipText,
            selectedCategory === null && styles.categoryChipTextActive
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAddModal(false)}>
            <X size={24} color="#666666" />
          </TouchableOpacity>
          ]}>
            All
          </Text>
          <View style={styles.categoryCount}>
            <Text style={styles.categoryCountText}>{products.length}</Text>
          </View>
        </TouchableOpacity>
        
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.name && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(
              selectedCategory === category.name ? null : category.name
            )}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category.name && styles.categoryChipTextActive
            ]}>
              {category.name}
            </Text>
            <View style={styles.categoryCount}>
              <Text style={styles.categoryCountText}>{category.count}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products List */}
      <View style={styles.productsContainer}>
        <View style={styles.productsHeader}>
          <View style={styles.productsHeaderLeft}>
            <Text style={styles.productsTitle}>
              {selectedCategory ? selectedCategory : 'All Items'} 
              <Text style={styles.productsCount}> ({filteredProducts.length})</Text>
            </Text>
          </View>
          
          <View style={styles.productsHeaderRight}>
            <View style={styles.sortDropdown}>
              <Text style={styles.sortLabel}>Sort by:</Text>
              <TouchableOpacity 
                style={styles.sortButton}
                onPress={() => handleToggleSort('date')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'date' && styles.activeSortText]}>
                  Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.sortButton}
                onPress={() => handleToggleSort('price')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'price' && styles.activeSortText]}>
                  Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.sortButton}
                onPress={() => handleToggleSort('sales')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'sales' && styles.activeSortText]}>
                  Sales {sortBy === 'sales' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5ce1e6" />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : filteredProducts.length > 0 ? (
          productView === 'list' ? (
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
                    {item.featured && (
                      <View style={styles.featuredBadge}>
                        <Text style={styles.featuredText}>Featured</Text>
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
                      <View style={styles.statItem}>
                        <Clock size={14} color="#666666" />
                        <Text style={styles.statText}>{formatDate(item.updatedAt)}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.productActions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleEditProductModal(item)}
                      >
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
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              renderItem={({ item }) => (
                <View style={styles.gridCard}>
                  <View style={styles.gridImageContainer}>
                    <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
                    {item.discountPrice && (
                      <View style={styles.gridDiscountBadge}>
                        <Text style={styles.gridDiscountText}>
                          {getDiscountPercentage(item.price, item.discountPrice)}%
                        </Text>
                      </View>
                    )}
                    {!item.isActive && (
                      <View style={styles.gridInactiveBadge}>
                        <Text style={styles.gridInactiveText}>Inactive</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.gridContent}>
                    <Text style={styles.gridName} numberOfLines={1}>{item.name}</Text>
                    
                    <View style={styles.gridPriceRow}>
                      {item.discountPrice ? (
                        <View style={styles.gridPriceContainer}>
                          <Text style={styles.gridOriginalPrice}>{formatCurrency(item.price)}</Text>
                          <Text style={styles.gridDiscountPrice}>{formatCurrency(item.discountPrice)}</Text>
                        </View>
                      ) : (
                        <Text style={styles.gridPrice}>{formatCurrency(item.price)}</Text>
                      )}
                    </View>
                    
                    <View style={styles.gridFooter}>
                      <View style={styles.gridType}>
                        <Text style={[
                          styles.gridTypeText,
                          item.type === 'service' ? styles.gridServiceText : styles.gridProductText
                        ]}>
                          {item.type}
                        </Text>
                      </View>
                      
                      <View style={styles.gridActions}>
                        <TouchableOpacity 
                          style={styles.gridAction}
                          onPress={() => handleEditProductModal(item)}
                        >
                          <Pencil size={14} color="#5ce1e6" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.gridAction}
                          onPress={() => handleShareProduct(item)}
                        >
                          <Share2 size={14} color="#F39C12" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.gridAction, styles.gridDeleteAction]}
                          onPress={() => handleDeleteProduct(item.id)}
                        >
                          <Trash2 size={14} color="#E74C3C" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.gridList}
            />
          )
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
      {/* Orders Metrics */}
      <View style={styles.ordersMetricsContainer}>
        <View style={styles.orderMetricCard}>
          <View style={[styles.orderMetricIcon, { backgroundColor: '#27AE6020' }]}>
            <CheckCircle size={24} color="#27AE60" />
          </View>
          <Text style={styles.orderMetricValue}>1</Text>
          <Text style={styles.orderMetricTitle}>Completed</Text>
        </View>
        
        <View style={styles.orderMetricCard}>
          <View style={[styles.orderMetricIcon, { backgroundColor: '#3498DB20' }]}>
            <Clock size={24} color="#3498DB" />
          </View>
          <Text style={styles.orderMetricValue}>1</Text>
          <Text style={styles.orderMetricTitle}>Processing</Text>
        </View>
        
        <View style={styles.orderMetricCard}>
          <View style={[styles.orderMetricIcon, { backgroundColor: '#F39C1220' }]}>
            <AlertTriangle size={24} color="#F39C12" />
          </View>
          <Text style={styles.orderMetricValue}>1</Text>
          <Text style={styles.orderMetricTitle}>Pending</Text>
        </View>
      </View>

      {/* Orders List */}
      <View style={styles.ordersContainer}>
        <View style={styles.ordersHeader}>
          <Text style={styles.ordersTitle}>Recent Orders</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <ChevronRight size={16} color="#5ce1e6" />
          </TouchableOpacity>
        </View>

        {orders.length > 0 ? (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderId}>{item.id}</Text>
                    <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                  </View>
                  <View style={[
                    styles.orderStatusBadge,
                    item.status === 'completed' ? styles.completedBadge :
                    item.status === 'processing' ? styles.processingBadge :
                    item.status === 'pending' ? styles.pendingBadge :
                    styles.cancelledBadge
                  ]}>
                    <Text style={styles.orderStatusText}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.orderCustomer}>
                  <Text style={styles.customerName}>{item.customerName}</Text>
                  <Text style={styles.customerEmail}>{item.customerEmail}</Text>
                </View>
                
                <View style={styles.orderItems}>
                  {item.items.map((orderItem) => (
                    <View key={orderItem.id} style={styles.orderItem}>
                      <View style={styles.orderItemInfo}>
                        <Text style={styles.orderItemName}>{orderItem.name}</Text>
                        <Text style={styles.orderItemPrice}>
                          {formatCurrency(orderItem.price)} × {orderItem.quantity}
                        </Text>
                      </View>
                      <Text style={styles.orderItemTotal}>
                        {formatCurrency(orderItem.price * orderItem.quantity)}
                      </Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.orderFooter}>
                  <View style={styles.orderPayment}>
                    <Text style={styles.paymentLabel}>Payment:</Text>
                    <View style={[
                      styles.paymentStatus,
                      item.paymentStatus === 'paid' ? styles.paidStatus :
                      item.paymentStatus === 'refunded' ? styles.refundedStatus :
                      styles.unpaidStatus
                    ]}>
                      <Text style={styles.paymentStatusText}>
                        {item.paymentStatus.charAt(0).toUpperCase() + item.paymentStatus.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.orderTotal}>Total: {formatCurrency(item.total)}</Text>
                </View>
                
                <View style={styles.orderActions}>
                  <TouchableOpacity style={styles.orderActionButton}>
                    <Eye size={16} color="#5ce1e6" />
                    <Text style={styles.orderActionText}>View Details</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.orderActionButton}>
                    <MessageCircle size={16} color="#5ce1e6" />
                    <Text style={styles.orderActionText}>Contact Customer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.ordersList}
          />
        ) : (
          <View style={styles.emptyState}>
            <ShoppingBag size={64} color="#3A3A3A" />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyMessage}>
              Orders will appear here when customers make purchases
            </Text>
          </View>
        )}
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

      {/* Edit Product Modal */}
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
              Edit {selectedProduct?.type === 'service' ? 'Service' : 'Product'}
            </Text>
            <TouchableOpacity onPress={handleEditProduct}>
              <Save size={24} color="#5ce1e6" />
            </TouchableOpacity>
          </View>

          {selectedProduct && (
            <ScrollView style={styles.modalContent}>
              {/* Basic Information */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Basic Information</Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    style={styles.input}
                    value={selectedProduct.name}
                    onChangeText={(text) => setSelectedProduct({...selectedProduct, name: text})}
                    placeholder={`Enter ${selectedProduct.type} name`}
                    placeholderTextColor="#666666"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={styles.textArea}
                    value={selectedProduct.description}
                    onChangeText={(text) => setSelectedProduct({...selectedProduct, description: text})}
                    placeholder={`Describe your ${selectedProduct.type}`}
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
                        value={selectedProduct.price.toString()}
                        onChangeText={(text) => {
                          const price = parseFloat(text) || 0;
                          setSelectedProduct({...selectedProduct, price});
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
                        value={selectedProduct.discountPrice?.toString() || ''}
                        onChangeText={(text) => {
                          const discountPrice = parseFloat(text) || undefined;
                          setSelectedProduct({...selectedProduct, discountPrice});
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
                    value={selectedProduct.category}
                    onChangeText={(text) => setSelectedProduct({...selectedProduct, category: text})}
                    placeholder="e.g., Electronics, Services, Clothing"
                    placeholderTextColor="#666666"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Image URL</Text>
                  <TextInput
                    style={styles.input}
                    value={selectedProduct.imageUrl}
                    onChangeText={(text) => setSelectedProduct({...selectedProduct, imageUrl: text})}
                    placeholder="https://example.com/image.jpg"
                    placeholderTextColor="#666666"
                  />
                </View>
              </View>

              {/* Status */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Status</Text>
                
                <View style={styles.switchContainer}>
                  <View style={styles.switchInfo}>
                    <Text style={styles.switchLabel}>Active</Text>
                    <Text style={styles.switchDescription}>
                      {selectedProduct.isActive 
                        ? `This ${selectedProduct.type} will be visible to customers` 
                        : `This ${selectedProduct.type} will be hidden from customers`}
                    </Text>
                  </View>
                  <Switch
                    value={selectedProduct.isActive}
                    onValueChange={(value) => setSelectedProduct({...selectedProduct, isActive: value})}
                    trackColor={{ false: '#2A2A2A', true: '#5ce1e6' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                
                <View style={styles.switchContainer}>
                  <View style={styles.switchInfo}>
                    <Text style={styles.switchLabel}>
                      {selectedProduct.type === 'product' ? 'In Stock' : 'Available'}
                    </Text>
                    <Text style={styles.switchDescription}>
                      {selectedProduct.inStock 
                        ? `This ${selectedProduct.type} is available for purchase` 
                        : `This ${selectedProduct.type} is out of stock/unavailable`}
                    </Text>
                  </View>
                  <Switch
                    value={selectedProduct.inStock}
                    onValueChange={(value) => setSelectedProduct({...selectedProduct, inStock: value})}
                    trackColor={{ false: '#2A2A2A', true: '#5ce1e6' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                
                <View style={styles.switchContainer}>
                  <View style={styles.switchInfo}>
                    <Text style={styles.switchLabel}>Featured</Text>
                    <Text style={styles.switchDescription}>
                      {selectedProduct.featured 
                        ? `This ${selectedProduct.type} will be highlighted in listings` 
                        : `This ${selectedProduct.type} will be displayed normally`}
                    </Text>
                  </View>
                  <Switch
                    value={selectedProduct.featured || false}
                    onValueChange={(value) => setSelectedProduct({...selectedProduct, featured: value})}
                    trackColor={{ false: '#2A2A2A', true: '#5ce1e6' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </ScrollView>
          )}
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
  metricsContainer: {
    marginBottom: 16,
  },
  metricsContent: {
    paddingRight: 16,
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    width: 160,
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
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricTrendText: {
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
    color: '#CCCCCC',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
  viewToggleButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3A',
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
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    gap: 8,
  },
  categoryChipActive: {
    backgroundColor: '#5ce1e6',
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
    flexWrap: 'wrap',
    gap: 12,
  },
  productsHeaderLeft: {
    flex: 1,
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
  productsHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sortDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 4,
  },
  sortLabel: {
    fontSize: 12,
    color: '#666666',
    marginRight: 4,
  },
  sortButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sortButtonText: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  activeSortText: {
    color: '#5ce1e6',
    fontWeight: '600',
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
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#F39C12',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
  },
  featuredText: {
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
  // Grid view styles
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridList: {
    paddingBottom: 20,
  },
  gridCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    width: (width - 56) / 2,
  },
  gridImageContainer: {
    position: 'relative',
    height: 120,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridDiscountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#E74C3C',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridDiscountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gridInactiveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gridInactiveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  gridContent: {
    padding: 12,
  },
  gridName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  gridPriceRow: {
    marginBottom: 8,
  },
  gridPriceContainer: {
    flexDirection: 'column',
  },
  gridPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5ce1e6',
  },
  gridOriginalPrice: {
    fontSize: 12,
    fontWeight: '400',
    color: '#666666',
    textDecorationLine: 'line-through',
  },
  gridDiscountPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5ce1e6',
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridType: {
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gridTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  gridProductText: {
    color: '#3498DB',
  },
  gridServiceText: {
    color: '#9B59B6',
  },
  gridActions: {
    flexDirection: 'row',
    gap: 4,
  },
  gridAction: {
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    padding: 4,
  },
  gridDeleteAction: {
    backgroundColor: '#2A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 12,
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
  // Orders tab styles
  ordersMetricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  orderMetricCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginHorizontal: 4,
  },
  orderMetricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderMetricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  orderMetricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  ordersContainer: {
    flex: 1,
  },
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ordersTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5ce1e6',
  },
  ordersList: {
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666666',
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  completedBadge: {
    backgroundColor: '#27AE60',
  },
  processingBadge: {
    backgroundColor: '#3498DB',
  },
  pendingBadge: {
    backgroundColor: '#F39C12',
  },
  cancelledBadge: {
    backgroundColor: '#E74C3C',
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orderCustomer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  orderItemPrice: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  orderItemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5ce1e6',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderPayment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  paymentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paidStatus: {
    backgroundColor: '#27AE60',
  },
  unpaidStatus: {
    backgroundColor: '#F39C12',
  },
  refundedStatus: {
    backgroundColor: '#E74C3C',
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  orderActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  orderActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5ce1e6',
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