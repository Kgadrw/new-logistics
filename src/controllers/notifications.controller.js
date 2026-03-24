// Notifications controller
import Notification from '../models/Notification.js';
import Shipment from '../models/Shipment.js';
import User from '../models/User.js';

export const getNotifications = async (req, res) => {
  try {
    const { role, userId } = req.query;
    
    if (!role || !['client', 'warehouse', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Primary filter: user-scoped recipients.
    let notifications = await Notification.find({
      roleTargets: role,
      recipientUserIds: userId,
    }).sort({ createdAtIso: -1 });

    // Backward compatibility for legacy notifications without recipientUserIds.
    // We still isolate to the current user by shipment ownership.
    if (notifications.length === 0) {
      const legacy = await Notification.find({
        roleTargets: role,
        $or: [{ recipientUserIds: { $exists: false } }, { recipientUserIds: { $size: 0 } }],
      }).sort({ createdAtIso: -1 });

      if (legacy.length > 0) {
        if (role === 'admin') {
          const isAdmin = await User.exists({ id: userId, role: 'admin', active: { $ne: false } });
          notifications = isAdmin ? legacy : [];
        } else {
          const shipmentIds = legacy.map((n) => n.shipmentId).filter(Boolean);
          const shipments = shipmentIds.length > 0
            ? await Shipment.find({ id: { $in: shipmentIds } }).select('id clientId warehouseId')
            : [];
          const shipmentById = new Map(shipments.map((s) => [s.id, s]));
          notifications = legacy.filter((n) => {
            const shipment = shipmentById.get(n.shipmentId);
            if (!shipment) return false;
            return role === 'client'
              ? shipment.clientId === userId
              : shipment.warehouseId === userId;
          });
        }
      }
    }

    const normalized = notifications.map((n) => {
      const plain = n.toObject ? n.toObject() : n;
      const perUserUnread = Array.isArray(plain.unreadUserIds)
        ? plain.unreadUserIds.includes(userId)
        : Boolean(plain.unreadBy?.[role]);
      return {
        ...plain,
        unreadBy: {
          ...(plain.unreadBy || {}),
          [role]: perUserUnread,
        },
      };
    });

    res.json(normalized);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    const { role, userId, notificationIds } = req.body;
    
    if (!role || !['client', 'warehouse', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await Notification.updateMany(
        { id: { $in: notificationIds }, roleTargets: role, recipientUserIds: userId },
        { $pull: { unreadUserIds: userId }, $set: { [`unreadBy.${role}`]: false } }
      );
    } else {
      // Mark all notifications for this role as read
      await Notification.updateMany(
        { roleTargets: role, recipientUserIds: userId },
        { $pull: { unreadUserIds: userId }, $set: { [`unreadBy.${role}`]: false } }
      );
    }

    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    res.status(500).json({ error: error.message });
  }
};
