import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';

// Async Thunks
export const fetchPendingUnits = createAsyncThunk(
    'orders/fetchPendingUnits',
    async ({ adminMobile, page = 1, pageSize = 10, paymentStatus, paymentType, transferMode, search }: {
        adminMobile: string;
        page?: number;
        pageSize?: number;
        paymentStatus?: string;
        paymentType?: string;
        transferMode?: string;
        search?: string;
    }, { rejectWithValue }) => {
        try {
            const params: any = { page, page_size: pageSize };
            if (paymentStatus && paymentStatus !== 'All Status') params.paymentStatus = paymentStatus;
            if (paymentType && paymentType !== 'All Payments') params.paymentType = paymentType;
            if (transferMode && transferMode !== 'All Modes') params.transferMode = transferMode;
            if (search) params.search = search;

            const response = await axios.get(API_ENDPOINTS.getPendingUnits(), {
                headers: { 'X-Admin-Mobile': adminMobile },
                params
            });
            return response.data; // Return full response to get count
        } catch (error: any) {
            const rawDetail = error?.response?.data?.detail;
            let msg: string;
            if (typeof rawDetail === 'string') {
                msg = rawDetail;
            } else if (Array.isArray(rawDetail)) {
                const first = rawDetail[0];
                if (first && typeof first === 'object' && 'msg' in first) {
                    msg = String(first.msg);
                } else {
                    msg = 'Failed to load orders';
                }
            } else if (rawDetail && typeof rawDetail === 'object' && 'msg' in rawDetail) {
                msg = String(rawDetail.msg);
            } else {
                msg = 'Failed to load orders';
            }
            return rejectWithValue(msg);
        }
    }
);

export const approveOrder = createAsyncThunk(
    'orders/approveOrder',
    async ({ unitId, adminMobile, comments }: { unitId: string; adminMobile: string; comments?: string }, { dispatch, rejectWithValue, getState }) => {
        try {
            await axios.post(API_ENDPOINTS.approveUnit(), { orderId: unitId, comments }, {
                headers: { 'X-Admin-Mobile': adminMobile }
            });
            // Refresh list after success, preserving filters
            const state = getState() as any;
            const { filters } = state.orders;
            dispatch(fetchPendingUnits({
                adminMobile,
                page: filters.page,
                pageSize: filters.pageSize,
                paymentStatus: filters.statusFilter,
                paymentType: filters.paymentTypeFilter,
                transferMode: filters.transferModeFilter
            }));
            return unitId;
        } catch (error: any) {
            return rejectWithValue('Failed to approve order');
        }
    }
);

export const rejectOrder = createAsyncThunk(
    'orders/rejectOrder',
    async ({ unitId, adminMobile, comments }: { unitId: string; adminMobile: string; comments?: string }, { dispatch, rejectWithValue, getState }) => {
        try {
            await axios.post(API_ENDPOINTS.rejectUnit(), { orderId: unitId, comments }, {
                headers: { 'X-Admin-Mobile': adminMobile }
            });
            // Refresh list after success, preserving filters
            const state = getState() as any;
            const { filters } = state.orders;
            dispatch(fetchPendingUnits({
                adminMobile,
                page: filters.page,
                pageSize: filters.pageSize,
                paymentStatus: filters.statusFilter,
                paymentType: filters.paymentTypeFilter,
                transferMode: filters.transferModeFilter
            }));
            return unitId;
        } catch (error: any) {
            return rejectWithValue('Failed to reject order');
        }
    }
);

export const fetchStatusCounts = createAsyncThunk(
    'orders/fetchStatusCounts',
    async ({ adminMobile }: { adminMobile: string }, { rejectWithValue }) => {
        try {
            const statuses = [
                'All Status',
                'PENDING_ADMIN_VERIFICATION',
                'PAID',
                'REJECTED',
                'PENDING_PAYMENT'
            ];

            const requests = statuses.map(status => {
                const params: any = { page: 1, page_size: 1 }; // Minimal fetch to get count
                if (status !== 'All Status') params.paymentStatus = status;
                return axios.get(API_ENDPOINTS.getPendingUnits(), {
                    headers: { 'X-Admin-Mobile': adminMobile },
                    params
                }).then(res => ({
                    status,
                    count: res.data.total_filtered ?? (res.data.total_count || res.data.total || res.data.count || 0),
                    totalAll: res.data.total_all_orders
                }));
            });

            const results = await Promise.all(requests);
            return results;
        } catch (error: any) {
            return rejectWithValue('Failed to fetch status counts');
        }
    }
);

export interface OrdersState {
    pendingUnits: any[];
    loading: boolean;
    error: string | null;
    actionLoading: boolean; // For approve/reject actions
    trackingData: {
        [key: string]: {
            currentStageId: number;
            history: { [stageId: number]: { date: string, time: string, description?: string } };
            stages?: Array<{ id: number; label: string; description: string; rawStage?: string }>;
        }
    };
    totalCount: number;
    totalAllOrders: number;
    statusCounts: { [key: string]: number };
    filters: {
        searchQuery: string; // Keeping for client-side or future use
        paymentFilter: string;
        paymentTypeFilter: string;
        transferModeFilter: string;
        statusFilter: string;
        page: number;
        pageSize: number;
    };
    expansion: {
        expandedOrderId: string | null;
        activeUnitIndex: number | null;
        showFullDetails: boolean;
    };
}

const getInitialExpansion = () => {
    try {
        return {
            expandedOrderId: localStorage.getItem('orders_expandedOrderId') || null,
            activeUnitIndex: localStorage.getItem('orders_activeUnitIndex') ? Number(localStorage.getItem('orders_activeUnitIndex')) : null,
            showFullDetails: localStorage.getItem('orders_showFullDetails') === 'true',
        };
    } catch {
        return { expandedOrderId: null, activeUnitIndex: null, showFullDetails: false };
    }
};

const getInitialTrackingData = () => {
    try {
        const saved = localStorage.getItem('orders_trackingData');
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
};

const initialState: OrdersState = {
    pendingUnits: [],
    loading: false,
    error: null,
    actionLoading: false,
    trackingData: getInitialTrackingData(),
    totalCount: 0,
    totalAllOrders: 0,
    statusCounts: {},
    filters: {
        searchQuery: localStorage.getItem('orders_searchQuery') || '',
        paymentFilter: localStorage.getItem('orders_paymentFilter') || 'All Payments',
        paymentTypeFilter: localStorage.getItem('orders_paymentTypeFilter') || 'All Payments',
        transferModeFilter: localStorage.getItem('orders_transferModeFilter') || 'All Modes',
        statusFilter: localStorage.getItem('orders_statusFilter') || 'PENDING_ADMIN_VERIFICATION',
        page: 1,
        pageSize: 15,
    },
    expansion: getInitialExpansion(),
};

const ordersSlice = createSlice({
    name: 'orders',
    initialState,
    reducers: {
        setPendingUnits: (state, action: PayloadAction<any[]>) => {
            state.pendingUnits = action.payload;
        },
        setOrdersError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.filters.searchQuery = action.payload;
        },
        setPaymentFilter: (state, action: PayloadAction<string>) => {
            state.filters.paymentFilter = action.payload; // Legacy, using paymentTypeFilter now ideally, but keeping for compatibility if needed.
            state.filters.paymentTypeFilter = action.payload;
        },
        setTransferModeFilter: (state, action: PayloadAction<string>) => {
            state.filters.transferModeFilter = action.payload;
        },
        setStatusFilter: (state, action: PayloadAction<string>) => {
            state.filters.statusFilter = action.payload;
        },
        setPage: (state, action: PayloadAction<number>) => {
            state.filters.page = action.payload;
        },
        setExpandedOrderId: (state, action: PayloadAction<string | null>) => {
            state.expansion.expandedOrderId = action.payload;
        },
        setActiveUnitIndex: (state, action: PayloadAction<number | null>) => {
            state.expansion.activeUnitIndex = action.payload;
        },
        setShowFullDetails: (state, action: PayloadAction<boolean>) => {
            state.expansion.showFullDetails = action.payload;
        },
        updateTrackingData: (state, action: PayloadAction<{ key: string; stageId: number; date: string; time: string }>) => {
            const { key, stageId, date, time } = action.payload;
            if (!state.trackingData[key]) {
                state.trackingData[key] = { currentStageId: stageId, history: {} };
            }
            state.trackingData[key].currentStageId = stageId;
            state.trackingData[key].history[stageId] = { date, time };
        },
        setInitialTracking: (state, action: PayloadAction<{ key: string; data: any }>) => {
            state.trackingData[action.payload.key] = action.payload.data;
        }
    },
    extraReducers: (builder) => {
        // Fetch Pending Units
        builder.addCase(fetchPendingUnits.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchPendingUnits.fulfilled, (state, action) => {
            state.loading = false;
            // Handle response format: { orders: [], total_count: 123 } or just array
            const payload = action.payload;
            let currentCount = 0;

            if (payload && Array.isArray(payload.orders)) {
                state.pendingUnits = payload.orders;
                // Prefer total_filtered for pagination if available, otherwise fallback
                currentCount = payload.total_filtered ?? (payload.total_count || payload.total || payload.count || payload.orders.length);
                state.totalCount = currentCount;

                // Set total_all_orders if available
                if (typeof payload.total_all_orders === 'number') {
                    state.totalAllOrders = payload.total_all_orders;
                }
            } else if (Array.isArray(payload)) {
                state.pendingUnits = payload;
                currentCount = payload.length;
                state.totalCount = currentCount;
            } else {
                state.pendingUnits = [];
                state.totalCount = 0;
            }

            // Update cached count for the current filters if pertinent
            // We only reliably know the count for the CURRENT status filter
            const currentStatus = state.filters.statusFilter;
            // Also ensure other filters are 'All' to be sure this count represents the status count
            // However, even if filtered by paymentType, showing the count for that context is useful
            if (currentStatus) {
                state.statusCounts[currentStatus] = currentCount;
            }
        });
        builder.addCase(fetchPendingUnits.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Approve Order
        builder.addCase(approveOrder.pending, (state) => {
            state.actionLoading = true;
        });
        builder.addCase(approveOrder.fulfilled, (state) => {
            state.actionLoading = false;
        });
        builder.addCase(approveOrder.rejected, (state) => {
            state.actionLoading = false;
        });

        // Reject Order
        builder.addCase(rejectOrder.pending, (state) => {
            state.actionLoading = true;
        });
        builder.addCase(rejectOrder.fulfilled, (state) => {
            state.actionLoading = false;
        });
        builder.addCase(rejectOrder.rejected, (state) => {
            state.actionLoading = false;
        });

        // Fetch Status Counts
        builder.addCase(fetchStatusCounts.fulfilled, (state, action) => {
            action.payload.forEach(({ status, count, totalAll }) => {
                state.statusCounts[status] = count;
                if (typeof totalAll === 'number') {
                    state.totalAllOrders = totalAll;
                }
            });
            // Explicitly ensure 'All Status' matches totalAllOrders if available
            if (state.totalAllOrders > 0) {
                state.statusCounts['All Status'] = state.totalAllOrders;
            }
        });
    }
});

export const {
    setPendingUnits,
    setOrdersError,
    setSearchQuery,
    setPaymentFilter,
    setTransferModeFilter,
    setStatusFilter,
    setPage,
    setExpandedOrderId,
    setActiveUnitIndex,
    setShowFullDetails,
    updateTrackingData,
    setInitialTracking,
} = ordersSlice.actions;

export const ordersReducer = ordersSlice.reducer;
export default ordersSlice.reducer;
