import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

// Handle 401 responses with automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Wait for refresh to complete
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post("/auth/refresh", {
          refresh_token: refreshToken,
        });
        const { access_token, refresh_token } = response.data;
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", refresh_token);
        api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        onRefreshed(access_token);
        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    company_name: string;
    company_tax_id: string;
  }) => api.post("/auth/register", data),
  refresh: (refreshToken: string) =>
    api.post("/auth/refresh", { refresh_token: refreshToken }),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post("/auth/change-password", data),
};

export const companyApi = {
  list: () => api.get("/companies"),
  get: (id: string) => api.get(`/companies/${id}`),
  create: (data: any) => api.post("/companies", data),
  updateMy: (data: any) => api.put("/companies/my", data),
};

export const contactApi = {
  list: (params?: { type?: string; search?: string }) =>
    api.get("/contacts", { params }),
  get: (id: string) => api.get(`/contacts/${id}`),
  create: (data: any) => api.post("/contacts", data),
  update: (id: string, data: any) => api.put(`/contacts/${id}`, data),
  delete: (id: string) => api.delete(`/contacts/${id}`),
  getTransactions: (id: string) => api.get(`/contacts/${id}/transactions`),
};

export const productApi = {
  list: (params?: { category?: string; search?: string }) =>
    api.get("/products", { params }),
  get: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post("/products", data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  getTransactions: (id: string) => api.get(`/products/${id}/transactions`),
};

export const projectApi = {
  list: (params?: { status?: string; search?: string }) =>
    api.get("/projects", { params }),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post("/projects", data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  financials: (id: string) => api.get(`/projects/${id}/financials`),
  financialsSummary: () => api.get("/projects/financials/summary"),
  getTransactions: (id: string) => api.get(`/projects/${id}/transactions`),
};

export const quotationApi = {
  list: (params?: { status?: string; contact_id?: string; project_id?: string; search?: string }) =>
    api.get("/quotations", { params }),
  get: (id: string) => api.get(`/quotations/${id}`),
  create: (data: any) => api.post("/quotations", data),
  update: (id: string, data: any) => api.put(`/quotations/${id}`, data),
  updateStatus: (id: string, status: string) => api.put(`/quotations/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/quotations/${id}`),
};

export const invoiceApi = {
  list: (params?: { status?: string; contact_id?: string; project_id?: string; is_overdue?: boolean; search?: string }) =>
    api.get("/invoices", { params }),
  get: (id: string) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post("/invoices", data),
  update: (id: string, data: any) => api.put(`/invoices/${id}`, data),
  updateStatus: (id: string, status: string) => api.put(`/invoices/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/invoices/${id}`),
  generateETax: (id: string) => api.post(`/invoices/${id}/e-tax/generate`),
  submitETax: (id: string) => api.post(`/invoices/${id}/e-tax/submit`),
  downloadETaxXml: (id: string) => api.get(`/invoices/${id}/e-tax/xml`, { responseType: "blob" }),
  getETaxHistory: (id: string) => api.get(`/invoices/${id}/e-tax/history`),
};

export const receiptApi = {
  list: (params?: { invoice_id?: string; project_id?: string; payment_method?: string; start_date?: string; end_date?: string }) =>
    api.get("/receipts", { params }),
  get: (id: string) => api.get(`/receipts/${id}`),
  create: (data: any) => api.post("/receipts", data),
  delete: (id: string) => api.delete(`/receipts/${id}`),
};

export const purchaseOrderApi = {
  list: (params?: { status?: string; contact_id?: string; project_id?: string; search?: string }) => api.get("/purchase-orders", { params }),
  get: (id: string) => api.get(`/purchase-orders/${id}`),
  create: (data: any) => api.post("/purchase-orders", data),
  update: (id: string, data: any) => api.put(`/purchase-orders/${id}`, data),
  updateStatus: (id: string, status: string) => api.put(`/purchase-orders/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/purchase-orders/${id}`),
  convert: (id: string) => api.post(`/purchase-orders/${id}/convert`),
};

export const purchaseInvoiceApi = {
  list: (params?: { status?: string; contact_id?: string; project_id?: string; is_overdue?: boolean; search?: string }) => api.get("/purchase-invoices", { params }),
  get: (id: string) => api.get(`/purchase-invoices/${id}`),
  create: (data: any) => api.post("/purchase-invoices", data),
  update: (id: string, data: any) => api.put(`/purchase-invoices/${id}`, data),
  updateStatus: (id: string, status: string) => api.put(`/purchase-invoices/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/purchase-invoices/${id}`),
};

export const expenseClaimApi = {
  list: (params?: { status?: string; category?: string; contact_id?: string; project_id?: string; search?: string }) => api.get("/expense-claims", { params }),
  get: (id: string) => api.get(`/expense-claims/${id}`),
  create: (data: any) => api.post("/expense-claims", data),
  update: (id: string, data: any) => api.put(`/expense-claims/${id}`, data),
  updateStatus: (id: string, status: string) => api.put(`/expense-claims/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/expense-claims/${id}`),
};

export const accountingApi = {
  listCOA: (params?: { account_type?: string; search?: string }) =>
    api.get("/accounting/chart-of-accounts", { params }),
  createCOA: (data: any) => api.post("/accounting/chart-of-accounts", data),
  updateCOA: (id: string, data: any) => api.put(`/accounting/chart-of-accounts/${id}`, data),
  listJournalEntries: (params?: { entry_type?: string; from_date?: string; to_date?: string; limit?: number; offset?: number }) =>
    api.get("/accounting/journal-entries", { params }),
  getJournalEntry: (id: string) => api.get(`/accounting/journal-entries/${id}`),
  createJournalEntry: (data: any) => api.post("/accounting/journal-entries", data),
  trialBalance: (params?: { as_of?: string }) =>
    api.get("/accounting/reports/trial-balance", { params }),
  incomeStatement: (params: { from_date: string; to_date: string }) =>
    api.get("/accounting/reports/income-statement", { params }),
  balanceSheet: (params?: { as_of?: string }) =>
    api.get("/accounting/reports/balance-sheet", { params }),
  arAging: (params?: { as_of?: string }) =>
    api.get("/accounting/reports/ar-aging", { params }),
  apAging: (params?: { as_of?: string }) =>
    api.get("/accounting/reports/ap-aging", { params }),
};

export const bankAccountApi = {
  list: (params?: { account_type?: string }) =>
    api.get("/bank-accounts", { params }),
  get: (id: string) => api.get(`/bank-accounts/${id}`),
  create: (data: any) => api.post("/bank-accounts", data),
  update: (id: string, data: any) => api.put(`/bank-accounts/${id}`, data),
  delete: (id: string) => api.delete(`/bank-accounts/${id}`),
  transactions: (id: string, params?: { is_reconciled?: string; from_date?: string; to_date?: string }) =>
    api.get(`/bank-accounts/${id}/transactions`, { params }),
  reconcile: (id: string, data: { line_ids: string[]; reconcile: boolean }) =>
    api.post(`/bank-accounts/${id}/reconcile`, data),
  importStatement: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/bank-accounts/${id}/statements/import`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  listStatementImports: (id: string) =>
    api.get(`/bank-accounts/${id}/statements`),
  getStatementLines: (id: string, importId: string, params?: { unmatched_only?: boolean }) =>
    api.get(`/bank-accounts/${id}/statements/${importId}/lines`, { params }),
  getMatchSuggestions: (id: string, importId: string) =>
    api.get(`/bank-accounts/${id}/statements/${importId}/suggestions`),
  matchStatementLine: (id: string, importId: string, data: { line_id: string; je_line_id?: string | null }) =>
    api.post(`/bank-accounts/${id}/statements/${importId}/match`, data),
  deleteStatementImport: (id: string, importId: string) =>
    api.delete(`/bank-accounts/${id}/statements/${importId}`),
};
