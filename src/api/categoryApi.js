import API from './axios';

export const getCategories = () => API.get('/categories');
export const createCategory = (name) =>
  API.post('/categories', null, { params: { name } });