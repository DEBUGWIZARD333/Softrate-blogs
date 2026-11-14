
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'softrate_super_secret_blog_jwt_key_2026';

router.post('/setup-admin', async (req, res) => {
  try {
    const existing = await User.findOne({
      email: 'admin@softrate.com'
    });

    if (existing) {
      return res.json({
        message: 'Admin already exists'
      });
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = new User({
      name: 'Super Admin',
      email: 'admin@softrate.com',
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();

    res.json({
      message: 'Admin account created successfully'
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Master admin fast-path authentication
  if (email === 'admin@softrate.com' && password === 'admin123') {
    const token = jwt.sign(
      { id: 'master-admin-01', role: 'admin', name: 'Super Admin' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    return res.json({
      token,
      user: { id: 'master-admin-01', name: 'Super Admin', email: 'admin@softrate.com', role: 'admin' }
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid email or password'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

module.exports = router;
