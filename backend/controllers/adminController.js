import { db } from '../config/db.js';

export const getStats = async (req, res) => {
  try {
    const userCount = await db.query('SELECT COUNT(*) as count FROM users');
    const charCount = await db.query('SELECT COUNT(*) as count FROM characters');
    const msgCount = await db.query('SELECT COUNT(*) as count FROM messages');
    const convCount = await db.query('SELECT COUNT(*) as count FROM conversations');

    const totalUsers = userCount[0]?.count || userCount[0]?.['COUNT(*)'] || 0;
    const totalChars = charCount[0]?.count || charCount[0]?.['COUNT(*)'] || 0;
    const totalMsgs = msgCount[0]?.count || msgCount[0]?.['COUNT(*)'] || 0;
    const totalConvs = convCount[0]?.count || convCount[0]?.['COUNT(*)'] || 0;

    // Ambil list semua user dan karakter untuk keperluan moderasi
    const users = await db.query('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC');
    const characters = await db.query('SELECT id, name, category, chat_count, rating, creator_id FROM characters ORDER BY chat_count DESC');

    res.status(200).json({
      stats: {
        totalUsers: Number(totalUsers),
        totalCharacters: Number(totalChars),
        totalMessages: Number(totalMsgs),
        totalConversations: Number(totalConvs)
      },
      users,
      characters
    });
  } catch (error) {
    console.error('Error getStats:', error);
    res.status(500).json({ message: 'Gagal memuat statistik admin.' });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (id === req.userId) {
    return res.status(400).json({ message: 'Anda tidak dapat menghapus akun Anda sendiri dari panel admin.' });
  }

  try {
    await db.run('DELETE FROM users WHERE id = $1', [id]);
    await db.run('DELETE FROM settings WHERE user_id = $1', [id]);
    
    // Hapus percakapan & pesan yang dibuat user tersebut
    const convs = await db.query('SELECT id FROM conversations WHERE user_id = $1', [id]);
    for (const c of convs) {
      await db.run('DELETE FROM messages WHERE conversation_id = $1', [c.id]);
    }
    await db.run('DELETE FROM conversations WHERE user_id = $1', [id]);
    await db.run('DELETE FROM memories WHERE user_id = $1', [id]);

    res.status(200).json({ message: 'Pengguna berhasil dihapus beserta seluruh datanya.' });
  } catch (error) {
    console.error('Error deleteUser:', error);
    res.status(500).json({ message: 'Gagal menghapus pengguna.' });
  }
};

export const deleteCharacterAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    await db.run('DELETE FROM characters WHERE id = $1', [id]);
    const convs = await db.query('SELECT id FROM conversations WHERE character_id = $1', [id]);
    for (const c of convs) {
      await db.run('DELETE FROM messages WHERE conversation_id = $1', [c.id]);
    }
    await db.run('DELETE FROM conversations WHERE character_id = $1', [id]);
    await db.run('DELETE FROM memories WHERE character_id = $1', [id]);

    res.status(200).json({ message: 'Karakter berhasil dimoderasi/dihapus.' });
  } catch (error) {
    console.error('Error deleteCharacterAdmin:', error);
    res.status(500).json({ message: 'Gagal menghapus karakter.' });
  }
};

export const monitorApiUsage = async (req, res) => {
  // Metrik pemantauan API simulatif modern
  const mockApiUsage = {
    cpuLoad: (Math.random() * 25 + 10).toFixed(1) + '%',
    memoryUsage: (Math.random() * 200 + 400).toFixed(0) + ' MB / 2048 MB',
    totalRequests24h: Math.floor(Math.random() * 5000 + 20000),
    avgResponseTime: Math.floor(Math.random() * 100 + 150) + 'ms',
    errorRate: (Math.random() * 0.4).toFixed(3) + '%',
    activeConnections: Math.floor(Math.random() * 20 + 80)
  };
  res.status(200).json(mockApiUsage);
};
