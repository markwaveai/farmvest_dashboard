import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
    adminMobile: string;
    adminName: string;
    adminRole: string;
    lastLogin: string;
    presentLogin: string;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    adminMobile: '',
    adminName: '',
    adminRole: '',
    lastLogin: '',
    presentLogin: '',
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setSession: (state, action: PayloadAction<Omit<AuthState, 'isAuthenticated'>>) => {
            return { ...action.payload, isAuthenticated: true };
        },
        clearSession: () => initialState,
    },
});

export const { setSession, clearSession } = authSlice.actions;
export const authReducer = authSlice.reducer;
export default authSlice.reducer;
