import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { farmvestService } from '../../../services/farmvest_api';
import { FarmvestTicket, TicketStats } from '../../../types/farmvest';

export const fetchTickets = createAsyncThunk(
    'farmvestTickets/fetchTickets',
    async (params: {
        ticket_type?: string;
        status_filter?: string;
        transfer_direction?: string;
        farm_id?: number;
        shed_id?: number;
        page?: number;
        size?: number;
    } | undefined, { rejectWithValue }) => {
        try {
            const response = await farmvestService.getTickets(params);

            let tickets: FarmvestTicket[] = [];
            let counts: any = null;
            let pagination: any = null;

            // Robust ticket list extraction
            const findTickets = (obj: any): FarmvestTicket[] => {
                if (Array.isArray(obj)) return obj;
                if (!obj || typeof obj !== 'object') return [];
                const priorityKeys = ['tickets', 'health_tickets', 'healthTickets', 'items', 'list', 'data', 'results', 'payload', 'records'];
                for (const key of priorityKeys) {
                    if (Array.isArray(obj[key])) return obj[key];
                }
                // Recursive search for first array
                for (const key in obj) {
                    if (Array.isArray(obj[key])) return obj[key];
                    if (obj[key] && typeof obj[key] === 'object') {
                        const nested = findTickets(obj[key]);
                        if (nested.length > 0) return nested;
                    }
                }
                return [];
            };

            tickets = findTickets(response);

            // Robust count extraction
            counts = response.counts || response.data?.counts;

            // Fallback: Check for root-level status counts if counts object is missing or incomplete
            if (response) {
                if (!counts) counts = {};

                // Map root-level keys if they exist and counts doesn't have them
                const mapping = {
                    total: ['total', 'total_items', 'total_count', 'count', 'total_tickets'],
                    pending: ['pending', 'pending_count', 'pending_tickets'],
                    in_progress: ['in_progress', 'in_progress_count', 'in_progress_tickets', 'inprogress'],
                    completed: ['completed', 'completed_count', 'completed_tickets', 'resolved', 'resolved_count']
                };

                Object.entries(mapping).forEach(([target, sources]) => {
                    if (counts[target] === undefined || counts[target] === 0) {
                        for (const source of sources) {
                            if (response[source] !== undefined) {
                                counts[target] = Number(response[source]);
                                break;
                            }
                            if (response.data?.[source] !== undefined) {
                                counts[target] = Number(response.data[source]);
                                break;
                            }
                        }
                    }
                });

                // Clean up if we didn't find anything
                if (Object.keys(counts).length === 0) counts = null;
            }

            pagination = response.pagination || response.data?.pagination;

            // Normalize pagination
            if (pagination || (counts && counts.total)) {
                if (!pagination) pagination = {};
                const totalItems = Number(pagination.total_items || pagination.totalItems || pagination.total_count || pagination.count || counts?.total || tickets.length || 0);
                let totalPages = Number(pagination.total_pages || pagination.totalPages || pagination.total_page || pagination.totalPage || 0);
                const currentPage = Number(pagination.current_page || pagination.currentPage || pagination.page || params?.page || 1);
                const itemsPerPage = Number(pagination.items_per_page || pagination.itemsPerPage || pagination.size || params?.size || 15);

                if (totalPages === 0 && totalItems > 0) {
                    totalPages = Math.ceil(totalItems / itemsPerPage);
                }

                pagination = {
                    total_items: totalItems,
                    total_pages: totalPages,
                    current_page: currentPage,
                    items_per_page: itemsPerPage
                };
            }

            return {
                tickets,
                counts,
                pagination,
            };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch tickets');
        }
    }
);

export const fetchTicketStats = createAsyncThunk(
    'farmvestTickets/fetchTicketStats',
    async (params: {
        ticket_type?: string;
        transfer_direction?: string;
        farm_id?: number;
        shed_id?: number;
    } | undefined, { rejectWithValue }) => {
        try {
            // Fetch a larger batch of tickets to calculate stats locally if server doesn't provide them
            const response = await farmvestService.getTickets({ ...params, page: 1, size: 500 });

            let counts: any = response.counts || response.data?.counts;

            // If no counts object, try root extraction first
            if (!counts && response && !Array.isArray(response)) {
                counts = {};
                const mapping = {
                    total: ['total', 'total_count', 'count', 'total_tickets'],
                    pending: ['pending', 'pending_count', 'pending_tickets'],
                    in_progress: ['in_progress', 'in_progress_count', 'in_progress_tickets', 'inprogress'],
                    completed: ['completed', 'completed_count', 'completed_tickets', 'resolved', 'resolved_count']
                };

                Object.entries(mapping).forEach(([target, sources]) => {
                    for (const source of sources) {
                        if (response[source] !== undefined) {
                            counts[target] = Number(response[source]);
                            break;
                        }
                    }
                });
            }

            // If still no counts OR counts are all 0 but we have tickets, calculate locally from the fetched list
            // Ultra-robust ticket list extraction
            const tickets = Array.isArray(response) ? response : (
                response.data?.tickets ||
                response.data?.list ||
                response.data?.items ||
                response.data ||
                response.health_tickets ||
                response.healthTickets ||
                response.tickets ||
                response.list ||
                response.items ||
                []
            );

            const hasData = Array.isArray(tickets) && tickets.length > 0;

            if (hasData && (!counts || (Number(counts.total || 0) === 0))) {
                counts = {
                    total: tickets.length,
                    pending: tickets.filter((t: any) => {
                        const s = String(t.status || '').toUpperCase();
                        return s === 'PENDING' || s === '1';
                    }).length,
                    in_progress: tickets.filter((t: any) => {
                        const s = String(t.status || '').toUpperCase();
                        return s === 'IN_PROGRESS' || s === 'INPROGRESS' || s.includes('PROGRESS') || s === '2';
                    }).length,
                    completed: tickets.filter((t: any) => {
                        const s = String(t.status || '').toUpperCase();
                        return ['RESOLVED', 'COMPLETED', 'APPROVED', 'SUCCESS', '3'].includes(s);
                    }).length
                };
            }


            return counts || null;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch ticket stats');
        }
    }
);

export const createTicket = createAsyncThunk(
    'farmvestTickets/createTicket',
    async ({ ticketType, payload }: { ticketType: string; payload: any }, { rejectWithValue, dispatch }) => {
        try {
            const response = await farmvestService.createTicket(ticketType, payload);
            dispatch(fetchTickets(undefined));
            dispatch(fetchTicketStats(undefined)); // Refresh stats
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to create ticket');
        }
    }
);

export const updateTreatment = createAsyncThunk(
    'farmvestTickets/updateTreatment',
    async (payload: { ticket_id: number; disease?: string[]; description?: string }, { rejectWithValue, dispatch }) => {
        try {
            const response = await farmvestService.updateTreatmentDetails(payload);
            dispatch(fetchTickets(undefined));
            dispatch(fetchTicketStats(undefined)); // Refresh stats
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to update treatment details');
        }
    }
);

export const assignTicket = createAsyncThunk(
    'farmvestTickets/assignTicket',
    async ({ ticketId, assistantId, doctorId }: { ticketId: number; assistantId?: number; doctorId?: number }, { rejectWithValue, dispatch }) => {
        try {
            const response = await farmvestService.assignTicket(ticketId, { assistant_id: assistantId, doctor_id: doctorId });
            dispatch(fetchTickets(undefined));
            dispatch(fetchTicketStats(undefined)); // Refresh stats
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to assign ticket');
        }
    }
);

interface TicketsState {
    tickets: FarmvestTicket[];
    counts: TicketStats | null;
    stats: TicketStats | null; // New persistent stats
    loading: boolean;
    createLoading: boolean;
    error: string | null;
    successMessage: string | null;
    pagination: { current_page: number; total_pages: number; total_items: number; items_per_page?: number } | null;
}

const initialState: TicketsState = {
    tickets: [],
    counts: null,
    stats: null,
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
                // If this was a fetch WITHOUT status filter, usage it for stats too
                if (!state.stats && action.payload.counts) {
                    state.stats = action.payload.counts;
                }
            })
            .addCase(fetchTickets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchTicketStats.fulfilled, (state, action) => {
                if (action.payload) {
                    state.stats = action.payload;
                }
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
            .addCase(updateTreatment.pending, (state) => {
                state.error = null;
                state.successMessage = null;
            })
            .addCase(updateTreatment.fulfilled, (state, action) => {
                state.successMessage = action.payload?.message || 'Treatment details updated successfully';
            })
            .addCase(updateTreatment.rejected, (state, action) => {
                state.error = action.payload as string;
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
