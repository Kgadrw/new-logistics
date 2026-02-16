// Warehouse controller
import Shipment from '../models/Shipment.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { makeId } from '../utils/idGenerator.js';

function nowIso() {
  return new Date().toISOString();
}

export const getWarehouseDashboard = async (req, res) => {
  try {
    const warehouseId = req.query.warehouseId || 'u-wh-1';
    const warehouse = await User.findOne({ id: warehouseId, role: 'warehouse' });
    
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // Filter by both warehouseId (if available) and warehouseName for backward compatibility
    const allShipments = await Shipment.find({
      $or: [
        { warehouseId: warehouse.id },
        { warehouseName: warehouse.name }
      ]
    }).sort({ createdAtIso: -1 });
    
    const pendingReceipt = allShipments.filter(s => s.status === 'Submitted').length;
    const receivedToday = allShipments.filter(s => s.status === 'Received').length;
    const inTransit = allShipments.filter(s => s.status === 'Left Warehouse' || s.status === 'In Transit').length;
    const processed = allShipments.filter(s => s.status === 'Delivered').length;
    const recentActivity = allShipments.slice(0, 5);

    res.json({
      pendingReceipt,
      receivedToday,
      inTransit,
      processed,
      recentActivity
    });
  } catch (error) {
    console.error('Get warehouse dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getWarehouseProfile = async (req, res) => {
  try {
    const warehouseId = req.query.warehouseId || 'u-wh-1';
    const user = await User.findOne({ id: warehouseId, role: 'warehouse' }).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email || '',
      location: user.location || '',
      capacity: user.capacity || '',
      manager: user.manager || '',
      contact: user.contact || '',
      phone: user.contact || '', // Alias for contact
      address: user.location || '', // Alias for location
    });
  } catch (error) {
    console.error('Get warehouse profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateWarehouseProfile = async (req, res) => {
  try {
    const warehouseId = req.query.warehouseId || 'u-wh-1';
    const updates = req.body;
    
    delete updates.role;
    delete updates.password;
    delete updates.id;

    const user = await User.findOneAndUpdate(
      { id: warehouseId, role: 'warehouse' },
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update warehouse profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getIncomingShipments = async (req, res) => {
  try {
    const warehouseId = req.query.warehouseId || 'u-wh-1';
    const warehouse = await User.findOne({ id: warehouseId, role: 'warehouse' });
    
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // Debug: Check all shipments for this warehouse first
    const allWarehouseShipments = await Shipment.find({
      $or: [
        { warehouseId: warehouse.id },
        { warehouseName: { $regex: new RegExp(`^${warehouse.name}$`, 'i') } }
      ]
    });
    
    console.log(`[getIncomingShipments] Warehouse: ${warehouse.id} (${warehouse.name})`);
    console.log(`[getIncomingShipments] Total shipments for this warehouse: ${allWarehouseShipments.length}`);
    console.log(`[getIncomingShipments] Status breakdown:`, 
      allWarehouseShipments.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {})
    );

    // Filter by both warehouseId (if available) and warehouseName for backward compatibility
    // Use case-insensitive matching for warehouseName to handle any case differences
    const shipments = await Shipment.find({
      $or: [
        { warehouseId: warehouse.id },
        { warehouseName: { $regex: new RegExp(`^${warehouse.name}$`, 'i') } }
      ],
      status: { $in: ['Submitted', 'Received'] }
    }).sort({ createdAtIso: -1 });
    
    console.log(`[getIncomingShipments] Found ${shipments.length} incoming shipments (Submitted or Received)`);
    
    res.json(shipments);
  } catch (error) {
    console.error('Get incoming shipments error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getOutgoingShipments = async (req, res) => {
  try {
    const warehouseId = req.query.warehouseId || 'u-wh-1';
    const warehouse = await User.findOne({ id: warehouseId, role: 'warehouse' });
    
    if (!warehouse) {
      console.warn(`[getOutgoingShipments] Warehouse not found for ID: ${warehouseId}`);
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // Outgoing shipments are those that are "Received" (ready to dispatch) or "Left Warehouse" (ready to mark as in transit)
    // Use case-insensitive matching for warehouseName for backward compatibility
    const query = {
      $or: [
        { warehouseId: warehouse.id },
        { warehouseName: { $regex: new RegExp(`^${warehouse.name}$`, 'i') } }
      ],
      status: { $in: ['Received', 'Left Warehouse'] }
    };

    const shipments = await Shipment.find(query).sort({ createdAtIso: -1 });
    
    console.log(`[getOutgoingShipments] Warehouse: ${warehouse.id} (${warehouse.name}), Query: ${JSON.stringify(query)}, Found ${shipments.length} outgoing shipments`);
    res.json(shipments);
  } catch (error) {
    console.error('Get outgoing shipments error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getShipmentHistory = async (req, res) => {
  try {
    const warehouseId = req.query.warehouseId || 'u-wh-1';
    const warehouse = await User.findOne({ id: warehouseId, role: 'warehouse' });
    
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // Filter by both warehouseId (if available) and warehouseName for backward compatibility
    const shipments = await Shipment.find({
      $or: [
        { warehouseId: warehouse.id },
        { warehouseName: warehouse.name }
      ],
      status: { $in: ['Delivered', 'In Transit', 'Left Warehouse'] }
    }).sort({ createdAtIso: -1 });
    
    res.json(shipments);
  } catch (error) {
    console.error('Get shipment history error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getShipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findOne({ id });
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.json(shipment);
  } catch (error) {
    console.error('Get shipment error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const receiveShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedProductImages, draftBL, consumerNumber } = req.body;
    const shipment = await Shipment.findOne({ id });
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (shipment.status !== 'Submitted') {
      return res.status(400).json({ error: 'Only submitted shipments can be received' });
    }

    shipment.status = 'Received';
    if (receivedProductImages && Array.isArray(receivedProductImages)) {
      shipment.receivedProductImages = receivedProductImages;
    }
    if (draftBL) {
      shipment.draftBL = draftBL;
    }
    if (consumerNumber) {
      shipment.consumerNumber = consumerNumber;
    }
    shipment.updatedAtIso = nowIso();
    await shipment.save();

    // Create notification
    const notification = new Notification({
      id: makeId('ntf'),
      createdAtIso: nowIso(),
      roleTargets: ['client', 'admin'],
      unreadBy: { client: true, warehouse: false, admin: true },
      shipmentId: id,
      title: 'Shipment received',
      message: `Shipment #${id} has been received at the warehouse.`,
    });
    await notification.save();

    res.json({ success: true, message: 'Shipment received successfully', shipment });
  } catch (error) {
    console.error('Receive shipment error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const dispatchShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { method, transportId, departureDate, departureDateIso, packagingList, packageNumber, consigneeNumber, shippingMark } = req.body;
    
    const departureDateValue = departureDateIso || departureDate;
    if (!method || !transportId || !departureDateValue) {
      return res.status(400).json({ error: 'Method, transport ID, and departure date are required' });
    }

    const shipment = await Shipment.findOne({ id });
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (shipment.status !== 'Received') {
      return res.status(400).json({ error: 'Only received shipments can be dispatched' });
    }

    shipment.status = 'Left Warehouse';
    shipment.dispatch = {
      method,
      transportId,
      departureDateIso: departureDateValue,
      packagingList: packagingList || undefined,
      packageNumber: packageNumber || undefined,
      consigneeNumber: consigneeNumber || undefined,
      shippingMark: shippingMark || 'UZA Solutions',
    };
    shipment.updatedAtIso = nowIso();
    await shipment.save();

    // Create notification
    const notification = new Notification({
      id: makeId('ntf'),
      createdAtIso: nowIso(),
      roleTargets: ['client', 'admin'],
      unreadBy: { client: true, warehouse: false, admin: true },
      shipmentId: id,
      title: 'Shipment dispatched',
      message: `Shipment #${id} has left the warehouse via ${method}.`,
    });
    await notification.save();

    res.json({ success: true, message: 'Shipment dispatched successfully', shipment });
  } catch (error) {
    console.error('Dispatch shipment error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateShipmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Warehouse can set: Submitted, Received, Left Warehouse, In Transit
    const allowedStatuses = ['Submitted', 'Received', 'Left Warehouse', 'In Transit'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Warehouse can only set status to: Submitted, Received, Left Warehouse, or In Transit' });
    }

    const shipment = await Shipment.findOne({ id });
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Allow forward and reverse transitions for warehouse
    // Forward: Submitted → Received → Left Warehouse → In Transit
    // Reverse: In Transit → Left Warehouse → Received → Submitted
    const validTransitions = {
      'Submitted': ['Received'],
      'Received': ['Submitted', 'Left Warehouse'],
      'Left Warehouse': ['Received', 'In Transit'],
      'In Transit': ['Left Warehouse'],
      'Delivered': [] // Cannot change from Delivered
    };

    const currentStatus = shipment.status;
    if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({ 
        error: `Cannot change status from ${currentStatus} to ${status}. Valid transitions: ${validTransitions[currentStatus].join(', ')}` 
      });
    }

    // If reversing to Submitted, clear dispatch info
    if (status === 'Submitted' && shipment.dispatch) {
      shipment.dispatch = undefined;
    }
    // If reversing to Received, clear dispatch info
    if (status === 'Received' && shipment.dispatch) {
      shipment.dispatch = undefined;
    }

    shipment.status = status;
    shipment.updatedAtIso = nowIso();
    await shipment.save();

    // Create notification for status change
    const statusMessages = {
      'Submitted': 'reverted to Submitted',
      'Received': 'marked as Received',
      'Left Warehouse': 'marked as Left Warehouse',
      'In Transit': 'marked as In Transit'
    };

    const notification = new Notification({
      id: makeId('ntf'),
      createdAtIso: nowIso(),
      roleTargets: ['client', 'admin', 'warehouse'],
      unreadBy: { client: true, warehouse: false, admin: true },
      shipmentId: id,
      title: `Status changed to ${status}`,
      message: `Shipment #${id} has been ${statusMessages[status] || 'status updated'}.`,
    });
    await notification.save();

    res.json({ success: true, message: 'Status updated successfully', shipment });
  } catch (error) {
    console.error('Update shipment status error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const markInTransit = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findOne({ id });
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (shipment.status !== 'Left Warehouse') {
      return res.status(400).json({ error: 'Can only mark as In Transit from Left Warehouse status' });
    }

    shipment.status = 'In Transit';
    shipment.updatedAtIso = nowIso();
    await shipment.save();

    // Create notification
    const notification = new Notification({
      id: makeId('ntf'),
      createdAtIso: nowIso(),
      roleTargets: ['client', 'admin'],
      unreadBy: { client: true, warehouse: false, admin: true },
      shipmentId: id,
      title: 'Shipment in transit',
      message: `Shipment #${id} is now in transit.`,
    });
    await notification.save();

    res.json({ success: true, message: 'Shipment marked as In Transit successfully', shipment });
  } catch (error) {
    console.error('Mark in transit error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const addWarehouseRemarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    
    const shipment = await Shipment.findOne({ id });
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    shipment.warehouseRemarks = remarks || '';
    shipment.updatedAtIso = nowIso();
    await shipment.save();

    res.json({ success: true, message: 'Remarks added successfully', shipment });
  } catch (error) {
    console.error('Add warehouse remarks error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateShipmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      receivedProductImages, 
      draftBL, 
      consumerNumber,
      packagingList,
      packageNumber,
      consigneeNumber,
      shippingMark,
      notes
    } = req.body;
    
    const shipment = await Shipment.findOne({ id });
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Update client notes if provided (warehouse can edit client notes)
    if (notes !== undefined) {
      shipment.notes = notes || '';
    }

    // Update received details
    if (receivedProductImages !== undefined) {
      shipment.receivedProductImages = Array.isArray(receivedProductImages) ? receivedProductImages : [];
    }
    if (draftBL !== undefined) {
      shipment.draftBL = draftBL || undefined;
    }
    if (consumerNumber !== undefined) {
      shipment.consumerNumber = consumerNumber || undefined;
    }

    // Update dispatch details if dispatch exists
    if (shipment.dispatch) {
      if (packagingList !== undefined) {
        shipment.dispatch.packagingList = packagingList || undefined;
      }
      if (packageNumber !== undefined) {
        shipment.dispatch.packageNumber = packageNumber || undefined;
      }
      if (consigneeNumber !== undefined) {
        shipment.dispatch.consigneeNumber = consigneeNumber || undefined;
      }
      if (shippingMark !== undefined) {
        shipment.dispatch.shippingMark = shippingMark || 'UZA Solutions';
      }
    }

    shipment.updatedAtIso = nowIso();
    await shipment.save();

    res.json({ success: true, message: 'Shipment details updated successfully', shipment });
  } catch (error) {
    console.error('Update shipment details error:', error);
    res.status(500).json({ error: error.message });
  }
};
