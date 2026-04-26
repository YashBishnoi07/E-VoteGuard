import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('evoting_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('evoting_user');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (voterID, password) => {
    const res = await api.post('/auth/login', { voterID, password });
    const { token: newToken, voter } = res.data;
    localStorage.setItem('evoting_token', newToken);
    localStorage.setItem('evoting_user', JSON.stringify(voter));
    setToken(newToken);
    setUser(voter);
    return res.data;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const { token: newToken, voter } = res.data;
    localStorage.setItem('evoting_token', newToken);
    localStorage.setItem('evoting_user', JSON.stringify(voter));
    setToken(newToken);
    setUser(voter);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('evoting_token');
    localStorage.removeItem('evoting_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('evoting_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, isAuthenticated: !!token, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
