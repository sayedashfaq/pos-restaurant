import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { MenuAPI, UserAPI, OrderAPI, AuthAPI } from "../api/api";
import * as Print from "expo-print";
import { WebView } from "react-native-webview";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 40) / 2;

const orderTypes = ["Dine in", "Delivery", "Takeaway", "Online Order"];

export default function MenuScreen() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [cart, setCart] = useState([]);
  const [selectedOrderType, setSelectedOrderType] = useState("Dine in");
  const [deliveryFee, setDeliveryFee] = useState("0.00");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [numberOfGuests, setNumberOfGuests] = useState("1");
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState(null);
  const [selectedCounter, setSelectedCounter] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);

  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showDeliveryBoyPicker, setShowDeliveryBoyPicker] = useState(false);
  const [showCounterPicker, setShowCounterPicker] = useState(false);
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);

  const [newCustomer, setNewCustomer] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tables, setTables] = useState([]);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [counters, setCounters] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [cartTotalItems, setCartTotalItems] = useState(0);

  const [printDocuments, setPrintDocuments] = useState([]);
  const [currentPrintIndex, setCurrentPrintIndex] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const [printActionType, setPrintActionType] = useState("");

  const [filterItems, setFilterItems] = useState("All");

  const navigation = useNavigation();

  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartTotalItems(total);
  }, [cart]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [
          categoriesResponse,
          menusResponse,
          customersResponse,
          tablesResponse,
          deliveryBoysResponse,
          countersResponse,
          platformsResponse,
        ] = await Promise.all([
          MenuAPI.getCategories(),
          MenuAPI.getMenuItems(),
          UserAPI.getCustomers(),
          OrderAPI.getTables(),
          UserAPI.getStaff("delivery"),
          OrderAPI.getCounters(),
          OrderAPI.getPlatforms(),
        ]);

        setCategories(categoriesResponse);
        setMenuItems(menusResponse);
        setCustomers(customersResponse);
        setTables(tablesResponse);
        setDeliveryBoys(deliveryBoysResponse);
        setCounters(countersResponse);
        setPlatforms(platformsResponse);
      } catch (err) {
        setError(err.message || "Failed to fetch data");
        Alert.alert("Error", "Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setSelectedTable(null);
    setNumberOfGuests("1");
    setSelectedDeliveryBoy(null);
    setSelectedCounter(null);
    setSelectedPlatform(null);
    setSelectedAddress(null);
    setDeliveryFee("0.00");
  }, [selectedOrderType]);

  // const filteredItems = menuItems.filter(item =>
  //   (selectedCategory === 'All' || item.category === selectedCategory) &&
  //   item.name.toLowerCase().includes(searchText.toLowerCase())
  // );

  const searchedItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const categoryMap = {};
  categories.forEach((cat) => {
    categoryMap[cat.id] = cat.name;
  });

  const fetchFilteredItems = async (categoryName) => {
    try {
      setLoading(true);
      const filteredResponse = await MenuAPI.getMenuItemFiltered(categoryName);
      setMenuItems(filteredResponse);
      setLoading(false);
    } catch (error) {
      setError(error.message || "Failed to filter items");
      setLoading(false);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    if (category === "all") {
      fetchData();
    } else {
      fetchFilteredItems(category);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthAPI.logout();
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Error", "Failed to logout. Please try again.");
    }
  };

  const handleAddToCart = (item) => {
    setCart((prev) => {
      const existingItem = prev.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prev.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  const handleCartQuantityChange = (itemId, change) => {
    setCart((prev) => {
      const updatedCart = prev
        .map((item) => {
          if (item.id === itemId) {
            const newQuantity = item.quantity + change;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter(Boolean);

      return updatedCart;
    });
  };

  const handleAddCustomer = async () => {
    if (newCustomer.trim() !== "" && newPhone.trim() !== "") {
      try {
        const customerData = {
          full_name: newCustomer,
          phone_number: newPhone,
          email: newEmail,
        };
        const createdCustomer = await UserAPI.createCustomer(customerData);
        setCustomers([...customers, createdCustomer]);
        setSelectedCustomer(createdCustomer);
        setNewCustomer("");
        setNewPhone("");
        setNewEmail("");
        setShowCustomerPicker(false);
      } catch (error) {
        Alert.alert("Error", "Failed to create customer");
      }
    } else {
      Alert.alert("Error", "Name and phone are required");
    }
  };

  const handlePlaceOrder = async (actionType) => {
    try {
      if (!["kot", "bill"].includes(actionType?.toLowerCase())) {
        Alert.alert("Invalid Action", "Action must be either KOT or BILL");
        return;
      }

      if (cart.length === 0) {
        Alert.alert("Error", "Please add items to the order");
        return;
      }

      if (!selectedCustomer) {
        Alert.alert("Error", "Please select a customer");
        return;
      }

      switch (selectedOrderType) {
        case "Dine in":
          if (!selectedTable) {
            Alert.alert("Error", "Please select a table");
            return;
          }
          if (!numberOfGuests || parseInt(numberOfGuests) <= 0) {
            Alert.alert("Error", "Please enter valid number of guests");
            return;
          }
          break;
        case "Delivery":
          if (!selectedAddress || !selectedDeliveryBoy) {
            Alert.alert("Error", "Please complete delivery details");
            return;
          }
          break;
        case "Takeaway":
          if (!selectedCounter) {
            Alert.alert("Error", "Please select a counter");
            return;
          }
          break;
        case "Online Order":
          if (!selectedAddress || !selectedPlatform) {
            Alert.alert("Error", "Please complete online order details");
            return;
          }
          break;
      }

      const orderData = {
        order_type: selectedOrderType?.toLocaleLowerCase().replace(" ", "_"),
        customer: selectedCustomer?.id,
        table: selectedTable?.id || null,
        delivery_boy_id: selectedDeliveryBoy?.id || null,
        delivery_fee: deliveryFee || 0,
        guest_count: parseInt(numberOfGuests) || null,
        total_price: totalAmount,
        items: cart.map((item) => ({
          menu_id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      const response = await OrderAPI.createOrder(orderData);

      if (response?.id) {
        try {
          //  array of print documents
          const docs = await OrderAPI.printOrderBill(response.id, actionType);
          setPrintDocuments(docs);
          setCurrentPrintIndex(0);
          setShowPrintPreview(true);

          handlePrintAll();
        } catch (printError) {
          console.error("Printing failed:", printError);
          Alert.alert(
            "Printing Error",
            "Order was created but printing failed"
          );
        }

        // Alert.alert('Success', 'Order placed successfully');
        // setCart([]);
        // navigation.navigate('Orders');
      } else {
        throw new Error("Order creation failed: No ID returned");
      }
    } catch (error) {
      console.error(
        "Order submission error:",
        error?.response?.data || error.message
      );
      Alert.alert("Error", error.message || "Failed to place order");
    }
  };

  //printingfunc
  const handlePrintAll = async () => {
    setIsPrinting(true);
    try {
      for (let i = 0; i < printDocuments.length; i++) {
        setCurrentPrintIndex(i);

        await new Promise((resolve) => setTimeout(resolve, 300));

        await Print.printAsync({
          html: printDocuments[i].html,
          orientation: Print.Orientation.portrait,
          paperSize: { width: 210, height: 297 },
        });

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setCart([]);
    } catch (error) {
      Alert.alert("Print Error", `Failed to print: ${error.message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  const closePrintPreview = () => {
    setShowPrintPreview(false);
    navigation.navigate("Orders");
  };

  const renderMenuItem = ({ item }) => (
    <View style={styles.gridItem}>
      {/* <View style={styles.itemImagePlaceholder}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.itemImage} />
        ) : (
          <Ionicons name="fast-food" size={40} color="#7e4bcc" />
        )}
      </View> */}
      <Text style={styles.itemName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.itemPrice}>QAR {Number(item.price).toFixed(2)}</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleAddToCart(item)}
      >
        <Text style={styles.addButtonText}>ADD</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Text style={styles.cartItemName} numberOfLines={1}>
        {item.name}
      </Text>
      <View style={styles.cartItemControls}>
        <TouchableOpacity
          style={styles.cartQuantityButton}
          onPress={() => handleCartQuantityChange(item.id, -1)}
        >
          <Ionicons name="remove" size={16} color="#7e4bcc" />
        </TouchableOpacity>
        <Text style={styles.cartQuantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.cartQuantityButton}
          onPress={() => handleCartQuantityChange(item.id, 1)}
        >
          <Ionicons name="add" size={16} color="#7e4bcc" />
        </TouchableOpacity>
        <Text style={styles.cartItemPrice}>
          QAR {(item.price * item.quantity).toFixed(2)}
        </Text>
      </View>
    </View>
  );

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount =
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0) +
    parseFloat(deliveryFee || 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7e4bcc" />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={40} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.replace("Menu")}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        {/* Header */}
        {/* <View style={styles.header}> */}
        {/* </View> */}
        {/* <Text style={styles.title}>NassCafe</Text> */}

        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
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
          <Text
            style={styles.viewAll}
            onPress={() => handleCategorySelect("All")}
          >
            View All
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {/* <TouchableOpacity
            onPress={() => handleCategorySelect('All')}
            style={[
              styles.categoryItem,
              selectedCategory === 'All' && styles.selectedCategory
            ]}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === 'All' && styles.selectedCategoryText
            ]}>
              All
            </Text>
          </TouchableOpacity> */}

          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => handleCategorySelect(category.name)}
              style={[
                styles.categoryItem,
                selectedCategory === category.name && styles.selectedCategory,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.name &&
                    styles.selectedCategoryText,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Menu Items */}
        <FlatList
          data={searchedItems}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMenuItem}
          contentContainerStyle={styles.gridContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="fast-food" size={60} color="#7e4bcc" />
              <Text style={styles.emptyText}>No items found</Text>
              <Text style={styles.emptySubtext}>
                Try another category or search term
              </Text>
            </View>
          }
          ListHeaderComponent={
            <>
              <Text style={[styles.sectionTitle, styles.menuTitle]}>Menus</Text>
              {cart.length > 0 && (
                <View style={styles.cartItemsContainer}>
                  <Text style={styles.sectionTitle}>
                    Order Items ({totalItems})
                  </Text>
                  <FlatList
                    data={cart}
                    renderItem={renderCartItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.cartItemsList}
                  />
                </View>
              )}
            </>
          }
          ListFooterComponent={
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.orderFormContainer}
              keyboardVerticalOffset={80}
            >
              <Text style={styles.sectionTitle}>Order Details</Text>

              <View style={styles.sectionBox}>
                <Text style={styles.subSectionTitle}>Order Type</Text>
                <View style={styles.orderTypeContainer}>
                  {orderTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={styles.orderTypeButton}
                      onPress={() => setSelectedOrderType(type)}
                    >
                      <View
                        style={[
                          styles.radioOuter,
                          selectedOrderType === type &&
                            styles.radioOuterSelected,
                        ]}
                      >
                        {selectedOrderType === type && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text style={styles.orderTypeText}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {selectedOrderType === "Dine in" && (
                <View style={styles.sectionBox}>
                  <Text style={styles.subSectionTitle}>Select Table</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowTablePicker(true)}
                  >
                    <Text
                      style={
                        selectedTable
                          ? styles.pickerText
                          : styles.pickerPlaceholder
                      }
                    >
                      {selectedTable?.name || "Select a table..."}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#888" />
                  </TouchableOpacity>

                  <Text style={styles.subSectionTitle}>Number of Guests</Text>
                  <TextInput
                    style={styles.feeInput}
                    keyboardType="numeric"
                    value={numberOfGuests}
                    onChangeText={setNumberOfGuests}
                    placeholder="1"
                  />
                </View>
              )}

              {selectedOrderType === "Delivery" && (
                <View style={styles.sectionBox}>
                  <Text style={styles.subSectionTitle}>
                    Select Delivery Boy
                  </Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowDeliveryBoyPicker(true)}
                  >
                    <Text
                      style={
                        selectedDeliveryBoy
                          ? styles.pickerText
                          : styles.pickerPlaceholder
                      }
                    >
                      {selectedDeliveryBoy?.name || "Select a delivery boy..."}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#888" />
                  </TouchableOpacity>

                  <Text style={styles.subSectionTitle}>Delivery Fee</Text>
                  <TextInput
                    style={styles.feeInput}
                    keyboardType="numeric"
                    value={deliveryFee}
                    onChangeText={setDeliveryFee}
                    placeholder="0.00"
                  />
                </View>
              )}

              {selectedOrderType === "Takeaway" && (
                <View style={styles.sectionBox}>
                  <Text style={styles.subSectionTitle}>Select Counter</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowCounterPicker(true)}
                  >
                    <Text
                      style={
                        selectedCounter
                          ? styles.pickerText
                          : styles.pickerPlaceholder
                      }
                    >
                      {selectedCounter?.name || "Select a counter..."}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#888" />
                  </TouchableOpacity>
                </View>
              )}

              {selectedOrderType === "Online Order" && (
                <View style={styles.sectionBox}>
                  <Text style={styles.subSectionTitle}>Select Platform</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowPlatformPicker(true)}
                  >
                    <Text
                      style={
                        selectedPlatform
                          ? styles.pickerText
                          : styles.pickerPlaceholder
                      }
                    >
                      {selectedPlatform?.name || "Select a platform..."}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#888" />
                  </TouchableOpacity>

                  <Text style={styles.subSectionTitle}>Delivery Fee</Text>
                  <TextInput
                    style={styles.feeInput}
                    keyboardType="numeric"
                    value={deliveryFee}
                    onChangeText={setDeliveryFee}
                    placeholder="0.00"
                  />
                </View>
              )}

              <View style={styles.sectionBox}>
                <Text style={styles.subSectionTitle}>Select Customer</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowCustomerPicker(true)}
                >
                  {selectedCustomer ? (
                    <Text style={styles.pickerText}>
                      {selectedCustomer.full_name}
                    </Text>
                  ) : (
                    <Text style={styles.pickerPlaceholder}>
                      Select a customer...
                    </Text>
                  )}
                  <Ionicons name="chevron-down" size={20} color="#888" />
                </TouchableOpacity>

                {(selectedOrderType === "Delivery" ||
                  selectedOrderType === "Online Order") && (
                  <>
                    <Text style={styles.subSectionTitle}>Delivery Address</Text>
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => setShowAddressPicker(true)}
                    >
                      <Text
                        style={
                          selectedAddress
                            ? styles.pickerText
                            : styles.pickerPlaceholder
                        }
                      >
                        {selectedAddress || "Enter delivery address..."}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#888" />
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Total Payment</Text>
                <Text style={styles.totalAmount}>
                  QAR {totalAmount.toFixed(2)}
                </Text>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.kotButton}
                    onPress={() => handlePlaceOrder("kot")}
                  >
                    <Text style={styles.kotButtonText}>KOT & Bill</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.billButton}
                    onPress={() => handlePlaceOrder("bill")}
                  >
                    <Text style={styles.billButtonText}>Bill</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          }
        />
      </View>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => navigation.navigate("Orders")}
        >
          <Ionicons name="list" size={24} color="#7e4bcc" />
          <Text style={styles.footerButtonText}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => navigation.navigate("Menu")}
        >
          <Ionicons name="fast-food" size={24} color="#7e4bcc" />
          <Text style={styles.footerButtonText}>Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#7e4bcc" />
          <Text style={styles.footerButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCustomerPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCustomerPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCustomerPicker(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Customer</Text>

          <View style={styles.addContainer}>
            <Text style={styles.subSectionTitle}>Add New Customer</Text>
            <TextInput
              style={styles.addInput}
              placeholder="Full Name"
              value={newCustomer}
              onChangeText={setNewCustomer}
              placeholderTextColor="#888"
            />
            <View style={styles.phoneInputContainer}>
              <TextInput
                style={[styles.addInput, styles.emailInput]}
                placeholder="Email"
                value={newEmail}
                onChangeText={setNewEmail}
                placeholderTextColor="#888"
              />
              <TextInput
                style={[styles.addInput, styles.phoneInput]}
                placeholder="Phone Number"
                keyboardType="phone-pad"
                value={newPhone}
                onChangeText={setNewPhone}
                placeholderTextColor="#888"
              />
            </View>
            <TouchableOpacity
              style={[
                styles.addButtonModal,
                (!newCustomer.trim() || !newPhone.trim()) &&
                  styles.disabledAddButton,
              ]}
              onPress={handleAddCustomer}
              disabled={!newCustomer.trim() || !newPhone.trim()}
            >
              <Text style={styles.addButtonTextModal}>Add Customer</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.subSectionTitle, { marginTop: 15 }]}>
            Existing Customers
          </Text>
          <FlatList
            data={customers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedCustomer(item);
                  setShowCustomerPicker(false);
                }}
              >
                <Text style={styles.modalItemText}>
                  {item.full_name} ({item.country_code || "971"}
                  {item.phone_number})
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* print modal */}
      <Modal
        visible={showPrintPreview}
        transparent={false}
        animationType="slide"
      >
        <SafeAreaView style={styles.printPreviewContainer}>
          <View style={styles.printPreviewHeader}>
            <Text style={styles.printPreviewTitle}>
              {/* {printHtml.includes('KITCHEN ORDER TICKET') ? 'Kitchen Ticket' : 'Customer Receipt'} */}
            </Text>
            <TouchableOpacity onPress={closePrintPreview}>
              <Ionicons name="close" size={24} color="#5d3a7e" />
            </TouchableOpacity>
          </View>

          <WebView
            originWhitelist={["*"]}
            source={{ html: printDocuments[currentPrintIndex]?.html || "" }}
            style={styles.webview}
          />

          <View style={styles.printActions}>
            <TouchableOpacity
              style={[styles.printButton, isPrinting && styles.disabledButton]}
              onPress={() => handlePrintAll()}
              disabled={isPrinting}
            >
              {isPrinting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.printButtonText}>Print All</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelPrintButton}
              onPress={closePrintPreview}
            >
              <Text style={styles.cancelPrintButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showAddressPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddressPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowAddressPicker(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Address</Text>

          <View style={styles.addContainer}>
            <TextInput
              style={styles.addInput}
              placeholder="Enter new address..."
              value={newAddress}
              onChangeText={setNewAddress}
              placeholderTextColor="#888"
            />
            <TouchableOpacity
              style={[
                styles.addButtonModal,
                !newAddress.trim() && styles.disabledAddButton,
              ]}
              onPress={() => {
                setSelectedAddress(newAddress);
                setNewAddress("");
                setShowAddressPicker(false);
              }}
              disabled={!newAddress.trim()}
            >
              <Text style={styles.addButtonTextModal}>Add Address</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.subSectionTitle, { marginTop: 15 }]}>
            Saved Addresses
          </Text>
          {selectedCustomer?.addresses?.length > 0 ? (
            <FlatList
              data={selectedCustomer.addresses}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedAddress(item);
                    setShowAddressPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text style={styles.noAddressText}>
              No saved addresses for this customer
            </Text>
          )}
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
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedTable(item);
                  setShowTablePicker(false);
                }}
              >
                <Text style={styles.modalItemText}>
                  {item.name} - {item.status}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <Modal
        visible={showDeliveryBoyPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDeliveryBoyPicker(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setShowDeliveryBoyPicker(false)}
        >
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Delivery Boy</Text>
          <FlatList
            data={deliveryBoys}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedDeliveryBoy(item);
                  setShowDeliveryBoyPicker(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <Modal
        visible={showCounterPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCounterPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCounterPicker(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Counter</Text>
          <FlatList
            data={counters}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedCounter(item);
                  setShowCounterPicker(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <Modal
        visible={showPlatformPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPlatformPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPlatformPicker(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Platform</Text>
          <FlatList
            data={platforms}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedPlatform(item);
                  setShowPlatformPicker(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* {totalItems > 0 &&  (
          <View style={styles.cartIndicator}>
            <Ionicons  name="cart" size={24} color="#fff" />
            <Text style={styles.cartCount}>{totalItems}</Text>
          </View>
        )} */}

      <View style={styles.logoutIconContainer}>
        <TouchableOpacity onPress={handleLogout} style={styles.cartIconButton}>
          <Ionicons name="log-out" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.cartIconContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Orders")}
          style={styles.cartIconButton}
        >
          <Ionicons name="cart" size={28} color="#fff" />
          {cartTotalItems > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartCount}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* <View style={styles.header}>
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Ionicons name="log-out" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.title}>Menu</Text>
    
      </View> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#7e4bcc",
    fontSize: 16,
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    color: "#e74c3c",
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#7e4bcc",
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  content: {
    flex: 1,
    marginBottom: 60,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0d7f0",
    paddingVertical: 12,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  footerButton: {
    alignItems: "center",
    flex: 1,
  },
  footerButtonText: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    color: "#7e4bcc",
  },
  fixedHeader: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0d7f0",
    paddingBottom: 10,
    shadowColor: "#7e4bcc",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  header: {
    paddingTop: 45,
    paddingBottom: 20,
    backgroundColor: "#7e4bcc",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontFamily: "Poppins-Bold",
    color: "#fff",
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: "#7e4bcc",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 12,
    color: "#9e9bc7",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#5a4a9c",
    fontFamily: "Poppins-Regular",
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 9,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#5a4a9c",
  },
  menuTitle: {
    marginHorizontal: 20,
    marginTop: 5,
    marginBottom: 8,
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#5a4a9c",
  },
  viewAll: {
    color: "#7e4bcc",
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
  },
  categoriesContainer: {
    paddingHorizontal: 15,
    paddingBottom: 18 ,
    // marginBottom:10,
  },
  categoryItem: {
    backgroundColor: "#f0ebff",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 22,
    marginHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
    height: 42,
    shadowColor: "#7e4bcc",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCategory: {
    backgroundColor: "#7e4bcc",
    shadowColor: "#5a4a9c",
  },
  categoryText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#5a4a9c",
  },
  selectedCategoryText: {
    color: "#fff",
  },
  gridContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    marginTop: 10,
  },
  gridItem: {
    width: ITEM_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    margin: 8,
    alignItems: "center",
    shadowColor: "#7e4bcc",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  itemImagePlaceholder: {
    width: ITEM_WIDTH - 32,
    height: ITEM_WIDTH - 32,
    backgroundColor: "#f8f5ff",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  itemImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  itemName: {
    fontWeight: "Bold",
    fontSize: 19,
    textAlign: "center",
    marginBottom: 6,
    color: "#5a4a9c",
  },
  itemPrice: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: "#7e4bcc",
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: "#7e4bcc",
    borderRadius: 12,
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
    shadowColor: "#7e4bcc",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#7e4bcc",
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#9e9bc7",
    marginTop: 8,
    textAlign: "center",
    fontFamily: "Poppins-Regular",
  },
  orderFormContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: "#e0d7f0",
  },
  sectionBox: {
    backgroundColor: "#fcfcfcff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e0d7f0",
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5d3a7e",
    marginBottom: 8,
  },
  orderTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  orderTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 8,
    width: "48%",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#7e4bcc",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    backgroundColor: "#f0e6ff",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#7e4bcc",
  },
  orderTypeText: {
    fontSize: 16,
    color: "#5d3a7e",
  },
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e0d7f0",
  },
  pickerText: {
    color: "#5d3a7e",
    fontSize: 16,
  },
  pickerPlaceholder: {
    color: "#a78bc9",
    fontSize: 16,
  },
  feeInput: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0d7f0",
    color: "#5d3a7e",
    marginBottom: 15,
  },
  totalSection: {
    backgroundColor: "#f8f4ff",
    borderRadius: 15,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#e0d7f0",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5d3a7e",
    marginBottom: 5,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#7e4bcc",
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  kotButton: {
    backgroundColor: "#7e4bcc",
    borderRadius: 10,
    padding: 15,
    flex: 1,
    alignItems: "center",
  },
  kotButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  billButton: {
    backgroundColor: "#f0e6ff",
    borderRadius: 10,
    padding: 15,
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#7e4bcc",
  },
  billButtonText: {
    color: "#7e4bcc",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#5d3a7e",
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0d7f0",
  },
  modalItemText: {
    fontSize: 16,
    color: "#5d3a7e",
  },
  addContainer: {
    marginBottom: 15,
  },
  addInput: {
    borderWidth: 1,
    borderColor: "#e0d7f0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    color: "#5d3a7e",
  },
  phoneInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  emailInput: {
    width: "50%",
    marginRight: 10,
  },
  phoneInput: {
    width: "50%",
  },
  addButtonModal: {
    backgroundColor: "#7e4bcc",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  disabledAddButton: {
    backgroundColor: "#d6c2f0",
  },
  addButtonTextModal: {
    color: "#fff",
    fontWeight: "bold",
  },
  cartIndicator: {
    position: "absolute",
    top: 50,
    right: 10,
    flexDirection: "row",
    backgroundColor: "#7e4bcc",
    padding: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: "center",
    zIndex: 20,
    borderWidth: 1,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  cartCount: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 6,
  },
  cartItemsContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e0d7f0",
  },
  cartItemsList: {
    paddingTop: 10,
  },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0e6ff",
  },
  cartItemName: {
    flex: 1,
    fontSize: 14,
    color: "#5d3a7e",
  },
  cartItemControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartQuantityButton: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: "#f0e6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  cartQuantityText: {
    width: 30,
    textAlign: "center",
    fontSize: 14,
    color: "#5d3a7e",
  },
  cartItemPrice: {
    width: 80,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "bold",
    color: "#7e4bcc",
  },
  noAddressText: {
    textAlign: "center",
    padding: 20,
    color: "#888",
  },

  cartIconContainer: {
    position: "absolute",
    top: 22,

    right: 20,
    zIndex: 100,
  },
  logoutIconContainer: {
    position: "absolute",
    top: 22,
    transform: [{ scaleX: -1 }],
    left: 20,
    zIndex: 100,
  },
  cartIconButton: {
    position: "relative",
  },
  // cartBadge: {
  //   position: 'absolute',
  //   right: -5,
  //   top: -5,
  //   backgroundColor: 'red',
  //   borderRadius: 10,
  //   width: 20,
  //   height: 20,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  cartBadgeText: {
    color: "white",
    fontSize: 8,
    fontWeight: "ultralight",
  },
  //prinnting stylesss
  printPreviewContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  printPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0d7f0",
  },
  printPreviewTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#5d3a7e",
  },
  pdfContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#f8f8f8",
  },
  pdf: {
    flex: 1,
    width: "100%",
    backgroundColor: "#fff",
  },
  printActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0d7f0",
  },
  printButton: {
    backgroundColor: "#7e4bcc",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 25,
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  disabledButton: {
    backgroundColor: "#b19cd9",
  },
  printButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelPrintButton: {
    borderWidth: 1,
    borderColor: "#7e4bcc",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 25,
    alignItems: "center",
    flex: 1,
  },
  cancelPrintButtonText: {
    color: "#7e4bcc",
    fontWeight: "bold",
    fontSize: 16,
  },
});
