import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { farmvestService } from '../../../services/farmvest_api';
import { FarmvestEmployee } from '../../../types/farmvest';

export const fetchEmployees = createAsyncThunk(
    'farmvestEmployees/fetchEmployees',
    async (params: { role?: string; active_status?: number; sort_by?: number; page?: number; size?: number } | undefined, { rejectWithValue }) => {
        try {
            const response = await farmvestService.getEmployees(params);
            console.log('fetchEmployees thunk response:', response);

            let rawData: any[] = [];

            // Extract the array from various possible structures
            if (Array.isArray(response)) {
                rawData = response;
            } else if (response && Array.isArray(response.data)) {
                rawData = response.data;
            } else if (response && (response.users || response.employees)) {
                rawData = response.users || response.employees;
            } else {
                // Fallback: check if status is 200 and data exists but hasn't been caught yet
                if (response && response.status === 200 && Array.isArray(response.data)) {
                    rawData = response.data;
                }
            }

            if (rawData.length > 0 || (response && response.status === 'success')) {
                // Map the data to match FarmvestEmployee interface
                const mappedData = rawData.map((item: any, index: number) => {
                    const isActive = item.active_status ?? item.is_active;
                    const normalizedActive = isActive === 1 || isActive === '1' || isActive === true;

                    return {
                        ...item, // Spread first so defaults can override
                        id: item.id || item.investor_id || index, // Fallback to index if no ID
                        first_name: item.first_name || '',
                        last_name: item.last_name || '',
                        email: item.email || '',
                        mobile: item.mobile || item.phone_number || '', // Map phone_number to mobile
                        phone_number: item.mobile || item.phone_number || '', // Ensure phone_number is also available for component
                        roles: item.roles || ['Investor'], // Default role
                        active_status: normalizedActive, // Ensure boolean for UI
                        // Explicitly extract farm and shed info to ensure they appear
                        farm_name: item.farm_name || (item.farm && item.farm.farm_name) || '',
                        shed_name: item.shed_name || (item.shed && item.shed.shed_name) || (item.shed && item.shed.name) || '',
                        farm_id: item.farm_id || (item.farm && item.farm.id) || '',
                        shed_id: item.shed_id || (item.shed && item.shed.id) || '',
                    };
                });

                // Extract total count if available
                const totalCount =
                    response.pagination?.total_items ||
                    response.pagination?.total_count ||
                    response.data?.pagination?.total_items ||
                    response.total_users ||
                    response.total ||
                    response.count ||
                    response.total_count ||
                    rawData.length;

                return { employees: mappedData, totalCount };
            }

            return rejectWithValue(response.message || 'Failed to fetch employees');
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch employees');
        }
    }
);

export const createEmployee = createAsyncThunk(
    'farmvestEmployees/createEmployee',
    async (employeeData: any, { rejectWithValue, dispatch }) => {
        try {
            const response = await farmvestService.createEmployee(employeeData);
            // Refresh list after creation
            dispatch(fetchEmployees(undefined));
            return response;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to create employee';
            return rejectWithValue(message);
        }
    }
);

export const deleteEmployee = createAsyncThunk(
    'farmvestEmployees/deleteEmployee',
    async (id: number, { rejectWithValue, dispatch }) => {
        try {
            const response = await farmvestService.deleteEmployee(id);
            // Refresh list after deletion
            dispatch(fetchEmployees(undefined));
            return response;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to delete employee';
            return rejectWithValue(message);
        }
    }
);

export interface RoleCounts {
    FARM_MANAGER: number;
    SUPERVISOR: number;
    DOCTOR: number;
    ASSISTANT_DOCTOR: number;
    [key: string]: number;
}

export const fetchRoleCounts = createAsyncThunk(
    'farmvestEmployees/fetchRoleCounts',
    async (_, { rejectWithValue }) => {
        try {
            const roles = ['FARM_MANAGER', 'SUPERVISOR', 'DOCTOR', 'ASSISTANT_DOCTOR'];
            const promises = roles.map(role =>
                farmvestService.getEmployees({ role, size: 1, page: 1 })
                    .then(response => {
                        const count =
                            response.pagination?.total_items ||
                            response.pagination?.total_count ||
                            response.data?.pagination?.total_items ||
                            response.total_users ||
                            response.total ||
                            response.count ||
                            response.total_count ||
                            (Array.isArray(response) ? response.length :
                                (response.data && Array.isArray(response.data) ? response.data.length : 0));
                        return { role, count: Number(count) || 0 };
                    })
                    .catch(() => ({ role, count: 0 }))
            );

            const results = await Promise.all(promises);

            const counts: RoleCounts = {
                FARM_MANAGER: 0,
                SUPERVISOR: 0,
                DOCTOR: 0,
                ASSISTANT_DOCTOR: 0,
            };

            results.forEach(({ role, count }) => {
                counts[role] = count;
            });

            return counts;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch role counts');
        }
    }
);



interface EmployeesState {
    employees: FarmvestEmployee[];
    totalCount: number;
    roleCounts: RoleCounts;
    loading: boolean;
    roleCountsLoading: boolean;
    createLoading: boolean;
    deleteLoading: boolean;
    error: string | null;
    successMessage: string | null;
}

const initialState: EmployeesState = {
    employees: [],
    totalCount: 0,
    roleCounts: {
        FARM_MANAGER: 0,
        SUPERVISOR: 0,
        DOCTOR: 0,
        ASSISTANT_DOCTOR: 0,
    },
    loading: false,
    roleCountsLoading: false,
    createLoading: false,
    deleteLoading: false,
    error: null,
    successMessage: null,
};



const employeesSlice = createSlice({
    name: 'farmvestEmployees',
    initialState,
    reducers: {
        setEmployees: (state, action: PayloadAction<FarmvestEmployee[]>) => {
            state.employees = action.payload;
        },
        clearMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },

    extraReducers: (builder) => {
        builder
            .addCase(fetchEmployees.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEmployees.fulfilled, (state, action) => {
                state.loading = false;
                // Handle both array (old fallback) and object with employees/totalCount return
                if (action.payload && 'totalCount' in action.payload) {
                    state.employees = action.payload.employees;
                    state.totalCount = action.payload.totalCount;
                } else {
                    state.employees = action.payload as unknown as FarmvestEmployee[];
                    state.totalCount = (action.payload as unknown as FarmvestEmployee[]).length;
                }
            })
            .addCase(fetchEmployees.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Create Employee
            .addCase(createEmployee.pending, (state) => {
                state.createLoading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(createEmployee.fulfilled, (state, action) => {
                state.createLoading = false;
                state.successMessage = action.payload?.message || 'Employee created successfully';
            })
            .addCase(createEmployee.rejected, (state, action) => {
                state.createLoading = false;
                state.error = action.payload as string;
            })
            // Delete Employee
            .addCase(deleteEmployee.pending, (state) => {
                state.deleteLoading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(deleteEmployee.fulfilled, (state, action) => {
                state.deleteLoading = false;
                state.successMessage = action.payload?.message || 'Employee deleted successfully';
            })
            .addCase(deleteEmployee.rejected, (state, action) => {
                state.deleteLoading = false;
                state.error = action.payload as string;
            })
            // Fetch Role Counts
            .addCase(fetchRoleCounts.pending, (state) => {
                state.roleCountsLoading = true;
            })
            .addCase(fetchRoleCounts.fulfilled, (state, action) => {
                state.roleCountsLoading = false;
                state.roleCounts = action.payload;
            })
            .addCase(fetchRoleCounts.rejected, (state) => {
                state.roleCountsLoading = false;
            });
    },


});

export const { setEmployees, clearMessages } = employeesSlice.actions;

export const employeesReducer = employeesSlice.reducer;
export default employeesSlice.reducer;
