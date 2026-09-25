import { create } from 'zustand';

const getInitialUser = () => {
  try {
    const stored = localStorage.getItem('user');
    return stored && stored !== 'undefined' && stored !== 'null' ? JSON.parse(stored) : null;
  } catch (e) {
    console.warn('Failed to parse stored user, clearing cache:', e);
    localStorage.removeItem('user');
    return null;
  }
};

const useAuthStore = create((set) => ({
  user: getInitialUser(),
  isAuthenticated: !!localStorage.getItem('token'),
  login: (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    set({ user: userData, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },
  updateUser: (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    set({ user: userData });
  },
}));

export default useAuthStore;
