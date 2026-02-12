import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { farmvestService } from '../../../services/farmvest_api';
import { FarmvestEmployee } from '../../../types/farmvest';

export const fetchEmployees = createAsyncThunk(
    'farmvestEmployees/fetchEmployees',
    async (params: { role?: string; active_status?: number; sort_by?: number; page?: number; size?: number } | undefined, { rejectWithValue }) => {
        try {
            const response = await farmvestService.getEmployees(params);

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
                        id: item.id || item.user_id || item.employee_id || item.emp_id || item.employee_code || item.investor_id || item.user?.id || item.data?.id || index, // Robust fallback for ID including nested objects
                        first_name: item.first_name || '',
                        last_name: item.last_name || '',
                        email: item.email || '',
                        mobile: item.mobile || item.phone_number || '', // Map phone_number to mobile
                        phone_number: item.mobile || item.phone_number || '', // Ensure phone_number is also available for component
                        roles: item.roles || ['Investor'], // Default role
                        is_active: isActive,
                        active_status: isActive, // Sync both fields
                        joining_date: item.created_at || item.joining_date || '',
                        farm_name: item.farm_name || item.farm?.farm_name || item.farm?.name || (item.farm_details ? item.farm_details.farm_name : '') || item.farm_id || item.farm?.id || '',
                        shed_name: item.shed_name || item.shed?.shed_name || item.shed?.name || (item.shed_details ? item.shed_details.shed_name : '') || item.shed_id || item.shed?.id || ''
                    };
                });

                // Extract total count if available
                // Prioritize the user-specified structure: "pagination": { "total_items": 5, ... }
                const pagination = response.pagination || response.data?.pagination;

                const totalCount =
                    pagination?.total_items ||
                    pagination?.total_count ||
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
            dispatch(fetchRoleCounts()); // Refresh allEmployees for search
            return response;
        } catch (error: any) {
            // Pass the full error data if available for debugging validation errors
            const errorData = error.response?.data || error.message || 'Failed to create employee';
            return rejectWithValue(errorData);
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
            dispatch(fetchRoleCounts()); // Refresh allEmployees for search
            return response;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to delete employee';
            return rejectWithValue(message);
        }
    }
);




export const updateEmployee = createAsyncThunk(
    'farmvestEmployees/updateEmployee',
    async (payload: { user_id: number; role: string; farm_id: number; shed_id?: number }, { rejectWithValue, dispatch }) => {
        try {
            const response = await farmvestService.updateEmployee(payload);
            dispatch(fetchEmployees(undefined));
            dispatch(fetchRoleCounts());
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to update employee');
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
            dispatch(fetchRoleCounts()); // Refresh allEmployees for search and counts
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

            // Map allEmployees to follow the same structure as fetchEmployees for consistency
            const mappedEmployees = allEmployees.map((item: any, index: number) => {
                const rawStatus = item.is_active !== undefined ? item.is_active : item.active_status;
                const isActive = Number(rawStatus) ? 1 : 0;
                return {
                    ...item,
                    id: item.id || item.user_id || item.employee_id || item.emp_id || item.employee_code || item.investor_id || item.user?.id || item.data?.id || index,
                    first_name: item.first_name || '',
                    last_name: item.last_name || '',
                    email: item.email || '',
                    mobile: item.mobile || item.phone_number || '',
                    phone_number: item.mobile || item.phone_number || '',
                    roles: item.roles || ['Investor'],
                    is_active: isActive,
                    active_status: isActive,
                    joining_date: (item.created_at || item.joining_date || '').split('T')[0],
                    farm_name: item.farm_name || item.farm?.farm_name || item.farm?.name || (item.farm_details ? item.farm_details.farm_name : '') || item.farm_id || item.farm?.id || '',
                    shed_name: item.shed_name || item.shed?.shed_name || item.shed?.name || (item.shed_details ? item.shed_details.shed_name : '') || item.shed_id || item.shed?.id || ''
                };
            });

            return { roleCounts: counts, statusCounts, allEmployees: mappedEmployees };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

interface EmployeesState {
    employees: FarmvestEmployee[];
    allEmployees: FarmvestEmployee[];
    totalCount: number;
    globalTotalCount: number;
    loading: boolean;
    createLoading: boolean;
    deleteLoading: boolean;
    updateLoading: boolean;
    error: string | null;
    successMessage: string | null;
    roleCounts: Record<string, number>;
    statusCounts: { active: number; inactive: number };
    updateStatusLoading: string | null;
}

const initialState: EmployeesState = {
    employees: [],
    allEmployees: [],
    totalCount: 0,
    globalTotalCount: 0,
    loading: false,
    createLoading: false,
    deleteLoading: false,
    updateLoading: false,
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
                state.allEmployees = action.payload.allEmployees || [];
                state.globalTotalCount = (action.payload.allEmployees || []).length;
            })
        builder
            .addCase(fetchEmployees.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEmployees.fulfilled, (state, action) => {
                state.loading = false;
                // Handle both array (old fallback) and object with employees/totalCount return
                // Cast payload to any to avoid TypeScript inference issues with complex union types in thunks
                const payload = action.payload as any;

                if (payload && 'employees' in payload) {
                    state.employees = payload.employees;
                    state.totalCount = payload.totalCount || payload.employees.length;
                } else if (Array.isArray(payload)) {
                    state.employees = payload;
                    state.totalCount = payload.length;
                } else {
                    // Fallback
                    state.employees = [];
                    state.totalCount = 0;
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
                // Handle object payloads (validation errors) to prevent React rendering crash
                if (typeof action.payload === 'object' && action.payload !== null) {
                    state.error = JSON.stringify(action.payload);
                } else {
                    state.error = action.payload as string || 'An error occurred';
                }
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
            })
            // Update Employee Assignment
            .addCase(updateEmployee.pending, (state) => {
                state.updateLoading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(updateEmployee.fulfilled, (state, action) => {
                state.updateLoading = false;
                state.successMessage = action.payload?.message || 'Employee updated successfully';
            })
            .addCase(updateEmployee.rejected, (state, action) => {
                state.updateLoading = false;
                state.error = typeof action.payload === 'string' ? action.payload : JSON.stringify(action.payload);
            });
    },


});

export const { setEmployees, clearMessages } = employeesSlice.actions;

export const employeesReducer = employeesSlice.reducer;
export default employeesSlice.reducer;
