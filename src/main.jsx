import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/bootstrap-custom.css';
import './styles/main.css';
import './styles/dashboard.css';
import './styles/pos.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { PermissionProvider } from './context/PermissionContext';
import { BranchProvider } from './context/BranchContext';
import { registerServiceWorker } from './registerServiceWorker';

registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <PermissionProvider>
        <BranchProvider>
          <App />
        </BranchProvider>
      </PermissionProvider>
    </AuthProvider>
  </React.StrictMode>
);
