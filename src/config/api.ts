import { remoteConfig, RemoteConfigKeys } from '../services/remoteConfigService';

export const API_CONFIG = {
  getEnvironment: () => {
    return localStorage.getItem('farmvest_env_mode') || 'live';
  },
  getFarmVestBaseUrl: () => {
    const mode = API_CONFIG.getEnvironment();

    // Remote values
    const liveUrl = remoteConfig.getValue(RemoteConfigKeys.LIVE_API_URL) || 'https://farmvest-live-apis-jn6cma3vvq-el.a.run.app';
    const stagingUrl = remoteConfig.getValue(RemoteConfigKeys.STAGING_API_URL) || 'https://farmvest-stagging-services-612299373064.asia-south1.run.app';

    let baseUrl = mode === 'dev' ? stagingUrl : liveUrl;

    // Ensure baseUrl doesn't end with /api or / to avoid double /api in endpoints
    baseUrl = baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

    // Only use CORS proxy in local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const corsUrl = 'https://cors-612299373064.asia-south1.run.app';
      return `${corsUrl}/${baseUrl}`;
    } else {
      return baseUrl;
    }
  },
  getBaseUrl: () => {
    const mode = API_CONFIG.getEnvironment();

    // Remote values for AnimalKart
    const liveUrl = remoteConfig.getValue(RemoteConfigKeys.ANIMALKART_LIVE_URL) || 'https://animalkart-stagging-jn6cma3vvq-el.a.run.app';
    const stagingUrl = remoteConfig.getValue(RemoteConfigKeys.ANIMALKART_STAGING_URL) || 'https://animalkart-stagging-jn6cma3vvq-el.a.run.app';

    const baseUrl = mode === 'dev' ? stagingUrl : liveUrl;

    // Only use CORS proxy in local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const corsUrl = 'https://cors-612299373064.asia-south1.run.app';
      return `${corsUrl}/${baseUrl}`;
    } else {
      return baseUrl;
    }
  }
};

export const API_ENDPOINTS = {
  // AnimalKart Endpoints
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
  markInTransit: () => `${API_CONFIG.getBaseUrl()}/order-tracking/intransit`,
  getInTransitOrders: () => `${API_CONFIG.getBaseUrl()}/order-tracking/intransit`,

  // FarmVest Endpoints
  // Auth
  staticLogin: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/auth/static_login`,
  loginWithOtp: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/auth/token`,
  sendWhatsappOtp: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/auth/send-whatsapp-otp`,

  // Users
  getFarmVestUserData: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/users/get_user_data`, // Query params handled by caller
  updateFarmVestUserDetails: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/users/update_user_details/`,
  activateDeactivateUser: (mobile: string) => `${API_CONFIG.getFarmVestBaseUrl()}/api/users/activate_deactivate_user/${mobile}`,

  // Animals
  onboardAnimal: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/animal/onboard_animal`,
  allocateAnimal: (shedId: string | number) => `${API_CONFIG.getFarmVestBaseUrl()}/api/animal/shed_allocation/${shedId}`,
  getUnallocatedAnimals: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/animal/unallocated_animals`,
  searchAnimal: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/animal/search_animal`,
  getTotalAnimals: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/animal/get_total_animals`,
  getAnimalByPosition: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/animal/get-position`,
  getCalves: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/animal/get_calves`,

  // Employees
  createEmployee: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/employee/create_employee`,
  getAllEmployees: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/employee/get_all_employees`,
  getEmployeeDetailsById: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/employee/get_employee_details_by_id`,
  searchEmployee: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/employee/search_employee`,
  updateEmployee: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/employee/update_employee`,

  // Farms
  createFarm: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/farm/farm`,
  getAllFarms: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/farm/get_all_farms`,
  getFarmDetails: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/farm/farm/details`,
  getFarmStaff: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/farm/staff`,
  getInvestorFarms: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/farm/investor/farms`,
  getFarmLocations: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/farm/locations`,

  // Investors
  getInvestorSummary: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/investors/summary`,
  getInvestorAnimals: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/investors/animals`,
  getAllInvestors: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/investors/get_all_investors`,

  // Leave Requests
  createLeaveRequest: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/leave_requests/create_leave_request`,
  getLeaveRequests: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/leave_requests/leave-requests`,
  updateLeaveStatus: (leaveId: number | string) => `${API_CONFIG.getFarmVestBaseUrl()}/api/leave_requests/update_leave_status/${leaveId}`,
  cancelLeaveRequest: (leaveId: number | string) => `${API_CONFIG.getFarmVestBaseUrl()}/api/leave_requests/leave-requests/${leaveId}`,

  // Milk
  createMilkEntry: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/milk/create_milk_entry`,
  getAllMilkEntries: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/milk/milk_entries`,
  getMilkReport: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/milk/get_milk_report`,

  // Sheds
  createShed: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/shed/create_shed`,
  listSheds: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/shed/list`,
  getAvailablePositionsInShed: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/shed/available_positions`,

  // Tickets
  createTicket: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/ticket/`,
  getHealthTickets: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/ticket/get_health_tickets`,

  // Visits
  bookVisitSlot: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/visits/book_visit_slot`,
  getAvailableVisitSlots: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/visits/available_visit_slots`,
  getMyVisits: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/visits/my-visits`,
  scanVisitQr: (visitId: string) => `${API_CONFIG.getFarmVestBaseUrl()}/api/visits/visits/${visitId}`,

  // Doctor
  getMyAssistants: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/doctor/get_my_assistants`,
  assignTickets: () => `${API_CONFIG.getFarmVestBaseUrl()}/api/doctor/assign_tickets`,
};
