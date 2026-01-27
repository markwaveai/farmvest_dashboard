import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { farmvestService } from '../../../services/farmvest_api';
import { FarmvestEmployee } from '../../../types/farmvest';

export const fetchEmployees = createAsyncThunk(
    'farmvestEmployees/fetchEmployees',
    async (role: string | undefined, { rejectWithValue }) => {
        try {
            const response = await farmvestService.getEmployees(role);
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
                const mappedData = rawData.map((item: any, index: number) => ({
                    id: item.id || item.investor_id || index, // Fallback to index if no ID
                    first_name: item.first_name || '',
                    last_name: item.last_name || '',
                    email: item.email || '',
                    mobile: item.mobile || item.phone_number || '', // Map phone_number to mobile
                    roles: item.roles || ['Investor'], // Default role
                    is_active: item.is_active !== undefined ? item.is_active : (item.active_status ? 1 : 0), // Map boolean active_status to number
                    // Preserve other fields just in case
                    ...item
                }));
                return mappedData;
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



interface EmployeesState {
    employees: FarmvestEmployee[];
    loading: boolean;
    createLoading: boolean;
    deleteLoading: boolean;
    error: string | null;
    successMessage: string | null;
}



const initialState: EmployeesState = {
    employees: [],
    loading: false,
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
                state.employees = action.payload;
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
            });
    },


});

export const { setEmployees, clearMessages } = employeesSlice.actions;

export const employeesReducer = employeesSlice.reducer;
export default employeesSlice.reducer;
