import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Use context token (Super Admin switched into a laundry) if present
    const contextToken = localStorage.getItem('contextToken');
    const token = contextToken || localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint = original?.url?.includes('/auth/login') ||
      original?.url?.includes('/auth/register') ||
      original?.url?.includes('/auth/refresh') ||
      original?.url?.includes('/platform/setup');

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const userId = localStorage.getItem('userId');
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken }, {
          headers: { 'x-user-id': userId },
        });
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return apiClient(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const unwrap = (response: AxiosResponse<{ success: boolean; data: any }>): any =>
  response.data.data;

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }).then((r) => r.data),
  register: (data: any) => apiClient.post('/auth/register', data).then((r) => r.data),
  logout: () => apiClient.post('/auth/logout').then((r) => r.data),
  getProfile: () => apiClient.get('/auth/profile').then(unwrap),
};

// Orders
export const ordersApi = {
  getDashboard: () => apiClient.get('/orders/dashboard').then(unwrap),
  list: (params?: any) => apiClient.get('/orders', { params }).then(unwrap),
  get: (id: string) => apiClient.get(`/orders/${id}`).then(unwrap),
  create: (data: any) => apiClient.post('/orders', data).then(unwrap),
  updateStatus: (id: string, data: any) =>
    apiClient.patch(`/orders/${id}/status`, data).then(unwrap),
  getHistory: (id: string) => apiClient.get(`/orders/${id}/history`).then(unwrap),
};

// Customers
export const customersApi = {
  list: (params?: any) => apiClient.get('/customers', { params }).then(unwrap),
  get: (id: string) => apiClient.get(`/customers/${id}`).then(unwrap),
  create: (data: any) => apiClient.post('/customers', data).then(unwrap),
  update: (id: string, data: any) => apiClient.patch(`/customers/${id}`, data).then(unwrap),
  getStats: (id: string) => apiClient.get(`/customers/${id}/stats`).then(unwrap),
};

// CA
export const caApi = {
  getDashboard: () => apiClient.get('/ca/dashboard').then(unwrap),
  listClients: (params?: any) => apiClient.get('/ca/clients', { params }).then(unwrap),
  getClient: (id: string) => apiClient.get(`/ca/clients/${id}`).then(unwrap),
  createClient: (data: any) => apiClient.post('/ca/clients', data).then(unwrap),
  createItr: (clientId: string, data: any) =>
    apiClient.post(`/ca/clients/${clientId}/itr`, data).then(unwrap),
  getItr: (itrId: string) => apiClient.get(`/ca/itr/${itrId}`).then(unwrap),
  updateItrStatus: (itrId: string, data: any) =>
    apiClient.patch(`/ca/itr/${itrId}/status`, data).then(unwrap),
  addDocument: (itrId: string, data: any) =>
    apiClient.post(`/ca/itr/${itrId}/documents`, data).then(unwrap),
  getDocuments: (clientId: string, ay?: string) =>
    apiClient.get(`/ca/clients/${clientId}/documents`, { params: { assessmentYear: ay } }).then(unwrap),
  checkReadiness: (itrId: string) =>
    apiClient.get(`/ca/itr/${itrId}/readiness`).then(unwrap),
};

// Services
export const servicesApi = {
  list: (params?: any) => apiClient.get('/services', { params }).then(unwrap),
  get: (id: string) => apiClient.get(`/services/${id}`).then(unwrap),
  create: (data: any) => apiClient.post('/services', data).then(unwrap),
  update: (id: string, data: any) => apiClient.patch(`/services/${id}`, data).then(unwrap),
  remove: (id: string) => apiClient.delete(`/services/${id}`).then(unwrap),
  getCategories: () => apiClient.get('/services/categories').then(unwrap),
  getPriceLists: (id: string) => apiClient.get(`/services/${id}/price-lists`).then(unwrap),
  setPriceList: (id: string, data: any) => apiClient.post(`/services/${id}/price-lists`, data).then(unwrap),
};

// Billing
export const billingApi = {
  getStats: () => apiClient.get('/billing/stats').then(unwrap),
  listInvoices: (params?: any) => apiClient.get('/billing/invoices', { params }).then(unwrap),
  getInvoice: (id: string) => apiClient.get(`/billing/invoices/${id}`).then(unwrap),
  createFromOrder: (orderId: string) => apiClient.post(`/billing/invoices/from-order/${orderId}`).then(unwrap),
  listPayments: (params?: any) => apiClient.get('/billing/payments', { params }).then(unwrap),
  recordPayment: (data: any) => apiClient.post('/billing/payments', data).then(unwrap),
};

// Inventory
export const inventoryApi = {
  getStats: () => apiClient.get('/inventory/stats').then(unwrap),
  getLowStock: () => apiClient.get('/inventory/low-stock').then(unwrap),
  listVendors: () => apiClient.get('/inventory/vendors').then(unwrap),
  createVendor: (data: any) => apiClient.post('/inventory/vendors', data).then(unwrap),
  updateVendor: (id: string, data: any) => apiClient.patch(`/inventory/vendors/${id}`, data).then(unwrap),
  listItems: (params?: any) => apiClient.get('/inventory/items', { params }).then(unwrap),
  getItem: (id: string) => apiClient.get(`/inventory/items/${id}`).then(unwrap),
  createItem: (data: any) => apiClient.post('/inventory/items', data).then(unwrap),
  updateItem: (id: string, data: any) => apiClient.patch(`/inventory/items/${id}`, data).then(unwrap),
  adjustStock: (id: string, data: any) => apiClient.post(`/inventory/items/${id}/adjust`, data).then(unwrap),
};

// Expenses
export const expensesApi = {
  getStats: () => apiClient.get('/expenses/stats').then(unwrap),
  list: (params?: any) => apiClient.get('/expenses', { params }).then(unwrap),
  get: (id: string) => apiClient.get(`/expenses/${id}`).then(unwrap),
  create: (data: any) => apiClient.post('/expenses', data).then(unwrap),
  update: (id: string, data: any) => apiClient.patch(`/expenses/${id}`, data).then(unwrap),
  approve: (id: string) => apiClient.patch(`/expenses/${id}/approve`).then(unwrap),
  reject: (id: string) => apiClient.patch(`/expenses/${id}/reject`).then(unwrap),
};

// Employees
export const employeesApi = {
  getStats: () => apiClient.get('/employees/stats').then(unwrap),
  list: (params?: any) => apiClient.get('/employees', { params }).then(unwrap),
  get: (id: string) => apiClient.get(`/employees/${id}`).then(unwrap),
  create: (data: any) => apiClient.post('/employees', data).then(unwrap),
  update: (id: string, data: any) => apiClient.patch(`/employees/${id}`, data).then(unwrap),
  deactivate: (id: string) => apiClient.patch(`/employees/${id}/deactivate`).then(unwrap),
};

// Reports
export const reportsApi = {
  getSales: (params?: any) => apiClient.get('/reports/sales', { params }).then(unwrap),
  getFinancial: (params?: any) => apiClient.get('/reports/financial', { params }).then(unwrap),
  getCustomers: () => apiClient.get('/reports/customers').then(unwrap),
};

// Garments
export const garmentsApi = {
  getStats: () => apiClient.get('/garments/stats').then(unwrap),
  list: (params?: any) => apiClient.get('/garments', { params }).then(unwrap),
  byOrder: (orderId: string) => apiClient.get(`/garments/by-order/${orderId}`).then(unwrap),
  byTag: (tagId: string) => apiClient.get(`/garments/tag/${tagId}`).then(unwrap),
  create: (data: any) => apiClient.post('/garments', data).then(unwrap),
  updateStatus: (id: string, status: string) => apiClient.patch(`/garments/${id}/status`, { status }).then(unwrap),
  recordQuality: (id: string, data: any) => apiClient.post(`/garments/${id}/quality`, data).then(unwrap),
  listBatches: () => apiClient.get('/garments/batches').then(unwrap),
  createBatch: (data: any) => apiClient.post('/garments/batches', data).then(unwrap),
};

// Branches
export const branchesApi = {
  list: () => apiClient.get('/branches').then(unwrap),
  get: (id: string) => apiClient.get(`/branches/${id}`).then(unwrap),
  create: (data: any) => apiClient.post('/branches', data).then(unwrap),
  update: (id: string, data: any) => apiClient.patch(`/branches/${id}`, data).then(unwrap),
  deactivate: (id: string) => apiClient.patch(`/branches/${id}/deactivate`).then(unwrap),
};

// Loyalty
export const loyaltyApi = {
  getStats: () => apiClient.get('/loyalty/stats').then(unwrap),
  getAccount: (customerId: string) => apiClient.get(`/loyalty/account/${customerId}`).then(unwrap),
  earnPoints: (data: any) => apiClient.post('/loyalty/earn', data).then(unwrap),
  redeemPoints: (data: any) => apiClient.post('/loyalty/redeem', data).then(unwrap),
  listPlans: () => apiClient.get('/loyalty/plans').then(unwrap),
  createPlan: (data: any) => apiClient.post('/loyalty/plans', data).then(unwrap),
  updatePlan: (id: string, data: any) => apiClient.patch(`/loyalty/plans/${id}`, data).then(unwrap),
  subscribe: (data: any) => apiClient.post('/loyalty/subscribe', data).then(unwrap),
  listSubscriptions: () => apiClient.get('/loyalty/subscriptions').then(unwrap),
};

// Coupons
export const couponsApi = {
  getStats: () => apiClient.get('/coupons/stats').then(unwrap),
  validate: (data: any) => apiClient.post('/coupons/validate', data).then(unwrap),
  apply: (data: any) => apiClient.post('/coupons/apply', data).then(unwrap),
  list: () => apiClient.get('/coupons').then(unwrap),
  create: (data: any) => apiClient.post('/coupons', data).then(unwrap),
  update: (id: string, data: any) => apiClient.patch(`/coupons/${id}`, data).then(unwrap),
  deactivate: (id: string) => apiClient.patch(`/coupons/${id}/deactivate`).then(unwrap),
};

// Notifications
export const notificationsApi = {
  listTemplates: () => apiClient.get('/notifications/templates').then(unwrap),
  createTemplate: (data: any) => apiClient.post('/notifications/templates', data).then(unwrap),
  updateTemplate: (id: string, data: any) => apiClient.patch(`/notifications/templates/${id}`, data).then(unwrap),
  seedDefaults: () => apiClient.post('/notifications/templates/seed').then(unwrap),
  send: (data: any) => apiClient.post('/notifications/send', data).then(unwrap),
  listLogs: (params?: any) => apiClient.get('/notifications/logs', { params }).then(unwrap),
  getStats: () => apiClient.get('/notifications/stats').then(unwrap),
};

// Attendance
export const attendanceApi = {
  getStats: () => apiClient.get('/attendance/stats').then(unwrap),
  list: (params?: any) => apiClient.get('/attendance', { params }).then(unwrap),
  mark: (data: any) => apiClient.post('/attendance/mark', data).then(unwrap),
  checkIn: (data: any) => apiClient.post('/attendance/check-in', data).then(unwrap),
  checkOut: (data: any) => apiClient.post('/attendance/check-out', data).then(unwrap),
  listShifts: () => apiClient.get('/attendance/shifts').then(unwrap),
  createShift: (data: any) => apiClient.post('/attendance/shifts', data).then(unwrap),
  listLeaves: (params?: any) => apiClient.get('/attendance/leaves', { params }).then(unwrap),
  createLeave: (data: any) => apiClient.post('/attendance/leaves', data).then(unwrap),
  approveLeave: (id: string) => apiClient.patch(`/attendance/leaves/${id}/approve`).then(unwrap),
};

// Delivery
export const deliveryApi = {
  getStats: () => apiClient.get('/delivery/stats').then(unwrap),
  getRiderQueue: () => apiClient.get('/delivery/queue').then(unwrap),
  getPickupQueue: () => apiClient.get('/delivery/pickup-queue').then(unwrap),
  markDelivered: (id: string) => apiClient.patch(`/delivery/${id}/delivered`).then(unwrap),
  markPickupDone: (id: string) => apiClient.patch(`/delivery/${id}/pickup-done`).then(unwrap),
};

// Platform (Super Admin only)
export const platformApi = {
  getStats: () => apiClient.get('/platform/stats').then(unwrap),
  listOrganizations: (params?: any) => apiClient.get('/platform/organizations', { params }).then(unwrap),
  getOrganization: (id: string) => apiClient.get(`/platform/organizations/${id}`).then(unwrap),
  registerLaundry: (data: any) => apiClient.post('/platform/organizations', data).then(unwrap),
  editOrganization: (id: string, data: any) => apiClient.patch(`/platform/organizations/${id}`, data).then(unwrap),
  updateStatus: (id: string, data: any) => apiClient.patch(`/platform/organizations/${id}/status`, data).then(unwrap),
  updateConfig: (id: string, data: any) => apiClient.patch(`/platform/organizations/${id}/config`, data).then(unwrap),
  resetPassword: (id: string, newPassword: string) => apiClient.post(`/platform/organizations/${id}/reset-password`, { newPassword }).then(unwrap),
  deleteOrganization: (id: string, force = false) => apiClient.delete(`/platform/organizations/${id}`, { params: { force } }).then(unwrap),
  switchContext: (id: string) => apiClient.post(`/platform/organizations/${id}/switch`).then(unwrap),
  getMonthlyRegistrations: () => apiClient.get('/platform/analytics/registrations').then(unwrap),
  getRevenueByOrg: () => apiClient.get('/platform/analytics/revenue').then(unwrap),
  getStatusDistribution: () => apiClient.get('/platform/analytics/status-distribution').then(unwrap),
  exitContext: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('contextToken');
      localStorage.removeItem('contextOrgName');
    }
  },
};

export default apiClient;
