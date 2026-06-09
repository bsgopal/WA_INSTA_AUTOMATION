import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import Login from './pages/Auth/Login';
import Customers from './pages/Customers/Customers';
import Campaigns from './pages/Campaigns/Campaigns';
import Templates from './pages/Templates/Templates';
import Messages from './pages/Messages/Messages';
import Analytics from './pages/Analytics/Analytics';
import Settings from './pages/Settings/Settings';
import Workflows from './pages/Workflows/Workflows';
import AIFeatures from './pages/AIFeatures/AIFeatures';
import Conversations from './pages/Conversations/Conversations';
import QuickReplies from './pages/QuickReplies/QuickReplies';
import Catalog from './pages/Catalog/Catalog';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="conversations" element={<Conversations />} />
        <Route path="customers" element={<Customers />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="templates" element={<Templates />} />
        <Route path="quick-replies" element={<QuickReplies />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="messages" element={<Messages />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="workflows" element={<Workflows />} />
        <Route path="ai-features" element={<AIFeatures />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
