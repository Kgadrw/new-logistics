// Admin controller
import User from '../models/User.js';
import Shipment from '../models/Shipment.js';
import PricingRules from '../models/PricingRules.js';
import AuditEvent from '../models/AuditEvent.js';
import { makeId } from '../utils/idGenerator.js';

function nowIso() {
  return new Date().toISOString();
}

export const getAdminDashboard = async (req, res) => {
  try {
    const totalShipments = await Shipment.countDocuments();
    const totalUsers = await User.countDocuments();
    const activeWarehouses = await User.countDocuments({ role: 'warehouse', active: true });
    
    const allShipments = await Shipment.find();
    const totalRevenue = allShipments.reduce((sum, s) => sum + (s.estimatedCostUsd || 0), 0);

    res.json({
      totalShipments,
      totalUsers,
      totalRevenue,
      activeWarehouses
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getStatistics = async (req, res) => {
  try {
    const shipments = await Shipment.find();
    const users = await User.find();
    
    const shipmentStats = {
      total: shipments.length,
      draft: shipments.filter(s => s.status === 'Draft').length,
      submitted: shipments.filter(s => s.status === 'Submitted').length,
      received: shipments.filter(s => s.status === 'Received').length,
      inTransit: shipments.filter(s => s.status === 'In Transit').length,
      delivered: shipments.filter(s => s.status === 'Delivered').length,
    };

    const userStats = {
      total: users.length,
      clients: users.filter(u => u.role === 'client').length,
      warehouses: users.filter(u => u.role === 'warehouse').length,
      admins: users.filter(u => u.role === 'admin').length,
      active: users.filter(u => u.active).length,
    };

    const revenue = shipments.reduce((sum, s) => sum + (s.estimatedCostUsd || 0), 0);

    res.json({
      shipments: shipmentStats,
      users: userStats,
      revenue: { total: revenue },
      warehouses: {
        total: userStats.warehouses,
        active: users.filter(u => u.role === 'warehouse' && u.active).length,
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.query.adminId || 'u-admin-1';
    const user = await User.findOne({ id: adminId, role: 'admin' }).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.query.adminId || 'u-admin-1';
    const updates = req.body;
    
    delete updates.role;
    delete updates.password;
    delete updates.id;

    const user = await User.findOneAndUpdate(
      { id: adminId, role: 'admin' },
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find().sort({ createdAtIso: -1 });
    res.json(shipments);
  } catch (error) {
    console.error('Get all shipments error:', error);
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

export const updateShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Admin cannot change shipment status - only supervise
    if (updates.status !== undefined) {
      return res.status(400).json({ error: 'Admin cannot change shipment status. Status changes must be made by warehouse or client.' });
    }
    
    delete updates.id;
    delete updates.createdAtIso;
    delete updates.status; // Ensure status is not updated even if sent

    const shipment = await Shipment.findOneAndUpdate(
      { id },
      { ...updates, updatedAtIso: nowIso() },
      { new: true, runValidators: true }
    );

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Create audit log
    const audit = new AuditEvent({
      id: makeId('aud'),
      createdAtIso: nowIso(),
      actor: 'Admin',
      action: 'Update Shipment',
      detail: `Shipment #${id} updated (status changes not allowed)`,
    });
    await audit.save();

    res.json({ success: true, message: 'Shipment updated successfully', shipment });
  } catch (error) {
    console.error('Update shipment error:', error);
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

    // Create audit log
    const audit = new AuditEvent({
      id: makeId('aud'),
      createdAtIso: nowIso(),
      actor: 'Admin',
      action: 'Delete Shipment',
      detail: `Shipment #${id} deleted`,
    });
    await audit.save();

    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) {
    console.error('Delete shipment error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query; // Optional filter by role
    
    let query = {};
    if (role && (role === 'client' || role === 'warehouse' || role === 'admin')) {
      query.role = role;
    }

    const users = await User.find(query).select('-password'); // Exclude password from response
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: Implement actual data fetching
    res.json({ id, message: 'User details' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, address, company, location, capacity, manager, contact } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        error: 'Name, email, password, and role are required' 
      });
    }

    // Only allow creating client or warehouse users (not admin)
    if (role !== 'client' && role !== 'warehouse') {
      return res.status(400).json({ 
        error: 'Can only create client or warehouse accounts' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email already exists' 
      });
    }

    // Create new user
    const userId = makeId();
    const newUser = new User({
      id: userId,
      role,
      name,
      email,
      password, // Stored as plain text
      active: true,
      // Client-specific fields
      phone: phone || '',
      address: address || '',
      company: company || '',
      // Warehouse-specific fields
      location: location || '',
      capacity: capacity || '',
      manager: manager || '',
      contact: contact || '',
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: `${role} account created successfully`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        active: newUser.active,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'User with this email already exists' 
      });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow updating role or password through this endpoint
    delete updates.role;
    delete updates.password;

    const user = await User.findOneAndUpdate(
      { id },
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create audit log if active status changed
    if (updates.active !== undefined) {
      const audit = new AuditEvent({
        id: makeId('aud'),
        createdAtIso: nowIso(),
        actor: 'Admin',
        action: updates.active ? 'Activate User' : 'Deactivate User',
        detail: `User ${user.name} (${user.email}) ${updates.active ? 'activated' : 'deactivated'}`,
      });
      await audit.save();
    }

    res.json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOneAndDelete({ id });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getPricingRules = async (req, res) => {
  try {
    const pricing = await PricingRules.getPricingRules();
    res.json({
      pricePerKgUsd: pricing.pricePerKgUsd,
      transportPriceUsd: pricing.transportPriceUsd,
      warehouseHandlingFeeUsd: pricing.warehouseHandlingFeeUsd
    });
  } catch (error) {
    console.error('Get pricing rules error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updatePricingRules = async (req, res) => {
  try {
    const updates = req.body;
    
    let pricing = await PricingRules.findOne();
    if (!pricing) {
      pricing = new PricingRules(updates);
    } else {
      Object.assign(pricing, updates);
    }
    await pricing.save();

    // Create audit log
    const audit = new AuditEvent({
      id: makeId('aud'),
      createdAtIso: nowIso(),
      actor: 'Admin',
      action: 'Update Pricing',
      detail: 'Pricing rules updated',
    });
    await audit.save();

    res.json({ success: true, message: 'Pricing rules updated successfully', pricing });
  } catch (error) {
    console.error('Update pricing rules error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditEvent.find().sort({ createdAtIso: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: error.message });
  }
};
