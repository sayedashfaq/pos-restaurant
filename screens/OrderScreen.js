import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Image,
  Animated
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const paymentTypes = ['Cash', 'Card', 'Credit'];
const orderStatuses = ['Active', 'Settled', 'Cancelled'];

export default function OrderScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Active');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('Cash');
  const [scaleValue] = useState(new Animated.Value(1));


  const [orders, setOrders] = useState([
    {
      id: '1',
      customer: { name: 'Unknown Customer', phone: '', country: { code: '+974', name: 'Qatar' } },
      table: 'Table 102',
      time: '25s',
      items: [
        { name: 'CHAPPATHI & BEEF CURRY', qty: 1, price: 6.00 },
        { name: 'CHICKEN BIRYANI', qty: 1, price: 15.00 },
        { name: 'SOUTH INDIAN THAU', qty: 3, price: 28.00 }
      ],
      total: 105.00,
      status: 'Active',
      selected: false,
      orderType: 'Dine in'
    },
    {
      id: '2',
      customer: { name: 'John Doe', phone: '12345678', country: { code: '+974', name: 'Qatar' } },
      table: 'VIP 1',
      time: '5m',
      items: [
        { name: 'MUTTON BIRYANI', qty: 2, price: 18.00 },
        { name: 'GARLIC NAAN', qty: 3, price: 3.00 }
      ],
      total: 45.00,
      status: 'Active',
      selected: false,
      orderType: 'Takeaway'
    },
    {
      id: '3',
      customer: { name: 'Jane Smith', phone: '87654321', country: { code: '+971', name: 'UAE' } },
      table: 'Outdoor 2',
      time: '15m',
      items: [
        { name: 'VEG PULAO', qty: 1, price: 12.00 },
        { name: 'PANEER TIKKA', qty: 1, price: 14.00 }
      ],
      total: 26.00,
      status: 'Settled',
      selected: false,
      orderType: 'Delivery'
    },
    {
      id: '4',
      customer: { name: 'Mike Johnson', phone: '11223344', country: { code: '+966', name: 'Saudi Arabia' } },
      table: 'Table 5',
      time: '20m',
      items: [
        { name: 'FISH CURRY', qty: 2, price: 16.00 }
      ],
      total: 32.00,
      status: 'Cancelled',
      selected: false,
      orderType: 'Online Order'
    }
  ]);


  useEffect(() => {
    if (route.params?.order) {
      const newOrder = {
        ...route.params.order,
        id: (orders.length + 1).toString(),
        time: 'Just now',
        status: 'Active',
        selected: false
      };
      setOrders([newOrder, ...orders]);
    }
  }, [route.params]);

  const filteredOrders = orders.filter(order =>
    activeTab === 'All' || order.status === activeTab
  );

  const toggleOrderSelection = (id) => {
    setOrders(orders.map(order =>
      order.id === id ? { ...order, selected: !order.selected } : order
    ));
  };

  const toggleSelectAll = () => {
    const allSelected = filteredOrders.every(order => order.selected);
    setOrders(orders.map(order => {
      if (filteredOrders.some(fOrder => fOrder.id === order.id)) {
        return { ...order, selected: !allSelected };
      }
      return order;
    }));
  };

  const settleSelected = () => {
    if (selectedOrders.length === 0) {
      Alert.alert('No Orders Selected', 'Please select orders to settle');
      return;
    }

    setShowPaymentModal(true);
  };

  const cancelSelected = () => {
    if (selectedOrders.length === 0) {
      Alert.alert('No Orders Selected', 'Please select orders to cancel');
      return;
    }

    Alert.alert(
      'Confirm Cancellation',
      `Are you sure you want to cancel ${selectedOrders.length} order(s)?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => {
            setOrders(orders.map(order =>
              selectedOrders.includes(order.id)
                ? { ...order, status: 'Cancelled', selected: false }
                : order
            ));
            setSelectedOrders([]);
          }
        }
      ]
    );
  };

  const confirmPayment = () => {
    if (!cashAmount) {
      Alert.alert('Enter Amount', 'Please enter the cash amount');
      return;
    }

    const amount = parseFloat(cashAmount);
    if (isNaN(amount)) {
      Alert.alert('Invalid Amount', 'Please enter a valid number');
      return;
    }


    setOrders(orders.map(order =>
      selectedOrders.includes(order.id)
        ? { ...order, status: 'Settled', selected: false }
        : order
    ));

    setSelectedOrders([]);
    setShowPaymentModal(false);
    setCashAmount('');
    Alert.alert('Payment Confirmed', 'Order has been settled successfully');
  };

  const printKOT = (orderId) => {

    Alert.alert('Print KOT', `KOT printed for order #${orderId}`);
  };

  const printBill = (orderId) => {
    Alert.alert('Print Bill', `Bill printed for order #${orderId}`);
  };

  const settleSingleOrder = (orderId) => {
    setSelectedOrders([orderId]);
    setShowPaymentModal(true);
  };


  useEffect(() => {
    const selected = orders.filter(order => order.selected).map(order => order.id);
    setSelectedOrders(selected);
  }, [orders]);

  const totalSelectedAmount = orders
    .filter(order => selectedOrders.includes(order.id))
    .reduce((sum, order) => sum + order.total, 0);

  const animateButton = (callback) => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(callback);
  };

  const handlePrintKOT = (orderId) => {
    animateButton(() => printKOT(orderId));
  };

  const handlePrintBill = (orderId) => {
    animateButton(() => printBill(orderId));
  };

  const renderOrderItem = ({ item }) => (
    <View style={[
      styles.orderCard,
      item.status === 'Settled' && styles.settledCard,
      item.status === 'Cancelled' && styles.cancelledCard
    ]}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.customerName}>{item.customer.name}</Text>
          {item.customer.phone && (
            <Text style={styles.customerPhone}>
              {item.customer.country.code} {item.customer.phone}
            </Text>
          )}
        </View>
        <View style={styles.orderMeta}>
          <Text style={styles.orderTime}>{item.time}</Text>
          <Text style={styles.orderTable}>{item.table}</Text>
          <Text style={styles.orderType}>{item.orderType}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.itemsCount}>{item.items.length} items • QAR {item.total.toFixed(2)}</Text>

        {item.items.map((orderItem, index) => (
          <View key={index} style={styles.orderItem}>
            <Text style={styles.itemName}>{orderItem.name}</Text>
            <Text style={styles.itemPrice}>{orderItem.qty} x {orderItem.price.toFixed(2)} = QAR {(orderItem.qty * orderItem.price).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {item.status === 'Active' && (
        <View style={styles.orderActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => settleSingleOrder(item.id)}
          >
            <MaterialIcons name="payment" size={20} color="#4CAF50" />
            <Text style={styles.actionText}>Settle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handlePrintKOT(item.id)}
          >
            <MaterialIcons name="print" size={20} color="#2196F3" />
            <Text style={styles.actionText}>Print KOT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handlePrintBill(item.id)}
          >
            <MaterialIcons name="receipt" size={20} color="#9C27B0" />
            <Text style={styles.actionText}>Print Bill</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'Settled' && (
        <View style={styles.statusBadge}>
          <Text style={styles.settledText}>SETTLED</Text>
        </View>
      )}

      {item.status === 'Cancelled' && (
        <View style={[styles.statusBadge, styles.cancelledBadge]}>
          <Text style={styles.cancelledText}>CANCELLED</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.selectCheckbox}
        onPress={() => toggleOrderSelection(item.id)}
      >
        <Ionicons
          name={item.selected ? "checkbox" : "square-outline"}
          size={24}
          color={item.selected ? "#FF9800" : "#ccc"}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>

      <LinearGradient
        colors={['#4a6572', '#344955']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Welcome User</Text>
        <Text style={styles.headerSubtitle}>Orders</Text>

        <View style={styles.tabsContainer}>
          {['All', 'Active', 'Settled', 'Cancelled'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab === 'All' ? 'All' : tab)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>


      {activeTab === 'Active' && (
        <View style={styles.activeOrdersHeader}>
          <TouchableOpacity onPress={toggleSelectAll}>
            <Text style={styles.actionLink}>Select All</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={settleSelected}>
            <Text style={styles.actionLink}>Settle Selected</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={cancelSelected}>
            <Text style={styles.actionLink}>Cancel Selected</Text>
          </TouchableOpacity>
        </View>
      )}


      {filteredOrders.length > 0 ? (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color="#e0e0e0" />
          <Text style={styles.emptyText}>No orders found</Text>
          <Text style={styles.emptySubtext}>
            {activeTab === 'Active'
              ? 'Create new orders from the menu'
              : `No ${activeTab.toLowerCase()} orders`}
          </Text>
        </View>
      )}


      {selectedOrders.length > 0 && (
        <View style={styles.selectedSummary}>
          <Text style={styles.summaryText}>
            {selectedOrders.length} order(s) selected • QAR {totalSelectedAmount.toFixed(2)}
          </Text>
        </View>
      )}


      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPaymentModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Settle Payment</Text>

          <Text style={styles.sectionTitle}>Payment Type</Text>
          <View style={styles.paymentTypes}>
            {paymentTypes.map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.paymentButton,
                  selectedPayment === type && styles.selectedPayment
                ]}
                onPress={() => setSelectedPayment(type)}
              >
                <Text style={[
                  styles.paymentText,
                  selectedPayment === type && styles.selectedPaymentText
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedPayment === 'Cash' && (
            <View style={styles.cashInputContainer}>
              <Text style={styles.inputLabel}>Cash Amount</Text>
              <TextInput
                placeholder="Enter amount"
                value={cashAmount}
                onChangeText={setCashAmount}
                keyboardType="numeric"
                style={styles.cashInput}
              />
            </View>
          )}

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>QAR {totalSelectedAmount.toFixed(2)}</Text>
          </View>

          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={confirmPayment}
            >
              <LinearGradient
                colors={['#4CAF50', '#2E7D32']}
                style={styles.gradientButton}
              >
                <Text style={styles.confirmButtonText}>Confirm Payment</Text>
                <MaterialIcons name="payment" size={24} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.printButton}
            onPress={() => handlePrintKOT(selectedOrders[0])}
          >
            <Text style={styles.printButtonText}>Print KOT</Text>
          </TouchableOpacity>
        </View>
      </Modal>


      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="menu" size={24} color="#4a6572" />
          <Text style={styles.navText}>Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="people" size={24} color="#4a6572" />
          <Text style={styles.navText}>Customers</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="bar-chart" size={24} color="#4a6572" />
          <Text style={styles.navText}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="swap-horizontal" size={24} color="#4a6572" />
          <Text style={styles.navText}>Transaction</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="log-out" size={24} color="#4a6572" />
          <Text style={styles.navText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 15,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#FF9800',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  activeOrdersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  actionLink: {
    color: '#FF9800',
    fontWeight: '600',
  },
  listContent: {
    padding: 15,
    paddingBottom: 80,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  settledCard: {
    borderLeftColor: '#4CAF50',
  },
  cancelledCard: {
    borderLeftColor: '#F44336',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  orderMeta: {
    alignItems: 'flex-end',
  },
  orderTime: {
    color: '#FF9800',
    fontWeight: '600',
  },
  orderTable: {
    color: '#2196F3',
    fontWeight: '600',
  },
  orderType: {
    color: '#9C27B0',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 2,
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 5,
  },
  itemsCount: {
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  orderItem: {
    marginBottom: 5,
  },
  itemName: {
    color: '#333',
    fontWeight: '500',
  },
  itemPrice: {
    color: '#777',
    fontSize: 14,
    marginLeft: 10,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 5,
    color: '#555',
  },
  statusBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#e8f5e9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  settledText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cancelledBadge: {
    backgroundColor: '#ffebee',
  },
  cancelledText: {
    color: '#F44336',
    fontWeight: 'bold',
    fontSize: 12,
  },
  selectCheckbox: {
    position: 'absolute',
    top: 15,
    left: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#9e9e9e',
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#bdbdbd',
    marginTop: 5,
    textAlign: 'center',
  },
  selectedSummary: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: '#FF9800',
    padding: 10,
    alignItems: 'center',
  },
  summaryText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  paymentTypes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  paymentButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  selectedPayment: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  paymentText: {
    color: '#555',
  },
  selectedPaymentText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  cashInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    marginBottom: 8,
    color: '#555',
    fontWeight: '500',
  },
  cashInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  confirmButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 10,
  },
  gradientButton: {
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 10,
  },
  printButton: {
    marginTop: 15,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 10,
  },
  printButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    paddingVertical: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    alignItems: 'center',
  },
  navText: {
    color: '#4a6572',
    fontSize: 12,
    marginTop: 4,
  },
});