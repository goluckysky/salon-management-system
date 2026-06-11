export type NotificationType = 'appointment' | 'payment' | 'cancellation' | 'new_customer';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Simple in-memory notification store with callbacks
type Listener = (notifications: Notification[]) => void;

class NotificationStore {
  private notifications: Notification[] = [];
  private listeners: Listener[] = [];

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emit() {
    this.listeners.forEach(l => l([...this.notifications]));
  }

  add(n: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const notification: Notification = {
      ...n,
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    this.notifications = [notification, ...this.notifications].slice(0, 20);
    this.emit();
  }

  markAllRead() {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.emit();
  }

  markRead(id: string) {
    this.notifications = this.notifications.map(n => n.id === id ? { ...n, read: true } : n);
    this.emit();
  }

  clear() {
    this.notifications = [];
    this.emit();
  }

  getAll() {
    return [...this.notifications];
  }

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }
}

export const notificationStore = new NotificationStore();
