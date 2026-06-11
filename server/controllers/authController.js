'use strict';
/** متحكّم المصادقة */
const bcrypt = require('bcryptjs');
const { q } = require('../config/db');
const { signToken } = require('../middleware/auth');

/** POST /api/auth/login { email, password } */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'البريد وكلمة المرور مطلوبان' });
    const rows = await q(`SELECT * FROM users WHERE email = ?`, [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    const token = signToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { next(e); }
};

/** GET /api/auth/me */
exports.me = async (req, res) => {
  res.json({ user: req.user });
};
