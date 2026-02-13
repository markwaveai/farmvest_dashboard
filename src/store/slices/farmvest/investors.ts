import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { farmvestService } from '../../../services/farmvest_api';

export const fetchInvestors = createAsyncThunk(
    'farmvestInvestors/fetchInvestors',
    async (params: { page?: number; size?: number; active_status?: number } | undefined, { rejectWithValue }) => {
        try {
            const response = await farmvestService.getAllInvestors(params);

            let rawData: any[] = [];
            let totalCount = 0;

            // Handle various response structures (direct array, data.investors, data.users, etc.)
            if (Array.isArray(response)) {
                rawData = response;
            } else if (response && Array.isArray(response.data)) {
                rawData = response.data;
            } else if (response && response.data) {
                rawData = response.data.investors || response.data.users || response.data.data || (Array.isArray(response.data) ? response.data : []);
            } else if (response && (response.users || response.investors)) {
                rawData = response.users || response.investors;
            }

            // Extract totalCount from various possible locations
            const pagination = response?.pagination || response?.data?.pagination;
            totalCount =
                pagination?.total_items ||
                pagination?.total_count ||
                response?.total_users ||
                response?.total_investors ||
                response?.total ||
                response?.count ||
                response?.total_count ||
                rawData.length;

            const mappedData = rawData.map((item: any, index: number) => {
                // Determine active status robustly (1 or 0)
                const rawStatus = item.active_status !== undefined ? item.active_status : (item.is_active !== undefined ? item.is_active : true);
                const isActive = Number(rawStatus) ? 1 : 0;

                return {
                    id: item.id || item.investor_id || item.user_id || index,
                    investor_id: item.investor_id || item.id || item.user_id,
                    first_name: item.first_name || item.name?.split(' ')[0] || '',
                    last_name: item.last_name || item.name?.split(' ').slice(1).join(' ') || '',
                    email: item.email || '',
                    mobile: item.mobile || item.phone_number || '',
                    phone_number: item.phone_number || item.mobile || '',
                    active_status: isActive,
                    is_active: isActive,
                    created_at: item.created_at || item.joining_date || '',
                    address: item.address || [item.location, item.city, item.street_address, item.landmark].filter(Boolean).join(', ') || '-',
                };
            });

            return { investors: mappedData, totalCount };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch investors');
        }
    }
);

export const fetchInvestorStats = createAsyncThunk(
    'farmvestInvestors/fetchInvestorStats',
    async (_, { rejectWithValue }) => {
        try {
            // Fetch everything (size: 5000) to calculate accurate stats on frontend
            const response = await farmvestService.getAllInvestors({ size: 5000 });

            let rawData: any[] = [];
            if (Array.isArray(response)) {
                rawData = response;
            } else if (response && Array.isArray(response.data)) {
                rawData = response.data;
            } else if (response && response.data) {
                rawData = response.data.investors || response.data.users || response.data.data || (Array.isArray(response.data) ? response.data : []);
            } else if (response && (response.users || response.investors)) {
                rawData = response.users || response.investors;
            }

            const statusCounts = { active: 0, inactive: 0 };
            const mappedData = rawData.map((item: any, index: number) => {
                const rawStatus = item.active_status !== undefined ? item.active_status : (item.is_active !== undefined ? item.is_active : true);
                const isActive = Number(rawStatus) ? 1 : 0;

                if (isActive) statusCounts.active++;
                else statusCounts.inactive++;

                return {
                    id: item.id || item.investor_id || item.user_id || index,
                    investor_id: item.investor_id || item.id || item.user_id,
                    first_name: item.first_name || item.name?.split(' ')[0] || '',
                    last_name: item.last_name || item.name?.split(' ').slice(1).join(' ') || '',
                    email: item.email || '',
                    mobile: item.mobile || item.phone_number || '',
                    phone_number: item.phone_number || item.mobile || '',
                    active_status: isActive,
                    is_active: isActive,
                    created_at: item.created_at || item.joining_date || '',
                    address: item.address || [item.location, item.city, item.street_address, item.landmark].filter(Boolean).join(', ') || '-',
                };
            });

            return { statusCounts, allInvestors: mappedData };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch investor stats');
        }
    }
);

interface InvestorsState {
    investors: any[];
    allInvestors: any[];
    totalCount: number;
    loading: boolean;
    error: string | null;
    statusCounts: { active: number; inactive: number };
}

const initialState: InvestorsState = {
    investors: [],
    allInvestors: [],
    totalCount: 0,
    loading: false,
    error: null,
    statusCounts: { active: 0, inactive: 0 },
};

const investorsSlice = createSlice({
    name: 'farmvestInvestors',
    initialState,
    reducers: {
        clearInvestorErrors: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchInvestors.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchInvestors.fulfilled, (state, action) => {
                state.loading = false;
                state.investors = action.payload.investors;
                state.totalCount = action.payload.totalCount;
            })
            .addCase(fetchInvestors.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchInvestorStats.fulfilled, (state, action) => {
                state.statusCounts = action.payload.statusCounts;
                state.allInvestors = action.payload.allInvestors || [];
            });
    },
});

export const { clearInvestorErrors } = investorsSlice.actions;
export const investorsReducer = investorsSlice.reducer;
export default investorsReducer;
