import { configureStore } from '@reduxjs/toolkit';

import { authReducer, AuthState } from './slices/authSlice';
import { uiReducer, UIState } from './slices/uiSlice';
import { ordersReducer, OrdersState } from './slices/ordersSlice';
import { usersReducer, UsersState } from './slices/usersSlice';
import { productsReducer, ProductsState } from './slices/productsSlice';
import { employeesReducer } from './slices/farmvest/employees';
import { farmsReducer } from './slices/farmvest/farms';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        ui: uiReducer,
        orders: ordersReducer,
        users: usersReducer,
        products: productsReducer,
        farmvestEmployees: employeesReducer,
        farmvestFarms: farmsReducer,
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
}

export type AppDispatch = typeof store.dispatch;
