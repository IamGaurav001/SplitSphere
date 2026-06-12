import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app load
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('splitsphere_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          connectSocket(res.data.id);
        } catch (err) {
          console.error('Failed to restore session:', err);
          localStorage.removeItem('splitsphere_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user: userData } = res.data;
      localStorage.setItem('splitsphere_token', token);
      setUser(userData);
      connectSocket(userData.id);
      return userData;
    } catch (err) {
      throw err.response?.data?.error || 'Login failed';
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const { token, user: userData } = res.data;
      localStorage.setItem('splitsphere_token', token);
      setUser(userData);
      connectSocket(userData.id);
      return userData;
    } catch (err) {
      throw err.response?.data?.error || 'Registration failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('splitsphere_token');
    setUser(null);
    disconnectSocket();
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
