import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ROLES } from '../data/roles';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleBasedRoute } from './RoleBasedRoute';
import { RoleHomeRedirect } from './RoleHomeRedirect';
import { LoginPage } from '../pages/auth/LoginPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { MFAPage } from '../pages/auth/MFAPage';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { BranchManagement } from '../pages/admin/BranchManagement';
import { UserManagement } from '../pages/admin/UserManagement';
import { RolePermissionManagement } from '../pages/admin/RolePermissionManagement';
import { ProductCatalog } from '../pages/admin/ProductCatalog';
import { SupplierManagement } from '../pages/admin/SupplierManagement';
import { AdminReports } from '../pages/admin/AdminReports';
import { AuditLogsPage } from '../pages/admin/AuditLogsPage';
import { SecuritySettings } from '../pages/admin/SecuritySettings';
import { SystemSettings } from '../pages/settings/SystemSettings';
import { WarehouseDashboard } from '../pages/warehouse/WarehouseDashboard';
import { AddStock } from '../pages/warehouse/AddStock';
import { SupplierDeliveries } from '../pages/warehouse/SupplierDeliveries';
import { InventoryBalances } from '../pages/warehouse/InventoryBalances';
import { StockLedgerPage } from '../pages/warehouse/StockLedgerPage';
import { StockRequestsPage } from '../pages/warehouse/StockRequestsPage';
import { StockTransfersPage } from '../pages/warehouse/StockTransfersPage';
import { TransferDetailsPage } from '../pages/warehouse/TransferDetailsPage';
import { DamagedGoodsPage } from '../pages/warehouse/DamagedGoodsPage';
import { RFIDAlertsPage } from '../pages/warehouse/RFIDAlertsPage';
import { ShopDashboard } from '../pages/shop/ShopDashboard';
import { ShopStockPage } from '../pages/shop/ShopStockPage';
import { CreateStockRequestPage } from '../pages/shop/CreateStockRequestPage';
import { ShopRequestHistoryPage } from '../pages/shop/ShopRequestHistoryPage';
import { IncomingTransfersPage } from '../pages/shop/IncomingTransfersPage';
import { TransferDiscrepanciesPage } from '../pages/shop/TransferDiscrepanciesPage';
import { ShopReportsPage } from '../pages/shop/ShopReportsPage';
import { CashierShiftReportsPage } from '../pages/shop/CashierShiftReportsPage';
import { LowStockAlertsPage } from '../pages/shop/LowStockAlertsPage';
import { POSCheckoutPage } from '../pages/pos/POSCheckoutPage';
import { ProductLookupPage } from '../pages/pos/ProductLookupPage';
import { ReceiptScreenPage } from '../pages/pos/ReceiptScreenPage';
import { ShiftOpenPage } from '../pages/pos/ShiftOpenPage';
import { ShiftClosePage } from '../pages/pos/ShiftClosePage';
import { ReturnsRefundsPage } from '../pages/pos/ReturnsRefundsPage';
import { ReportsHomePage } from '../pages/reports/ReportsHomePage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/mfa" element={<MFAPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<RoleHomeRedirect />} />
            <Route path="/dashboard" element={<RoleHomeRedirect />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            <Route element={<RoleBasedRoute allowedRoles={[ROLES.ADMIN]} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/branches" element={<BranchManagement />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/roles" element={<RolePermissionManagement />} />
              <Route path="/admin/products" element={<ProductCatalog />} />
              <Route path="/admin/suppliers" element={<SupplierManagement />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/audit" element={<AuditLogsPage />} />
              <Route path="/admin/security" element={<SecuritySettings />} />
              <Route path="/admin/settings" element={<SystemSettings />} />
            </Route>

            <Route element={<RoleBasedRoute allowedRoles={[ROLES.ADMIN, ROLES.STORE_MANAGER]} />}>
              <Route path="/warehouse/dashboard" element={<WarehouseDashboard />} />
              <Route path="/warehouse/add-stock" element={<AddStock />} />
              <Route path="/warehouse/deliveries" element={<SupplierDeliveries />} />
              <Route path="/warehouse/inventory" element={<InventoryBalances />} />
              <Route path="/warehouse/ledger" element={<StockLedgerPage />} />
              <Route path="/warehouse/requests" element={<StockRequestsPage />} />
              <Route path="/warehouse/transfers" element={<StockTransfersPage />} />
              <Route path="/warehouse/transfers/:transferId" element={<TransferDetailsPage />} />
              <Route path="/warehouse/damaged" element={<DamagedGoodsPage />} />
              <Route path="/warehouse/rfid-alerts" element={<RFIDAlertsPage />} />
            </Route>

            <Route element={<RoleBasedRoute allowedRoles={[ROLES.ADMIN, ROLES.SHOP_MANAGER]} />}>
              <Route path="/shop/dashboard" element={<ShopDashboard />} />
              <Route path="/shop/stock" element={<ShopStockPage />} />
              <Route path="/shop/request-stock" element={<CreateStockRequestPage />} />
              <Route path="/shop/requests" element={<ShopRequestHistoryPage />} />
              <Route path="/shop/incoming-transfers" element={<IncomingTransfersPage />} />
              <Route path="/shop/discrepancies" element={<TransferDiscrepanciesPage />} />
              <Route path="/shop/transfers/:transferId" element={<TransferDetailsPage />} />
              <Route path="/shop/reports" element={<ShopReportsPage />} />
              <Route path="/shop/cashier-shifts" element={<CashierShiftReportsPage />} />
              <Route path="/shop/low-stock" element={<LowStockAlertsPage />} />
              <Route path="/shop/receipt-settings" element={<SystemSettings />} />
            </Route>

            <Route element={<RoleBasedRoute allowedRoles={[ROLES.ADMIN, ROLES.CASHIER]} />}>
              <Route path="/pos/checkout" element={<POSCheckoutPage />} />
              <Route path="/pos/product-search" element={<ProductLookupPage />} />
              <Route path="/pos/receipt" element={<ReceiptScreenPage />} />
              <Route path="/pos/shift-open" element={<ShiftOpenPage />} />
              <Route path="/pos/shift-close" element={<ShiftClosePage />} />
            </Route>

            <Route element={<RoleBasedRoute allowedRoles={[ROLES.ADMIN, ROLES.SHOP_MANAGER, ROLES.CASHIER]} />}>
              <Route path="/pos/returns" element={<ReturnsRefundsPage />} />
            </Route>

            <Route element={<RoleBasedRoute allowedRoles={[ROLES.ADMIN, ROLES.STORE_MANAGER, ROLES.SHOP_MANAGER, ROLES.AUDITOR]} />}>
              <Route path="/reports" element={<ReportsHomePage />} />
            </Route>

            <Route path="/not-found" element={<NotFoundPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
