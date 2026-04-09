import API from './axios';

export const getCart = () => API.get('/cart');
export const addToCart = (productId, quantity = 1) =>
  API.post('/cart/add', null, { params: { productId, quantity } });
export const updateCartItem = (cartItemId, quantity) =>
  API.put(`/cart/update/${cartItemId}`, null, { params: { quantity } });
export const removeFromCart = (cartItemId) =>
  API.delete(`/cart/remove/${cartItemId}`);
export const clearCart = () => API.delete('/cart/clear');
export const getCartCount = () => API.get('/cart/count');