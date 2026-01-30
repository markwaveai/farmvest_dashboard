import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { farmvestService } from '../../../services/farmvest_api';

// Define a type for Investor based on common fields and what we might expect
export interface FarmvestInvestor {
    id: number | string;
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
    phone_number: string;
    roles?: string[];
    is_active?: number | boolean;
    created_at?: string;
    // Add other fields as discovered
    [key: string]: any;
}

export const fetchInvestors = createAsyncThunk(
    'farmvestInvestors/fetchInvestors',
    async (params: { page?: number; size?: number } | undefined, { rejectWithValue }) => {
        try {
            const response = await farmvestService.getAllInvestors(params);
            console.log('fetchInvestors thunk response:', response);

            let rawData: any[] = [];

            // Robust parsing logic similar to employees slice
            if (Array.isArray(response)) {
                rawData = response;
            } else if (response && Array.isArray(response.data)) {
                rawData = response.data;
            } else if (response && (response.users || response.employees || response.investors)) {
                rawData = response.users || response.employees || response.investors;
            } else {
                if (response && response.status === 200 && Array.isArray(response.data)) {
                    rawData = response.data;
                }
            }

            if (rawData.length > 0 || (response && response.status === 'success')) {
                const mappedData = rawData.map((item: any, index: number) => ({
                    id: item.id || item.investor_id || index,
                    first_name: item.first_name || '',
                    last_name: item.last_name || '',
                    email: item.email || '',
                    mobile: item.mobile || item.phone_number || '',
                    phone_number: item.mobile || item.phone_number || '',
                    roles: item.roles || ['Investor'],
                    is_active: item.is_active !== undefined ? item.is_active : (item.active_status ? 1 : 0),
                    ...item
                }));

                const totalCount =
                    response.pagination?.total_items ||
                    response.pagination?.total_count ||
                    response.data?.pagination?.total_items ||
                    response.total_users ||
                    response.total ||
                    response.count ||
                    response.total_count ||
                    rawData.length;

                return { investors: mappedData, totalCount };
            }

            // Return empty list if success but no data
            if (response && (response.status === 'success' || response.status === 200)) {
                return { investors: [], totalCount: 0 };
            }

            return rejectWithValue(response.message || 'Failed to fetch investors');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch investors');
        }
    }
);

interface InvestorsState {
    investors: FarmvestInvestor[];
    totalCount: number;
    loading: boolean;
    error: string | null;
}

const initialState: InvestorsState = {
    investors: [],
    totalCount: 0,
    loading: false,
    error: null,
};

const investorsSlice = createSlice({
    name: 'farmvestInvestors',
    initialState,
    reducers: {
        clearInvestorsMessages: (state) => {
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
                if (action.payload && 'totalCount' in action.payload) {
                    state.investors = action.payload.investors;
                    state.totalCount = action.payload.totalCount;
                } else {
                    // Fallback should not be hit with current logic but good for type safety
                    state.investors = action.payload as unknown as FarmvestInvestor[];
                    state.totalCount = (action.payload as unknown as FarmvestInvestor[]).length;
                }
            })
            .addCase(fetchInvestors.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearInvestorsMessages } = investorsSlice.actions;
export const investorsReducer = investorsSlice.reducer;
export default investorsSlice.reducer;
