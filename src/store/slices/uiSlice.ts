import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
    activeTab: 'orders' | 'nonVerified' | 'existing' | 'tree' | 'products' | 'tracking' | 'buffaloViz' | 'emi';
    isSidebarOpen: boolean;
    showAdminDetails: boolean;
    modals: {
        referral: boolean;
        editReferral: {
            isOpen: boolean;
            user: any;
        };
        proof: {
            isOpen: boolean;
            data: any;
        };
        rejection: {
            isOpen: boolean;
            unitId: string | null;
        };
        approval: {
            isOpen: boolean;
            unitId: string | null;
        };
        creationRole: 'Investor' | 'Employee' | null;
    };
    snackbar: {
        message: string | null;
        type: 'success' | 'error' | null;
    };
}


const getInitialActiveTab = (): UIState['activeTab'] => {
    const saved = localStorage.getItem('activeTab');
    if (saved && ['orders', 'nonVerified', 'existing', 'tree', 'products', 'tracking', 'buffaloViz', 'emi'].includes(saved)) {
        return saved as UIState['activeTab'];
    }
    return 'orders';
};

const initialState: UIState = {
    activeTab: getInitialActiveTab(),
    isSidebarOpen: window.innerWidth >= 768,
    showAdminDetails: false,
    modals: {
        referral: false,
        editReferral: {
            isOpen: false,
            user: null,
        },
        proof: {
            isOpen: false,
            data: null,
        },
        rejection: {
            isOpen: false,
            unitId: null,
        },
        approval: {
            isOpen: false,
            unitId: null,
        },
        creationRole: null,
    },
    snackbar: {
        message: null,
        type: null,
    },
};


const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setActiveTab: (state, action: PayloadAction<UIState['activeTab']>) => {
            state.activeTab = action.payload;
        },
        toggleSidebar: (state) => {
            state.isSidebarOpen = !state.isSidebarOpen;
        },
        setSidebarOpen: (state, action: PayloadAction<boolean>) => {
            state.isSidebarOpen = action.payload;
        },
        setShowAdminDetails: (state, action: PayloadAction<boolean>) => {
            state.showAdminDetails = action.payload;
        },
        setReferralModalOpen: (state, action: PayloadAction<boolean>) => {
            state.modals.referral = action.payload;
        },
        setEditReferralModal: (state, action: PayloadAction<{ isOpen: boolean; user?: any }>) => {
            state.modals.editReferral.isOpen = action.payload.isOpen;
            if (action.payload.user !== undefined) {
                state.modals.editReferral.user = action.payload.user;
            }
        },
        setProofModal: (state, action: PayloadAction<{ isOpen: boolean; data?: any }>) => {
            state.modals.proof.isOpen = action.payload.isOpen;
            if (action.payload.data !== undefined) {
                state.modals.proof.data = action.payload.data;
            }
        },
        setRejectionModal: (state, action: PayloadAction<{ isOpen: boolean; unitId?: string | null }>) => {
            state.modals.rejection.isOpen = action.payload.isOpen;
            if (action.payload.unitId !== undefined) {
                state.modals.rejection.unitId = action.payload.unitId;
            }
        },
        setApprovalModal: (state, action: PayloadAction<{ isOpen: boolean; unitId?: string | null }>) => {
            state.modals.approval.isOpen = action.payload.isOpen;
            if (action.payload.unitId !== undefined) {
                state.modals.approval.unitId = action.payload.unitId;
            }
        },
        setCreationRole: (state, action: PayloadAction<'Investor' | 'Employee' | null>) => {
            state.modals.creationRole = action.payload;
        },
        setSnackbar: (state, action: PayloadAction<{ message: string | null; type: 'success' | 'error' | null }>) => {
            state.snackbar = action.payload;
        },
    },
});


export const {
    setActiveTab,
    toggleSidebar,
    setSidebarOpen,
    setShowAdminDetails,
    setReferralModalOpen,
    setEditReferralModal,
    setProofModal,
    setRejectionModal,
    setApprovalModal,
    setCreationRole,
    setSnackbar,
} = uiSlice.actions;


export const uiReducer = uiSlice.reducer;
export default uiSlice.reducer;
