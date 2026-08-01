import { config } from '@/config';
import axios from 'axios';

const api = axios.create({
  baseURL: config.apiUrl,

  // Send cookies (refresh token)
  withCredentials: true,

  headers: {
    'Content-Type': 'application/json',
  },

  timeout: 10000,
});

export default api;
