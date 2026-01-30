import { configureStore } from '@reduxjs/toolkit';

import { authReducer, AuthState } from './slices/authSlice';
import { uiReducer, UIState } from './slices/uiSlice';
import { ordersReducer, OrdersState } from './slices/ordersSlice';
import { usersReducer, UsersState } from './slices/usersSlice';
import { productsReducer, ProductsState } from './slices/productsSlice';
import { employeesReducer } from './slices/farmvest/employees';
import { farmsReducer } from './slices/farmvest/farms';
import { investorsReducer } from './slices/farmvest/investors';

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
}

export type AppDispatch = typeof store.dispatch;
