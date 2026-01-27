import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';

// Async Thunks
export const fetchProducts = createAsyncThunk(
    'products/fetchProducts',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(API_ENDPOINTS.getProducts());
            return response.data?.products || [];
        } catch (error: any) {
            return rejectWithValue('Failed to fetch products');
        }
    }
);

export const addProduct = createAsyncThunk(
    'products/addProduct',
    async (productData: any, { rejectWithValue }) => {
        try {
            const response = await axios.post(API_ENDPOINTS.addProduct(), productData);
            return response.data?.product;
        } catch (error: any) {
            return rejectWithValue('Failed to add product');
        }
    }
);

export const updateProduct = createAsyncThunk(
    'products/updateProduct',
    async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
        try {
            const response = await axios.put(API_ENDPOINTS.updateProduct(id), data);
            return response.data?.product;
        } catch (error: any) {
            return rejectWithValue('Failed to update product');
        }
    }
);

export const deleteProduct = createAsyncThunk(
    'products/deleteProduct',
    async (id: string, { rejectWithValue }) => {
        try {
            await axios.delete(API_ENDPOINTS.deleteProduct(id));
            return id;
        } catch (error: any) {
            return rejectWithValue('Failed to delete product');
        }
    }
);

export interface ProductsState {
    products: any[];
    loading: boolean;
    error: string | null;
}

const initialState: ProductsState = {
    products: [],
    loading: false,
    error: null,
};

const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        setProducts: (state, action: PayloadAction<any[]>) => {
            state.products = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchProducts.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchProducts.fulfilled, (state, action) => {
            state.loading = false;
            state.products = action.payload;
        });
        builder.addCase(fetchProducts.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Add Product
        builder.addCase(addProduct.fulfilled, (state, action) => {
            state.products.push(action.payload);
        });

        // Update Product
        builder.addCase(updateProduct.fulfilled, (state, action) => {
            const index = state.products.findIndex(p => p.id === action.payload.id);
            if (index !== -1) {
                state.products[index] = action.payload;
            }
        });

        // Delete Product
        builder.addCase(deleteProduct.fulfilled, (state, action) => {
            state.products = state.products.filter(p => p.id !== action.payload);
        });
    }
});

export const { setProducts } = productsSlice.actions;
export const productsReducer = productsSlice.reducer;
export default productsSlice.reducer;
