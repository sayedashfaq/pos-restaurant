import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { RNCamera } from 'react-native-camera';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

const DeliveryBoyScreen = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedOrders, setScannedOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const navigation = useNavigation();

  
  useEffect(() => {
    fetchDeliveryOrders();
  }, []);

  const fetchDeliveryOrders = async () => {
    try {
     
      const response = await axios.get('/api/delivery/assigned-orders');
      setScannedOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleQRScan = ({ data }) => {
    setIsScanning(false);
    try {
      const orderData = JSON.parse(data);
   
      const verifiedOrder = scannedOrders.find(order => order.id === orderData.orderId);
      if (verifiedOrder) {
        setActiveOrder(verifiedOrder);
      } else {
        Alert.alert('Invalid Order', 'This order is not assigned to you.');
      }
    } catch (e) {
      Alert.alert('Invalid QR Code', 'The scanned QR code is not valid.');
    }
  };

  const markAsDelivered = () => {
    if (!amountReceived && activeOrder.totalAmount > 0) {
      Alert.alert('Amount Required', 'Please enter the amount received from customer.');
      return;
    }

   
    confirmDelivery();
  };

  const confirmDelivery = async () => {
    try {
      const payload = {
        orderId: activeOrder.id,
        paymentMethod,
        amountReceived: parseFloat(amountReceived) || activeOrder.totalAmount,
        deliveryStatus: 'completed'
      };

     
      await axios.post('/api/delivery/confirm-delivery', payload);
      
      Alert.alert('Success', 'Order marked as delivered successfully');
      setActiveOrder(null);
      fetchDeliveryOrders(); 
    } catch (error) {
      console.error('Delivery confirmation failed:', error);
      Alert.alert('Error', 'Failed to confirm delivery. Please try again.');
    }
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderItem}
      onPress={() => setActiveOrder(item)}
    >
      <Text style={styles.orderId}>Order #{item.id}</Text>
      <Text>{item.customerName} - {item.deliveryAddress}</Text>
      <Text>Total: ₹{item.totalAmount}</Text>
      <Text>Status: {item.status}</Text>
    </TouchableOpacity>
  );

  if (isScanning) {
    return (
      <View style={styles.container}>
        <RNCamera
          style={styles.camera}
          onBarCodeRead={handleQRScan}
          captureAudio={false}
        >
          <View style={styles.overlay}>
            <View style={styles.border} />
            <Text style={styles.scanText}>Scan Order QR Code</Text>
          </View>
        </RNCamera>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => setIsScanning(false)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (activeOrder) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Order Details</Text>
        <View style={styles.orderDetails}>
          <Text style={styles.orderId}>Order #{activeOrder.id}</Text>
          <Text>Customer: {activeOrder.customerName}</Text>
          <Text>Address: {activeOrder.deliveryAddress}</Text>
          <Text>Phone: {activeOrder.customerPhone}</Text>
          <Text>Total Amount: ₹{activeOrder.totalAmount}</Text>
          
          <Text style={styles.subTitle}>Items:</Text>
          {activeOrder.items.map((item, index) => (
            <Text key={index}>{item.name} x{item.quantity} - ₹{item.price}</Text>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Payment Details</Text>
        <View style={styles.paymentSection}>
          <View style={styles.paymentMethodContainer}>
            <TouchableOpacity
              style={[styles.paymentMethod, paymentMethod === 'cash' && styles.selectedMethod]}
              onPress={() => setPaymentMethod('cash')}
            >
              <Text>Cash</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentMethod, paymentMethod === 'card' && styles.selectedMethod]}
              onPress={() => setPaymentMethod('card')}
            >
              <Text>Card</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.amountInput}
            placeholder="Amount Received"
            keyboardType="numeric"
            value={amountReceived}
            onChangeText={setAmountReceived}
          />
        </View>

        <TouchableOpacity 
          style={styles.deliverButton}
          onPress={markAsDelivered}
        >
          <Text style={styles.deliverButtonText}>Mark as Delivered</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setActiveOrder(null)}
        >
          <Text style={styles.backButtonText}>Back to Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Delivery Orders</Text>
      
      <TouchableOpacity 
        style={styles.scanButton}
        onPress={() => setIsScanning(true)}
      >
        <Text style={styles.scanButtonText}>Scan Order QR Code</Text>
      </TouchableOpacity>

      <FlatList
        data={scannedOrders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>Today's Deliveries: {scannedOrders.filter(o => o.status === 'completed').length}</Text>
        <Text style={styles.statsText}>Pending Deliveries: {scannedOrders.filter(o => o.status === 'assigned').length}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  scanButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  orderItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  orderId: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  listContent: {
    paddingBottom: 20,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  border: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 10,
  },
  scanText: {
    color: 'white',
    marginTop: 20,
    fontSize: 18,
  },
  cancelButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  orderDetails: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  paymentSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  paymentMethod: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  selectedMethod: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  deliverButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  deliverButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    backgroundColor: '#607D8B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  statsText: {
    fontSize: 16,
    marginBottom: 5,
  },
});

export default DeliveryBoyScreen;