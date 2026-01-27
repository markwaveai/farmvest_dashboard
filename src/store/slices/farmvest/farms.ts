import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { farmvestService } from '../../../services/farmvest_api';
import { FarmvestFarm } from '../../../types/farmvest';

export const fetchFarms = createAsyncThunk(
    'farmvestFarms/fetchFarms',
    async (location: string, { rejectWithValue }) => {
        try {
            console.log(`[FarmVest] Fetching all farms to filter by location: ${location}`);
            // Use the new getAllFarms API
            const response = await farmvestService.getAllFarms();

            // Log the raw response for debugging in the user's browser
            console.log(`[FarmVest] Response for getAllFarms:`, response);

            let allFarms: FarmvestFarm[] = [];

            // Normalize response data
            if (response && (response.status === 200 || response.status === "200")) {
                allFarms = Array.isArray(response.data) ? response.data : [];
            } else if (Array.isArray(response)) {
                allFarms = response;
            } else if (response && Array.isArray(response.data)) {
                allFarms = response.data;
            }

            // Client-side filtering by location
            // If location is provided, filter the farms. Case-insensitive comparison.
            if (location) {
                const normalizedLocation = location.toUpperCase();
                return allFarms.filter(farm =>
                    farm.location && farm.location.toUpperCase() === normalizedLocation
                );
            }

            // If no location specified, return all (though the thunk requires location string currently)
            return allFarms;

            return rejectWithValue(response?.message || `Failed to fetch farms for ${location}`);
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
