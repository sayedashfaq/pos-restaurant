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
  RefreshControl,KeyboardAvoidingView,Platform,Keyboard,ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { OrderAPI } from '../api/api';
import * as Print from 'expo-print';
import { WebView } from 'react-native-webview';

const paymentTypes = ['Cash', 'Card', 'Credit'];
const orderStatus = ['ordered', 'settled', 'cancelled'];

export default function OrderScreen() {
  const [printDocuments, setPrintDocuments] = useState([]);
  const [currentPrintIndex, setCurrentPrintIndex] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printActionType, setPrintActionType] = useState('');
  const route = useRoute();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('All');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [scaleValue] = useState(new Animated.Value(1));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const statusMap = {
  'All': null,
  'Active': 'ordered',  
  'Settled': 'settled',
  'Cancelled': 'cancelled'
};


 const fetchOrders = async () => {
  try {
    setRefreshing(true);
    const params = {};
    const status = statusMap[activeTab];
    
    if (status) {
      params.order_status = status;
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

  const filteredOrders = activeTab === 'All' 
  ? orders 
  : orders.filter(order => order.order_status === statusMap[activeTab]);
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
                OrderAPI.updateOrder(id, { order_status: 'cancelled' })
              ));

              setOrders(orders.map(order =>
                selectedOrders.includes(order.id)
                  ? { ...order, order_status: 'cancelled', selected: false }
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
 const totalSelectedAmount = orders
    .filter(order => selectedOrders.includes(order.id))
    .reduce((sum, order) => sum + order.total, 0);

  // const confirmPayment = async () => {
  //   if (selectedPayment === 'cash' && !cashAmount) {
  //     Alert.alert('Enter Amount', 'Please enter the cash amount');
  //     return;
  //   }

  //   if (selectedPayment === 'cash') {
  //     const amount = parseFloat(cashAmount);
  //     if (isNaN(amount)) {
  //       Alert.alert('Invalid Amount', 'Please enter a valid number');
  //       return;
  //     }
  //   } else {
  //     paymentAmount = totalSelectedAmount;
  //   }

  //   try {
  //     await Promise.all(selectedOrders.map(id =>
  //       OrderAPI.updateOrder(id, {
  //         order_status: 'settled',
  //         payment_amount: cashAmount,
  //         payment_type: selectedPayment,
  //       })
  //     ));

  //     setOrders(orders.map(order =>
  //       selectedOrders.includes(order.id)
  //         ? { ...order, order_status: 'settled', selected: false }
  //         : order
  //     ));

  //     setSelectedOrders([]);
  //     setShowPaymentModal(false);
  //     setCashAmount('');
  //     Alert.alert('Payment Confirmed', 'Order has been settled successfully');
  //     fetchOrders();
  //   } catch (error) {
  //     Alert.alert('Error', `Failed to settle orders: ${error.message || error}`);
  //     console.error(error);
  //   }
  // };
  const confirmPayment = async () => {
  if (selectedPayment === 'cash' && !cashAmount) { 
    Alert.alert('Enter Amount', 'Please enter the cash amount');
    return;
  }

  let paymentAmount;
  
  if (selectedPayment === 'cash') {
    paymentAmount = parseFloat(cashAmount);
    if (isNaN(paymentAmount)) {
      Alert.alert('Invalid Amount', 'Please enter a valid number');
      return;
    }
  } else {
    paymentAmount = totalSelectedAmount;
  }

  try {
    await Promise.all(selectedOrders.map(id =>
      OrderAPI.updateOrder(id, {
        order_status: 'settled',
        payment_amount: paymentAmount, // Use the calculated paymentAmount here
        payment_type: selectedPayment,
      })
    ));

    setOrders(orders.map(order =>
      selectedOrders.includes(order.id)
        ? { ...order, order_status: 'settled', selected: false }
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

  const printDocumentsSequentially = async (docs) => {
    setIsPrinting(true);
    try {
      for (let i = 0; i < docs.length; i++) {
        setCurrentPrintIndex(i);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await Print.printAsync({
          html: docs[i].html,
          orientation: Print.Orientation.portrait,
          paperSize: { width: 210, height: 297 }
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      return true;
    } catch (error) {
      console.error('Printing error:', error);
      throw new Error(`Failed to print: ${error.message}`);
    } finally {
      setIsPrinting(false);
    }
  };





  const printKOT = async (orderId) => {
  try {
    if (!orderId) return Alert.alert('Error', 'Order ID is missing');
    setPrintActionType('kot');
    const docs = (await OrderAPI.printOrderBill(orderId, 'kot'))
    setPrintDocuments(docs);
    setShowPrintPreview(true);
  } catch (error) {
    Alert.alert('Error', error.message || 'Failed to print KOT');
  }
};

const printBill = async (orderId) => {
  try {
    if (!orderId) return Alert.alert('Error', 'Order ID is missing');
    setPrintActionType('bill');
    const docs = await OrderAPI.printOrderBill(orderId, 'bill');
    setPrintDocuments(docs);
    setShowPrintPreview(true);
  } catch (error) {
    Alert.alert('Error', error.message || 'Failed to print bill');
  }
};


  const handlePrintAll = async () => {
    try {
      const success = await printDocumentsSequentially(printDocuments);
      if (success) {
        Alert.alert('Success', 'Documents sent to printer');
      }
    } catch (error) {
      Alert.alert('Print Error', error.message);
    } finally {
      setShowPrintPreview(false);
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
      item === 'settled' && styles.settledCard,
      item === 'cancelled' && styles.cancelledCard
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
          <View key={index} style={styles.orderItemContainer}>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{orderItem.name}</Text>
            </View>
            <Text style={styles.itemPrice}>
              {orderItem.qty} x QAR {orderItem.price.toFixed(2)}
            </Text>
            <Text style={styles.itemTotal}>
              QAR {(orderItem.qty * orderItem.price).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.orderActions}>
        {item.order_status === 'ordered'   && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.settleButton]}
              onPress={() => settleSingleOrder(item.id)}
            >
              <MaterialIcons name="payment" size={20} color="#fff" />
              <Text style={styles.actionText}>Settle</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                Alert.alert(
                  'Cancel Order',
                  'Are you sure you want to cancel this order?',
                  [
                    { text: 'No', style: 'cancel' },
                    {
                      text: 'Yes',
                      onPress: async () => {
                        try {
                          await OrderAPI.updateOrder(item.id, { order_status: 'cancelled' });
                          fetchOrders();
                        } catch (error) {
                          Alert.alert('Error', `Failed to cancel order: ${error.message || error}`);
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <MaterialIcons name="cancel" size={20} color="#fff" />
              <Text style={styles.actionText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.printButton]}
          onPress={() => printKOT(item.id)}
        >
          <MaterialIcons name="print" size={20} color="#fff" />
          <Text style={styles.actionText}>KOT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.billButton]}
          onPress={() => printBill(item.id)}
        >
          <MaterialIcons name="receipt" size={20} color="#fff" />
          <Text style={styles.actionText}>Bill</Text>
        </TouchableOpacity>
      </View>

      {item.order_status === 'settled' && (
        <View style={styles.statusBadge}>
          <Text style={styles.settledText}>SETTLED</Text>
        </View>
      )}

      {item.order_status === 'cancelled' && (
      
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
          color={item.selected ? "#5a67d8" : "#ccc"}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#6c5ce7', '#4a4bff']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>Order Management</Text>
        <Text style={styles.headerSubtitle}>Track and manage all orders</Text>

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
          <ActivityIndicator size="large" color="#6c5ce7" />
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
              colors={['#6c5ce7']}
              tintColor="#6c5ce7"
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color="#d1d1e0" />
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

      {/* Print Preview Modal */}
      <Modal
        visible={showPrintPreview}
        transparent={false}
        animationType="slide"
      >
        <SafeAreaView style={styles.printPreviewContainer}>
          <View style={styles.printPreviewHeader}>
            <Text style={styles.printPreviewTitle}>
              {printActionType === 'kot' ? 'Kitchen Order Ticket' : 'Bill Preview'}
            </Text>
            <TouchableOpacity onPress={() => setShowPrintPreview(false)}>
              <Ionicons name="close" size={24} color="#5a67d8" />
            </TouchableOpacity>
          </View>

          <WebView
            originWhitelist={['*']}
            source={{ html: printDocuments[currentPrintIndex]?.html || '' }}
            style={styles.webview}
          />

          <View style={styles.printActions}>
            <TouchableOpacity
              style={[styles.printButton, isPrinting && styles.disabledButton]}
              onPress={handlePrintAll}
              disabled={isPrinting}
            >
              {isPrinting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.printButtonText}>Print</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelPrintButton}
              onPress={() => setShowPrintPreview(false)}
            >
              <Text style={styles.cancelPrintButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      
<Modal
  visible={showPaymentModal}
  transparent={true}
  animationType="fade"
  onRequestClose={() => setShowPaymentModal(false)}
>
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={styles.keyboardView}
  >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* --- Modal Body Starts --- */}
          <Text style={styles.modalTitle}>Settle Payment</Text>
          <Text style={styles.modalSubtitle}>Select payment method and complete transaction</Text>

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

          {/* {selectedPayment === 'Cash' && (
            <View style={styles.cashInputContainer}>
              <Text style={styles.inputLabel}>Cash Amount</Text>
              <TextInput
                placeholder="Enter amount"
                placeholderTextColor="#aaa"
                value={cashAmount}
                onChangeText={setCashAmount}
                keyboardType="numeric"
                style={styles.cashInput}
              />
            </View>
          )} */}

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>QAR {totalSelectedAmount.toFixed(2)}</Text>
          </View>

          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={confirmPayment}
            >
              <LinearGradient
                colors={['#6c5ce7', '#5a67d8']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.confirmButtonText}>Confirm Payment</Text>
                <MaterialIcons name="check" size={24} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowPaymentModal(false)}
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
          {/* --- Modal Body Ends --- */}
        </View>
      </View>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
</Modal>



    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Poppins-Regular',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    padding: 5,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: 'white',
  },
  tabText: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    fontFamily: 'Poppins-Medium',
  },
  activeTabText: {
    color: '#6c5ce7',
    fontWeight: 'bold',
  },
  activeOrdersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionLink: {
    color: '#6c5ce7',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  listContent: {
    padding: 15,
    paddingBottom: 80,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#6c5ce7',
    position: 'relative',
    overflow: 'hidden',
  },
  settledCard: {
    borderLeftColor: '#48bb78',
  },
  cancelledCard: {
    borderLeftColor: '#e53e3e',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    maxWidth: '70%',
    fontFamily: 'Poppins-Bold',
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  orderMeta: {
    alignItems: 'flex-end',
  },
  orderTime: {
    color: '#6c5ce7',
    fontWeight: '600',
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  orderTable: {
    color: '#4a4bff',
    fontWeight: '600',
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  orderType: {
    color: '#9c7bff',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 8,
  },
  itemsCount: {
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
    fontFamily: 'Poppins-SemiBold',
  },
  orderItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemDetails: {
    flex: 2,
  },
  itemName: {
    color: '#333',
    fontWeight: '500',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  itemPrice: {
    color: '#777',
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    flex: 1,
    textAlign: 'right',
    paddingRight: 10,
  },
  itemTotal: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    width: 80,
    textAlign: 'right',
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
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    minWidth: '23%',
    justifyContent: 'center',
    // marginVertical: 2,
    marginRight:2,
  },
  settleButton: {
    backgroundColor: '#48bb78',
  },
  cancelButton: {
    backgroundColor: '#e53e3e',
  },
  printButton: {
    backgroundColor: '#4a4bff',
  },
  billButton: {
    backgroundColor: '#9c7bff',
  },
  actionText: {
    marginLeft: 5,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
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
    color: '#48bb78',
    fontWeight: 'bold',
    fontSize: 10,
  },
  cancelledBadge: {
    backgroundColor: '#ffebee',
  },
  cancelledText: {
    color: '#e53e3e',
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
    color: '#a0a0c0',
    marginTop: 15,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#c0c0e0',
    marginTop: 5,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  selectedSummary: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: '#6c5ce7',
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  summaryText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  keyboardView: {
  flex: 1,

},
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
  modalContent: {
  width: '90%',
  backgroundColor: 'white',
  borderRadius: 20,
  padding: 25,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.2,
  shadowRadius: 20,
  elevation: 10,
},
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins-Regular',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  paymentTypes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  paymentButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
  },
  selectedPayment: {
    backgroundColor: '#eef2ff',
    borderColor: '#6c5ce7',
  },
  paymentText: {
    color: '#555',
    fontFamily: 'Poppins-Medium',
  },
  selectedPaymentText: {
    color: '#6c5ce7',
    fontWeight: 'bold',
  },
  cashInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    marginBottom: 8,
    color: '#555',
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  cashInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f8f9ff',
    fontFamily: 'Poppins-Regular',
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
    fontFamily: 'Poppins-Bold',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6c5ce7',
    fontFamily: 'Poppins-Bold',
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
    fontFamily: 'Poppins-Bold',
  },
  closeButton: {
    marginTop: 15,
    padding: 15,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#6c5ce7',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6c5ce7',
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  printPreviewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  printPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0d7f0',
  },
  printPreviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5a67d8',
    fontFamily: 'Poppins-Bold',
  },
  webview: {
    flex: 1,
  },
  printActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0d7f0',
  },
  printButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 25,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#b19cd9',
  },
  printButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  cancelPrintButton: {
    borderWidth: 1,
    borderColor: '#6c5ce7',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 25,
    alignItems: 'center',
    flex: 1,
  },
  cancelPrintButtonText: {
    color: '#6c5ce7',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
});