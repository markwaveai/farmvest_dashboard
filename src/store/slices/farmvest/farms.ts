import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { farmvestService } from '../../../services/farmvest_api';
import { FarmvestFarm } from '../../../types/farmvest';

export const fetchFarms = createAsyncThunk(
    'farmvestFarms/fetchFarms',
    async (location: string, { rejectWithValue }) => {
        try {
            const normalizedLocation = location ? location.toUpperCase() : 'KURNOOL';
            console.log(`[FarmVest] Fetching farms via API for location: ${normalizedLocation}`);

            // specific parameters - location and large size to get "all" for that location
            const response = await farmvestService.getAllFarms({
                location: normalizedLocation,
                size: 2000 // Get all farms for client-side table handling
            });

            // Log the raw response for debugging
            console.log(`[FarmVest] Response for getAllFarms (${normalizedLocation}):`, response);

            let allFarms: FarmvestFarm[] = [];

            // Normalize response data with robust checks
            if (response) {
                if (Array.isArray(response)) {
                    allFarms = response;
                } else if (response && Array.isArray(response.data)) {
                    allFarms = response.data;
                } else if (response && Array.isArray(response.farms)) {
                    allFarms = response.farms;
                } else if (response && response.data && Array.isArray(response.data.farms)) {
                    allFarms = response.data.farms;
                } else if (response && (response.items || response.results)) {
                    allFarms = response.items || response.results;
                } else if (response && Array.isArray(response.payload)) {
                    allFarms = response.payload;
                } else if (response && (response.status === 200 || response.status === "200") && Array.isArray(response.data)) {
                    allFarms = response.data;
                }
            }

            // Map and normalize data to ensure UI compatibility
            allFarms = allFarms.map((item: any, index: number) => ({
                id: item.id || item._id || item.farm_id || index,
                farm_name: item.farm_name || item.name || `Farm ${index + 1}`,
                location: item.location || normalizedLocation,
                total_buffaloes_count: item.total_buffaloes_count || item.total_animals || item.buffalo_count || 0,
                farm_manager_name: item.farm_manager_name || item.manager_name || (item.farm_manager?.name) || '-',
                mobile_number: item.mobile_number || item.manager_mobile || item.manager_phone || (item.farm_manager?.mobile) || '-'
            }));

            return allFarms;
        } catch (error: any) {
            console.error(`[FarmVest] Thunk Error for ${location}:`, error);
            return rejectWithValue(error.message || 'Failed to fetch farms');
        }
    }
);

interface FarmsState {
    farms: FarmvestFarm[];
    loading: boolean;
    error: string | null;
}

const initialState: FarmsState = {
    farms: [],
    loading: false,
    error: null,
};

const farmsSlice = createSlice({
    name: 'farmvestFarms',
    initialState,
    reducers: {
        setFarms: (state, action: PayloadAction<FarmvestFarm[]>) => {
            state.farms = Array.isArray(action.payload) ? action.payload : [];
        },
        clearFarmsError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchFarms.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFarms.fulfilled, (state, action) => {
                state.loading = false;
                state.farms = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchFarms.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.farms = [];
            });
    },
});

export const { setFarms, clearFarmsError } = farmsSlice.actions;
export const farmsReducer = farmsSlice.reducer;
export default farmsSlice.reducer;
