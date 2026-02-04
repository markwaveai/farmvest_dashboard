import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

export const FARMVEST_API_CONFIG = {
    getBaseUrl: () => {
        const productionUrl = process.env.REACT_APP_FARMVEST_PRODUCTION_URL || 'https://farmvest-live-apis-jn6cma3vvq-el.a.run.app';

        // Only use CORS proxy in local development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            const corsUrl = process.env.REACT_APP_CORS_URL || 'https://cors-612299373064.asia-south1.run.app';
            return `${corsUrl}/${productionUrl}`;
        } else {
            return productionUrl;
        }
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
            console.error('Error parsing session for token', e);
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
            console.error('Error during farmvest static login:', error);
            throw error;
        }
    },
    getEmployees: async (params?: { role?: string; active_status?: number; sort_by?: number; page?: number; size?: number }) => {
        try {
            const { role, active_status, sort_by = 1, page = 1, size = 20 } = params || {};
            let query = `?sort_by=${sort_by}&page=${page}&size=${size}`;
            if (role) query += `&role=${role}`;
            if (active_status !== undefined && active_status !== null && active_status.toString() !== '') query += `&is_active=${active_status}`;

            const url = `/api/employee/get_all_employees${query}`;
            console.log('[FarmVest] Fetching employees with URL:', url);
            console.log('[FarmVest] Params:', { role, sort_by, page, size });
            const response = await farmvestApi.get(url);
            console.log('[FarmVest] API Response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching farmvest employees:', error);
            throw error;
        }
    },
    getAllInvestors: async (params?: { page?: number; size?: number }) => {
        try {
            const { page = 1, size = 5000 } = params || {};
            // Build URL using the config endpoint + query params
            const baseUrl = API_ENDPOINTS.getAllInvestors();
            const url = `${baseUrl}?page=${page}&size=${size}`;

            console.log('[FarmVest] Fetching investors with URL:', url);
            const response = await farmvestApi.get(url);
            console.log('[FarmVest] Investors API Response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching farmvest investors:', error);
            throw error;
        }
    },
    getFarms: async (location: string) => {
        try {
            const response = await farmvestApi.get(`/api/farm/get_all_farms?location=${location}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching farms for ${location}:`, error);
            throw error;
        }
    },
    getLocations: async () => {
        try {
            const response = await farmvestApi.get('/api/farm/locations');
            return response.data;
        } catch (error) {
            console.error('Error fetching farm locations:', error);
            throw error;
        }
    },
    getAllFarms: async (params?: { location?: string, sort_by?: number, page?: number, size?: number }) => {
        try {
            let url = '/api/farm/get_all_farms';
            if (params) {
                const query = new URLSearchParams();
                if (params.location) query.append('location', params.location);
                if (params.sort_by) query.append('sort_by', params.sort_by.toString());
                if (params.page) query.append('page', params.page.toString());
                if (params.size) query.append('size', params.size.toString());
                url += `?${query.toString()}`;
            }
            const response = await farmvestApi.get(url);
            return response.data;
        } catch (error) {
            console.error('Error fetching all farms:', error);
            throw error;
        }
    },
    searchEmployee: async (query: string) => {
        try {
            const response = await farmvestApi.get(`/api/employee/search_employee?search_query=${query}`);
            return response.data;
        } catch (error) {
            console.error(`Error searching employee ${query}:`, error);
            // Return empty list or null instead of throwing to avoid breaking UI flow if just searching name
            return [];
        }
    },
    createEmployee: async (employeeData: any) => {
        try {
            const response = await farmvestApi.post('/api/employee/create_employee', employeeData);
            return response.data;
        } catch (error) {
            console.error('Error creating farmvest employee:', error);
            throw error;
        }
    },
    getEmployeeDetailsById: async (id: string) => {
        try {
            // Updated parameter name to 'user_id' as per Swagger documentation
            const response = await farmvestApi.get(`/api/employee/get_employee_details_by_id?user_id=${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching details for employee ${id}:`, error);
            throw error;
        }
    },
    deleteEmployee: async (id: number) => {
        try {
            const response = await farmvestApi.delete(`/api/admin/delete_employee/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting farmvest employee ${id}:`, error);
            throw error;
        }
    },
    getAvailableSheds: async (farm_id: number) => {
        try {
            const response = await farmvestApi.get(`/api/shed/list?farm_id=${farm_id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching sheds for farm ${farm_id}:`, error);
            throw error;
        }
    },
    getShedsByFarm: async (farmId: number) => {
        try {
            const url = `/api/shed/list?farm_id=${farmId}`;
            console.log(`[FarmVest] Fetching sheds from: ${url}`);
            const response = await farmvestApi.get(url);
            return response.data;
        } catch (error) {
            console.error(`Error fetching sheds for farm ${farmId}:`, error);
            throw error;
        }
    },
    getShedList: async (farmId: number) => {
        try {
            const response = await farmvestApi.get(`/api/shed/list?farm_id=${farmId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching shed list for farm ${farmId}:`, error);
            throw error;
        }
    },
    getShedPositions: async (shedId: number) => {
        try {
            const response = await farmvestApi.get(`/api/shed/available_positions?shed_id=${shedId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching positions for shed ${shedId}:`, error);
            throw error;
        }
    },
    getAnimalPositions: async (shedId: number) => {
        try {
            const response = await farmvestApi.get(`/api/animal/get-position?shed_id=${shedId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching animal positions for shed ${shedId}:`, error);
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
            console.error(`Error fetching details for parking grid ${params.parkingId}:`, error);
            throw error;
        }
    },
    getTotalAnimals: async (farmId?: number, shedId?: number) => {
        try {
            let url = '/api/animal/get_total_animals';
            const params = new URLSearchParams();
            if (farmId) params.append('farm_id', farmId.toString());
            if (shedId) params.append('shed_id', shedId.toString());

            if (params.toString()) url += `?${params.toString()}`;

            const response = await farmvestApi.get(url);
            return response.data;
        } catch (error) {
            console.error('Error fetching total animals:', error);
            throw error;
        }
    },
    getShedAllocation: async (shedId: string) => {
        try {
            const response = await farmvestApi.get(`/api/animal/shed_allocation?shed_id=${shedId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching allocation for shed ${shedId}:`, error);
            throw error;
        }
    },
    getUnallocatedAnimals: async (farmId: number) => {
        try {
            console.log(`Fetching unallocated animals for farm ${farmId}`);
            const response = await farmvestApi.get(`/api/animal/unallocated_animals?farm_id=${farmId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching unallocated animals for farm ${farmId}:`, error);
            throw error;
        }
    },
    createFarm: async (farmData: { farm_name: string; location: string }) => {
        try {
            const response = await farmvestApi.post('/api/farm/farm', farmData);
            return response.data;
        } catch (error) {
            console.error('Error creating farm:', error);
            throw error;
        }
    },
    createShed: async (shedData: { farm_id: number; shed_id: string; shed_name: string; capacity: number; cctv_url: string }) => {
        try {
            const response = await farmvestApi.post('/api/shed/create_shed', shedData);
            return response.data;
        } catch (error) {
            console.error('Error creating shed:', error);
            throw error;
        }
    },
    deactivateUser: async (mobile: string) => {
        try {
            const response = await farmvestApi.put(`/api/users/deactivate/${mobile}`);
            return response.data;
        } catch (error) {
            console.error(`Error deactivating user ${mobile}:`, error);
            throw error;
        }
    },
    activateUser: async (mobile: string) => {
        try {
            const response = await farmvestApi.put(`/api/users/activate/${mobile}`);
            return response.data;
        } catch (error) {
            console.error(`Error activating user ${mobile}:`, error);
            throw error;
        }
    },
    getPaidOrders: async (mobile: string) => {
        try {
            console.log('[FarmVest] Fetching paid orders for mobile:', mobile);

            // Get admin mobile from session
            const sessionStr = localStorage.getItem('ak_dashboard_session');
            let adminMobile = '';
            if (sessionStr) {
                try {
                    const session = JSON.parse(sessionStr);
                    adminMobile = session.mobile;
                } catch (e) {
                    console.error("Error parsing session for admin mobile", e);
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
                console.log('[FarmVest] API Response Data:', response.data);
                return response.data; // Return the full { user, orders, status, statuscode }
            }
            return { user: null, orders: [] };
        } catch (error: any) {
            console.error(`Error fetching paid orders for ${mobile}:`, error);
            return { user: null, orders: [] };
        }
    },
    onboardAnimal: async (onboardingData: any) => {
        try {
            console.log('[FarmVest] Onboarding animal with data:', JSON.stringify(onboardingData, null, 2));

            let url = API_ENDPOINTS.onboardAnimal();
            if (onboardingData.farm_id !== undefined && onboardingData.farm_id !== null) {
                url += `?farm_id=${onboardingData.farm_id}`;
            }

            const response = await farmvestApi.post(url, onboardingData, {
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('[FarmVest] Onboarding response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Error onboarding animals:', error);
            if (error.response) {
                console.error('[FarmVest] Onboard Error Response:', error.response.status, error.response.data);
                // Log detailed validation errors if available
                if (error.response.data && Array.isArray(error.response.data.detail)) {
                    console.error('Validation Details:', error.response.data.detail);
                }
            }
            throw error;
        }
    },
    allocateAnimal: async (shedId: string, allocations: { rfid_tag_number: string; row_number: string; parking_id: string }[]) => {
        try {
            // Reverting to path parameter as per Swagger docs (404 was likely due to 'Animal Not Found' not 'Endpoint Not Found')
            const url = `/api/animal/shed_allocation/${shedId}`;
            console.log(`[FarmVest] POST Request to: ${url}`);
            const payload = { allocations };
            console.log(`[FarmVest] Payload:`, JSON.stringify(payload, null, 2));
            const response = await farmvestApi.post(url, payload);
            return response.data;
        } catch (error: any) {
            console.error('Error allocating animal:', error);
            if (error.response) {
                console.error('[FarmVest] Allocation Error Response:', error.response.status, error.response.data);
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
            console.error(`Error searching animal ${queryStr}:`, error);
            throw error;
        }
    },
    getAnimalsByInvestor: async (investorId: number) => {
        try {
            const response = await farmvestApi.get(`/api/investors/animals?investor_id=${investorId}`);
            console.log(`[FarmVest] getAnimalsByInvestor(${investorId}) response:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`Error fetching animals for investor ${investorId}:`, error);
            throw error;
        }
    },
    getCalves: async (animalId: string) => {
        try {
            const response = await farmvestApi.get(`/api/animal/get_calves?animal_id=${animalId}`);
            return response.data;
        } catch (error: any) {
            console.error(`Error fetching calves for animal ${animalId}:`, error);
            return [];
        }
    }
};