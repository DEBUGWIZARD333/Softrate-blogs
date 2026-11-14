const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'softrate_super_secret_blog_jwt_key_2026';

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT Auth Error:', error.message);
    res.status(401).json({ message: 'Token is expired. Please log out and log in again.' });
  }
};

module.exports = protect;
