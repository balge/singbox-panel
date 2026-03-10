import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider as JotaiProvider } from 'jotai';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuth } from './AuthContext';
import MainLayout from './pages/MainLayout';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import LogPage from './pages/LogPage';
import DnsPage from './pages/DnsPage';
import InboundsPage from './pages/InboundsPage';
import OutboundsPage from './pages/OutboundsPage';
import RoutePage from './pages/RoutePage';
import ExperimentalPage from './pages/ExperimentalPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="log" element={<LogPage />} />
        <Route path="dns" element={<DnsPage />} />
        <Route path="inbounds" element={<InboundsPage />} />
        <Route path="outbounds" element={<OutboundsPage />} />
        <Route path="route" element={<RoutePage />} />
        <Route path="experimental" element={<ExperimentalPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <JotaiProvider>
      <ConfigProvider locale={zhCN}>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ConfigProvider>
    </JotaiProvider>
  );
}

export default App;
