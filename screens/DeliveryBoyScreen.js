import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  StatusBar,
  ScrollView,
  Platform,
  Button,
  Modal,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { OrderAPI, AuthAPI } from "../api/api";
const DeliveryBoyScreen = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState("back");
  const [loading, setLoading] = useState(true);

  const [scannedData, setScannedData] = useState(null);
  const [showScanPopup, setShowScanPopup] = useState(false);

  const [scanResult, setScanResult] = useState(null);
  const [showScanResult, setShowScanResult] = useState(false);

  const [dailyStats, setDailyStats] = useState({
    deliveries: 0,
    collectedAmount: 0,
  });

  const navigation = useNavigation();

  // camera permission
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  useEffect(() => {
    fetchDeliveryOrders();
  }, []);

  const fetchDeliveryOrders = async () => {
    try {
      const response = await OrderAPI.getDeliveryOrders();
      // setOrders(response.orders || []);
      setOrders(response?.orders || []); // ✅ FIXED: response is an array directly
    } catch (error) {
      Alert.alert("Error", "Failed to load orders: " + error.message);
    } finally {
      setLoading(false);
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

  const [orders, setOrders] = useState([]);

  const handleBarCodeScanned = async ({ data }) => {
    if (!cameraReady) return;

    setIsScanning(false);
    setCameraReady(false);

    try {
      setScanResult({
        loading: true,
        message: "Verifying QR code...",
      });
      setShowScanResult(true);

      const response = await OrderAPI.verifyQRCode(data);

      // Handle success case
      if (response === "Order Picked Successfully") {
        setScanResult({
          success: true,
          message: response,
        });

        fetchDeliveryOrders();
      }
      // Handle already picked case
      else if (response === "Order already picked by you") {
        setScanResult({
          success: false,
          message: response,
          warning: true, // Add a warning type for UI differentiation
        });
      }
      // Handle other cases
      else {
        setScanResult({
          success: false,
          message: response || "QR verification failed",
          error: true,
        });
      }
    } catch (error) {
      setScanResult({
        success: false,
        message: error.message || "Failed to verify QR code",
        error: true,
      });
    } finally {
      setShowScanResult(true);
    }
  };

  const markAsDelivered = () => {
    if (paymentMethod === "cash" && !amountReceived) {
      Alert.alert(
        "Amount Required",
        "Please enter the amount received from customer."
      );
      return;
    }

    const updatedOrders = orders.map((order) =>
      order.id === activeOrder.id ? { ...order, status: "delivered" } : order
    );

    setOrders(updatedOrders);

    setDailyStats({
      deliveries: dailyStats.deliveries + 1,
      collectedAmount: dailyStats.collectedAmount + activeOrder.totalAmount,
    });

    Alert.alert("Success", "Order marked as delivered successfully");
    setActiveOrder(null);
    setAmountReceived("");
  };

  // const renderOrderItem = ({ item }) => (
  //   <TouchableOpacity
  //     style={[
  //       styles.orderItem,
  //       item.status === 'delivered' ? styles.completedOrder : styles.pendingOrder
  //     ]}
  //     onPress={() => setActiveOrder(item)}
  //   >
  //     <View style={styles.orderHeader}>
  //       <Text style={styles.orderId}>{item.id}</Text>
  //       <View style={[
  //         styles.statusBadge,
  //         item.status === 'delivered' ? styles.completedBadge : styles.pendingBadge
  //       ]}>
  //         <Text style={styles.statusText}>
  //           {item.status === 'delivered' ? 'Delivered' : 'Pending'}
  //         </Text>
  //       </View>
  //     </View>
  //     <View style={styles.orderInfo}>
  //       <Ionicons name="person" size={16} color="#555" />
  //       <Text style={styles.orderText}>{item.customerName}</Text>
  //     </View>
  //     <View style={styles.orderInfo}>
  //       <Ionicons name="location" size={16} color="#555" />
  //       <Text style={styles.orderText}>{item.deliveryAddress}</Text>
  //     </View>
  //     <View style={styles.orderInfo}>
  //       <Ionicons name="restaurant" size={16} color="#555" />
  //       <Text style={styles.orderText}>{item.restaurant}</Text>
  //     </View>
  //     <View style={styles.orderFooter}>
  //       <Text style={styles.orderAmount}>QAR {item.totalAmount}</Text>
  //       <View style={styles.timeInfo}>
  //         <Ionicons name="time" size={14} color="#555" />
  //         <Text style={styles.timeText}>{item.time}</Text>
  //       </View>
  //     </View>
  //   </TouchableOpacity>
  // );

  const renderOrderItem = ({ item }) => {
    // Fallbacks to prevent crashes
    const order = item?.order || {};
    const orderNumber = order?.order_number || `#${item?.id}`;
    const status = item?.status || "unknown";
    const pickupTime = item?.pickup_time
      ? new Date(item.pickup_time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";
    const deliveryTime = item?.delivery_time
      ? new Date(item.delivery_time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Pending";
    const paidStatus = order.is_paid ? "Paid" : "Unpaid";

    const customer = item?.customer || {};
    const address = item?.address || {};

    // Build full address string safely
    const fullAddress = [
      address.label,
      address.zone,
      address.street,
      address.building ? `Bldg ${address.building}` : null,
      address.floor ? `Fl ${address.floor}` : null,
      address.apartment ? `Apt ${address.apartment}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    return (
      <TouchableOpacity
        style={[
          styles.orderItem,
          status === "delivered" ? styles.completedOrder : styles.pendingOrder,
        ]}
        // onPress={() => setActiveOrder(item)} // Uncomment if needed
      >
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>{orderNumber}</Text>
          <View
            style={[
              styles.statusBadge,
              status === "delivered"
                ? styles.completedBadge
                : styles.pendingBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {status
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </Text>
          </View>
        </View>

        {/* Price & Payment */}
        {(order?.price || order?.is_paid !== undefined) && (
          <View style={styles.orderInfo}>
            <Ionicons name="cash" size={16} color="#555" />
            <Text style={styles.orderText}>
              {order?.price ? `QAR ${order.price}` : ""}
              {order?.is_paid !== undefined && ` - ${paidStatus}`}
            </Text>
          </View>
        )}

        {/* Notes (optional) */}
        {item?.notes && (
          <View style={styles.orderInfo}>
            <Ionicons name="information-circle" size={16} color="#555" />
            <Text style={styles.orderText}>{item.notes}</Text>
          </View>
        )}

        {/* Customer Name */}
        {customer.full_name && (
          <View style={styles.orderInfo}>
            <Ionicons name="person" size={16} color="#555" />
            <Text style={styles.orderText}>{customer.full_name}</Text>
          </View>
        )}

        {/* Customer Phone */}
        {customer.phone_number && (
          <View style={styles.orderInfo}>
            <Ionicons name="call" size={16} color="#555" />
            <Text style={styles.orderText}>{customer.phone_number}</Text>
          </View>
        )}

        {/* Address */}
        {fullAddress && (
          <View style={styles.orderInfo}>
            <Ionicons name="location" size={16} color="#555" />
            <Text style={styles.orderText}>{fullAddress}</Text>
          </View>
        )}

        {/* Pickup Time */}
        <View style={styles.orderInfo}>
          <Ionicons name="time" size={16} color="#555" />
          <Text style={styles.orderText}>Pickup: {pickupTime}</Text>
        </View>

        {/* Delivery Time */}
        <View style={styles.orderInfo}>
          <Ionicons name="time" size={16} color="#555" />
          <Text style={styles.orderText}>Delivery: {deliveryTime}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  //  Popup
  const ScanResultPopup = () => (
    <Modal
      visible={showScanResult}
      transparent
      animationType="fade"
      onRequestClose={() => setShowScanResult(false)}
    >
      <View style={styles.popupBackdrop}>
        <View style={styles.popupCard}>
          <Text style={styles.popupTitle}>
            {scanResult?.loading
              ? "Processing..."
              : scanResult?.success
              ? "Success"
              : "Error"}
          </Text>

          <View
            style={[
              styles.dataBox,
              scanResult?.success && styles.successBox,
              scanResult?.error && styles.errorBox,
            ]}
          >
            {scanResult?.loading ? (
              <ActivityIndicator size="large" color="#3498db" />
            ) : (
              <Text style={styles.dataText}>{scanResult?.message}</Text>
            )}
          </View>

          {!scanResult?.loading && (
            <TouchableOpacity
              style={[
                styles.closeButton,
                scanResult?.success && styles.successButton,
                scanResult?.error && styles.errorButton,
              ]}
              onPress={() => {
                setShowScanResult(false);
                if (scanResult?.success) {
                  setActiveOrder(scanResult.order);
                }
              }}
            >
              <Text style={styles.buttonText}>
                {scanResult?.success ? "View Order" : "Close"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderStatsCard = (icon, title, value, color) => (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  if (isScanning) {
    if (!permission) {
      return <View />;
    }

    if (!permission.granted) {
      return (
        <View style={[styles.container, styles.paddedContainer]}>
          <Text style={styles.permissionText}>
            We need your permission to show the camera
          </Text>
          <Button onPress={requestPermission} title="Grant Permission" />
          <TouchableOpacity
            style={[styles.scanButton, styles.bottomButton]}
            onPress={() => setIsScanning(false)}
          >
            <Text style={styles.scanButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.cameraContainer, styles.paddedContainer]}>
        <StatusBar barStyle="light-content" />
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          onBarcodeScanned={cameraReady ? handleBarCodeScanned : undefined}
          onCameraReady={() => {
            console.log("Camera is ready");
            setCameraReady(true);
          }}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        >
          <View style={styles.scanOverlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.scanText}>Align QR code within the frame</Text>
          </View>
        </CameraView>
        <TouchableOpacity
          style={[styles.closeButton, styles.paddedCloseButton]}
          onPress={() => setIsScanning(false)}
        >
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  if (activeOrder) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.orderHeaderContainer}>
          <TouchableOpacity
            onPress={() => setActiveOrder(null)}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Order Details</Text>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.card}>
            <View style={styles.orderIdContainer}>
              <Text style={styles.orderIdText}>{activeOrder.id}</Text>
              <View
                style={[
                  styles.statusBadge,
                  activeOrder.status === "delivered"
                    ? styles.completedBadge
                    : styles.pendingBadge,
                ]}
              >
                <Text style={styles.statusText}>
                  {activeOrder.status === "delivered"
                    ? "Delivered"
                    : "In Progress"}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color="#3498db" />
              <Text style={styles.infoText}>{activeOrder.customerName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#e74c3c" />
              <Text style={styles.infoText}>{activeOrder.deliveryAddress}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color="#27ae60" />
              <Text style={styles.infoText}>{activeOrder.customerPhone}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="restaurant" size={20} color="#f39c12" />
              <Text style={styles.infoText}>{activeOrder.restaurant}</Text>
            </View>

            <View style={styles.distanceContainer}>
              <View style={styles.distanceInfo}>
                <Ionicons name="navigate" size={18} color="#555" />
                <Text style={styles.distanceText}>{activeOrder.distance}</Text>
              </View>
              <View style={styles.distanceInfo}>
                <Ionicons name="time" size={18} color="#555" />
                <Text style={styles.distanceText}>{activeOrder.time}</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            {activeOrder.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  <Text style={styles.itemPrice}>QAR {item.price}</Text>
                </View>
              </View>
            ))}
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalAmount}>
                QAR {activeOrder.totalAmount}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>QR Code Data</Text>
            <TextInput
              style={styles.qrDataInput}
              value={activeOrder.rawData}
              editable={false}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentMethodContainer}>
              <TouchableOpacity
                style={[
                  styles.paymentMethod,
                  paymentMethod === "cash" && styles.selectedMethod,
                ]}
                onPress={() => setPaymentMethod("cash")}
              >
                <FontAwesome
                  name="money"
                  size={24}
                  color={paymentMethod === "cash" ? "#27ae60" : "#95a5a6"}
                />
                <Text style={styles.paymentText}>Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.paymentMethod,
                  paymentMethod === "card" && styles.selectedMethod,
                ]}
                onPress={() => setPaymentMethod("card")}
              >
                <FontAwesome
                  name="credit-card"
                  size={24}
                  color={paymentMethod === "card" ? "#27ae60" : "#95a5a6"}
                />
                <Text style={styles.paymentText}>Card</Text>
              </TouchableOpacity>
            </View>

            {paymentMethod === "cash" && (
              <>
                <Text style={styles.amountLabel}>Amount Received</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="Enter amount received"
                  keyboardType="numeric"
                  value={amountReceived}
                  onChangeText={setAmountReceived}
                  returnKeyType="done"
                />
              </>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.deliverButton,
              activeOrder.status === "delivered" && styles.disabledButton,
            ]}
            onPress={markAsDelivered}
            disabled={activeOrder.status === "delivered"}
          >
            <Text style={styles.deliverButtonText}>
              {activeOrder.status === "delivered"
                ? "Already Delivered"
                : "Mark as Delivered"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7e4bcc" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Main screen
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      <ScanResultPopup />

      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome back,</Text>
          {/* <Text style={styles.name}>Rahul Sharma</Text> */}
        </View>
        {/* <Image
  source={{ uri: "" }}
          style={styles.avatar}
        /> */}
      </View>

      <Text style={styles.sectionHeader}>Today's Stats</Text>
      <View style={styles.statsContainer}>
        {renderStatsCard(
          <Ionicons name="bicycle" size={28} color="white" />,
          "Deliveries",
          dailyStats.deliveries,
          "#3498db"
        )}
        {renderStatsCard(
          <Ionicons name="cash" size={28} color="white" />,
          "Collected",
          `QAR ${dailyStats.collectedAmount}`,
          "#27ae60"
        )}
      </View>

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => setIsScanning(true)}
      >
        <View style={styles.scanButtonContent}>
          <MaterialIcons name="qr-code-scanner" size={28} color="white" />
          <Text style={styles.scanButtonText}>Scan Order QR Code</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionHeader}>Your Orders</Text>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      {/* Footer Navigation */}
      <View style={styles.footer}>
        {/* <TouchableOpacity
                style={styles.footerButton}
                onPress={() => navigation.navigate("Orders")}
              >
                <Ionicons name="list" size={24} color="#7e4bcc" />
                <Text style={styles.footerButtonText}>Orders</Text>
              </TouchableOpacity> */}

        {/* <TouchableOpacity
                style={styles.footerButton}
                onPress={() => navigation.navigate("Menu")}
              >
                <Ionicons name="fast-food" size={24} color="#7e4bcc" />
                <Text style={styles.footerButtonText}>Menu</Text>
              </TouchableOpacity> */}

        <TouchableOpacity style={styles.footerButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#7e4bcc" />
          <Text style={styles.footerButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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

  successBox: {
    backgroundColor: "#e8f5e9",
    borderLeftWidth: 4,
    borderLeftColor: "#4caf50",
  },
  errorBox: {
    backgroundColor: "#ffebee",
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  successButton: {
    backgroundColor: "#4caf50",
  },
  errorButton: {
    backgroundColor: "#f44336",
  },

  // Loading indicator
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  qrDataInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    backgroundColor: "#f9f9f9",
    color: "#555",
  },

  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 30,
  },
  welcome: {
    fontSize: 18,
    color: "#7f8c8d",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#3498db",
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 16,
    marginTop: 10,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: "white",
    fontWeight: "500",
  },
  scanButton: {
    backgroundColor: "#2c3e50",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scanButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  scanButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  orderItem: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  pendingOrder: {
    borderLeftColor: "#f39c12",
  },
  completedOrder: {
    borderLeftColor: "#27ae60",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  orderId: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#2c3e50",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  pendingBadge: {
    backgroundColor: "#fef9e7",
  },
  completedBadge: {
    backgroundColor: "#eafaf1",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  orderInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  orderText: {
    color: "#555",
    fontSize: 14,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  orderAmount: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#2c3e50",
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    color: "#7f8c8d",
    fontSize: 14,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  scanOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50, // Push the scanning frame down
  },
  bottomButton: {
    marginTop: 20, // Space between button and other elements
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 10,
    position: "relative",
    marginBottom: 20,
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#27ae60",
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: -1,
    right: -1,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  scanText: {
    color: "white",
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  closeButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 10,
  },
  paddedCloseButton: {
    top: 60, // Move the close button down from the top
    // right: 20,
    // Keep other positioning styles
  },
  paddedContainer: {
    paddingTop: 50, // Adjust this value as needed
  },
  permissionText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  orderHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  orderIdContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  orderIdText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: "#34495e",
  },
  distanceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  distanceInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  distanceText: {
    fontSize: 16,
    color: "#555",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  itemName: {
    fontSize: 16,
    color: "#555",
    flex: 2,
  },
  itemDetails: {
    flexDirection: "row",
    gap: 20,
    flex: 1,
    justifyContent: "flex-end",
  },
  itemQuantity: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2c3e50",
    minWidth: 60,
    textAlign: "right",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  paymentMethodContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 20,
  },
  paymentMethod: {
    width: "48%",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ecf0f1",
    backgroundColor: "#f8f9fa",
  },
  selectedMethod: {
    borderColor: "#27ae60",
    backgroundColor: "#eafaf1",
  },
  paymentText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
    color: "#2c3e50",
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#555",
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: "white",
  },
  deliverButton: {
    backgroundColor: "#27ae60",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: "#95a5a6",
  },
  deliverButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  listContent: {
    paddingBottom: 20,
  },

  popupBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  popupCard: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  dataBox: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  dataText: {
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: "#3498db",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default DeliveryBoyScreen;

// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Image, StatusBar, ScrollView } from 'react-native';
// import { Camera } from 'expo-camera';
// import { useNavigation } from '@react-navigation/native';
// import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';

// const DeliveryBoyScreen = () => {
//   const [isScanning, setIsScanning] = useState(false);
//   const [hasPermission, setHasPermission] = useState(null);
//   const [activeOrder, setActiveOrder] = useState(null);
//   const [paymentMethod, setPaymentMethod] = useState('cash');
//   const [amountReceived, setAmountReceived] = useState('');

//   // Daily stats state
//   const [dailyStats, setDailyStats] = useState({
//     deliveries: 0,
//     collectedAmount: 0
//   });

//   const navigation = useNavigation();

//   // Request camera permission
//   useEffect(() => {
//     (async () => {
//       const { status } = await Camera.requestCameraPermissionsAsync();
//       setHasPermission(status === 'granted');
//     })();
//   }, []);

//   // Orders state
//   const [orders, setOrders] = useState([
//     {
//       id: 'ORD-1284',
//       customerName: 'Rajesh Kumar',
//       deliveryAddress: '24, Hamad, Qatar',
//       customerPhone: '9876543210',
//       totalAmount: 450,
//       status: 'assigned',
//       items: [
//         { name: 'Paneer Butter Masala', quantity: 2, price: 180 },
//         { name: 'Garlic Naan', quantity: 4, price: 160 },
//         { name: 'Mango Lassi', quantity: 2, price: 110 }
//       ],
//       distance: '2.5 km',
//       time: '15 min',
//       restaurant: 'NassResto'
//     },
//     {
//       id: 'ORD-1285',
//       customerName: 'Priya Sharma',
//       deliveryAddress: 'Block B, Apartment 302, Badam',
//       customerPhone: '8765432109',
//       totalAmount: 620,
//       status: 'assigned',
//       items: [
//         { name: 'Chicken Biryani', quantity: 1, price: 220 },
//         { name: 'Veg Fried Rice', quantity: 1, price: 150 },
//         { name: 'Chicken 65', quantity: 1, price: 180 },
//         { name: 'Coke', quantity: 2, price: 70 }
//       ],
//       distance: '3.2 km',
//       time: '20 min',
//       restaurant: 'NassResto'
//     }
//   ]);

//   // Handle QR scanning
//   const handleBarCodeScanned = ({ type, data }) => {
//     setIsScanning(false);
//     try {
//       const orderData = JSON.parse(data);
//       const verifiedOrder = orders.find(order => order.id === orderData.orderId);

//       if (verifiedOrder) {
//         // Add to today's deliveries when scanned
//         setActiveOrder(verifiedOrder);
//       } else {
//         Alert.alert('Invalid Order', 'This order is not assigned to you.');
//       }
//     } catch (e) {
//       Alert.alert('Invalid QR Code', 'The scanned QR code is not valid.');
//     }
//   };

//   // Mark order as delivered
//   const markAsDelivered = () => {
//     if (!amountReceived && activeOrder.totalAmount > 0) {
//       Alert.alert('Amount Required', 'Please enter the amount received from customer.');
//       return;
//     }

//     // Update order status
//     const updatedOrders = orders.map(order =>
//       order.id === activeOrder.id ? { ...order, status: 'delivered' } : order
//     );

//     setOrders(updatedOrders);

//     // Update daily stats
//     setDailyStats({
//       deliveries: dailyStats.deliveries + 1,
//       collectedAmount: dailyStats.collectedAmount + activeOrder.totalAmount
//     });

//     Alert.alert('Success', 'Order marked as delivered successfully');
//     setActiveOrder(null);
//     setAmountReceived('');
//   };

//   // Render order item
//   const renderOrderItem = ({ item }) => (
//     <TouchableOpacity
//       style={[
//         styles.orderItem,
//         item.status === 'delivered' ? styles.completedOrder : styles.pendingOrder
//       ]}
//       onPress={() => setActiveOrder(item)}
//     >
//       <View style={styles.orderHeader}>
//         <Text style={styles.orderId}>{item.id}</Text>
//         <View style={styles.statusBadge}>
//           <Text style={styles.statusText}>{item.status === 'delivered' ? 'Delivered' : 'Pending'}</Text>
//         </View>
//       </View>
//       <View style={styles.orderInfo}>
//         <Ionicons name="person" size={16} color="#555" />
//         <Text style={styles.orderText}>{item.customerName}</Text>
//       </View>
//       <View style={styles.orderInfo}>
//         <Ionicons name="location" size={16} color="#555" />
//         <Text style={styles.orderText}>{item.deliveryAddress}</Text>
//       </View>
//       <View style={styles.orderInfo}>
//         <Ionicons name="restaurant" size={16} color="#555" />
//         <Text style={styles.orderText}>{item.restaurant}</Text>
//       </View>
//       <View style={styles.orderFooter}>
//         <Text style={styles.orderAmount}>QAR {item.totalAmount}</Text>
//         <View style={styles.timeInfo}>
//           <Ionicons name="time" size={14} color="#555" />
//           <Text style={styles.timeText}>{item.time}</Text>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );

//   // Render stats card
//   const renderStatsCard = (icon, title, value, color) => (
//     <View style={[styles.statCard, { backgroundColor: color }]}>
//       <View style={styles.statIcon}>{icon}</View>
//       <Text style={styles.statValue}>{value}</Text>
//       <Text style={styles.statTitle}>{title}</Text>
//     </View>
//   );

//   if (isScanning) {
//     if (hasPermission === false) {
//       return (
//         <View style={styles.container}>
//           <Text style={styles.permissionText}>Camera permission not granted!</Text>
//           <TouchableOpacity
//             style={styles.scanButton}
//             onPress={() => setIsScanning(false)}
//           >
//             <Text style={styles.scanButtonText}>Go Back</Text>
//           </TouchableOpacity>
//         </View>
//       );
//     }

//     return (
//       <View style={styles.container}>
//         <StatusBar barStyle="light-content" />
//         <Camera
//           style={styles.camera}
//           onBarCodeScanned={handleBarCodeScanned}
//         >
//           <View style={styles.overlay}>
//             <View style={styles.border} />
//             <Text style={styles.scanText}>Scan Order QR Code</Text>
//             <Text style={styles.scanHint}>Position QR code within the frame</Text>
//           </View>
//         </Camera>
//         <TouchableOpacity
//           style={styles.cancelButton}
//           onPress={() => setIsScanning(false)}
//         >
//           <Ionicons name="close" size={28} color="white" />
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   // Order details screen
//   if (activeOrder) {
//     return (
//       <View style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
//         <View style={styles.orderHeaderContainer}>
//           <TouchableOpacity onPress={() => setActiveOrder(null)} style={styles.backButton}>
//             <Ionicons name="arrow-back" size={24} color="#2c3e50" />
//           </TouchableOpacity>
//           <Text style={styles.screenTitle}>Order Details</Text>
//         </View>

//         <ScrollView
//           style={styles.scrollContainer}
//           contentContainerStyle={styles.scrollContent}
//         >
//           <View style={styles.card}>
//             <View style={styles.orderIdContainer}>
//               <Text style={styles.orderIdText}>{activeOrder.id}</Text>
//               <View style={[styles.statusBadge,
//                 activeOrder.status === 'delivered' ?
//                 styles.completedBadge : styles.pendingBadge]}>
//                 <Text style={styles.statusText}>
//                   {activeOrder.status === 'delivered' ? 'Delivered' : 'In Progress'}
//                 </Text>
//               </View>
//             </View>

//             <View style={styles.infoRow}>
//               <Ionicons name="person" size={20} color="#3498db" />
//               <Text style={styles.infoText}>{activeOrder.customerName}</Text>
//             </View>

//             <View style={styles.infoRow}>
//               <Ionicons name="location" size={20} color="#e74c3c" />
//               <Text style={styles.infoText}>{activeOrder.deliveryAddress}</Text>
//             </View>

//             <View style={styles.infoRow}>
//               <Ionicons name="call" size={20} color="#27ae60" />
//               <Text style={styles.infoText}>{activeOrder.customerPhone}</Text>
//             </View>

//             <View style={styles.infoRow}>
//               <Ionicons name="restaurant" size={20} color="#f39c12" />
//               <Text style={styles.infoText}>{activeOrder.restaurant}</Text>
//             </View>

//             <View style={styles.distanceContainer}>
//               <View style={styles.distanceInfo}>
//                 <Ionicons name="navigate" size={18} color="#555" />
//                 <Text style={styles.distanceText}>{activeOrder.distance}</Text>
//               </View>
//               <View style={styles.distanceInfo}>
//                 <Ionicons name="time" size={18} color="#555" />
//                 <Text style={styles.distanceText}>{activeOrder.time}</Text>
//               </View>
//             </View>
//           </View>

//           <View style={styles.card}>
//             <Text style={styles.sectionTitle}>Order Items</Text>
//             {activeOrder.items.map((item, index) => (
//               <View key={index} style={styles.itemRow}>
//                 <Text style={styles.itemName}>{item.name}</Text>
//                 <View style={styles.itemDetails}>
//                   <Text style={styles.itemQuantity}>x{item.quantity}</Text>
//                   <Text style={styles.itemPrice}>QAR {item.price}</Text>
//                 </View>
//               </View>
//             ))}
//             <View style={styles.totalContainer}>
//               <Text style={styles.totalLabel}>Total Amount:</Text>
//               <Text style={styles.totalAmount}>QAR {activeOrder.totalAmount}</Text>
//             </View>
//           </View>

//           <View style={styles.card}>
//             <Text style={styles.sectionTitle}>Payment Method</Text>
//             <View style={styles.paymentMethodContainer}>
//               <TouchableOpacity
//                 style={[styles.paymentMethod, paymentMethod === 'cash' && styles.selectedMethod]}
//                 onPress={() => setPaymentMethod('cash')}
//               >
//                 <FontAwesome name="money" size={24} color={paymentMethod === 'cash' ? '#27ae60' : '#95a5a6'} />
//                 <Text style={styles.paymentText}>Cash</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.paymentMethod, paymentMethod === 'card' && styles.selectedMethod]}
//                 onPress={() => setPaymentMethod('card')}
//               >
//                 <FontAwesome name="credit-card" size={24} color={paymentMethod === 'card' ? '#27ae60' : '#95a5a6'} />
//                 <Text style={styles.paymentText}>Card</Text>
//               </TouchableOpacity>
//             </View>

//             <Text style={styles.amountLabel}>Amount Received</Text>
//             <TextInput
//               style={styles.amountInput}
//               placeholder="Enter amount received"
//               keyboardType="numeric"
//               value={amountReceived}
//               onChangeText={setAmountReceived}
//               returnKeyType="done"
//             />
//           </View>

//           <TouchableOpacity
//             style={styles.deliverButton}
//             onPress={markAsDelivered}
//           >
//             <Text style={styles.deliverButtonText}>Mark as Delivered</Text>
//           </TouchableOpacity>
//         </ScrollView>
//       </View>
//     );
//   }

//   // Main screen
//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
//       <View style={styles.header}>
//         <View>
//           <Text style={styles.welcome}>Welcome back,</Text>
//           <Text style={styles.name}>Rahul Sharma</Text>
//         </View>
//         <Image
//           source={{ uri: 'https://randomuser.me/api/portraits/men/2.jpg' }}
//           style={styles.avatar}
//         />
//       </View>

//       <Text style={styles.sectionHeader}>Today's Stats</Text>
//       <View style={styles.statsContainer}>
//         {renderStatsCard(
//           <Ionicons name="bicycle" size={28} color="white" />,
//           'Deliveries',
//           dailyStats.deliveries,
//           '#3498db'
//         )}
//         {renderStatsCard(
//           <Ionicons name="cash" size={28} color="white" />,
//           'Collected',
//           `QAR ${dailyStats.collectedAmount}`,
//           '#27ae60'
//         )}
//       </View>

//       <TouchableOpacity
//         style={styles.scanButton}
//         onPress={() => setIsScanning(true)}
//       >
//         <View style={styles.scanButtonContent}>
//           <MaterialIcons name="qr-code-scanner" size={28} color="white" />
//           <Text style={styles.scanButtonText}>Scan Order QR Code</Text>
//         </View>
//       </TouchableOpacity>

//       <Text style={styles.sectionHeader}>Your Orders</Text>
//       <FlatList
//         data={orders}
//         renderItem={renderOrderItem}
//         keyExtractor={item => item.id}
//         contentContainerStyle={styles.listContent}
//         showsVerticalScrollIndicator={false}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: '#f8f9fa',
//   },
//   scrollContainer: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingBottom: 30,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   welcome: {
//     fontSize: 18,
//     color: '#7f8c8d',
//   },
//   name: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//   },
//   avatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     borderWidth: 2,
//     borderColor: '#3498db',
//   },
//   sectionHeader: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 16,
//     marginTop: 10,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 20,
//   },
//   statCard: {
//     width: '48%',
//     borderRadius: 12,
//     padding: 16,
//     alignItems: 'center',
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   statIcon: {
//     marginBottom: 8,
//   },
//   statValue: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: 'white',
//     marginBottom: 4,
//   },
//   statTitle: {
//     fontSize: 14,
//     color: 'white',
//     fontWeight: '500',
//   },
//   scanButton: {
//     backgroundColor: '#2c3e50',
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 20,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   scanButtonContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 12,
//   },
//   scanButtonText: {
//     color: 'white',
//     fontWeight: 'bold',
//     fontSize: 18,
//   },
//   orderItem: {
//     backgroundColor: 'white',
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 12,
//     borderLeftWidth: 6,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//   },
//   pendingOrder: {
//     borderLeftColor: '#f39c12',
//   },
//   completedOrder: {
//     borderLeftColor: '#27ae60',
//   },
//   orderHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   orderId: {
//     fontWeight: 'bold',
//     fontSize: 16,
//     color: '#2c3e50',
//   },
//   statusBadge: {
//     paddingVertical: 4,
//     paddingHorizontal: 10,
//     borderRadius: 20,
//   },
//   pendingBadge: {
//     backgroundColor: '#fef9e7',
//   },
//   completedBadge: {
//     backgroundColor: '#eafaf1',
//   },
//   statusText: {
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
//   orderInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 6,
//     gap: 8,
//   },
//   orderText: {
//     color: '#555',
//     fontSize: 14,
//   },
//   orderFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginTop: 10,
//     paddingTop: 10,
//     borderTopWidth: 1,
//     borderTopColor: '#eee',
//   },
//   orderAmount: {
//     fontWeight: 'bold',
//     fontSize: 16,
//     color: '#2c3e50',
//   },
//   timeInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   timeText: {
//     color: '#7f8c8d',
//     fontSize: 14,
//   },
//   camera: {
//     flex: 1,
//     width: '100%',
//   },
//   overlay: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.7)',
//   },
//   border: {
//     width: 250,
//     height: 250,
//     borderWidth: 2,
//     borderColor: 'white',
//     borderRadius: 10,
//   },
//   scanText: {
//     color: 'white',
//     marginTop: 20,
//     fontSize: 20,
//     fontWeight: 'bold',
//   },
//   scanHint: {
//     color: '#ddd',
//     marginTop: 8,
//     fontSize: 16,
//   },
//   cancelButton: {
//     position: 'absolute',
//     bottom: 40,
//     alignSelf: 'center',
//     backgroundColor: '#e74c3c',
//     padding: 12,
//     borderRadius: 30,
//     width: 60,
//     height: 60,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   orderHeaderContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   backButton: {
//     marginRight: 15,
//   },
//   screenTitle: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//   },
//   card: {
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 20,
//     marginBottom: 16,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//   },
//   orderIdContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 15,
//     paddingBottom: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   orderIdText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//   },
//   infoRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//     gap: 12,
//   },
//   infoText: {
//     fontSize: 16,
//     color: '#34495e',
//   },
//   distanceContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 15,
//     paddingTop: 15,
//     borderTopWidth: 1,
//     borderTopColor: '#eee',
//   },
//   distanceInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   distanceText: {
//     fontSize: 16,
//     color: '#555',
//     fontWeight: '500',
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 15,
//   },
//   itemRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 12,
//     paddingBottom: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f8f9fa',
//   },
//   itemName: {
//     fontSize: 16,
//     color: '#555',
//     flex: 2,
//   },
//   itemDetails: {
//     flexDirection: 'row',
//     gap: 20,
//     flex: 1,
//     justifyContent: 'flex-end',
//   },
//   itemQuantity: {
//     fontSize: 16,
//     color: '#7f8c8d',
//   },
//   itemPrice: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: '#2c3e50',
//     minWidth: 60,
//     textAlign: 'right',
//   },
//   totalContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 10,
//     paddingTop: 15,
//     borderTopWidth: 1,
//     borderTopColor: '#eee',
//   },
//   totalLabel: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#555',
//   },
//   totalAmount: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//   },
//   paymentMethodContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 10,
//     marginBottom: 20,
//   },
//   paymentMethod: {
//     width: '48%',
//     padding: 16,
//     borderRadius: 10,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#ecf0f1',
//     backgroundColor: '#f8f9fa',
//   },
//   selectedMethod: {
//     borderColor: '#27ae60',
//     backgroundColor: '#eafaf1',
//   },
//   paymentText: {
//     fontSize: 16,
//     fontWeight: '500',
//     marginTop: 8,
//     color: '#2c3e50',
//   },
//   amountLabel: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: '#555',
//     marginBottom: 8,
//   },
//   amountInput: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 10,
//     padding: 15,
//     fontSize: 16,
//     backgroundColor: 'white',
//   },
//   deliverButton: {
//     backgroundColor: '#27ae60',
//     padding: 18,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginTop: 10,
//   },
//   deliverButtonText: {
//     color: 'white',
//     fontWeight: 'bold',
//     fontSize: 18,
//   },
//   permissionText: {
//     fontSize: 18,
//     textAlign: 'center',
//     marginBottom: 20,
//   },
// });

// export default DeliveryBoyScreen;
