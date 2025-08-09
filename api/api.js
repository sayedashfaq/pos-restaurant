import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL, ENDPOINTS } from "./endpoints";
import { convertJsonToHtml } from "../utils/htmlUtils";
import { transformKotToContent } from "../utils/transformKotToContent ";
import { transformBillToContent } from "../utils/transformBillToContent ";
import { startTokenExpiryWatcher } from "../utils/TokenManager";
import { clearTokenWatcher } from "../utils/TokenManager";
import { Platform } from "react-native";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 100000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token available");

        const response = await axios.post(
          `${BASE_URL}${ENDPOINTS.REFRESH_TOKEN}`,
          { refresh: refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        const newAccessToken = response.data.access;
        await AsyncStorage.setItem("access_token", newAccessToken);

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        console.error("🔒 Token refresh failed:", refreshError);

        await AsyncStorage.removeItem("access_token");
        await AsyncStorage.removeItem("refresh_token");

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const handleApiError = (error) => {
  const errorData = error.response?.data || { message: error.message };
  console.error("API Error:", errorData);
  throw errorData;
};

export const AuthAPI = {
  login: async (email, password) => {
    try {
      const headers = {};
      // ✅ Only add custom header if NOT running on web
      if (Platform.OS !== "web") {
        headers["X-Signature"] =
          "#mswua&kx+c8&(*#lb3#0lh&lb0!$%r^4+lib#9hlz70uxxkh0";
      }

      const response = await api.post(
        "/accounts/login/",
        { email, password },
        {
          headers,
        }
      );

      if (response.data.access) {
        await AsyncStorage.setItem("access_token", response.data.access);
        await AsyncStorage.setItem("refresh_token", response.data.refresh);

        api.defaults.headers.common.Authorization = `Bearer ${response.data.access}`;

        // 🧠 Start logout timer here
        startTokenExpiryWatcher(() => {
          // Example: navigate to login screen
          console.log("⏳ Auto logout triggered");
          // NavigationService.navigate('Login'); // or use your navigator
        });
      }

      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  getAccountInfo: async () => {
    try {
      const response = await api.get("/accounts/account/");
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem("access_token");
      await AsyncStorage.removeItem("refresh_token");
      delete api.defaults.headers.common.Authorization;

      clearTokenWatcher(); // 🧼 clear logout timer
    } catch (error) {
      console.error("Logout error", error);
      throw error;
    }
  },

  refreshToken: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      const headers = {};
      if (Platform.OS !== "web") {
        headers["Signature"] =
          "#mswua&kx+c8&(*#lb3#0lh&lb0!$%r^4+lib#9hlz70uxxkh0";
      }

      const response = await api.post(
        "/accounts/token/refresh/",
        {
          refresh: refreshToken,
        },
        {
          headers,
        }
      );

      await AsyncStorage.setItem("access_token", response.data.access);
      api.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${response.data.access}`;

      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  setupAuthHeader: async () => {
    const token = await AsyncStorage.getItem("access_token");
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
  },
};

export { api };

export const UserAPI = {
  getCustomers: async (params = {}) => {
    try {
      const response = await api.get(ENDPOINTS.CUSTOMERS, { params });

      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getCustomer: async (id) => {
    try {
      const response = await api.get(ENDPOINTS.CUSTOMER_DETAIL(id));
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  createCustomer: async (customerData) => {
    try {
      const response = await api.post(ENDPOINTS.CUSTOMERS, customerData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateCustomer: async (id, customerData) => {
    try {
      const response = await api.patch(
        ENDPOINTS.CUSTOMER_DETAIL(id),
        customerData
      );
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getStaff: async (role) => {
    try {
      const endpoint =
        role === "waiter" ? ENDPOINTS.WAITERS : ENDPOINTS.DELIVERY;
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const MenuAPI = {
  getMenuItems: async (params = {}) => {
    try {
      const response = await api.get(ENDPOINTS.MENUS, { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getMenuItem: async (id) => {
    try {
      const response = await api.get(ENDPOINTS.MENU_DETAIL(id));
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  getMenuItemFiltered: async (categoryName) => {
    try {
      const endpoint = categoryName
        ? `/menus?category=${encodeURIComponent(categoryName)}`
        : "/menus";
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getCategories: async () => {
    try {
      const response = await api.get(ENDPOINTS.CATEGORIES);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  createCategory: async (categoryData) => {
    try {
      const response = await api.post(ENDPOINTS.CATEGORIES, categoryData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const OrderAPI = {
  createOrder: async (orderData) => {
    try {
      const response = await api.post(ENDPOINTS.ORDERS, orderData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getOrders: async (params = {}) => {
    try {
      const response = await api.get(ENDPOINTS.ORDERS, { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  //   printOrderBill: async (orderId, actionType) => {
  //   try {
  //     const response = await api.get(ENDPOINTS.PRINT_BILL, {
  //       params: {
  //         order_id: orderId,
  //         action: actionType.toLowerCase()
  //       }
  //     });
  //     return response.data;
  //   } catch (error) {
  //     return handleApiError(error);
  //   }
  // },

  //   printOrderBill: async (orderId, actionType) => {
  //     try {

  //      const response = await api.get('/orders/bill', {
  //   params: {
  //     order_id: orderId,
  //     action: actionType.toLowerCase(),
  //   },
  // });
  //       return response.data;
  //     } catch (error) {
  //       throw new Error(error.response?.data?.message || 'Failed to generate print template');
  //     }
  //   },

  // In api.js
  // In api.js

  printOrderBill: async (orderId, actionType) => {
    try {
      const response = await api.get("/orders/bill", {
        params: { order_id: orderId, action: actionType.toLowerCase() },
      });

      const data = response?.data;
      console.log(data);
      
      if (!data) throw new Error("No response data from server");

      let docs = [];
      let isKot = false;

      if (actionType === "kot" && Array.isArray(data.kots)) {
        docs = data.kots;
        isKot = true;
      } else if (actionType === "bill" && data.bill) {
        docs = [data.bill];
      } else {
        docs = Array.isArray(data) ? data : [data];
      }

      return docs.map((doc) => {
        const content = isKot
          ? transformKotToContent(doc)
          : transformBillToContent(doc);

        return {
        ...doc,
        html: content.value, // Already includes CSS
      };
      });
    } catch (error) {
      console.error("Print API error:", error);
      throw new Error(
        error?.response?.data?.message || "Failed to generate print template"
      );
    }
  },

  //   printOrderBill: async (orderId, actionType) => {
  //     try {
  //       const response = await api.get('/orders/bill', {

  //         params: { order_id: orderId, action: actionType.toLowerCase() }
  //       });

  //       console.log(response.data)

  //       if (Array.isArray(response.data)) {
  //         return response.data.map(doc => ({
  //           ...doc,
  //           html: convertJsonToHtml(doc.content)
  //         }));
  //       }

  //       return docs.map((doc) => ({
  //   ...doc,
  //   html: convertJsonToHtml(doc.content ?? doc),
  // }));
  //     } catch (error) {
  //       console.error('Print API error:', error);
  //       throw new Error(error.response?.data?.message || 'Failed to generate print template');
  //     }
  //   },
  getOrder: async (id) => {
    try {
      const response = await api.get(ENDPOINTS.ORDER_DETAIL(id));
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateOrder: async (id, updates) => {
    try {
      const response = await api.patch(ENDPOINTS.ORDER_DETAIL(id), updates);
      console.log(response);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  deleteOrder: async (id) => {
    try {
      const response = await api.delete(ENDPOINTS.ORDER_DETAIL(id));
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  generateKOT: async (orderId) => {
    try {
      const response = await api.post(ENDPOINTS.KOT, { order_id: orderId });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  generateBill: async (orderId) => {
    try {
      const response = await api.post(ENDPOINTS.BILL, { order_id: orderId });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getTables: async () => {
    try {
      const response = await api.get(ENDPOINTS.TABLES);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getCounters: async () => {
    try {
      const response = await api.get(ENDPOINTS.COUNTERS);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getPlatforms: async () => {
    try {
      const response = await api.get(ENDPOINTS.PLATFORMS);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  //    getDeliveryOrders: async () => {
  //   try {
  //     const response = await api.get('/accounts/delivery/orders/');
  //     return response.data;
  //   } catch (error) {
  //     throw error.response?.data || error.message;
  //   }
  // },

  getDeliveryOrders: async () => {
    try {
      const testToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzUzODAxMDc5LCJpYXQiOjE3NTM3OTgzNzksImp0aSI6ImIzOTcyN2VlZmVmNzRiNzFiMGJmNzk3ODc5MTgxZmIzIiwidXNlcl9pZCI6Mn0.A9tSlpz-Xf76q3ieZ0UviXOXAXnTpiCRsaY9IuuxNT4"; // 👈 Replace with actual token

      const response = await api.get("/accounts/delivery/orders/", {
        headers: {
          Authorization: `Bearer ${testToken}`, // Manually attach token
        },
      });

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  verifyQRCode: async (qrData) => {
    try {
      const response = await api.post("/orders/driver/qr/", {
        qr_data: qrData,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export const ReportAPI = {
  getSalesReport: async (params = {}) => {
    try {
      const response = await api.get(ENDPOINTS.SALES_REPORT, { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getItemReport: async (params = {}) => {
    try {
      const response = await api.get(ENDPOINTS.ITEM_REPORT, { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};
export default api;
