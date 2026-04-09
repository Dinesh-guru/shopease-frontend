import API from './axios';

export const processPayment = (data) => API.post('/payments/process', data);
export const getPaymentByOrder = (orderId) =>
  API.get(`/payments/order/${orderId}`);
export const retryPayment = (data) => API.post('/payments/retry', data);