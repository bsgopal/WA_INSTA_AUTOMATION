import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import useAuthStore from './store/authStore';

const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Login = lazy(() => import('./pages/Auth/Login'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));
const Customers = lazy(() => import('./pages/Customers/Customers'));
const Campaigns = lazy(() => import('./pages/Campaigns/Campaigns'));
const Templates = lazy(() => import('./pages/Templates/Templates'));
const Messages = lazy(() => import('./pages/Messages/Messages'));
const Analytics = lazy(() => import('./pages/Analytics/Analytics'));
const Settings = lazy(() => import('./pages/Settings/Settings'));
const Workflows = lazy(() => import('./pages/Workflows/Workflows'));
const ConditionalWorkflowBuilder = lazy(() => import('./pages/Workflows/ConditionalWorkflowBuilder'));
const AIFeatures = lazy(() => import('./pages/AIFeatures/AIFeatures'));
const ResponseRules = lazy(() => import('./pages/Rules/ResponseRules'));
const Conversations = lazy(() => import('./pages/Conversations/Conversations'));
const QuickReplies = lazy(() => import('./pages/QuickReplies/QuickReplies'));
const Catalog = lazy(() => import('./pages/Catalog/Catalog'));

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const user = useAuthStore((state) => state.user);
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      }
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        {/* Full-screen protected routes for workflow builder canvas */}
        <Route
          path="/workflows/create"
          element={
            <ProtectedRoute>
              <ConditionalWorkflowBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workflows/:id"
          element={
            <ProtectedRoute>
              <ConditionalWorkflowBuilder />
            </ProtectedRoute>
          }
        />

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
          <Route path="response-rules" element={<ResponseRules />} />
          <Route path="ai-features" element={user?.role === 'ADMIN' ? <AIFeatures /> : <Navigate to="/" replace />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
