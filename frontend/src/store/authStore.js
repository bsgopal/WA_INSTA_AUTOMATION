import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
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
