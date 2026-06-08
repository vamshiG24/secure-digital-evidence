import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const config = {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    };
                    const { data } = await axios.get(API_ENDPOINTS.ME, config);
                    setUser(data);
                } catch (error) {
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };

        checkUser();
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await axios.post(API_ENDPOINTS.LOGIN, { email, password });
            
            // Check if 2FA challenge is requested
            if (data.requires2FA) {
                return { success: true, requires2FA: true, email: data.email };
            }

            localStorage.setItem('token', data.token);
            setUser(data);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const verifyOTP = async (email, otp) => {
        try {
            const { data } = await axios.post(API_ENDPOINTS.VERIFY_LOGIN_OTP, { email, otp });
            localStorage.setItem('token', data.token);
            setUser(data);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Verification failed' };
        }
    };

    const register = async (name, email, password, role) => {
        try {
            const { data } = await axios.post(API_ENDPOINTS.REGISTER, { name, email, password, role });
            localStorage.setItem('token', data.token);
            setUser(data);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const updateUser = (userData) => {
        setUser(userData);
        if (userData.token) {
            localStorage.setItem('token', userData.token);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, verifyOTP, register, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
