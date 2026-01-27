import axios from 'axios';

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
        config.headers['Authorization'] = FARMVEST_API_CONFIG.getApiKey();
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
    getEmployees: async (role?: string) => {
        try {
            const query = role && role !== '' ? `?role=${role}` : '';
            const response = await farmvestApi.get(`/api/investors/get_all_investors${query}`);
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
    getAllFarms: async () => {
        try {
            const response = await farmvestApi.get('/api/farm/get_all_farms');
            return response.data;
        } catch (error) {
            console.error('Error fetching all farms:', error);
            throw error;
        }
    },
    createEmployee: async (employeeData: any) => {
        try {
            const response = await farmvestApi.post('/api/admin/create_employee', employeeData);
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
    createFarm: async (farmData: { farm_name: string; location: string; is_test: boolean }) => {
        try {
            const response = await farmvestApi.post('/api/farm', farmData);
            return response.data;
        } catch (error) {
            console.error('Error creating farm:', error);
            throw error;
        }
    }
};