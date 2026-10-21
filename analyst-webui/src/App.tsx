import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import ErrorLayout from './layouts/ErrorLayout';
import LoginForm from './components/layout/LoginForm.tsx';
import ApiDocs from './pages/admin/ApiDocs.tsx';
import ApiTokens from './pages/admin/ApiTokens.tsx';
import Configuration from './pages/admin/Configuration.tsx';
import UserManagement from './pages/admin/users/UserManagement.tsx';
import UserProfile from './pages/profile/UserProfile.tsx';
import InsightsPage from './pages/insights/InsightsPage.tsx';
import HistoryPage from './pages/history/HistoryPage.tsx';
import Error404 from './pages/error/Error404';
import Error403 from './pages/error/Error403';
import Error401 from './pages/error/Error401';

import { AuthProvider, useAuth } from './context/AuthContext';
// @ts-ignore
import './App.css';
import Metrics from "./pages/admin/metrics/Metrics.tsx";

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className='loader-container'>
        <div className='loader'></div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  return (
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AuthLayout/>}>
              <Route path="/login" element={<LoginForm />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Navigate to="/insights" replace />} />
                <Route path="/insights" element={<InsightsPage />} />
                <Route path="/history" element={<HistoryPage />} />

                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/api-tokens" element={<ApiTokens />} />
                <Route path="/admin/api-docs" element={<ApiDocs />} />
                <Route path="/admin/configuration" element={<Configuration />} />
                <Route path="/admin/metrics" element={<Metrics />} />

                <Route path="/profile" element={<UserProfile />} />
              </Route>
            </Route>

            <Route element={<ErrorLayout />}>
              <Route path="/403" element={<Error403 />} />
              <Route path="/401" element={<Error401 />} />
              <Route path="/404" element={<Error404 />} />
            </Route>

            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
  );
}

export default App;
