import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import ErrorLayout from './layouts/ErrorLayout';
import LoginForm from './components/layout/LoginForm.tsx';

import ApiDocs from './pages/admin/ApiDocs.tsx';
import ApiTokens from './pages/admin/ApiTokens.tsx';
import UserManagement from './pages/admin/users/UserManagement.tsx';
import UserProfile from './pages/profile/UserProfile.tsx';

import Error404 from './pages/error/Error404';
import Error403 from './pages/error/Error403';
import Error401 from './pages/error/Error401';
import ComingSoon from './pages/error/ComingSoon';

import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';

import FullscreenLayout from './layouts/FullscreenLayout.tsx';

// @ts-ignore
import './App.css';


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
        <WebSocketProvider>
          <BrowserRouter>
            <Routes>
              /* Public Routes */
              <Route element={<AuthLayout/>}>
                <Route path="/login" element={<LoginForm />} />
          </Route>

          /* Protected Routes */
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>


              /* Admin Routes */
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/api-tokens" element={<ApiTokens />} />
              <Route path="/admin/api-docs" element={<ApiDocs />} />

              <Route path="/profile" element={<UserProfile />} />
            </Route>
          </Route>

          /* Error Routes */
          <Route element={<ErrorLayout />}>
            <Route path="/403" element={<Error403 />} />
            <Route path="/401" element={<Error401 />} />
            <Route path="/404" element={<Error404 />} />
            <Route path="/coming-soon" element={<ComingSoon />} />
          </Route>




          {/* Fallback */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter >
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
