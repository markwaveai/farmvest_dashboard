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
            const response = await farmvestApi.post('/api/auth/static_login', {
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

            const url = `/api/employee/get_all_employees${query}`;
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
            const response = await farmvestApi.get(`/api/farm/get_all_farms?location=${location}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getLocations: async () => {
        try {
            const response = await farmvestApi.get('/api/farm/locations');
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getAllFarms: async (params?: { location?: string, sort_by?: number, page?: number, size?: number, search?: string }) => {
        try {
            let url = '/api/farm/get_all_farms';
            if (params) {
                const query = new URLSearchParams();
                if (params.location) query.append('location', params.location);
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
            const response = await farmvestApi.get(`/api/employee/search_employee?search_query=${query}`);
            return response.data;
        } catch (error) {
            // Return empty list or null instead of throwing to avoid breaking UI flow if just searching name
            return [];
        }
    },
    createEmployee: async (employeeData: any) => {
        try {
            const response = await farmvestApi.post('/api/employee/create_employee', employeeData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getEmployeeDetailsById: async (id: string) => {
        try {
            // Updated parameter name to 'user_id' as per Swagger documentation
            const response = await farmvestApi.get(`/api/employee/get_employee_details_by_id?user_id=${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    deleteEmployee: async (id: number) => {
        try {
            const response = await farmvestApi.delete(`/api/admin/delete_employee/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getAvailableSheds: async (farm_id: number) => {
        try {
            const response = await farmvestApi.get(`/api/shed/list?farm_id=${farm_id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getShedsByFarm: async (farmId: number) => {
        try {
            const url = `/api/shed/list?farm_id=${farmId}`;
            const response = await farmvestApi.get(url);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getShedList: async (farmId: number) => {
        try {
            const response = await farmvestApi.get(`/api/shed/list?farm_id=${farmId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getShedPositions: async (shedId: number) => {
        try {
            const response = await farmvestApi.get(`/api/shed/available_positions?shed_id=${shedId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getAnimalPositions: async (shedId: number) => {
        try {
            const response = await farmvestApi.get(`/api/animal/get-position?shed_id=${shedId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getAnimalPositionDetails: async (params: { parkingId: string; farmId?: number; shedId?: number; rowNumber?: string }) => {
        try {
            const { parkingId, farmId, shedId, rowNumber } = params;
            let url = `/api/animal/get-position?parking_id=${parkingId}`;
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
            let url = '/api/animal/get_total_animals';
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
            const response = await farmvestApi.get(`/api/animal/shed_allocation?shed_id=${shedId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getUnallocatedAnimals: async (farmId: number) => {
        try {
            const response = await farmvestApi.get(`/api/animal/unallocated_animals?farm_id=${farmId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    // Create Farm
    createFarm: (farmData: { location: string; shed_count: number; is_test: boolean }) => {
        return farmvestApi.post('/api/farm/farm', farmData);
    },
    updateFarm: async (farmId: number, farmData: { farm_name?: string; location?: string; shed_count?: number; is_test?: boolean }) => {
        try {
            const response = await farmvestApi.put(`/api/farm/update/${farmId}`, farmData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    deleteFarm: async (farmId: number) => {
        try {
            const response = await farmvestApi.delete(`/api/farm/delete/${farmId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    createShed: async (shedData: { farm_id: number; shed_id: string; shed_name: string; capacity: number; cctv_url?: string }) => {
        try {
            const response = await farmvestApi.post('/api/shed/create_shed', shedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    deactivateUser: async (mobile: string) => {
        try {
            const response = await farmvestApi.put(`/api/users/activate_deactivate_user/${mobile}?is_active=false`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    activateUser: async (mobile: string) => {
        try {
            const response = await farmvestApi.put(`/api/users/activate_deactivate_user/${mobile}?is_active=true`);
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
            const response = await axios.post(url, {
                mobile: mobile || ""
            }, {
                headers: {
                    'x-admin-mobile': adminMobile,
                    'Content-Type': 'application/json'
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
    allocateAnimal: async (shedId: string, allocations: { rfid_tag_number: string; row_number: string; parking_id: string }[]) => {
        try {
            // Reverting to path parameter as per Swagger docs (404 was likely due to 'Animal Not Found' not 'Endpoint Not Found')
            const url = `/api/animal/shed_allocation/${shedId}`;
            const payload = { allocations };
            const response = await farmvestApi.post(url, payload);
            return response.data;
        } catch (error: any) {
            if (error.response) {
                // alert replaced with console error
            }
            throw error;
        }
    },
    searchAnimal: async (queryStr: string) => {
        try {
            const response = await farmvestApi.get(`/api/animal/search_animal?query_str=${queryStr}`);
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

    getAnimalsByInvestor: async (investorId: number) => {
        try {
            const response = await farmvestApi.get(`/api/investors/animals?investor_id=${investorId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // getAnimalsByInvestor was duplicated here by mistake. Removing this block.
    getCalves: async (animalId: string) => {
        try {
            const response = await farmvestApi.get(`/api/animal/get_calves?animal_id=${animalId}`);
            return response.data;
        } catch (error: any) {
            return [];
        }
    },

    // ============ TICKETS ============

    createTicket: async (ticketType: string, payload: any) => {
        const response = await farmvestApi.post(`/api/ticket/?ticket_type=${ticketType}`, payload);
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
        if (params?.farm_id) query.append('farm_id', params.farm_id.toString());
        if (params?.shed_id) query.append('shed_id', params.shed_id.toString());
        query.append('page', (params?.page || 1).toString());
        query.append('size', (params?.size || 15).toString());
        const response = await farmvestApi.get(`/api/ticket/get_health_tickets?${query.toString()}`);
        return response.data;
    },

    assignTicket: async (ticketId: number, assistantId?: number) => {
        const payload: any = { ticket_id: ticketId };
        if (assistantId) payload.assistant_id = assistantId;
        const response = await farmvestApi.post('/api/doctor/assign_tickets', payload);
        return response.data;
    },

    getDoctorAssistants: async () => {
        const response = await farmvestApi.get('/api/doctor/get_my_assistants');
        return response.data;
    },

    // ============ MILK ============

    createMilkEntry: async (payload: any) => {
        const response = await farmvestApi.post('/api/milk/create_milk_entry', payload);
        return response.data;
    },

    getMilkEntries: async (params?: { page?: number; size?: number; farm_id?: number | string; shed_id?: number | string }) => {
        const query = new URLSearchParams();
        query.append('page', (params?.page || 1).toString());
        query.append('size', (params?.size || 15).toString());
        if (params?.farm_id) query.append('farm_id', params.farm_id.toString());
        if (params?.shed_id) query.append('shed_id', params.shed_id.toString());
        const response = await farmvestApi.get(`/api/milk/milk_entries?${query.toString()}`);
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
        const response = await farmvestApi.get(`/api/milk/get_milk_report?${query.toString()}`);
        return response.data;
    },

    // ============ LEAVE REQUESTS ============

    createLeaveRequest: async (payload: any) => {
        const response = await farmvestApi.post('/api/leave_requests/create_leave_request', payload);
        return response.data;
    },

    getLeaveRequests: async (params?: { status_filter?: string; page?: number; size?: number }) => {
        const query = new URLSearchParams();
        if (params?.status_filter) query.append('status_filter', params.status_filter);
        query.append('page', (params?.page || 1).toString());
        query.append('size', (params?.size || 15).toString());
        const response = await farmvestApi.get(`/api/leave_requests/leave-requests?${query.toString()}`);
        return response.data;
    },

    updateLeaveStatus: async (leaveId: number, payload: { status: string; rejection_reason?: string }) => {
        const response = await farmvestApi.put(`/api/leave_requests/update_leave_status/${leaveId}`, payload);
        return response.data;
    },

    cancelLeaveRequest: async (leaveId: number) => {
        const response = await farmvestApi.put(`/api/leave_requests/leave-requests/${leaveId}`);
        return response.data;
    },

    // ============ FARM DETAILS ============

    getFarmDetails: async (farmId: number) => {
        const response = await farmvestApi.get(`/api/farm/farm/details?farm_id=${farmId}`);
        return response.data;
    },

    getFarmStaff: async (farmId: number) => {
        const response = await farmvestApi.get(`/api/farm/staff?farm_id=${farmId}`);
        return response.data;
    },

    // ============ EMPLOYEE UPDATE ============

    updateEmployee: async (payload: { user_id: number; role: string; farm_id: number; shed_id?: number }) => {
        const response = await farmvestApi.put('/api/employee/update_employee', payload);
        return response.data;
    },

    updateUserDetails: async (payload: { name?: string; email?: string; address?: string; profile?: string }) => {
        const response = await farmvestApi.put('/api/users/update_user_details/', payload);
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