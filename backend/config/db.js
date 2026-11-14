const mongoose = require('mongoose');
const dns = require('dns');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Post = require('../models/post');
const sampleBlogs = require('../seed');

// Force reliable public DNS for Atlas SRV resolution
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/softrate_blog';

  try {
    console.log('Connecting to MongoDB Atlas (waiting for initial SSL handshake)...');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 20000,
      family: 4
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // 1. Auto-seed Admin in Atlas if not yet created
    try {
      const adminExists = await User.findOne({ email: 'admin@softrate.com' });
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
          name: 'Super Admin',
          email: 'admin@softrate.com',
          password: hashedPassword,
          role: 'admin'
        });
        console.log('Default Admin (admin@softrate.com) verified in MongoDB.');
      }

      // 2. Auto-seed 42 Posts in Atlas if not yet populated
      const count = await Post.countDocuments();
      if (count < 42) {
        console.log(`Post count is ${count}. Populating all 42 articles...`);
        await Post.deleteMany({});
        await Post.insertMany(sampleBlogs);
        console.log('Successfully populated all 42 articles into MongoDB!');
      }
    } catch (seedErr) {
      console.warn('Note on auto-seeding:', seedErr.message);
    }
  } catch (error) {
    console.warn(`Primary MongoDB connection failed (${error.message}).`);

    // Attempt local MongoDB fallback
    if (uri !== 'mongodb://127.0.0.1:27017/softrate_blog') {
      try {
        console.log('Attempting local MongoDB fallback (mongodb://127.0.0.1:27017/softrate_blog)...');
        const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/softrate_blog', {
          serverSelectionTimeoutMS: 3000
        });
        console.log(`Connected to Local MongoDB fallback: ${localConn.connection.host}`);
        return;
      } catch (localErr) {
        console.warn(`Local fallback also unreachable: ${localErr.message}`);
      }
    }
    console.log('Express server will continue running on port 5000 in standalone mode.');
  }
};

module.exports = connectDB;