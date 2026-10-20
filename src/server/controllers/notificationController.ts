import { Response } from 'express';
import { dataStore } from '../data/dataStore.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const recipientId = req.user?.employeeId || req.user?.userId;
    if (!recipientId) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const notifications = await dataStore.getNotifications(recipientId);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.status(200).json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.', error: err.message });
  }
}

export async function markNotificationRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const notification = await dataStore.markNotificationRead(id);

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Marked as read.', data: notification });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update notification.', error: err.message });
  }
}

export async function markAllNotificationsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const recipientId = req.user?.employeeId || req.user?.userId;
    if (!recipientId) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const count = await dataStore.markAllNotificationsRead(recipientId);
    res.status(200).json({ success: true, message: `Marked ${count} notifications as read.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update notifications.', error: err.message });
  }
}
