// Authentication controller
import User from '../models/User.js';
import { makeId } from '../utils/idGenerator.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, phone, address, company } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Name, email, and password are required' 
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

    // Create new user (password stored as plain text for better UX)
    const userId = makeId();
    const newUser = new User({
      id: userId,
      role: 'client',
      name,
      email,
      password, // Stored as plain text
      phone: phone || '',
      address: address || '',
      company: company || '',
      active: true,
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'User with this email already exists' 
      });
    }
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(401).json({ 
        error: 'Account is deactivated' 
      });
    }

    // Verify password (plain text comparison for better UX)
    if (user.password !== password) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Optional: Verify role matches (if role is provided)
    if (role && user.role !== role) {
      return res.status(403).json({ 
        error: 'Invalid role for this account' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      token: 'mock-jwt-token' // TODO: Generate actual JWT token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    // TODO: Implement logout logic (invalidate token, etc.)
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    // TODO: Implement token verification
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    res.json({ valid: true });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
