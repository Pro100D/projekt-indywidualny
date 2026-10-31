import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PurchasesPage from './pages/PurchasesPage.jsx';
import PurchaseDetailsPage from './pages/PurchaseDetailsPage.jsx';
import PurchaseFormPage from './pages/PurchaseFormPage.jsx';
import AddressesPage from './pages/AddressesPage.jsx';
import WarrantiesPage from './pages/WarrantiesPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import StatsPage from './pages/StatsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* TODO (funkcja 1): wpuszczać tylko zalogowanych, resztę przekierować na /login */}
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="purchases/new" element={<PurchaseFormPage />} />
        <Route path="purchases/:id" element={<PurchaseDetailsPage />} />
        <Route path="purchases/:id/edit" element={<PurchaseFormPage />} />
        <Route path="addresses" element={<AddressesPage />} />
        <Route path="warranties" element={<WarrantiesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
