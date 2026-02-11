import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

export const FARMVEST_API_CONFIG = {
    getBaseUrl: () => {
        const productionUrl = process.env.REACT_APP_FARMVEST_PRODUCTION_URL || 'https://farmvest-stagging-services-612299373064.asia-south1.run.app';

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
    getEmployees: async (params?: { role?: string; active_status?: number; sort_by?: number; page?: number; size?: number; farm_id?: number }) => {
        try {
            const { role, active_status, sort_by = 1, page = 1, size = 20, farm_id } = params || {};
            let query = `?sort_by=${sort_by}&page=${page}&size=${size}`;
            if (role) query += `&role=${role}`;
            if (active_status !== undefined && active_status !== null && active_status.toString() !== '') query += `&is_active=${active_status}`;
            if (farm_id) query += `&farm_id=${farm_id}`;

            const url = `/api/employee/get_all_employees${query}`;
            const response = await farmvestApi.get(url);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getAllInvestors: async (params?: { page?: number; size?: number }) => {
        try {
            const { page = 1, size = 5000 } = params || {};
            // Build URL using the config endpoint + query params
            const baseUrl = API_ENDPOINTS.getAllInvestors();
            const url = `${baseUrl}?page=${page}&size=${size}`;

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
    createFarm: async (farmData: { farm_name: string; location: string }) => {
        try {
            const response = await farmvestApi.post('/api/farm/farm', farmData);
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
    getAnimalsByInvestor: async (investorId: number) => {
        try {
            const response = await farmvestApi.get(`/api/investors/animals?investor_id=${investorId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getCalves: async (animalId: string) => {
        try {
            const response = await farmvestApi.get(`/api/animal/get_calves?animal_id=${animalId}`);
            return response.data;
        } catch (error: any) {
            return [];
        }
    }
};