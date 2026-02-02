import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { farmvestService } from '../../../services/farmvest_api';

export const fetchInvestors = createAsyncThunk(
    'farmvestInvestors/fetchInvestors',
    async (params: { page?: number; size?: number } | undefined, { rejectWithValue }) => {
        try {
            const response = await farmvestService.getAllInvestors(params);
            console.log('fetchInvestors thunk response:', response);

            let rawData: any[] = [];
            let totalCount = 0;

            if (Array.isArray(response)) {
                rawData = response;
                totalCount = response.length;
            } else if (response && Array.isArray(response.data)) {
                rawData = response.data;
                totalCount = response.total_items || response.total || response.count || response.data.length;
            } else if (response && (response.users || response.investors)) {
                rawData = response.users || response.investors; // Fallback keys
                totalCount = response.total || response.count || rawData.length;
            }

            // Map data if needed, or pass through. Assuming shape is similar to users/employees or specific investor shape
            const mappedData = rawData.map((item: any, index: number) => ({
                id: item.id || item.investor_id || index,
                first_name: item.first_name || '',
                last_name: item.last_name || '',
                email: item.email || '',
                mobile: item.mobile || item.phone_number || '',
                phone_number: item.mobile || item.phone_number || '',
                active_status: item.active_status !== undefined ? item.active_status : (item.is_active ? 1 : 0),
                created_at: item.created_at || '',
                ...item
            }));

            return { investors: mappedData, totalCount };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch investors');
        }
    }
);

interface InvestorsState {
    investors: any[]; // Replace 'any' with specific Investor type if available
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
            });
    },
});

export const { clearInvestorErrors } = investorsSlice.actions;
export const investorsReducer = investorsSlice.reducer;
export default investorsSlice.reducer;
