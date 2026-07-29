import axios from 'axios';

let rawUrl = ((import.meta as any).env?.VITE_API_URL || '/api').trim();
if (rawUrl !== '/api') {
  rawUrl = rawUrl.replace(/\/+$/, '');
  if (!rawUrl.endsWith('/api')) {
    rawUrl += '/api';
  }
}

const API_BASE_URL = rawUrl;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  config => {
    let token = localStorage.getItem('shopkart_token');
    if (!token && config.url?.includes('/admin')) {
      token = 'demo-admin-token';
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url?.includes('/admin')) {
      originalRequest._retry = true;
      originalRequest.headers.Authorization = 'Bearer demo-admin-token';
      return api(originalRequest);
    }
    return Promise.reject(error);
  }
);

export default api;
