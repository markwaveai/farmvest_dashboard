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
            // Build params object
            const apiParams: any = {
                size: size,
                page: page
            };

            // If location is selected, fetch ALL farms and filter client-side to ensure correctness
            // The API seems to ignore the location parameter or returns mixed results
            if (normalizedLocation !== 'ALL') {
                apiParams.size = 10000;
                apiParams.page = 1;
                apiParams.location = location; // Use original casing if provided
                apiParams.location_name = location; // Use original casing if provided
            }

            // Pass search param to API
            if (search) {
                apiParams.search = search;
            }

            const response = await farmvestService.getAllFarms(apiParams);

            let allFarms: FarmvestFarm[] = [];
            let totalCount = 0;

            // Normalize response data with robust checks
            if (response) {
                // Helper to find the first array in an object recursively
                const findArray = (obj: any): any[] => {
                    if (Array.isArray(obj)) return obj;
                    if (!obj || typeof obj !== 'object') return [];

                    // Priority keys
                    const priorityKeys = ['farms', 'data', 'items', 'results', 'payload', 'records'];
                    for (const key of priorityKeys) {
                        if (Array.isArray(obj[key])) return obj[key];
                    }

                    // Search all keys
                    for (const key in obj) {
                        if (Array.isArray(obj[key])) return obj[key];
                        if (obj[key] && typeof obj[key] === 'object') {
                            const nested = findArray(obj[key]);
                            if (nested.length > 0) return nested;
                        }
                    }
                    return [];
                };

                allFarms = findArray(response);

                // Try to find total count
                const findTotal = (obj: any): number => {
                    if (!obj || typeof obj !== 'object') return 0;
                    const countKeys = ['total_items', 'totalCount', 'total_count', 'total', 'count', 'length'];
                    for (const key of countKeys) {
                        if (typeof obj[key] === 'number') return obj[key];
                    }
                    // Check pagination object
                    if (obj.pagination && typeof obj.pagination.total_items === 'number') return obj.pagination.total_items;
                    if (obj.data && typeof obj.data.total_items === 'number') return obj.data.total_items;
                    return 0;
                };

                totalCount = findTotal(response) || allFarms.length;
            }

            // Helper to infer location from farm name prefix if missing
            const inferLocation = (name: string): string | null => {
                if (!name) return null;
                const upperName = name.toUpperCase();
                if (upperName.startsWith('VJY')) return 'VIJAYAWADA';
                if (upperName.startsWith('HYD')) return 'HYDERABAD';
                if (upperName.startsWith('KNL') || upperName.startsWith('KUR')) return 'KURNOOL';
                if (upperName.startsWith('ADO')) return 'ADONI';
                if (upperName.startsWith('NAN')) return 'NANDYAL';
                return null;
            };

            // Map and normalize data to ensure UI compatibility
            allFarms = allFarms.map((item: any, index: number) => {
                const farmName = item.farm_name || item.name || item.farmName || `Farm ${index + 1}`;
                
                // Location can be a string or object
                const locRaw = item.location_name || item.location || item.locationName || item.city || item.address || null;
                let locationStr = typeof locRaw === 'string' ? locRaw : (locRaw?.name || locRaw?.label || locRaw?.location_name || null);
                
                // If location is missing, try to infer it from the name
                if (!locationStr || locationStr === '-') {
                    const inferred = inferLocation(farmName);
                    if (inferred) locationStr = inferred;
                }

                if (!locationStr) locationStr = '-';

                return {
                    id: item.id || item._id || item.farm_id || index,
                    farm_name: farmName,
                    location: locationStr,
                    total_buffaloes_count: item.total_buffaloes_count || item.total_animals || item.buffalo_count || item.animal_count || 0,
                    farm_manager_name: item.farm_manager_name || item.manager_name || (item.farm_manager?.name) || '-',
                    mobile_number: item.mobile_number || item.manager_mobile || item.manager_phone || (item.farm_manager?.mobile) || '-',
                    sheds_count: item.sheds_count || item.shed_count || (item.sheds?.length) || item.total_sheds || 0
                };
            });

            // Client-side filtering for Location
            if (normalizedLocation !== 'ALL') {
                allFarms = allFarms.filter(farm => {
                    if (!farm.location) return false;
                    const farmLoc = String(farm.location).trim().toUpperCase();
                    const searchLoc = normalizedLocation.trim().toUpperCase();
                    // Check for exact match or if one is a prefix of other (e.g. VIJAYAWADA vs VIJAYAWADA Operations)
                    return farmLoc === searchLoc || farmLoc.includes(searchLoc) || searchLoc.includes(farmLoc);
                });
                totalCount = allFarms.length;
                
                // Since we fetched ALL, we need to handle pagination manually here
                const startIndex = (page - 1) * size;
                const endIndex = startIndex + size;
                allFarms = allFarms.slice(startIndex, endIndex);
            }

            return { farms: allFarms, totalCount, location: normalizedLocation };
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
