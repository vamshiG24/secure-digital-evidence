import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== '' ? import.meta.env.VITE_API_URL : '',
  withCredentials: true,
});

export default API;
