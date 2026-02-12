import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { farmvestService } from '../../../services/farmvest_api';
import { FarmvestTicket, TicketStats } from '../../../types/farmvest';

export const fetchTickets = createAsyncThunk(
    'farmvestTickets/fetchTickets',
    async (params: {
        ticket_type?: string;
        status_filter?: string;
        farm_id?: number;
        page?: number;
        size?: number;
    } | undefined, { rejectWithValue }) => {
        try {
            const response = await farmvestService.getTickets(params);
            return {
                tickets: response.data || [],
                counts: response.counts || null,
                pagination: response.pagination || null,
            };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch tickets');
        }
    }
);

export const createTicket = createAsyncThunk(
    'farmvestTickets/createTicket',
    async ({ ticketType, payload }: { ticketType: string; payload: any }, { rejectWithValue, dispatch }) => {
        try {
            const response = await farmvestService.createTicket(ticketType, payload);
            dispatch(fetchTickets(undefined));
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to create ticket');
        }
    }
);

export const assignTicket = createAsyncThunk(
    'farmvestTickets/assignTicket',
    async ({ ticketId, assistantId }: { ticketId: number; assistantId?: number }, { rejectWithValue, dispatch }) => {
        try {
            const response = await farmvestService.assignTicket(ticketId, assistantId);
            dispatch(fetchTickets(undefined));
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to assign ticket');
        }
    }
);

interface TicketsState {
    tickets: FarmvestTicket[];
    counts: TicketStats | null;
    loading: boolean;
    createLoading: boolean;
    error: string | null;
    successMessage: string | null;
    pagination: { current_page: number; total_pages: number; total_items: number } | null;
}

const initialState: TicketsState = {
    tickets: [],
    counts: null,
    loading: false,
    createLoading: false,
    error: null,
    successMessage: null,
    pagination: null,
};

const ticketsSlice = createSlice({
    name: 'farmvestTickets',
    initialState,
    reducers: {
        clearTicketMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTickets.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTickets.fulfilled, (state, action) => {
                state.loading = false;
                state.tickets = action.payload.tickets;
                state.counts = action.payload.counts;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchTickets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createTicket.pending, (state) => {
                state.createLoading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(createTicket.fulfilled, (state, action) => {
                state.createLoading = false;
                state.successMessage = action.payload?.message || 'Ticket created successfully';
            })
            .addCase(createTicket.rejected, (state, action) => {
                state.createLoading = false;
                state.error = typeof action.payload === 'string' ? action.payload : JSON.stringify(action.payload);
            })
            .addCase(assignTicket.pending, (state) => {
                state.error = null;
            })
            .addCase(assignTicket.fulfilled, (state, action) => {
                state.successMessage = action.payload?.message || 'Ticket assigned successfully';
            })
            .addCase(assignTicket.rejected, (state, action) => {
                state.error = action.payload as string;
            });
    },
});

export const { clearTicketMessages } = ticketsSlice.actions;
export const ticketsReducer = ticketsSlice.reducer;
export default ticketsSlice.reducer;
