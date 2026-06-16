import crypto from 'crypto';
import { db } from '../config/db.js';

export const getMemories = async (req, res) => {
  const { characterId } = req.query;

  if (!characterId) {
    return res.status(400).json({ message: 'characterId diperlukan.' });
  }

  try {
    const memories = await db.query(
      'SELECT * FROM memories WHERE user_id = $1 AND character_id = $2 ORDER BY created_at DESC',
      [req.userId, characterId]
    );
    res.status(200).json(memories);
  } catch (error) {
    console.error('Error getMemories:', error);
    res.status(500).json({ message: 'Gagal mengambil data memori.' });
  }
};

export const createMemory = async (req, res) => {
  const { characterId, fact } = req.body;

  if (!characterId || !fact) {
    return res.status(400).json({ message: 'characterId dan data fakta (fact) wajib diisi.' });
  }

  try {
    const id = 'mem_' + crypto.randomUUID();
    await db.run(
      'INSERT INTO memories (id, user_id, character_id, fact) VALUES ($1, $2, $3, $4)',
      [id, req.userId, characterId, fact]
    );
    res.status(201).json({ message: 'Memori berhasil ditambahkan!', memoryId: id });
  } catch (error) {
    console.error('Error createMemory:', error);
    res.status(500).json({ message: 'Gagal menambahkan memori.' });
  }
};

export const updateMemory = async (req, res) => {
  const { id } = req.params;
  const { fact } = req.body;

  if (!fact) {
    return res.status(400).json({ message: 'Fakta memori tidak boleh kosong.' });
  }

  try {
    const mems = await db.query('SELECT * FROM memories WHERE id = $1', [id]);
    if (mems.length === 0) {
      return res.status(404).json({ message: 'Memori tidak ditemukan.' });
    }

    if (mems[0].user_id !== req.userId) {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    await db.run('UPDATE memories SET fact = $1 WHERE id = $2', [fact, id]);
    res.status(200).json({ message: 'Memori berhasil diperbarui.' });
  } catch (error) {
    console.error('Error updateMemory:', error);
    res.status(500).json({ message: 'Gagal memperbarui memori.' });
  }
};

export const deleteMemory = async (req, res) => {
  const { id } = req.params;

  try {
    const mems = await db.query('SELECT * FROM memories WHERE id = $1', [id]);
    if (mems.length === 0) {
      return res.status(404).json({ message: 'Memori tidak ditemukan.' });
    }

    if (mems[0].user_id !== req.userId) {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    await db.run('DELETE FROM memories WHERE id = $1', [id]);
    res.status(200).json({ message: 'Memori berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleteMemory:', error);
    res.status(500).json({ message: 'Gagal menghapus memori.' });
  }
};
