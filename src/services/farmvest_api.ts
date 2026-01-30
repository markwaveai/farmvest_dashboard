import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

export const FARMVEST_API_CONFIG = {
    getBaseUrl: () => {
        const productionUrl = process.env.REACT_APP_FARMVEST_PRODUCTION_URL || 'https://farmvest-live-apis-jn6cma3vvq-el.a.run.app';

        // Only use CORS proxy in local development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return productionUrl;
        } else {
            const corsUrl = process.env.REACT_APP_CORS_URL || 'https://cors-612299373064.asia-south1.run.app';
            return `${corsUrl}/${productionUrl}`;
        }
    },
    getApiKey: () => process.env.REACT_APP_FARMVEST_API_KEY || 'bWFya3dhdmUtZmFybXZlc3QtdGVzdHRpbmctYXBpa2V5'
};

const farmvestApi = axios.create({
    baseURL: FARMVEST_API_CONFIG.getBaseUrl(),
    headers: {
        'Content-Type': 'application/json'
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
        // Fallback to the API Key, ensuring Bearer prefix is used
        const apiKey = FARMVEST_API_CONFIG.getApiKey();
        config.headers['Authorization'] = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
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
    getEmployees: async (params?: { role?: string; sort_by?: number; page?: number; size?: number }) => {
        try {
            const { role, sort_by = 1, page = 1, size = 20 } = params || {};
            let query = `?sort_by=${sort_by}&page=${page}&size=${size}`;
            if (role) query += `&role=${role}`;

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
    getFarms: async (location: string) => {
        try {
            const response = await farmvestApi.get(`/api/farm/get_all_farms?location=${location}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching farms for ${location}:`, error);
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
    createEmployee: async (employeeData: any) => {
        try {
            const response = await farmvestApi.post('/api/employee/create_employee', employeeData);
            return response.data;
        } catch (error) {
            console.error('Error creating farmvest employee:', error);
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
            // If response.data is the list, return it.
            // If response.data.data is the list (common pattern), return that.
            // Let's return response.data for now and handle parsing in the component as we are not 100% sure of the structure.
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
    getPaidOrders: async (mobile: string) => {
        try {
            // using the AnimalKart staging endpoint
            // API_ENDPOINTS.markInTransit() points to /order-tracking/intransit
            const url = API_ENDPOINTS.markInTransit();
            console.log('[FarmVest] Fetching paid orders from:', url, 'with mobile:', mobile);
            // 405 error on GET suggests POST is required. Sending mobile in body.
            const response = await farmvestApi.post(url, { mobile });
            console.log('[FarmVest] Paid orders response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error(`Error fetching paid orders for ${mobile}:`, error);
            if (error.response) {
                console.error('[FarmVest] Error Response:', error.response.status, error.response.data);
            } else if (error.request) {
                console.error('[FarmVest] No response received:', error.request);
            } else {
                console.error('[FarmVest] Request setup error:', error.message);
            }
            throw error;
        }
    },
    onboardAnimal: async (onboardingData: any) => {
        try {
            console.log('[FarmVest] Onboarding animal with data:', JSON.stringify(onboardingData, null, 2));

            // Append farm_id to URL if present (backend might expect it as query param)
            let url = '/api/animal/onboard_animal';
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

                // Construct a helpful error message from the detail array
                let errorMsg = `Onboarding Error (${error.response.status}): `;
                if (error.response.data && Array.isArray(error.response.data.detail)) {
                    // Show first 3 errors to avoid huge alert
                    const details = error.response.data.detail.slice(0, 3).map((d: any) =>
                        `${d.loc.join('.')} : ${d.msg}`
                    ).join('\n');
                    errorMsg += '\n' + details;
                } else {
                    errorMsg += JSON.stringify(error.response.data);
                }

                alert(errorMsg);
            }
            throw error;
        }
    },
    allocateAnimal: async (shedId: string, allocations: { rfid_tag_number: string; row_number: string; parking_id: string }[]) => {
        try {
            const url = `/api/animal/shed_allocation/${shedId}`;
            console.log(`[FarmVest] POST Request to: ${url}`);
            console.log(`[FarmVest] Payload:`, JSON.stringify({ allocations }, null, 2));
            const response = await farmvestApi.post(url, { allocations });
            return response.data;
        } catch (error: any) {
            console.error('Error allocating animal:', error);
            if (error.response) {
                console.error('[FarmVest] Allocation Error Response:', error.response.status, error.response.data);
                alert(`Allocation Failed: ${JSON.stringify(error.response.data.detail || error.response.data)}`);
            }
            throw error;
        }
    },
    searchAnimal: async (rfid: string) => {
        try {
            const response = await farmvestApi.get(`/api/animal/search_animal?search_query=${rfid}`);
            return response.data;
        } catch (error) {
            console.error(`Error searching animal ${rfid}:`, error);
            throw error;
        }
    }
};