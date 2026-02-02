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
            } else if (response && response.data && (Array.isArray(response.data.employees) || Array.isArray(response.data.users))) {
                rawData = response.data.employees || response.data.users;
            } else {
                // Fallback: check if status is 200 and data exists but hasn't been caught yet
                if (response && response.status === 200 && Array.isArray(response.data)) {
                    rawData = response.data;
                }
            }

            if (rawData.length > 0 || (response && response.status === 'success')) {
                // Map the data to match FarmvestEmployee interface
                const mappedData = rawData.map((item: any, index: number) => {
                    // Normalize status
                    const rawStatus = item.is_active !== undefined ? item.is_active : item.active_status;
                    const isActive = Number(rawStatus) ? 1 : 0;

                    return {
                        ...item,
                        id: item.id || item.investor_id || index, // Fallback to index if no ID
                        first_name: item.first_name || '',
                        last_name: item.last_name || '',
                        email: item.email || '',
                        mobile: item.mobile || item.phone_number || '', // Map phone_number to mobile
                        phone_number: item.mobile || item.phone_number || '', // Ensure phone_number is also available for component
                        roles: item.roles || ['Investor'], // Default role
                        is_active: isActive,
                        active_status: isActive, // Sync both fields
                        joining_date: item.created_at || item.joining_date || ''
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




export const updateEmployeeStatus = createAsyncThunk(
    'farmvestEmployees/updateEmployeeStatus',
    async ({ mobile, status }: { mobile: string; status: boolean }, { rejectWithValue, dispatch }) => {
        try {
            if (status) {
                await farmvestService.activateUser(mobile);
            } else {
                await farmvestService.deactivateUser(mobile);
            }
            dispatch(fetchEmployees(undefined));
            return { mobile, status };
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to update employee status';
            return rejectWithValue(message);
        }
    }
);

export const fetchRoleCounts = createAsyncThunk(
    'farmvestEmployees/fetchRoleCounts',
    async (_, { rejectWithValue }) => {
        try {
            // Fetch a large number to ensure we get most employees for accurate counts
            // Ideally backend should provide a stats endpoint
            const response = await farmvestService.getEmployees({ size: 1000 });

            let allEmployees: any[] = [];

            if (Array.isArray(response)) {
                allEmployees = response;
            } else if (response && Array.isArray(response.data)) {
                allEmployees = response.data;
            } else if (response && (response.users || response.employees)) {
                allEmployees = response.users || response.employees;
            } else if (response && response.data && (Array.isArray(response.data.employees) || Array.isArray(response.data.users))) {
                allEmployees = response.data.employees || response.data.users;
            }

            const counts: Record<string, number> = {};
            const statusCounts = { active: 0, inactive: 0 };

            allEmployees.forEach((emp: any) => {
                // Roles Count
                let roleToCount: string | null = null;
                if (emp.roles && Array.isArray(emp.roles) && emp.roles.length > 0) {
                    roleToCount = emp.roles[0];
                } else if (emp.role) {
                    roleToCount = emp.role;
                } else if (emp.role_name) {
                    roleToCount = emp.role_name;
                }

                if (roleToCount) {
                    const normalizedRole = String(roleToCount).trim().toUpperCase().replace(/\s+/g, '_');
                    counts[normalizedRole] = (counts[normalizedRole] || 0) + 1;
                }

                // Status Count
                const rawStatus = emp.is_active !== undefined ? emp.is_active : emp.active_status;
                if (Number(rawStatus)) {
                    statusCounts.active++;
                } else {
                    statusCounts.inactive++;
                }
            });
            return { roleCounts: counts, statusCounts };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

interface EmployeesState {
    employees: FarmvestEmployee[];
    totalCount: number;
    loading: boolean;
    createLoading: boolean;
    deleteLoading: boolean;
    error: string | null;
    successMessage: string | null;
    roleCounts: Record<string, number>;
    statusCounts: { active: number; inactive: number };
    updateStatusLoading: string | null;
}

const initialState: EmployeesState = {
    employees: [],
    totalCount: 0,
    loading: false,
    createLoading: false,
    deleteLoading: false,
    error: null,
    successMessage: null,
    roleCounts: {},
    statusCounts: { active: 0, inactive: 0 },
    updateStatusLoading: null,
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
            .addCase(fetchRoleCounts.fulfilled, (state, action) => {
                state.roleCounts = action.payload.roleCounts;
                state.statusCounts = action.payload.statusCounts;
            })
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
            // Update Employee Status
            .addCase(updateEmployeeStatus.pending, (state, action) => {
                state.updateStatusLoading = action.meta.arg.mobile;
                state.error = null;
            })
            .addCase(updateEmployeeStatus.fulfilled, (state, action) => {
                state.updateStatusLoading = null;
                state.successMessage = `Employee ${action.meta.arg.status ? 'activated' : 'deactivated'} successfully`;
                // Optimistic update
                const employee = state.employees.find(e => e.mobile === action.meta.arg.mobile);
                if (employee) {
                    employee.active_status = action.meta.arg.status ? 1 : 0;
                    employee.is_active = action.meta.arg.status ? 1 : 0;
                }
            })
            .addCase(updateEmployeeStatus.rejected, (state, action) => {
                state.updateStatusLoading = null;
                state.error = action.payload as string;
            });
    },


});

export const { setEmployees, clearMessages } = employeesSlice.actions;

export const employeesReducer = employeesSlice.reducer;
export default employeesSlice.reducer;
