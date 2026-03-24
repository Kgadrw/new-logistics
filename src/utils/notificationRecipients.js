import User from '../models/User.js';

export async function resolveNotificationRecipientUserIds({ shipment, roleTargets }) {
  const recipients = new Set();
  const roles = Array.isArray(roleTargets) ? roleTargets : [];

  if (roles.includes('client') && shipment?.clientId) {
    recipients.add(shipment.clientId);
  }

  if (roles.includes('warehouse')) {
    if (shipment?.warehouseId) {
      recipients.add(shipment.warehouseId);
    } else if (shipment?.warehouseName) {
      const warehouse = await User.findOne({
        role: 'warehouse',
        name: { $regex: new RegExp(`^${String(shipment.warehouseName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      }).select('id');
      if (warehouse?.id) recipients.add(warehouse.id);
    }
  }

  if (roles.includes('admin')) {
    const admins = await User.find({ role: 'admin', active: { $ne: false } }).select('id');
    admins.forEach((admin) => {
      if (admin?.id) recipients.add(admin.id);
    });
  }

  return Array.from(recipients);
}

