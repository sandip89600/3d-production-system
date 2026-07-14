import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const queryClient = useQueryClient();

  const connectSocket = useCallback((userId) => {
    const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { userId },
      transports: ['websocket'],
    });
    s.on('connect', () => console.log('Socket connected'));
    s.on('disconnect', () => console.log('Socket disconnected'));
    setSocket(s);
    return s;
  }, []);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
      connectSocket(data.user._id);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    } finally {
      setLoading(false);
    }
  }, [connectSocket]);

  useEffect(() => {
    loadUser();
    return () => { socket?.disconnect(); };
  }, []);

  const login = async (email, password, twoFactorToken) => {
    const { data } = await authAPI.login({ email, password, twoFactorToken });
    if (data.requires2FA) return { requires2FA: true };
    queryClient.clear();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    connectSocket(data.user._id);
    return { success: true, user: data.user };
  };

  const register = async (registerData) => {
    const { data } = await authAPI.register(registerData);
    queryClient.clear();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    connectSocket(data.user._id);
    return { success: true, user: data.user };
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await authAPI.logout(refreshToken);
    } catch {}
    queryClient.clear();
    localStorage.clear();
    socket?.disconnect();
    setSocket(null);
    setUser(null);
  };

  const updateUser = (updates) => setUser(prev => ({ ...prev, ...updates }));

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, socket, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
