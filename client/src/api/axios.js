import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  timeout: 60000,
});

export const SESSION_EXPIRED_EVENT = 'sde:session-expired';

// Auth endpoints legitimately return 401 (wrong password / bad OTP); everything else means the session died.
const AUTH_PATHS = ['/api/users/login', '/api/users/verify-login-otp', '/api/users/me', '/api/users/logout'];

API.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    if (status === 401 && !AUTH_PATHS.some((p) => url.startsWith(p))) {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

export default API;
