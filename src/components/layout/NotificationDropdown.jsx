import { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { ConfirmModal } from '../common/ConfirmModal';
import { StatusBadge } from '../common/StatusBadge';

export function NotificationDropdown() {
  const { notifications, unreadCount } = useNotifications();
  const [activeNotification, setActiveNotification] = useState(null);

  return (
    <>
      <div className="dropdown">
        <button
          className="btn btn-icon position-relative"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          aria-label="Notifications"
        >
          <i className="bi bi-bell" aria-hidden="true" />
          {unreadCount ? <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill text-bg-danger">{unreadCount}</span> : null}
        </button>
        <div className="dropdown-menu dropdown-menu-end notification-menu">
          <div className="dropdown-header">Notifications</div>
          {notifications.length ? (
            notifications.map((notification) => (
              <button className="dropdown-item notification-item" type="button" key={notification.id} onClick={() => setActiveNotification(notification)}>
                <span>
                  <strong>{notification.title}</strong>
                  <small>{notification.body}</small>
                </span>
                <StatusBadge status={notification.priority} />
              </button>
            ))
          ) : (
            <span className="dropdown-item-text text-body-secondary">No notifications</span>
          )}
        </div>
      </div>
      <ConfirmModal
        open={Boolean(activeNotification)}
        title={activeNotification?.title || 'Notification'}
        body={activeNotification?.body || ''}
        confirmLabel="Close"
        cancelLabel={null}
        onConfirm={() => setActiveNotification(null)}
        onCancel={() => setActiveNotification(null)}
      />
    </>
  );
}
