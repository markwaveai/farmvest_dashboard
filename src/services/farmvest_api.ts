import axios from 'axios';
import { API_ENDPOINTS, API_CONFIG } from '../config/api';

export const FARMVEST_API_CONFIG = {
    getBaseUrl: () => {
        return API_CONFIG.getFarmVestBaseUrl();
    },
    getApiKey: () => process.env.REACT_APP_FARMVEST_API_KEY || 'bWFya3dhdmUtZmFybXZlc3QtdGVzdHRpbmctYXBpa2V5'
};

const farmvestApi = axios.create({
    baseURL: FARMVEST_API_CONFIG.getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }
});

// Add request interceptor to handle dynamic Authorization
farmvestApi.interceptors.request.use((config) => {
    // Check for session token
    const savedSession = localStorage.getItem('ak_dashboard_session');
    let token = null;
    let tokenType = 'Bearer';

    if (savedSession) {
        try {
            const session = JSON.parse(savedSession);
            // Check if we have farmvest specific token data
            if (session.access_token) {
                token = session.access_token;
                tokenType = session.token_type || 'Bearer';
            }
        } catch (e) {
        }
    }

    // If we have a token, use it. Otherwise fall back to the API Key.
    if (token) {
        config.headers['Authorization'] = `${tokenType} ${token}`;
    } else {
        // Fallback to the API Key, sending it raw without Bearer prefix as expected by backend
        const apiKey = FARMVEST_API_CONFIG.getApiKey();
        config.headers['Authorization'] = apiKey;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

export const farmvestService = {
    staticLogin: async (mobile_number: string, otp: string) => {
        try {
            // This call will usage the API Key via the interceptor (since no token exists yet)
            const response = await farmvestApi.post(API_ENDPOINTS.staticLogin(), {
                mobile_number,
                otp
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getEmployees: async (params?: { role?: string; active_status?: number; sort_by?: number; page?: number; size?: number; farm_id?: number; search?: string }) => {
        try {
            const { role, active_status, sort_by = 1, page = 1, size = 20, farm_id } = params || {};
            let query = `?sort_by=${sort_by}&page=${page}&size=${size}`;
            if (role) query += `&role=${role}`;
            if (active_status !== undefined && active_status !== null && active_status.toString() !== '') query += `&is_active=${active_status}`;
            if (farm_id) query += `&farm_id=${farm_id}`;
            // Add search param if provided (assuming API supports 'search' or 'q')
            // Based on other methods, typically 'search' or 'query'. Let's try 'search'.
            if (params?.search) query += `&search=${encodeURIComponent(params.search)}`;

            const url = `${API_ENDPOINTS.getAllEmployees()}${query}`;
            const response = await farmvestApi.get(url);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getAllInvestors: async (params?: { page?: number; size?: number; active_status?: number }) => {
        try {
            const { page = 1, size = 5000, active_status } = params || {};
            // Build URL using the config endpoint + query params
            const baseUrl = API_ENDPOINTS.getAllInvestors();
            let url = `${baseUrl}?page=${page}&size=${size}`;

            if (active_status !== undefined) {
                url += `&active_status=${active_status}`;
            }

            const response = await farmvestApi.get(url);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getFarms: async (location: string) => {
        try {
            const response = await farmvestApi.get(`${API_ENDPOINTS.getAllFarms()}?location=${location}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getLocations: async () => {
        try {
            const response = await farmvestApi.get(API_ENDPOINTS.getFarmLocations());
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    createLocation: async (locationData: { name: string; prefix: string }) => {
        try {
            const response = await farmvestApi.post(API_ENDPOINTS.createLocation(), locationData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getAllFarms: async (params?: { location?: string, location_name?: string, sort_by?: number, page?: number, size?: number, search?: string }) => {
        try {
            let url = API_ENDPOINTS.getAllFarms();
            if (params) {
                const query = new URLSearchParams();
                if (params.location) query.append('location', params.location);
                if (params.location_name) query.append('location_name', params.location_name);
                if (params.sort_by) query.append('sort_by', params.sort_by.toString());
                if (params.page) query.append('page', params.page.toString());
                if (params.size) query.append('size', params.size.toString());
                if (params.search) query.append('search', params.search);
                url += `?${query.toString()}`;
            }
            const response = await farmvestApi.get(url);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    searchEmployee: async (query: string) => {
        try {
            const response = await farmvestApi.get(`${API_ENDPOINTS.searchEmployee()}?search_query=${query}`);
            return response.data;
        } catch (error) {
            // Return empty list or null instead of throwing to avoid breaking UI flow if just searching name
            return [];
        }
    },
    getAdminsList: async (adminMobileOverride?: string) => {
        // Get admin mobile from session for header fallback
        const sessionStr = localStorage.getItem('ak_dashboard_session');
        let sessionAdminMobile = '';
        if (sessionStr) {
            try {
                const session = JSON.parse(sessionStr);
                sessionAdminMobile = session.mobile || '';
            } catch (e) { }
        }

        const adminMobile = adminMobileOverride || sessionAdminMobile;

        // Use plain axios but explicitly add X-Admin-Mobile and X-Requested-With
        const response = await axios.get(API_ENDPOINTS.getAdminsList(), {
            headers: {
                'X-Admin-Mobile': adminMobile,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        return response.data;
    },
    updateOrderStatus: async (payload: {
        orderId: string;
        status: string;
        buffaloId: string;
        buffaloIds: string[];
        description: string;
        location: string;
    }, adminMobileOverride?: string) => {
        // Get admin mobile from session for header fallback
        const sessionStr = localStorage.getItem('ak_dashboard_session');
        let sessionAdminMobile = '';
        if (sessionStr) {
            try {
                const session = JSON.parse(sessionStr);
                sessionAdminMobile = session.mobile || '';
            } catch (e) { }
        }

        const adminMobile = adminMobileOverride || sessionAdminMobile;

        console.log("Updating order status. FINAL PAYLOAD:", JSON.stringify(payload, null, 2));
        console.log("Using X-Admin-Mobile header:", adminMobile);

        // Explicitly include X-Admin-Mobile and X-Requested-With
        const response = await axios.post(API_ENDPOINTS.updateOrderStatus(), payload, {
            headers: {
                'X-Admin-Mobile': adminMobile,
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    },
    createEmployee: async (employeeData: any) => {
        try {
            const response = await farmvestApi.post(API_ENDPOINTS.createEmployee(), employeeData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getEmployeeDetailsById: async (id: string) => {
        try {
            // Updated parameter name to 'user_id' as per Swagger documentation
            const response = await farmvestApi.get(`${API_ENDPOINTS.getEmployeeDetailsById()}?user_id=${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    deleteEmployee: async (id: number) => {
        try {
            const response = await farmvestApi.delete(API_ENDPOINTS.deleteEmployee(id));
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getAvailableSheds: async (farm_id: number) => {
        try {
            const response = await farmvestApi.get(`${API_ENDPOINTS.listSheds()}?farm_id=${farm_id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getShedsByFarm: async (farmId: number) => {
        try {
            const url = `${API_ENDPOINTS.listSheds()}?farm_id=${farmId}`;
            const response = await farmvestApi.get(url);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getShedList: async (farmId: number) => {
        try {
            const response = await farmvestApi.get(`${API_ENDPOINTS.listSheds()}?farm_id=${farmId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getShedPositions: async (shedId: number) => {
        try {
            const response = await farmvestApi.get(`${API_ENDPOINTS.getAvailablePositionsInShed()}?shed_id=${shedId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getAnimalPositions: async (shedId: number) => {
        try {
            const response = await farmvestApi.get(`${API_ENDPOINTS.getAnimalByPosition()}?shed_id=${shedId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getAnimalPositionDetails: async (params: { parkingId: string; farmId?: number; shedId?: number; rowNumber?: string }) => {
        try {
            const { parkingId, farmId, shedId, rowNumber } = params;
            let url = `${API_ENDPOINTS.getAnimalByPosition()}?parking_id=${parkingId}`;
            if (farmId) url += `&farm_id=${farmId}`;
            if (shedId) url += `&shed_id=${shedId}`;
            if (rowNumber) url += `&row_number=${rowNumber}`;

            const response = await farmvestApi.get(url);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getTotalAnimals: async (farmId?: number, shedId?: number, page: number = 1, size: number = 15) => {
        try {
            let url = API_ENDPOINTS.getTotalAnimals();
            const params = new URLSearchParams();
            if (farmId) params.append('farm_id', farmId.toString());
            if (shedId) params.append('shed_id', shedId.toString());
            params.append('page', page.toString());
            params.append('size', size.toString());

            if (params.toString()) url += `?${params.toString()}`;

            const response = await farmvestApi.get(url);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getShedAllocation: async (shedId: string) => {
        try {
            const response = await farmvestApi.get(API_ENDPOINTS.allocateAnimal(shedId));
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getUnallocatedAnimals: async (farmId: number) => {
        try {
            const response = await farmvestApi.get(`${API_ENDPOINTS.getUnallocatedAnimals()}?farm_id=${farmId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    // Create Farm
    createFarm: (farmData: { farm_name?: string; location_name: string; shed_count: number; is_test: boolean }) => {
        return farmvestApi.post(API_ENDPOINTS.createFarm(), farmData);
    },
    updateFarm: async (farmId: number, farmData: { farm_name?: string; location_name?: string; shed_count?: number; is_test?: boolean }) => {
        try {
            const response = await farmvestApi.put(API_ENDPOINTS.updateFarm(farmId), farmData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    deleteFarm: async (farmId: number) => {
        try {
            const response = await farmvestApi.delete(API_ENDPOINTS.deleteFarm(farmId));
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    createShed: async (shedData: { farm_id: number; shed_id: string; shed_name: string; capacity: number; cctv_url?: string }) => {
        try {
            const response = await farmvestApi.post(API_ENDPOINTS.createShed(), shedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    deactivateUser: async (mobile: string) => {
        try {
            const response = await farmvestApi.put(`${API_ENDPOINTS.activateDeactivateUser(mobile)}?is_active=false`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    activateUser: async (mobile: string) => {
        try {
            const response = await farmvestApi.put(`${API_ENDPOINTS.activateDeactivateUser(mobile)}?is_active=true`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getPaidOrders: async (mobile: string) => {
        try {

            // Get admin mobile from session
            const sessionStr = localStorage.getItem('ak_dashboard_session');
            let adminMobile = '';
            if (sessionStr) {
                try {
                    const session = JSON.parse(sessionStr);
                    adminMobile = session.mobile;
                } catch (e) {
                }
            }

            const url = API_ENDPOINTS.getInTransitOrders();
            const payload: any = {
                filter_status: "intransit"
            };

            if (mobile && mobile.trim() !== "") {
                payload.mobile = mobile;
            }

            const response = await farmvestApi.post(url, payload, {
                headers: {
                    'X-Admin-Mobile': adminMobile,
                    'filter-status': 'intransit'
                }
            });

            if (response.status === 200 || response.status === 201) {
                return response.data; // Return the full { user, orders, status, statuscode }
            }
            return { user: null, orders: [] };
        } catch (error: any) {
            return { user: null, orders: [] };
        }
    },
    onboardAnimal: async (onboardingData: any) => {
        try {

            let url = API_ENDPOINTS.onboardAnimal();
            if (onboardingData.farm_id !== undefined && onboardingData.farm_id !== null) {
                url += `?farm_id=${onboardingData.farm_id}`;
            }

            const response = await farmvestApi.post(url, onboardingData, {
                headers: { 'Content-Type': 'application/json' }
            });
            return response.data;
        } catch (error: any) {
            if (error.response) {
            }
            throw error;
        }
    },
    allocateAnimal: async (shedId: string, allocations: { animal_id: any; row_number: string; parking_id: string }[]) => {
        try {
            const url = API_ENDPOINTS.allocateAnimal(shedId);

            // The API expects a single allocation object at the root of the body:
            // { animal_id, row_number, parking_id }
            // If the UI sends multiple, we loop through them to ensure all are processed.
            const responses = [];
            for (const allocation of allocations) {
                const response = await farmvestApi.post(url, allocation);
                responses.push(response.data);
            }

            // Return the last response or a summary if needed
            return responses.length > 0 ? responses[responses.length - 1] : { status: "success", count: 0 };
        } catch (error: any) {
            if (error.response) {
                console.error("Allocation Error:", error.response.data);
            }
            throw error;
        }
    },
    searchAnimal: async (queryStr: string) => {
        try {
            const response = await farmvestApi.get(`${API_ENDPOINTS.searchAnimal()}?query_str=${queryStr}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    // ============ ANIMALS ============
    // Added getTotalAnimals for Tag Number generation
    getTotalAnimalCount: async () => {
        try {
            const response = await farmvestApi.get(API_ENDPOINTS.getTotalAnimals());
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getAnimalsByInvestor: async (investorId: number | string, params?: { page?: number; size?: number }) => {
        try {
            let url = `${API_ENDPOINTS.getInvestorAnimals()}?investor_id=${investorId}`;
            if (params?.page) url += `&page=${params.page}`;
            if (params?.size) url += `&size=${params.size}`;

            const response = await farmvestApi.get(url);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // getAnimalsByInvestor was duplicated here by mistake. Removing this block.
    getCalves: async (animalId: string) => {
        try {
            const response = await farmvestApi.get(`${API_ENDPOINTS.getCalves()}?animal_id=${animalId}`);
            return response.data;
        } catch (error: any) {
            return [];
        }
    },

    // AI Entry Integration
    submitAIEntry: async (payload: { ai_generate_date: string; device_id: string; is_ai_generated: boolean; semen_straw_type: string }) => {
        const response = await farmvestApi.post(API_ENDPOINTS.aiEntry(), payload);
        return response.data;
    },

    // ============ TICKETS ============

    createTicket: async (ticketType: string, payload: any) => {
        const response = await farmvestApi.post(`${API_ENDPOINTS.createTicket()}?ticket_type=${ticketType}`, payload);
        return response.data;
    },

    getTickets: async (params?: {
        ticket_type?: string;
        status_filter?: string;
        transfer_direction?: string;
        farm_id?: number;
        shed_id?: number;
        page?: number;
        size?: number;
    }) => {
        const query = new URLSearchParams();
        if (params?.ticket_type) query.append('ticket_type', params.ticket_type);
        if (params?.status_filter) query.append('status_filter', params.status_filter);
        if (params?.transfer_direction) query.append('transfer_direction', params.transfer_direction);
        if (params?.farm_id !== undefined && params?.farm_id !== null) {
            query.append('farm_id', params.farm_id.toString());
            query.append('farmId', params.farm_id.toString()); // Backup for potential camelCase expectation
        }
        if (params?.shed_id !== undefined && params?.shed_id !== null) {
            query.append('shed_id', params.shed_id.toString());
            query.append('shedId', params.shed_id.toString()); // Backup for potential camelCase expectation
        }
        query.append('page', (params?.page || 1).toString());
        query.append('size', (params?.size || 15).toString());
        const response = await farmvestApi.get(`${API_ENDPOINTS.getHealthTickets()}?${query.toString()}`);
        return response.data;
    },

    assignTicket: async (ticketId: number, assignments: { assistant_id?: number; doctor_id?: number }) => {
        const payload: any = { ticket_id: ticketId, ...assignments };
        const response = await farmvestApi.post(API_ENDPOINTS.assignTickets(), payload);
        return response.data;
    },

    getDoctorAssistants: async () => {
        const response = await farmvestApi.get(API_ENDPOINTS.getMyAssistants());
        return response.data;
    },

    updateTreatmentDetails: async (payload: { ticket_id: number; disease?: string[]; description?: string }) => {
        const response = await farmvestApi.post(API_ENDPOINTS.updateTreatmentDetails(), payload);
        return response.data;
    },

    // ============ MILK ============

    createMilkEntry: async (payload: any) => {
        const response = await farmvestApi.post(API_ENDPOINTS.createMilkEntry(), payload);
        return response.data;
    },

    getMilkEntries: async (params?: { page?: number; size?: number; farm_id?: number | string; shed_id?: number | string }) => {
        const query = new URLSearchParams();
        query.append('page', (params?.page || 1).toString());
        query.append('size', (params?.size || 15).toString());
        if (params?.farm_id) query.append('farm_id', params.farm_id.toString());
        if (params?.shed_id) query.append('shed_id', params.shed_id.toString());
        const response = await farmvestApi.get(`${API_ENDPOINTS.getAllMilkEntries()}?${query.toString()}`);
        return response.data;
    },

    getMilkReport: async (params: { report_date: string; timing?: string; page?: number; size?: number; farm_id?: number | string; shed_id?: number | string }) => {
        const query = new URLSearchParams();
        query.append('report_date', params.report_date);
        if (params.timing) query.append('timing', params.timing);
        query.append('page', (params.page || 1).toString());
        query.append('size', (params.size || 15).toString());
        if (params.farm_id) query.append('farm_id', params.farm_id.toString());
        if (params.shed_id) query.append('shed_id', params.shed_id.toString());
        const response = await farmvestApi.get(`${API_ENDPOINTS.getMilkReport()}?${query.toString()}`);
        return response.data;
    },

    // ============ LEAVE REQUESTS ============

    createLeaveRequest: async (payload: any) => {
        const response = await farmvestApi.post(API_ENDPOINTS.createLeaveRequest(), payload);
        return response.data;
    },

    getLeaveRequests: async (params?: { status_filter?: string; page?: number; size?: number }) => {
        const query = new URLSearchParams();
        if (params?.status_filter) query.append('status_filter', params.status_filter);
        query.append('page', (params?.page || 1).toString());
        query.append('size', (params?.size || 15).toString());
        const response = await farmvestApi.get(`${API_ENDPOINTS.getLeaveRequests()}?${query.toString()}`);
        return response.data;
    },

    updateLeaveStatus: async (leaveId: number, payload: { status: string; rejection_reason?: string }) => {
        const response = await farmvestApi.put(API_ENDPOINTS.updateLeaveStatus(leaveId), payload);
        return response.data;
    },

    cancelLeaveRequest: async (leaveId: number) => {
        const response = await farmvestApi.put(API_ENDPOINTS.cancelLeaveRequest(leaveId));
        return response.data;
    },

    // ============ FARM DETAILS ============

    getFarmDetails: async (farmId: number) => {
        const response = await farmvestApi.get(`${API_ENDPOINTS.getFarmDetails()}?farm_id=${farmId}`);
        return response.data;
    },

    getFarmStaff: async (farmId: number) => {
        const response = await farmvestApi.get(`${API_ENDPOINTS.getFarmStaff()}?farm_id=${farmId}`);
        return response.data;
    },

    // ============ EMPLOYEE UPDATE ============

    updateEmployee: async (payload: { user_id: number; role: string; farm_id: number; shed_id?: number }) => {
        const response = await farmvestApi.put(API_ENDPOINTS.updateEmployee(), payload);
        return response.data;
    },

    updateUserDetails: async (payload: { name?: string; email?: string; address?: string; profile?: string }) => {
        const response = await farmvestApi.put(API_ENDPOINTS.updateFarmVestUserDetails(), payload);
        return response.data;
    },

    // ============ ACCOUNT ACTIVATION/DEACTIVATION (OTP FLOW) ============

    requestReactivationOtp: async (mobile: string, channel: string = 'whatsapp') => {
        // Mock success as there is no backend endpoint for this in Farmvest.
        // This follows the same pattern as the Login flow in this dashboard.
        return { message: 'OTP sent successfully' };
    },

    confirmReactivation: async (mobile: string, otp: string) => {
        // Since OTP sending is mocked, we proceed directly to the activation call.
        return farmvestService.activateUser(mobile);
    },

    requestDeactivationOtp: async (mobile: string, channel: string = 'whatsapp') => {
        // Mock success
        return { message: 'OTP sent successfully' };
    },

    confirmDeactivation: async (mobile: string, otp: string) => {
        // Since OTP sending is mocked, we proceed directly to the deactivation call.
        return farmvestService.deactivateUser(mobile);
    }
};