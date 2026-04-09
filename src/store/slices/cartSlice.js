import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCart, addToCart, updateCartItem,
         removeFromCart, clearCart } from '../../api/cartApi';

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, thunkAPI) => {
  try {
    const res = await getCart();
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to fetch cart');
  }
});

export const addItemToCart = createAsyncThunk(
  'cart/addItem',
  async ({ productId, quantity }, thunkAPI) => {
    try {
      const res = await addToCart(productId, quantity);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to add item');
    }
  }
);

export const updateItem = createAsyncThunk(
  'cart/updateItem',
  async ({ cartItemId, quantity }, thunkAPI) => {
    try {
      const res = await updateCartItem(cartItemId, quantity);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to update item');
    }
  }
);

export const removeItem = createAsyncThunk(
  'cart/removeItem',
  async (cartItemId, thunkAPI) => {
    try {
      const res = await removeFromCart(cartItemId);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to remove item');
    }
  }
);

export const emptyCart = createAsyncThunk('cart/clearCart', async (_, thunkAPI) => {
  try {
    await clearCart();
    return { items: [], totalItems: 0, totalAmount: 0 };
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to clear cart');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    totalItems: 0,
    totalAmount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    resetCart(state) {
      state.items = [];
      state.totalItems = 0;
      state.totalAmount = 0;
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state) => {
      state.loading = true;
      state.error = null;
    };
    const handleFulfilled = (state, action) => {
      state.loading = false;
      state.items = action.payload.items || [];
      state.totalItems = action.payload.totalItems || 0;
      state.totalAmount = action.payload.totalAmount || 0;
    };
    const handleRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload;
    };

    builder
      .addCase(fetchCart.pending, handlePending)
      .addCase(fetchCart.fulfilled, handleFulfilled)
      .addCase(fetchCart.rejected, handleRejected)
      .addCase(addItemToCart.pending, handlePending)
      .addCase(addItemToCart.fulfilled, handleFulfilled)
      .addCase(addItemToCart.rejected, handleRejected)
      .addCase(updateItem.pending, handlePending)
      .addCase(updateItem.fulfilled, handleFulfilled)
      .addCase(updateItem.rejected, handleRejected)
      .addCase(removeItem.pending, handlePending)
      .addCase(removeItem.fulfilled, handleFulfilled)
      .addCase(removeItem.rejected, handleRejected)
      .addCase(emptyCart.fulfilled, handleFulfilled);
  },
});

export const { resetCart } = cartSlice.actions;
export default cartSlice.reducer;