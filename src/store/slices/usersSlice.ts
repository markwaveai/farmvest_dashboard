import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';

// Async Thunks
export const fetchReferralUsers = createAsyncThunk(
    'users/fetchReferralUsers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(API_ENDPOINTS.getReferrals());
            return response.data.users || [];
        } catch (error: any) {
            return rejectWithValue('Failed to fetch referral users');
        }
    }
);

export const fetchExistingCustomers = createAsyncThunk(
    'users/fetchExistingCustomers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(API_ENDPOINTS.getUsers());
            return response.data.users || [];
        } catch (error: any) {
            return rejectWithValue('Failed to fetch existing customers');
        }
    }
);

export const createReferralUser = createAsyncThunk(
    'users/createReferralUser',
    async (userData: any, { dispatch, rejectWithValue }) => {
        try {
            const response = await axios.post(API_ENDPOINTS.createUser(), userData);
            // If successful, refresh the referral list
            dispatch(fetchReferralUsers());
            return response.data;
        } catch (error: any) {
            // Handle "User already exists" or generic errors
            const msg = error?.response?.data?.message || 'Failed to create user';
            return rejectWithValue(msg);
        }
    }
);

export const deactivateRequestOtp = createAsyncThunk(
    'users/deactivateRequestOtp',
    async (payload: { mobile: string; channel: string; }, { rejectWithValue }) => {
        try {
            const response = await axios.post(API_ENDPOINTS.deactivateRequestOtp(), payload);
            return response.data;
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Failed to send OTP';
            return rejectWithValue(msg);
        }
    }
);

export const deactivateConfirm = createAsyncThunk(
    'users/deactivateConfirm',
    async (payload: { mobile: string; otp: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(API_ENDPOINTS.deactivateConfirm(), payload);
            return response.data;
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Failed to deactivate account';
            return rejectWithValue(msg);
        }
    }
);

export const activateRequestOtp = createAsyncThunk(
    'users/activateRequestOtp',
    async (payload: { mobile: string; channel: string; }, { rejectWithValue }) => {
        try {
            const response = await axios.post(API_ENDPOINTS.requestReactivationOtp(), payload);
            return response.data;
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Failed to send OTP';
            return rejectWithValue(msg);
        }
    }
);

export const activateConfirm = createAsyncThunk(
    'users/activateConfirm',
    async (payload: { mobile: string; otp: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(API_ENDPOINTS.confirmReactivation(), payload);
            return response.data;
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Failed to activate account';
            return rejectWithValue(msg);
        }
    }
);

export const fetchAdminProfile = createAsyncThunk(
    'users/fetchAdminProfile',
    async (mobile: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(API_ENDPOINTS.getUserDetails(mobile));
            return response.data.user;
        } catch (error: any) {
            return rejectWithValue('Failed to fetch admin profile');
        }
    }
);

export interface UsersState {
    referralUsers: any[];
    existingCustomers: any[];
    referralLoading: boolean;
    existingLoading: boolean;
    loading: boolean; // Computed loading state
    error: string | null;
    actionLoading: boolean; // For create action
    deactivation: {
        loading: boolean;
        error: string | null;
        success: boolean;
        message: string | null;
    };
    activation: {
        loading: boolean;
        error: string | null;
        success: boolean;
        message: string | null;
    };
    adminProfile: any | null;
}

const initialState: UsersState = {
    referralUsers: [],
    existingCustomers: [],
    referralLoading: false,
    existingLoading: false,
    loading: false,
    error: null,
    actionLoading: false,
    deactivation: {
        loading: false,
        error: null,
        success: false,
        message: null,
    },
    activation: {
        loading: false,
        error: null,
        success: false,
        message: null,
    },
    adminProfile: null,
};

const usersSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        setReferralUsers: (state, action: PayloadAction<any[]>) => {
            state.referralUsers = action.payload;
        },
        setExistingCustomers: (state, action: PayloadAction<any[]>) => {
            state.existingCustomers = action.payload;
        },
        resetDeactivationState: (state) => {
            state.deactivation = {
                loading: false,
                error: null,
                success: false,
                message: null,
            };
        },
        resetActivationState: (state) => {
            state.activation = {
                loading: false,
                error: null,
                success: false,
                message: null,
            };
        },
    },
    extraReducers: (builder) => {
        // Fetch Referral Users
        builder.addCase(fetchReferralUsers.pending, (state) => {
            state.referralLoading = true;
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchReferralUsers.fulfilled, (state, action) => {
            state.referralLoading = false;
            state.loading = state.existingLoading;
            state.referralUsers = action.payload;
        });
        builder.addCase(fetchReferralUsers.rejected, (state, action) => {
            state.referralLoading = false;
            state.loading = state.existingLoading;
            state.error = action.payload as string;
        });

        // Fetch Existing Customers
        builder.addCase(fetchExistingCustomers.pending, (state) => {
            state.existingLoading = true;
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchExistingCustomers.fulfilled, (state, action) => {
            state.existingLoading = false;
            state.loading = state.referralLoading;
            state.existingCustomers = action.payload;
        });
        builder.addCase(fetchExistingCustomers.rejected, (state, action) => {
            state.existingLoading = false;
            state.loading = state.referralLoading;
            state.error = action.payload as string;
        });

        // Create Referral User
        builder.addCase(createReferralUser.pending, (state) => {
            state.actionLoading = true;
            state.error = null;
        });
        builder.addCase(createReferralUser.fulfilled, (state) => {
            state.actionLoading = false;
        });
        builder.addCase(createReferralUser.rejected, (state, action) => {
            state.actionLoading = false;
            state.error = action.payload as string;
        });

        // Deactivate Request OTP
        builder.addCase(deactivateRequestOtp.pending, (state) => {
            state.deactivation.loading = true;
            state.deactivation.error = null;
            state.deactivation.message = null;
        });
        builder.addCase(deactivateRequestOtp.fulfilled, (state, action: PayloadAction<any>) => {
            state.deactivation.loading = false;
            state.deactivation.success = true;
            state.deactivation.message = action.payload.message;
        });
        builder.addCase(deactivateRequestOtp.rejected, (state, action) => {
            state.deactivation.loading = false;
            state.deactivation.error = action.payload as string;
        });

        // Deactivate Confirm
        builder.addCase(deactivateConfirm.pending, (state) => {
            state.deactivation.loading = true;
            state.deactivation.error = null;
            state.deactivation.message = null;
        });
        builder.addCase(deactivateConfirm.fulfilled, (state, action: PayloadAction<any>) => {
            state.deactivation.loading = false;
            state.deactivation.success = true;
            state.deactivation.message = action.payload.message;
        });
        builder.addCase(deactivateConfirm.rejected, (state, action) => {
            state.deactivation.loading = false;
            state.deactivation.error = action.payload as string;
        });

        // Activate Request OTP
        builder.addCase(activateRequestOtp.pending, (state) => {
            state.activation.loading = true;
            state.activation.error = null;
            state.activation.message = null;
        });
        builder.addCase(activateRequestOtp.fulfilled, (state, action: PayloadAction<any>) => {
            state.activation.loading = false;
            state.activation.success = true;
            state.activation.message = action.payload.message;
        });
        builder.addCase(activateRequestOtp.rejected, (state, action) => {
            state.activation.loading = false;
            state.activation.error = action.payload as string;
        });

        // Activate Confirm
        builder.addCase(activateConfirm.pending, (state) => {
            state.activation.loading = true;
            state.activation.error = null;
            state.activation.message = null;
        });
        builder.addCase(activateConfirm.fulfilled, (state, action: PayloadAction<any>) => {
            state.activation.loading = false;
            state.activation.success = true;
            state.activation.message = action.payload.message;
        });
        builder.addCase(activateConfirm.rejected, (state, action) => {
            state.activation.loading = false;
            state.activation.error = action.payload as string;
        });

        // Fetch Admin Profile
        builder.addCase(fetchAdminProfile.pending, (state) => {
            // Option to handle loading state specifically for admin profile if needed
        });
        builder.addCase(fetchAdminProfile.fulfilled, (state, action) => {
            state.adminProfile = action.payload;
        });
        builder.addCase(fetchAdminProfile.rejected, (state) => {
            // Handle error if needed
        });
    }
});

export const { setReferralUsers, setExistingCustomers, resetDeactivationState, resetActivationState } = usersSlice.actions;
export const usersReducer = usersSlice.reducer;
export default usersSlice.reducer;
