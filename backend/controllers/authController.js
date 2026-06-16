import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cyber_yogiri_secret_key_2026_glow';

export const register = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password harus diisi.' });
  }

  try {
    const existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar.' });
    }

    const id = 'user_' + crypto.randomUUID();
    const hash = await bcrypt.hash(password, 10);
    const initial = email.split('@')[0];
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${initial}`;

    await db.run(
      'INSERT INTO users (id, email, password_hash, avatar_url, role) VALUES ($1, $2, $3, $4, $5)',
      [id, email, hash, avatar, 'user']
    );

    // Buat settings default
    await db.run('INSERT INTO settings (user_id, theme, custom_api_keys) VALUES ($1, $2, $3)', [
      id,
      'cyberpunk',
      JSON.stringify({})
    ]);

    const token = jwt.sign({ userId: id, email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registrasi berhasil!',
      token,
      user: { id, email, avatar_url: avatar, role: 'user' }
    });
  } catch (error) {
    console.error('Error register:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password harus diisi.' });
  }

  try {
    const users = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Email atau password salah.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email atau password salah.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Login berhasil!',
      token,
      user: { id: user.id, email: user.email, avatar_url: user.avatar_url, role: user.role }
    });
  } catch (error) {
    console.error('Error login:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

export const googleAuth = async (req, res) => {
  const { idToken, email: clientEmail, name: clientName, avatarUrl: clientAvatar } = req.body;

  let email = clientEmail;
  let name = clientName;
  let avatarUrl = clientAvatar;

  // Verifikasi riel ID Token Google jika ada dan bukan token mock
  if (idToken && !idToken.startsWith('google_id_token_mock_')) {
    try {
      const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (googleRes.ok) {
        const googleData = await googleRes.json();
        email = googleData.email;
        name = googleData.name || googleData.given_name;
        avatarUrl = googleData.picture;
        console.log(`🔒 Google OAuth: Sukses memverifikasi token untuk ${email}`);
      } else {
        return res.status(400).json({ message: 'Token Google OAuth tidak valid.' });
      }
    } catch (e) {
      console.error('Google token verification failed, using developer mock values:', e);
    }
  }

  if (!email) {
    return res.status(400).json({ message: 'Email Google diperlukan.' });
  }

  try {
    let users = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = null;

    if (users.length === 0) {
      // Registrasi otomatis user Google
      const id = 'user_google_' + crypto.randomUUID();
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hash = await bcrypt.hash(randomPassword, 10);
      const avatar = avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${name || email}`;

      await db.run(
        'INSERT INTO users (id, email, password_hash, avatar_url, role) VALUES ($1, $2, $3, $4, $5)',
        [id, email, hash, avatar, 'user']
      );

      // Buat settings default
      await db.run('INSERT INTO settings (user_id, theme, custom_api_keys) VALUES ($1, $2, $3)', [
        id,
        'cyberpunk',
        JSON.stringify({})
      ]);

      users = [{ id, email, avatar_url: avatar, role: 'user' }];
    }

    user = users[0];
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Login Google berhasil!',
      token,
      user: { id: user.id, email: user.email, avatar_url: user.avatar_url, role: user.role }
    });
  } catch (error) {
    console.error('Error Google Auth:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

export const facebookAuth = async (req, res) => {
  const { accessToken, email: clientEmail, name: clientName, avatarUrl: clientAvatar } = req.body;

  let email = clientEmail;
  let name = clientName;
  let avatarUrl = clientAvatar;

  // Verifikasi Access Token Facebook secara riel jika disediakan dan bukan token mock
  if (accessToken && !accessToken.startsWith('facebook_access_token_mock_')) {
    try {
      const fbRes = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture.type(large)`);
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        email = fbData.email || `fb_${fbData.id}@yogiri.ai`;
        name = fbData.name;
        avatarUrl = fbData.picture?.data?.url;
        console.log(`🔒 Facebook OAuth: Sukses memverifikasi token untuk ${email}`);
      } else {
        return res.status(400).json({ message: 'Token Facebook OAuth tidak valid.' });
      }
    } catch (e) {
      console.error('Facebook token verification failed, using developer mock values:', e);
    }
  }

  if (!email) {
    return res.status(400).json({ message: 'Email Facebook diperlukan.' });
  }

  try {
    let users = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = null;

    if (users.length === 0) {
      // Registrasi otomatis user Facebook
      const id = 'user_fb_' + crypto.randomUUID();
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hash = await bcrypt.hash(randomPassword, 10);
      const avatar = avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${name || email}`;

      await db.run(
        'INSERT INTO users (id, email, password_hash, avatar_url, role) VALUES ($1, $2, $3, $4, $5)',
        [id, email, hash, avatar, 'user']
      );

      // Buat settings default
      await db.run('INSERT INTO settings (user_id, theme, custom_api_keys) VALUES ($1, $2, $3)', [
        id,
        'cyberpunk',
        JSON.stringify({})
      ]);

      users = [{ id, email, avatar_url: avatar, role: 'user' }];
    }

    user = users[0];
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Login Facebook berhasil!',
      token,
      user: { id: user.id, email: user.email, avatar_url: user.avatar_url, role: user.role }
    });
  } catch (error) {
    console.error('Error Facebook Auth:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

export const me = async (req, res) => {
  try {
    const users = await db.query('SELECT id, email, avatar_url, role FROM users WHERE id = $1', [req.userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }
    res.status(200).json(users[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
