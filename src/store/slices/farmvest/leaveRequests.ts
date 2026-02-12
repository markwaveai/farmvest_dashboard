import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { farmvestService } from '../../../services/farmvest_api';
import { LeaveRequest } from '../../../types/farmvest';

export const fetchLeaveRequests = createAsyncThunk(
    'farmvestLeaveRequests/fetchLeaveRequests',
    async (params: { status_filter?: string; page?: number; size?: number } | undefined, { rejectWithValue }) => {
        try {
            const response = await farmvestService.getLeaveRequests(params);
            return {
                leaveRequests: response.data || [],
                count: response.count || 0,
                pagination: response.pagination || null,
            };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch leave requests');
        }
    }
);

export const createLeaveRequest = createAsyncThunk(
    'farmvestLeaveRequests/createLeaveRequest',
    async (payload: any, { rejectWithValue, dispatch }) => {
        try {
            const response = await farmvestService.createLeaveRequest(payload);
            dispatch(fetchLeaveRequests(undefined));
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to create leave request');
        }
    }
);

export const updateLeaveStatus = createAsyncThunk(
    'farmvestLeaveRequests/updateLeaveStatus',
    async ({ leaveId, status, rejection_reason }: { leaveId: number; status: string; rejection_reason?: string }, { rejectWithValue, dispatch }) => {
        try {
            const response = await farmvestService.updateLeaveStatus(leaveId, { status, rejection_reason });
            dispatch(fetchLeaveRequests(undefined));
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to update leave status');
        }
    }
);

interface LeaveRequestsState {
    leaveRequests: LeaveRequest[];
    count: number;
    loading: boolean;
    createLoading: boolean;
    actionLoading: number | null;
    error: string | null;
    successMessage: string | null;
    pagination: { current_page: number; total_pages: number; total_items: number } | null;
}

const initialState: LeaveRequestsState = {
    leaveRequests: [],
    count: 0,
    loading: false,
    createLoading: false,
    actionLoading: null,
    error: null,
    successMessage: null,
    pagination: null,
};

const leaveRequestsSlice = createSlice({
    name: 'farmvestLeaveRequests',
    initialState,
    reducers: {
        clearLeaveMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchLeaveRequests.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchLeaveRequests.fulfilled, (state, action) => {
                state.loading = false;
                state.leaveRequests = action.payload.leaveRequests;
                state.count = action.payload.count;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchLeaveRequests.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createLeaveRequest.pending, (state) => {
                state.createLoading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(createLeaveRequest.fulfilled, (state, action) => {
                state.createLoading = false;
                state.successMessage = action.payload?.message || 'Leave request created successfully';
            })
            .addCase(createLeaveRequest.rejected, (state, action) => {
                state.createLoading = false;
                state.error = typeof action.payload === 'string' ? action.payload : JSON.stringify(action.payload);
            })
            .addCase(updateLeaveStatus.pending, (state, action) => {
                state.actionLoading = action.meta.arg.leaveId;
                state.error = null;
            })
            .addCase(updateLeaveStatus.fulfilled, (state, action) => {
                state.actionLoading = null;
                state.successMessage = action.payload?.message || 'Leave status updated';
            })
            .addCase(updateLeaveStatus.rejected, (state, action) => {
                state.actionLoading = null;
                state.error = action.payload as string;
            });
    },
});

export const { clearLeaveMessages } = leaveRequestsSlice.actions;
export const leaveRequestsReducer = leaveRequestsSlice.reducer;
export default leaveRequestsSlice.reducer;
