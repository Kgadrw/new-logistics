// Notifications controller
import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    const { role } = req.query;
    
    if (!role || !['client', 'warehouse', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required' });
    }

    const notifications = await Notification.find({
      roleTargets: role
    }).sort({ createdAtIso: -1 });

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    const { role, notificationIds } = req.body;
    
    if (!role || !['client', 'warehouse', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required' });
    }

    if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await Notification.updateMany(
        { id: { $in: notificationIds }, roleTargets: role },
        { $set: { [`unreadBy.${role}`]: false } }
      );
    } else {
      // Mark all notifications for this role as read
      await Notification.updateMany(
        { roleTargets: role },
        { $set: { [`unreadBy.${role}`]: false } }
      );
    }

    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    res.status(500).json({ error: error.message });
  }
};
