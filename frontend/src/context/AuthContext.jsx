'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestCurrency, setGuestCurrency] = useState('INR');
  const [authModal, setAuthModal] = useState(null); // null | 'login' | 'register' | 'forgot'
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCurrency = localStorage.getItem('subspens_base_currency') || localStorage.getItem('subtrack_base_currency');
      if (savedCurrency) setGuestCurrency(savedCurrency);
    }
  }, []);

  const openLogin = useCallback(() => setAuthModal('login'), []);
  const openRegister = useCallback(() => setAuthModal('register'), []);
  const openForgotPassword = useCallback(() => setAuthModal('forgot'), []);
  const closeAuthModal = useCallback(() => setAuthModal(null), []);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  useEffect(() => {
    const token = localStorage.getItem('subspens_token') || localStorage.getItem('subtrack_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch((err) => {
        // ONLY invalidate token if server explicitly returned 401 Unauthorized
        // Never wipe credentials on network errors, timeouts, or 5xx server cold starts
        if (err?.status === 401) {
          localStorage.removeItem('subspens_token');
          localStorage.removeItem('subtrack_token');
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { user, token } = await api.login({ email, password });
    localStorage.setItem('subspens_token', token);
    setUser(user);
    setAuthModal(null);
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { user, token } = await api.register({ name, email, password });
    localStorage.setItem('subspens_token', token);
    setUser(user);
    setAuthModal(null);
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    const { user, token } = await api.googleAuth(credential);
    localStorage.setItem('subspens_token', token);
    setUser(user);
    setAuthModal(null);
  }, []);

  const setBaseCurrency = useCallback(async (currency) => {
    localStorage.setItem('subspens_base_currency', currency);
    setGuestCurrency(currency);
    if (user) {
      try {
        const { user: updated } = await api.updateCurrency(currency);
        setUser(updated);
      } catch (err) {
        console.error('Failed to update currency preference:', err);
      }
    }
  }, [user]);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  const updateTokenAndUser = useCallback((newToken, updatedUser) => {
    if (newToken) {
      localStorage.setItem('subspens_token', newToken);
    }
    if (updatedUser) {
      setUser(updatedUser);
    }
  }, []);

  const deleteAccount = useCallback(async (payload) => {
    await api.deleteAccount(payload);
    localStorage.removeItem('subspens_token');
    localStorage.removeItem('subtrack_token');
    setUser(null);
    setSettingsOpen(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('subspens_token');
    localStorage.removeItem('subtrack_token');
    setUser(null);
    setSettingsOpen(false);
  }, []);

  const isPro = Boolean(user && (user.plan === 'pro' || user.plan === 'lifetime'));
  const baseCurrency = user?.baseCurrency || guestCurrency || 'INR';

  return (
    <AuthContext.Provider
      value={{
        user,
        baseCurrency,
        loading,
        isPro,
        authModal,
        openLogin,
        openRegister,
        openForgotPassword,
        closeAuthModal,
        setAuthModal,
        settingsOpen,
        openSettings,
        closeSettings,
        updateUser,
        updateTokenAndUser,
        deleteAccount,
        login,
        register,
        loginWithGoogle,
        logout,
        setBaseCurrency,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
