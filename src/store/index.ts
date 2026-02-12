import { configureStore } from '@reduxjs/toolkit';

import { authReducer, AuthState } from './slices/authSlice';
import { uiReducer, UIState } from './slices/uiSlice';
import { ordersReducer, OrdersState } from './slices/ordersSlice';
import { usersReducer, UsersState } from './slices/usersSlice';
import { productsReducer, ProductsState } from './slices/productsSlice';
import { employeesReducer } from './slices/farmvest/employees';
import { farmsReducer } from './slices/farmvest/farms';
import { investorsReducer } from './slices/farmvest/investors';
import { ticketsReducer } from './slices/farmvest/tickets';
import { leaveRequestsReducer } from './slices/farmvest/leaveRequests';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        ui: uiReducer,
        orders: ordersReducer,
        users: usersReducer,
        products: productsReducer,
        farmvestEmployees: employeesReducer,
        farmvestFarms: farmsReducer,
        farmvestInvestors: investorsReducer,
        farmvestTickets: ticketsReducer,
        farmvestLeaveRequests: leaveRequestsReducer,
    },
});

export interface RootState {
    auth: AuthState;
    ui: UIState;
    orders: OrdersState;
    users: UsersState;
    products: ProductsState;
    farmvestEmployees: ReturnType<typeof employeesReducer>;
    farmvestFarms: ReturnType<typeof farmsReducer>;
    farmvestInvestors: ReturnType<typeof investorsReducer>;
    farmvestTickets: ReturnType<typeof ticketsReducer>;
    farmvestLeaveRequests: ReturnType<typeof leaveRequestsReducer>;
}

export type AppDispatch = typeof store.dispatch;
