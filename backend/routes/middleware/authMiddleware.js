import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cyber_yogiri_secret_key_2026_glow';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak. Token tidak disediakan.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Token tidak valid atau kedaluwarsa.' });
  }
};

export const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.userRole === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Akses ditolak. Memerlukan hak akses Admin.' });
    }
  });
};
