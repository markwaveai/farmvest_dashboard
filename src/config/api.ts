export const API_CONFIG = {
  getBaseUrl: () => {
   const productionUrl = 'https://animalkart-stagging-services-jn6cma3vvq-el.a.run.app';

    // Only use CORS proxy in local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return productionUrl;
    } else {
      const corsUrl = 'https://cors-612299373064.asia-south1.run.app';
      return `${corsUrl}/${productionUrl}`;
    }
  }
};

export const API_ENDPOINTS = {
  getUsers: () => `${API_CONFIG.getBaseUrl()}/users/customers`,
  getReferrals: () => `${API_CONFIG.getBaseUrl()}/users/referrals`,
  createUser: () => `${API_CONFIG.getBaseUrl()}/users/referral-signup`,
  getUserDetails: (mobile: string) => `${API_CONFIG.getBaseUrl()}/users/${mobile}`,
  verifyUser: () => `${API_CONFIG.getBaseUrl()}/users/verify`,
  updateUser: (mobile: string) => `${API_CONFIG.getBaseUrl()}/users/${mobile}`,
  getProducts: () => `${API_CONFIG.getBaseUrl()}/products`,
  addProduct: () => `${API_CONFIG.getBaseUrl()}/products`,
  updateProduct: (id: string) => `${API_CONFIG.getBaseUrl()}/products/${id}`,
  deleteProduct: (id: string) => `${API_CONFIG.getBaseUrl()}/products/${id}`,
  health: () => `${API_CONFIG.getBaseUrl()}/health`,
  getPendingUnits: () => `${API_CONFIG.getBaseUrl()}/purchases/admin/units/pending`,
  approveUnit: () => `${API_CONFIG.getBaseUrl()}/purchases/admin/units/approve`,
  rejectUnit: () => `${API_CONFIG.getBaseUrl()}/purchases/admin/units/reject`,
  uploadProductImage: (id: string) => `${API_CONFIG.getBaseUrl()}/products/${id}/images`,
  getOrderStatus: () => `${API_CONFIG.getBaseUrl()}/order-tracking/stages`,
  updateOrderStatus: () => `${API_CONFIG.getBaseUrl()}/order-tracking/update-status`,
  deactivateRequestOtp: () => `${API_CONFIG.getBaseUrl()}/users/deactivate/request-otp`,
  deactivateConfirm: () => `${API_CONFIG.getBaseUrl()}/users/deactivate/confirm`,
  requestReactivationOtp: () => `${API_CONFIG.getBaseUrl()}/users/reactivate/request-otp`,
  confirmReactivation: () => `${API_CONFIG.getBaseUrl()}/users/reactivate/confirm`,
};
