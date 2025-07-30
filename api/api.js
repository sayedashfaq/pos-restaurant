import axios from 'axios';
import { BASE_URL, ENDPOINTS } from './endpoints';


const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
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
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token available');
        
        const response = await axios.post(
          `${BASE_URL}${ENDPOINTS.REFRESH_TOKEN}`,
          { refresh: refreshToken }
        );
        
        localStorage.setItem('access_token', response.data.access);
        api.defaults.headers.common.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
       
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);


const handleApiError = (error) => {
  const errorData = error.response?.data || { message: error.message };
  console.error('API Error:', errorData);
  throw errorData;
};


export const AuthAPI = {
  login: async (email, password) => {
    try {
      const response = await api.post(ENDPOINTS.LOGIN, { email, password });
      
    
      if (response.data.access) {
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  logout: async () => {
    try {
      await api.post(ENDPOINTS.LOGOUT);
      
     
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      delete api.defaults.headers.common['Authorization'];
      
      return true;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post(ENDPOINTS.REFRESH_TOKEN, { refresh: refreshToken });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

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
      const response = await api.patch(ENDPOINTS.CUSTOMER_DETAIL(id), customerData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getStaff: async (role) => {
    try {
      const endpoint = role === 'waiter' ? ENDPOINTS.WAITERS : ENDPOINTS.DELIVERY;
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
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
  }
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
  }
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
  }
};
 export default api;