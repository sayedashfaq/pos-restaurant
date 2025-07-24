import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 40) / 2; // 2 GRid

const orderTypes = ['Dine in', 'Delivery', 'Takeaway', 'Online Order'];
const countries = [
  { code: '+974', name: 'Qatar' },
  { code: '+971', name: 'UAE' },
  { code: '+966', name: 'Saudi Arabia' },
  { code: '+965', name: 'Kuwait' },
];
const tables = ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'VIP 1', 'VIP 2', 'Outdoor 1', 'Outdoor 2'];

// Dummy Direct Kodthath
const menuItems = [
  { id: 1, name: 'Chicken Biryani', price: 15.99, category: 'Main Course' },
  { id: 2, name: 'Paneer Tikka', price: 12.99, category: 'Appetizer' },
  { id: 3, name: 'Butter Naan', price: 2.99, category: 'Bread' },
  { id: 4, name: 'Mutton Curry', price: 18.99, category: 'Main Course' },
  { id: 5, name: 'Vegetable Pulao', price: 11.99, category: 'Main Course' },
  { id: 6, name: 'Samosa', price: 4.99, category: 'Appetizer' },
  { id: 7, name: 'Chicken Tikka', price: 14.99, category: 'Appetizer' },
  { id: 8, name: 'Garlic Naan', price: 3.49, category: 'Bread' },
  { id: 9, name: 'Fish Curry', price: 16.99, category: 'Main Course' },
  { id: 10, name: 'Raita', price: 3.99, category: 'Side Dish' },
  { id: 11, name: 'Gulab Jamun', price: 5.99, category: 'Dessert' },
  { id: 12, name: 'Mango Lassi', price: 4.49, category: 'Beverage' },
];

const categories = ['All', 'Main Course', 'Appetizer', 'Bread', 'Side Dish', 'Dessert', 'Beverage'];

export default function MenuScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [cart, setCart] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [selectedOrderType, setSelectedOrderType] = useState('Dine in');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);

  const navigation = useNavigation();

  const filteredItems = menuItems.filter(item =>
    (selectedCategory === 'All' || item.category === selectedCategory) &&
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleAddToCart = (item) => {
    const currentQty = quantities[item.id] || 0;
    if (currentQty > 0) {
      
      setCart(prev => {
        const existingItemIndex = prev.findIndex(cartItem => cartItem.id === item.id);
        if (existingItemIndex >= 0) {
          const updatedCart = [...prev];
          updatedCart[existingItemIndex] = {
            ...updatedCart[existingItemIndex],
            quantity: updatedCart[existingItemIndex].quantity + currentQty
          };
          return updatedCart;
        } else {
          return [...prev, { ...item, quantity: currentQty }];
        }
      });


      setQuantities(prev => ({ ...prev, [item.id]: 0 }));
    }
  };

  const handleQuantityChange = (itemId, change) => {
    setQuantities(prev => {
      const currentQty = prev[itemId] || 0;
      const newQty = Math.max(0, currentQty + change);
      return { ...prev, [itemId]: newQty };
    });
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your order');
      return;
    }

    if (selectedOrderType === 'Dine in' && !selectedTable) {
      Alert.alert('Table Required', 'Please select a table for dine-in orders');
      return;
    }

    if (selectedOrderType === 'Delivery' && (!customerPhone || !customerName)) {
      Alert.alert('Customer Details Required', 'Please enter customer phone and name for delivery');
      return;
    }

    const orderData = {
      items: cart,
      orderType: selectedOrderType,
      customer: {
        country: selectedCountry,
        phone: customerPhone,
        name: customerName
      },
      table: selectedOrderType === 'Dine in' ? selectedTable : null,
      total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };

    navigation.navigate('Orders', { order: orderData });
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const renderMenuItem = ({ item }) => {
    const quantity = quantities[item.id] || 0;

    return (
      <View style={styles.gridItem}>
        <View style={styles.itemImagePlaceholder}>
          <Ionicons name="fast-food" size={40} color="#d4a574" />
        </View>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemPrice}>QAR {item.price.toFixed(2)}</Text>

        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.id, -1)}
            disabled={quantity === 0}
          >
            <Ionicons name="remove" size={20} color={quantity === 0 ? '#ccc' : '#d4a574'} />
          </TouchableOpacity>

          <Text style={styles.quantityText}>{quantity}</Text>

          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.id, 1)}
          >
            <Ionicons name="add" size={20} color="#d4a574" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.addButton,
            quantity === 0 && styles.disabledButton
          ]}
          onPress={() => handleAddToCart(item)}
          disabled={quantity === 0}
        >
          <Text style={styles.addButtonText}>ADD</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.fixedHeader}>
        <ImageBackground
          source={require('../assets/background.jpg')}
          style={styles.header}
          blurRadius={2}
        >
          <Text style={styles.title}>Rithu Restaurant</Text>
          <Text style={styles.subtitle}>Delicious Menu</Text>
        </ImageBackground>


        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            placeholder="Search menu items..."
            placeholderTextColor="#888"
            value={searchText}
            onChangeText={setSearchText}
            style={styles.searchInput}
          />
        </View>


        <View style={styles.categoryHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Text style={styles.viewAll} onPress={() => setSelectedCategory('All')}>
            View All
          </Text>
        </View>


        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.categoryItem,
                selectedCategory === cat && styles.selectedCategory
              ]}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === cat && styles.selectedCategoryText
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>


      <FlatList
        ListHeaderComponent={<Text style={[styles.sectionTitle, styles.menuTitle]}>Menu Items</Text>}
        data={filteredItems}
        numColumns={2}
        keyExtractor={item => item.id.toString()}
        renderItem={renderMenuItem}
        contentContainerStyle={styles.gridContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="fast-food" size={60} color="#d4a574" />
            <Text style={styles.emptyText}>No items found</Text>
            <Text style={styles.emptySubtext}>Try another category or search term</Text>
          </View>
        }
        ListFooterComponent={
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.orderFormContainer}
          >
           
            <Text style={styles.sectionTitle}>Order Type</Text>
            <View style={styles.orderTypeContainer}>
              {orderTypes.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.orderTypeButton,
                    selectedOrderType === type && styles.selectedOrderType
                  ]}
                  onPress={() => setSelectedOrderType(type)}
                >
                  <View style={[
                    styles.radioOuter,
                    selectedOrderType === type && styles.radioOuterSelected
                  ]}>
                    {selectedOrderType === type && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text style={[
                    styles.orderTypeText,
                    selectedOrderType === type && styles.selectedOrderTypeText
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>


            <Text style={styles.sectionTitle}>Customer Details</Text>


            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowCountryPicker(true)}
            >
              <Text style={styles.inputLabel}>Country</Text>
              <View style={styles.countryInput}>
                <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                <Text style={styles.countryName}>{selectedCountry.name}</Text>
                <Ionicons name="chevron-down" size={20} color="#888" />
              </View>
            </TouchableOpacity>


            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Customer Phone</Text>
              <TextInput
                placeholder="Phone number"
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>


            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Customer Name</Text>
              <TextInput
                placeholder="Full name"
                value={customerName}
                onChangeText={setCustomerName}
                style={styles.input}
              />
            </View>


            {selectedOrderType === 'Dine in' && (
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowTablePicker(true)}
              >
                <Text style={styles.inputLabel}>Table</Text>
                <View style={styles.tableInput}>
                  <Text style={selectedTable ? styles.tableSelected : styles.tablePlaceholder}>
                    {selectedTable || 'Select Table'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#888" />
                </View>
              </TouchableOpacity>
            )}

            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Payment</Text>
              <Text style={styles.totalAmount}>QAR {totalAmount.toFixed(2)}</Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.logoutButton}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.orderButton}
                onPress={handlePlaceOrder}
              >
                <Text style={styles.orderButtonText}>Order</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        }
      />


      <Modal
        visible={showCountryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCountryPicker(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Country</Text>
          <FlatList
            data={countries}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedCountry(item);
                  setShowCountryPicker(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.name} ({item.code})</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>


      <Modal
        visible={showTablePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTablePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowTablePicker(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Table</Text>
          <FlatList
            data={tables}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedTable(item);
                  setShowTablePicker(false);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>


      {totalItems > 0 && (
        <View style={styles.cartIndicator}>
          <Ionicons name="cart" size={24} color="#fff" />
          <Text style={styles.cartCount}>{totalItems}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f6f1',
  },
  fixedHeader: {
    backgroundColor: '#f9f6f1',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 30,
    justifyContent: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#333',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  menuTitle: {
    marginHorizontal: 20,
    marginTop: 15,
  },
  viewAll: {
    color: '#d4a574',
    fontWeight: '500',
  },
  categoriesContainer: {
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  categoryItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
    height: 35,
  },
  selectedCategory: {
    backgroundColor: '#d4a574',
    borderColor: '#d4a574',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  gridContainer: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  gridItem: {
    width: ITEM_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    margin: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  itemImagePlaceholder: {
    width: ITEM_WIDTH - 30,
    height: ITEM_WIDTH - 30,
    backgroundColor: '#f9f6f1',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemName: {
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  itemPrice: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#d4a574',
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f9f6f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    width: 30,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#d4a574',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    width: '100%',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 5,
    textAlign: 'center',
  },
  orderFormContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  orderTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  orderTypeButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedOrderType: {
    backgroundColor: '#f0f7ff',
    borderColor: '#007bff',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#888',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#007bff',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007bff',
  },
  orderTypeText: {
    fontSize: 16,
  },
  selectedOrderTypeText: {
    color: '#007bff',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    marginBottom: 5,
    fontWeight: '500',
    color: '#555',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  countryInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tableInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  countryCode: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  countryName: {
    flex: 1,
  },
  tablePlaceholder: {
    color: '#888',
  },
  tableSelected: {
    color: '#333',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d4a574',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: '#f9f6f1',
    borderRadius: 10,
    padding: 15,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  logoutButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  orderButton: {
    backgroundColor: '#d4a574',
    borderRadius: 10,
    padding: 15,
    flex: 1,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
  },
  cartIndicator: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    backgroundColor: '#d4a574',
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    zIndex: 20,
  },
  cartCount: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 6,
  },
}); 