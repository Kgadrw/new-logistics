// Client controller
import Shipment from '../models/Shipment.js';
import User from '../models/User.js';
import PricingRules from '../models/PricingRules.js';
import Notification from '../models/Notification.js';
import { makeId, makeShipmentId } from '../utils/idGenerator.js';

function nowIso() {
  return new Date().toISOString();
}

function estimateCostUsd(pricing, shipment) {
  const kg = shipment.products.reduce((s, p) => s + p.weightKg * p.quantity, 0);
  const base = kg * pricing.pricePerKgUsd + pricing.warehouseHandlingFeeUsd;
  const transport = shipment.dispatch ? pricing.transportPriceUsd[shipment.dispatch.method] : 0;
  return Math.round(base + transport);
}

export const getClientDashboard = async (req, res) => {
  try {
    const clientId = req.query.clientId;
    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }
    
    const client = await User.findOne({ id: clientId, role: 'client' });
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const shipments = await Shipment.find({ clientId }).sort({ createdAtIso: -1 });
    
    const totalShipments = shipments.length;
    const activeShipments = shipments.filter(s => s.status !== 'Delivered' && s.status !== 'Draft').length;
    const delivered = shipments.filter(s => s.status === 'Delivered').length;
    const totalSpent = shipments.reduce((sum, s) => sum + (s.estimatedCostUsd || 0), 0);
    const recentShipments = shipments.slice(0, 5);

    res.json({
      totalShipments,
      activeShipments,
      delivered,
      totalSpent,
      recentShipments
    });
  } catch (error) {
    console.error('Get client dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getClientProfile = async (req, res) => {
  try {
    const clientId = req.query.clientId;
    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }
    
    const user = await User.findOne({ id: clientId, role: 'client' }).select('-password');
    
    if (!user) {
      // Return empty profile instead of 404 for new clients
      return res.json({
        id: clientId,
        name: '',
        email: '',
        phone: '',
        address: '',
        company: ''
      });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      company: user.company || ''
    });
  } catch (error) {
    console.error('Get client profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateClientProfile = async (req, res) => {
  try {
    const clientId = req.query.clientId;
    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }
    
    const updates = req.body;
    
    delete updates.role;
    delete updates.password;
    delete updates.id;

    let user = await User.findOne({ id: clientId, role: 'client' });

    if (!user) {
      // Create new client if doesn't exist
      const { makeId } = await import('../utils/idGenerator.js');
      user = new User({
        id: clientId,
        role: 'client',
        name: updates.name || '',
        email: updates.email || '',
        password: 'temp123', // Temporary password, should be set properly
        phone: updates.phone || '',
        address: updates.address || '',
        company: updates.company || '',
        active: true,
      });
      await user.save();
    } else {
      // Update existing user
      Object.assign(user, updates);
      await user.save();
    }

    const userResponse = await User.findOne({ id: clientId, role: 'client' }).select('-password');
    res.json({ success: true, message: 'Profile updated successfully', user: userResponse });
  } catch (error) {
    console.error('Update client profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getClientShipments = async (req, res) => {
  try {
    const clientId = req.query.clientId || 'u-client-1';
    const shipments = await Shipment.find({ clientId }).sort({ createdAtIso: -1 });
    res.json(shipments);
  } catch (error) {
    console.error('Get client shipments error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getClientShipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findOne({ id });
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.json(shipment);
  } catch (error) {
    console.error('Get client shipment error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createShipment = async (req, res) => {
  try {
    const { clientName, warehouseName, warehouseId, notes, products, clientId } = req.body;

    if (!clientName || !warehouseName || !products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Client name, warehouse name, and products are required' });
    }

    // If warehouseId is provided, verify the warehouse exists
    let finalWarehouseId = warehouseId || null;
    if (warehouseId) {
      const warehouse = await User.findOne({ id: warehouseId, role: 'warehouse' });
      if (!warehouse) {
        return res.status(400).json({ error: 'Invalid warehouse ID' });
      }
      // Ensure warehouseName matches if warehouseId is provided
      if (warehouse.name !== warehouseName) {
        console.warn(`Warehouse name mismatch: provided "${warehouseName}" but warehouse "${warehouseId}" has name "${warehouse.name}"`);
      }
    }

    // Get pricing for cost estimation
    const pricing = await PricingRules.getPricingRules();

    // Create shipment
    const shipmentId = makeShipmentId();
    const now = nowIso();
    
    const shipment = new Shipment({
      id: shipmentId,
      clientName,
      clientId: clientId || 'u-client-1',
      warehouseName,
      warehouseId: finalWarehouseId,
      status: 'Draft',
      products: products.map(p => ({
        id: makeId('prd'),
        ...p
      })),
      notes: notes || '',
      createdAtIso: now,
      updatedAtIso: now,
      estimatedCostUsd: 0,
    });

    // Calculate estimated cost
    shipment.estimatedCostUsd = estimateCostUsd(pricing, shipment);
    await shipment.save();

    // Create notification
    const notification = new Notification({
      id: makeId('ntf'),
      createdAtIso: now,
      roleTargets: ['client'],
      unreadBy: { client: true, warehouse: false, admin: false },
      shipmentId: shipmentId,
      title: 'Draft created',
      message: `Draft shipment #${shipmentId} created. Add items and submit when ready.`,
    });
    await notification.save();

    res.status(201).json({ success: true, shipment });
  } catch (error) {
    console.error('Create shipment error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Shipment ID already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, products } = req.body;

    const shipment = await Shipment.findOne({ id });
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (shipment.status !== 'Draft') {
      return res.status(400).json({ error: 'Only draft shipments can be edited' });
    }

    // Get pricing for cost recalculation
    const pricing = await PricingRules.getPricingRules();

    if (products) {
      shipment.products = products.map(p => ({
        id: p.id || makeId('prd'),
        ...p
      }));
    }
    if (notes !== undefined) {
      shipment.notes = notes;
    }
    
    shipment.updatedAtIso = nowIso();
    shipment.estimatedCostUsd = estimateCostUsd(pricing, shipment);
    await shipment.save();

    res.json({ success: true, message: 'Shipment updated successfully', shipment });
  } catch (error) {
    console.error('Update shipment error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateShipmentNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const shipment = await Shipment.findOne({ id });
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Allow updating notes at any status
    shipment.notes = notes || '';
    shipment.updatedAtIso = nowIso();
    await shipment.save();

    res.json({ success: true, message: 'Notes updated successfully', shipment });
  } catch (error) {
    console.error('Update shipment notes error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findOneAndDelete({ id });
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) {
    console.error('Delete shipment error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getWarehouses = async (req, res) => {
  try {
    // Get all active warehouses for clients to select from
    const warehouses = await User.find({ role: 'warehouse', active: { $ne: false } })
      .select('id name location capacity manager contact email')
      .sort({ name: 1 });
    
    res.json(warehouses);
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const submitShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findOne({ id });
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (shipment.status !== 'Draft') {
      return res.status(400).json({ error: 'Only draft shipments can be submitted' });
    }

    shipment.status = 'Submitted';
    shipment.updatedAtIso = nowIso();
    await shipment.save();

    // Create notifications
    const notification = new Notification({
      id: makeId('ntf'),
      createdAtIso: nowIso(),
      roleTargets: ['warehouse', 'admin'],
      unreadBy: { client: false, warehouse: true, admin: true },
      shipmentId: id,
      title: 'Shipment submitted',
      message: `Shipment #${id} has been submitted by ${shipment.clientName}.`,
    });
    await notification.save();

    res.json({ success: true, message: 'Shipment submitted successfully', shipment });
  } catch (error) {
    console.error('Submit shipment error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const markDelivered = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findOne({ id });
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (shipment.status !== 'In Transit') {
      return res.status(400).json({ error: 'Can only mark as Delivered from In Transit status' });
    }

    shipment.status = 'Delivered';
    shipment.updatedAtIso = nowIso();
    await shipment.save();

    // Create notification
    const notification = new Notification({
      id: makeId('ntf'),
      createdAtIso: nowIso(),
      roleTargets: ['warehouse', 'admin'],
      unreadBy: { client: false, warehouse: true, admin: true },
      shipmentId: id,
      title: 'Shipment delivered',
      message: `Shipment #${id} has been marked as delivered by ${shipment.clientName}.`,
    });
    await notification.save();

    res.json({ success: true, message: 'Shipment marked as delivered successfully', shipment });
  } catch (error) {
    console.error('Mark delivered error:', error);
    res.status(500).json({ error: error.message });
  }
};
