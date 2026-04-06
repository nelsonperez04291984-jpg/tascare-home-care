import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-tascare-key';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token provided. Access Denied.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach decoded user data to req object
    req.user = {
      id: decoded.id,
      role: decoded.role,
      tenant_id: decoded.tenant_id
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token. Access Denied.' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
  }
};
