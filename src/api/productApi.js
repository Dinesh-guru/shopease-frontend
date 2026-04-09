import API from './axios';

export const getProducts = (page = 0, size = 10, search = '', categoryId = '') =>
  API.get('/products', { params: { page, size, search, categoryId } });

export const getProductById = (id) => API.get(`/products/${id}`);

export const createProduct = (data) => API.post('/products', data);
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);
export const deleteProduct = (id) => API.delete(`/products/${id}`);