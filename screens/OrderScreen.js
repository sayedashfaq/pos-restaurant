import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { OrderAPI } from '../api/api';

const paymentTypes = ['Cash', 'Card', 'Credit'];
const orderStatuses = ['Active', 'Settled', 'Cancelled'];

export default function OrderScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('All'); 
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('Cash');
  const [scaleValue] = useState(new Animated.Value(1));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const params = {};
      if (activeTab !== 'All') {
        params.status = activeTab;
      }

      const data = await OrderAPI.getOrders(params);


      const formattedOrders = data.map(order => {

        let customerName = 'Unknown Customer';
        let customerPhone = '';

        if (order.customer) {
          if (typeof order.customer === 'string') {
            customerName = order.customer;
          } else if (order.customer.full_name) {
            customerName = order.customer.full_name;
          }

          if (order.customer.phone_number) {
            customerPhone = order.customer.phone_number;
          }
        }

        return {
          ...order,
          selected: false,
          table: order.table?.name || 'No Table',
          customer: {
            name: customerName,
            phone: customerPhone,
            country: {
              code: order.country_code || '+974',
              name: 'Qatar'
            }
          },
          items: order.items.map(item => ({
            ...item,
            name: item.menu?.name || 'Unknown Item',
            price: parseFloat(item.menu?.price || 0),
            qty: item.quantity || 1
          })),
          total: parseFloat(order.total_price || 0)
        };
      });

      setOrders(formattedOrders);
    } catch (error) {
      Alert.alert('Error', `Failed to fetch orders: ${error.message || error}`);
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  useEffect(() => {
    if (route.params?.refresh) {
      fetchOrders();
      navigation.setParams({ refresh: false });
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

  const cancelSelected = async () => {
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
          onPress: async () => {
            try {
              await Promise.all(selectedOrders.map(id =>
                OrderAPI.updateOrder(id, { status: 'Cancelled' })
              ));

              setOrders(orders.map(order =>
                selectedOrders.includes(order.id)
                  ? { ...order, status: 'Cancelled', selected: false }
                  : order
              ));

              setSelectedOrders([]);
              fetchOrders();
            } catch (error) {
              Alert.alert('Error', `Failed to cancel orders: ${error.message || error}`);
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const confirmPayment = async () => {
    if (selectedPayment === 'Cash' && !cashAmount) {
      Alert.alert('Enter Amount', 'Please enter the cash amount');
      return;
    }

    if (selectedPayment === 'Cash') {
      const amount = parseFloat(cashAmount);
      if (isNaN(amount)) {
        Alert.alert('Invalid Amount', 'Please enter a valid number');
        return;
      }
    }

    try {
      await Promise.all(selectedOrders.map(id =>
        OrderAPI.updateOrder(id, {
          status: 'Settled',
          payment_method: selectedPayment,
          cash_amount: selectedPayment === 'Cash' ? cashAmount : undefined
        })
      ));

      setOrders(orders.map(order =>
        selectedOrders.includes(order.id)
          ? { ...order, status: 'Settled', selected: false }
          : order
      ));

      setSelectedOrders([]);
      setShowPaymentModal(false);
      setCashAmount('');
      Alert.alert('Payment Confirmed', 'Order has been settled successfully');
      fetchOrders(); 
    } catch (error) {
      Alert.alert('Error', `Failed to settle orders: ${error.message || error}`);
      console.error(error);
    }
  };
const printKOT = async (orderId) => {
  try {
    await OrderAPI.printOrderBill(orderId, 'kot');
    Alert.alert('Print KOT', 'KOT printed successfully');
  } catch (error) {
    Alert.alert('Error', `Failed to print KOT: ${error.message || error}`);
    console.error(error);
  }
};

const printBill = async (orderId) => {
  try {
    await OrderAPI.printOrderBill(orderId, 'bill'); 
    Alert.alert('Print Bill', 'Bill printed successfully');
  } catch (error) {
    Alert.alert('Error', `Failed to print bill: ${error.message || error}`);
    console.error(error);
  }
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
          <Text style={styles.orderTime}>{item.created_at || 'Just now'}</Text>
          <Text style={styles.orderTable}>{item.table}</Text>
          <Text style={styles.orderType}>{item.order_type || 'Dine in'}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.itemsCount}>{item.items.length} items • QAR {item.total.toFixed(2)}</Text>

        {item.items.map((orderItem, index) => (
          <View key={index} style={styles.orderItem}>
            <Text style={styles.itemName}>{orderItem.name}</Text>
            <Text style={styles.itemPrice}>
              {orderItem.qty} x {orderItem.price.toFixed(2)} = QAR {(orderItem.qty * orderItem.price).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>


      <View style={styles.orderActions}>
        {item.status === 'Active' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => settleSingleOrder(item.id)}
          >
            <MaterialIcons name="payment" size={20} color="#4CAF50" />
            <Text style={styles.actionText}>Settle</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => printKOT(item.id)}
        >
          <MaterialIcons name="print" size={20} color="#2196F3" />
          <Text style={styles.actionText}>Print KOT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => printBill(item.id)}
        >
          <MaterialIcons name="receipt" size={20} color="#9C27B0" />
          <Text style={styles.actionText}>Print Bill</Text>
        </TouchableOpacity>

      </View>

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
              onPress={() => setActiveTab(tab)}
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
            <Text style={styles.actionLink}>
              {filteredOrders.every(order => order.selected) ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={settleSelected}>
            <Text style={styles.actionLink}>Settle Selected</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={cancelSelected}>
            <Text style={styles.actionLink}>Cancel Selected</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6572" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : filteredOrders.length > 0 ? (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id.toString()}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchOrders}
              colors={['#FF9800']}
              tintColor="#FF9800"
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color="#e0e0e0" />
          <Text style={styles.emptyText}>No orders found</Text>
          <Text style={styles.emptySubtext}>
            {activeTab === 'All'
              ? 'No orders in the system'
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
            onPress={() => printKOT(selectedOrders[0])}
          >
            <Text style={styles.printButtonText}>Print KOT</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
    position: 'relative',
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
    maxWidth: '70%',
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
    fontSize: 12,
  },
  orderTable: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 12,
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
    paddingVertical: 3,
  },
  itemName: {
    color: '#333',
    fontWeight: '500',
    fontSize: 14,
  },
  itemPrice: {
    color: '#777',
    fontSize: 13,
    marginLeft: 10,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    minWidth: '30%',
    justifyContent: 'center',
    marginVertical: 2,
  },
  actionText: {
    marginLeft: 5,
    color: '#555',
    fontSize: 12,
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
    fontSize: 10,
  },
  cancelledBadge: {
    backgroundColor: '#ffebee',
  },
  cancelledText: {
    color: '#F44336',
    fontWeight: 'bold',
    fontSize: 10,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#4a6572',
    fontSize: 16,
  },

  orderItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  itemDetails: {
    flex: 1,
  },
  itemQuantity: {
    minWidth: 40,
    textAlign: 'right',
  },
});
