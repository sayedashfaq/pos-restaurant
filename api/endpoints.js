export const BASE_URL = 'https://nassrestoapiuat.up.railway.app';

export const ENDPOINTS = {

  LOGIN: '/accounts/login/',
  REFRESH_TOKEN: '/accounts/token/refresh/',
  LOGOUT: '/accounts/logout/',


  CUSTOMERS: '/accounts/customers/',
  CUSTOMER_DETAIL: (id) => `/accounts/customers/${id}/`,
  WAITERS: '/accounts/waiters/',
  WAITER_DETAIL: (id) => `/accounts/waiters/${id}/`,
  DELIVERY: '/accounts/delivery/',
  DELIVERY_DETAIL: (id) => `/accounts/delivery/${id}/`,

  USER_PROFILE: '/accounts/account/',

  MENUS: '/menus/',
  MENU_DETAIL: (id) => `/menus/${id}/`,
  CATEGORIES: '/menus/categories/',
  FILTERCATEGORY: '/menus?category=<category_name>',
  CATEGORY_DETAIL: (id) => `/menus/categories/${id}/`,


  TABLES: '/floors/tables/',
  TABLE_DETAIL: (id) => `/floors/tables/${id}/`,
  COUNTERS: '/core/settings/pickups/',
  COUNTER_DETAIL: (id) => `/core/settings/pickups/${id}/`,


  ORDERS: '/orders/',
  ORDER_DETAIL: (id) => `/orders/${id}/`,
  KOT: `/orders/bill/`,
  PRINT_BILL: '/orders/bill/',
  PLATFORMS: '/core/settings/platforms/',
  PLATFORM_DETAIL: (id) => `/orders/settings/platforms/${id}/`,




};