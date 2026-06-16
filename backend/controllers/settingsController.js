import { db } from '../config/db.js';

export const getSettings = async (req, res) => {
  try {
    const settings = await db.query('SELECT * FROM settings WHERE user_id = $1', [req.userId]);
    if (settings.length === 0) {
      // Inisialisasi jika belum ada
      await db.run('INSERT INTO settings (user_id, theme, custom_api_keys) VALUES ($1, $2, $3)', [
        req.userId,
        'cyberpunk',
        JSON.stringify({})
      ]);
      const newSettings = await db.query('SELECT * FROM settings WHERE user_id = $1', [req.userId]);
      return res.status(200).json(newSettings[0]);
    }
    res.status(200).json(settings[0]);
  } catch (error) {
    console.error('Error getSettings:', error);
    res.status(500).json({ message: 'Gagal mengambil pengaturan.' });
  }
};

export const updateSettings = async (req, res) => {
  const { theme, custom_api_keys } = req.body;

  try {
    const settings = await db.query('SELECT * FROM settings WHERE user_id = $1', [req.userId]);
    if (settings.length === 0) {
      await db.run('INSERT INTO settings (user_id, theme, custom_api_keys) VALUES ($1, $2, $3)', [
        req.userId,
        theme || 'cyberpunk',
        JSON.stringify(custom_api_keys || {})
      ]);
    } else {
      await db.run(
        'UPDATE settings SET theme = $1, custom_api_keys = $2 WHERE user_id = $3',
        [
          theme || settings[0].theme,
          custom_api_keys !== undefined ? JSON.stringify(custom_api_keys) : settings[0].custom_api_keys,
          req.userId
        ]
      );
    }
    res.status(200).json({ message: 'Pengaturan berhasil diperbarui.' });
  } catch (error) {
    console.error('Error updateSettings:', error);
    res.status(500).json({ message: 'Gagal memperbarui pengaturan.' });
  }
};
