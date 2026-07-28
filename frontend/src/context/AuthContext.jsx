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

  const connectSocket = useCallback((userId, role) => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
                      import.meta.env.VITE_API_URL || 
                      `${window.location.protocol}//${window.location.hostname}:5000`;
    const s = io(socketUrl, {
      auth: { userId, role },
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
      // 5-second timeout to avoid blocking if backend is unreachable
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      );
      const { data } = await Promise.race([authAPI.getMe(), timeout]);
      setUser(data.user);
      connectSocket(data.user._id, data.user.role);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      // On timeout or any error, just clear loading — user stays null
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
    connectSocket(data.user._id, data.user.role);
    return { success: true, user: data.user };
  };

  const register = async (registerData) => {
    const { data } = await authAPI.register(registerData);
    // Don't log in automatically if it needs email verification
    if (data.message && data.message.includes('verify')) {
      return { success: true, pendingVerification: true, message: data.message };
    }
    queryClient.clear();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    connectSocket(data.user._id, data.user.role);
    return { success: true, user: data.user };
  };

  const loginWithGoogle = async (credential) => {
    const { data } = await authAPI.googleLogin(credential);
    queryClient.clear();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    connectSocket(data.user._id, data.user.role);
    return { success: true, user: data.user };
  };

  const signupWithGoogle = async (credential) => {
    const { data } = await authAPI.googleSignup(credential);
    queryClient.clear();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    connectSocket(data.user._id, data.user.role);
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
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, signupWithGoogle, logout, updateUser, socket, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
