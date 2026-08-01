import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmModal } from '../common/ConfirmModal';
import { ROLES, roleLabels } from '../../data/roles';
import { useAuth } from '../../hooks/useAuth';
import { BranchSwitcher } from './BranchSwitcher';
import { NotificationDropdown } from './NotificationDropdown';

function userRoleNames(user) {
  if (Array.isArray(user?.roles) && user.roles.length) {
    return user.roles;
  }
  return user?.role ? [user.role] : [];
}

function formatUserRoles(user) {
  return userRoleNames(user).map((role) => roleLabels[role] || role).join(', ') || 'User';
}

export function Topbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const roles = userRoleNames(user);
  const showNotifications = !roles.length || roles.some((role) => role !== ROLES.CASHIER);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <header className="app-topbar">
        <div className="topbar-left">
          <button className="btn btn-icon d-lg-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileSidebar" aria-controls="mobileSidebar">
            <i className="bi bi-list" aria-hidden="true" />
            <span className="visually-hidden">Open navigation</span>
          </button>
          <BranchSwitcher />
        </div>
        <div className="topbar-actions">
          {showNotifications ? <NotificationDropdown /> : null}
          <div className="dropdown">
            <button className="btn user-menu" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <span className="user-avatar">{user?.name?.charAt(0) || 'U'}</span>
              <span className="user-meta">
                <strong>{user?.name}</strong>
                <small>{formatUserRoles(user)}</small>
              </span>
              <i className="bi bi-chevron-down" aria-hidden="true" />
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <button className="dropdown-item" type="button" onClick={() => setModal('profile')}>
                  <i className="bi bi-person" aria-hidden="true" /> Profile
                </button>
              </li>
              <li>
                <button className="dropdown-item" type="button" onClick={() => setModal('session')}>
                  <i className="bi bi-shield-lock" aria-hidden="true" /> Session
                </button>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <button className="dropdown-item text-danger" type="button" onClick={handleSignOut}>
                  <i className="bi bi-box-arrow-right" aria-hidden="true" /> Sign out
                </button>
              </li>
            </ul>
          </div>
        </div>
      </header>
      <ConfirmModal
        open={modal === 'profile'}
        title="Profile"
        body={
          <dl className="receipt-meta mb-0">
            <dt>Name</dt>
            <dd>{user?.name}</dd>
            <dt>Email</dt>
            <dd>{user?.email}</dd>
            <dt>Role</dt>
            <dd>{formatUserRoles(user)}</dd>
          </dl>
        }
        confirmLabel="Close"
        cancelLabel={null}
        onConfirm={() => setModal(null)}
        onCancel={() => setModal(null)}
      />
      <ConfirmModal
        open={modal === 'session'}
        title="Session"
        body="You are signed in on this browser. Sign out removes your saved login from this device."
        confirmLabel="Close"
        cancelLabel={null}
        onConfirm={() => setModal(null)}
        onCancel={() => setModal(null)}
      />
    </>
  );
}
