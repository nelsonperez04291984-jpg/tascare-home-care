import pool from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-tascare-key';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // We allow a simulated superadmin override for emergencies during demo
    if (email === 'admin@tascare.com' && password === 'admin') {
       return res.json({
          token: jwt.sign({ id: 'admin', role: 'admin' }, JWT_SECRET),
          user: { id: 'admin', name: 'System Admin', email: 'admin@tascare.com', role: 'admin', tenant_id: '00000000-0000-0000-0000-000000000000' }
       });
    }
    
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'We could not find an account with that email.' });
    }
    
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }
    
    const token = jwt.sign({ id: user.id, role: user.role, tenant_id: user.tenant_id }, JWT_SECRET, { expiresIn: '12h' });
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Login failed due to a server error.', detail: error.message });
  }
};
