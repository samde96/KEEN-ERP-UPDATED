import { ROLES } from './roles';

export const navigationSections = [
  {
    title: 'Admin',
    roles: [ROLES.ADMIN],
    items: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: 'bi-speedometer2' },
      { label: 'Branches', path: '/admin/branches', icon: 'bi-shop' },
      { label: 'Users', path: '/admin/users', icon: 'bi-people' },
      { label: 'Roles', path: '/admin/roles', icon: 'bi-shield-check' },
      { label: 'Products', path: '/admin/products', icon: 'bi-box-seam' },
      { label: 'Suppliers', path: '/admin/suppliers', icon: 'bi-truck' },
      { label: 'Reports', path: '/admin/reports', icon: 'bi-bar-chart-line' },
      { label: 'Audit Logs', path: '/admin/audit', icon: 'bi-journal-text' },
      { label: 'Security', path: '/admin/security', icon: 'bi-shield-lock' },
      { label: 'Settings', path: '/admin/settings', icon: 'bi-gear' }
    ]
  },
  {
    title: 'Warehouse',
    roles: [ROLES.ADMIN, ROLES.STORE_MANAGER],
    items: [
      { label: 'Dashboard', path: '/warehouse/dashboard', icon: 'bi-building' },
      { label: 'Add Stock', path: '/warehouse/add-stock', icon: 'bi-upc-scan' },
      { label: 'Deliveries', path: '/warehouse/deliveries', icon: 'bi-box-arrow-in-down' },
      { label: 'Inventory', path: '/warehouse/inventory', icon: 'bi-boxes' },
      { label: 'Stock Ledger', path: '/warehouse/ledger', icon: 'bi-list-check' },
      { label: 'Requests', path: '/warehouse/requests', icon: 'bi-clipboard-check' },
      { label: 'Transfers', path: '/warehouse/transfers', icon: 'bi-arrow-left-right' },
      { label: 'Damaged Goods', path: '/warehouse/damaged', icon: 'bi-tools' },
      { label: 'RFID Alerts', path: '/warehouse/rfid-alerts', icon: 'bi-exclamation-triangle' }
    ]
  },
  {
    title: 'Shop',
    roles: [ROLES.ADMIN, ROLES.SHOP_MANAGER],
    items: [
      { label: 'Dashboard', path: '/shop/dashboard', icon: 'bi-shop-window' },
      { label: 'Shop Stock', path: '/shop/stock', icon: 'bi-box-seam' },
      { label: 'Request Stock', path: '/shop/request-stock', icon: 'bi-clipboard-plus' },
      { label: 'Request History', path: '/shop/requests', icon: 'bi-clock-history' },
      { label: 'Incoming Transfers', path: '/shop/incoming-transfers', icon: 'bi-box-arrow-in-left' },
      { label: 'Discrepancies', path: '/shop/discrepancies', icon: 'bi-exclamation-square' },
      { label: 'Shop Reports', path: '/shop/reports', icon: 'bi-graph-up' },
      { label: 'Cashier Shifts', path: '/shop/cashier-shifts', icon: 'bi-person-badge' },
      { label: 'Low Stock', path: '/shop/low-stock', icon: 'bi-bell' },
      { label: 'Returns', path: '/pos/returns', icon: 'bi-arrow-return-left', roles: [ROLES.ADMIN, ROLES.SHOP_MANAGER] },
      { label: 'Receipt Settings', path: '/shop/receipt-settings', icon: 'bi-receipt-cutoff' }
    ]
  },
  {
    title: 'POS',
    roles: [ROLES.ADMIN, ROLES.CASHIER],
    items: [
      { label: 'Checkout', path: '/pos/checkout', icon: 'bi-cart-check' },
      { label: 'Product Lookup', path: '/pos/product-search', icon: 'bi-search' },
      { label: 'Receipt Preview', path: '/pos/receipt', icon: 'bi-receipt' },
      { label: 'Open Shift', path: '/pos/shift-open', icon: 'bi-unlock' },
      { label: 'Close Shift', path: '/pos/shift-close', icon: 'bi-lock' },
      { label: 'Returns', path: '/pos/returns', icon: 'bi-arrow-return-left', roles: [ROLES.CASHIER] }
    ]
  },
  {
    title: 'Reports',
    roles: [ROLES.ADMIN, ROLES.STORE_MANAGER, ROLES.SHOP_MANAGER, ROLES.AUDITOR],
    items: [
      { label: 'Reports Center', path: '/reports', icon: 'bi-bar-chart-line' }
    ]
  }
];

export function getNavigationForRole(role) {
  return navigationSections
    .map((section) => ({
      ...section,
      items: section.roles.includes(role)
        ? section.items.filter((item) => !item.roles || item.roles.includes(role))
        : []
    }))
    .filter((section) => section.items.length > 0);
}
