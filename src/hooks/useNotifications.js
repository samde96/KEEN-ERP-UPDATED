import { useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    notificationService.list().then(setNotifications);
  }, []);

  const unreadCount = notifications.filter((notification) => notification.unread).length;

  return { notifications, unreadCount };
}
