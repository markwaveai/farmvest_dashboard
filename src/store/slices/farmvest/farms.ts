import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { farmvestService } from '../../../services/farmvest_api';
import { FarmvestFarm } from '../../../types/farmvest';

export const fetchFarms = createAsyncThunk(
    'farmvestFarms/fetchFarms',
    async (params: { location?: string; page?: number; size?: number; search?: string } | string, { rejectWithValue }) => {
        try {
            // value normalization handling string or object input
            const location = typeof params === 'string' ? params : params?.location;
            const page = typeof params === 'object' ? params.page || 1 : 1;
            const size = typeof params === 'object' ? params.size || 15 : 15;
            const search = typeof params === 'object' ? params.search : '';

            // Default to 'ALL' if no location provided
            const normalizedLocation = location ? location.toUpperCase() : 'ALL';

            // Build params object
            const apiParams: any = {
                size: size,
                page: page
            };

            // Only add location if it's not 'ALL'
            if (normalizedLocation !== 'ALL') {
                apiParams.location = normalizedLocation;
            }

            // Client-side search handling for Farms
            // API might ignore 'search', so if search is present, we fetch MORE items and filter locally
            if (search) {
                apiParams.size = 10000; // Fetch all for filtering
                apiParams.page = 1;
            }

            const response = await farmvestService.getAllFarms(apiParams);

            let allFarms: FarmvestFarm[] = [];
            let totalCount = 0;

            // Normalize response data with robust checks
            if (response) {
                // Check for pagination object at root or inside data
                const pagination = response.pagination || (response.data && response.data.pagination);
                if (pagination && pagination.total_items) {
                    totalCount = pagination.total_items;
                }

                if (Array.isArray(response)) {
                    allFarms = response;
                    if (!totalCount) totalCount = response.length;
                } else if (response && Array.isArray(response.data)) {
                    allFarms = response.data;
                    if (!totalCount) totalCount = response.total || response.total_count || response.count || response.data.length;
                } else if (response && Array.isArray(response.farms)) {
                    allFarms = response.farms;
                    if (!totalCount) totalCount = response.total || response.count || response.farms.length;
                } else if (response && response.data && Array.isArray(response.data.farms)) {
                    allFarms = response.data.farms;
                    if (!totalCount) totalCount = response.data.total || response.data.count || response.data.farms.length;
                } else if (response && (response.items || response.results)) {
                    allFarms = response.items || response.results;
                    if (!totalCount) totalCount = response.total || response.count || allFarms.length;
                } else if (response && Array.isArray(response.payload)) {
                    allFarms = response.payload;
                    if (!totalCount) totalCount = response.total || response.payload.length;
                } else if (response && (response.status === 200 || response.status === "200") && Array.isArray(response.data)) {
                    allFarms = response.data;
                    if (!totalCount) totalCount = response.total || response.data.length;
                }
            }

            // Map and normalize data to ensure UI compatibility
            allFarms = allFarms.map((item: any, index: number) => ({
                id: item.id || item._id || item.farm_id || index,
                farm_name: item.farm_name || item.name || `Farm ${index + 1}`,
                location: item.location || normalizedLocation,
                total_buffaloes_count: item.total_buffaloes_count || item.total_animals || item.buffalo_count || 0,
                farm_manager_name: item.farm_manager_name || item.manager_name || (item.farm_manager?.name) || '-',
                mobile_number: item.mobile_number || item.manager_mobile || item.manager_phone || (item.farm_manager?.mobile) || '-',
                sheds_count: item.sheds_count || item.shed_count || item.total_sheds || 0
            }));

            // Filter by search term if present
            if (search) {
                const lowerSearch = search.toLowerCase();
                allFarms = allFarms.filter((farm: any) =>
                    (farm.farm_name && farm.farm_name.toLowerCase().includes(lowerSearch)) ||
                    (farm.location && farm.location.toLowerCase().includes(lowerSearch)) ||
                    (farm.farm_manager_name && farm.farm_manager_name.toLowerCase().includes(lowerSearch))
                );
                // Update total count after filtering
                totalCount = allFarms.length;
            }

            // Fetch shed counts for each farm (still needed? if API provides it, we skip. Code showed we fetch it)
            // To optimize, maybe we shouldn't fetch sheds for ALL farms if paginated? 
            // We'll keep it for now but it might be slow for page size 20.
            const farmsWithShedCounts = await Promise.all(
                allFarms.map(async (farm) => {
                    try {
                        const shedData = await farmvestService.getShedList(farm.id);
                        let count = 0;
                        if (Array.isArray(shedData)) {
                            count = shedData.length;
                        } else if (shedData && Array.isArray(shedData.data)) {
                            count = shedData.data.length;
                        } else if (shedData && typeof shedData === 'object') {
                            if (Object.keys(shedData).length > 0) {
                                count = Object.keys(shedData).length; // Fallback if object
                            }
                        }
                        return { ...farm, sheds_count: count };
                    } catch (error) {
                        console.error(`Failed to fetch sheds for farm ${farm.id}`, error);
                        return farm; // Return farm with default 0 if fetch fails
                    }
                })
            );

            return { farms: farmsWithShedCounts, totalCount, location: normalizedLocation };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch farms');
        }
    }
);

interface FarmsState {
    farms: FarmvestFarm[];
    loading: boolean;
    error: string | null;
    loadedLocation: string | null;
    totalCount: number;
}

const initialState: FarmsState = {
    farms: [],
    loading: false,
    error: null,
    loadedLocation: null,
    totalCount: 0
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
                state.farms = action.payload.farms;
                state.totalCount = action.payload.totalCount;
                state.loadedLocation = action.payload.location;
            })
            .addCase(fetchFarms.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.farms = [];
                state.totalCount = 0;
            });
    },
});

export const { setFarms, clearFarmsError } = farmsSlice.actions;
export const farmsReducer = farmsSlice.reducer;
export default farmsSlice.reducer;
