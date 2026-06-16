import crypto from 'crypto';
import { db } from '../config/db.js';

export const getCharacters = async (req, res) => {
  const { category, search, filter } = req.query;
  const userId = req.query.userId; // jika ingin filter buatan sendiri saja

  let sql = 'SELECT * FROM characters WHERE 1=1';
  const params = [];

  if (userId) {
    sql += ' AND creator_id = $1';
    params.push(userId);
  } else {
    // Secara default, hanya ambil karakter publik / unlisted (tergantung kebutuhan)
    sql += " AND (visibility = 'public' OR visibility = 'unlisted')";
  }

  if (category && category !== 'Custom' && category !== 'all') {
    sql += ` AND LOWER(category) = $${params.length + 1}`;
    params.push(category.toLowerCase());
  }

  if (search) {
    sql += ` AND (LOWER(name) LIKE $${params.length + 1} OR LOWER(description) LIKE $${params.length + 2})`;
    params.push(`%${search.toLowerCase()}%`);
    params.push(`%${search.toLowerCase()}%`);
  }

  // Pengurutan
  if (filter === 'trending' || filter === 'popular') {
    sql += ' ORDER BY chat_count DESC, rating DESC';
  } else if (filter === 'new') {
    sql += ' ORDER BY created_at DESC';
  } else {
    sql += ' ORDER BY chat_count DESC';
  }

  try {
    const characters = await db.query(sql, params);
    res.status(200).json(characters);
  } catch (error) {
    console.error('Error getCharacters:', error);
    res.status(500).json({ message: 'Gagal mengambil data karakter.' });
  }
};

export const getCharacterById = async (req, res) => {
  const { id } = req.params;

  try {
    const character = await db.query('SELECT * FROM characters WHERE id = $1', [id]);
    if (character.length === 0) {
      return res.status(404).json({ message: 'Karakter tidak ditemukan.' });
    }
    res.status(200).json(character[0]);
  } catch (error) {
    console.error('Error getCharacterById:', error);
    res.status(500).json({ message: 'Gagal mengambil detail karakter.' });
  }
};

export const createCharacter = async (req, res) => {
  const {
    name,
    avatar_url,
    description,
    greeting,
    personality,
    example_dialogues,
    system_prompt,
    visibility,
    temperature,
    top_p,
    max_tokens,
    memory_length,
    category,
    tags
  } = req.body;

  if (!name || !greeting) {
    return res.status(400).json({ message: 'Nama karakter dan salam pembuka (greeting) wajib diisi.' });
  }

  const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`;

  try {
    const id = 'char_' + crypto.randomUUID();
    await db.run(
      `INSERT INTO characters (
        id, creator_id, name, avatar_url, description, greeting, personality,
        example_dialogues, system_prompt, visibility, temperature, top_p,
        max_tokens, memory_length, category, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        id,
        req.userId,
        name,
        avatar_url || defaultAvatar,
        description || '',
        greeting,
        personality || '',
        example_dialogues || '',
        system_prompt || '',
        visibility || 'public',
        temperature !== undefined ? parseFloat(temperature) : 0.8,
        top_p !== undefined ? parseFloat(top_p) : 0.9,
        max_tokens !== undefined ? parseInt(max_tokens) : 500,
        memory_length !== undefined ? parseInt(memory_length) : 10,
        category || 'general',
        tags || ''
      ]
    );

    res.status(201).json({ message: 'Karakter berhasil dibuat!', characterId: id });
  } catch (error) {
    console.error('Error createCharacter:', error);
    res.status(500).json({ message: 'Gagal membuat karakter.' });
  }
};

export const updateCharacter = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    avatar_url,
    description,
    greeting,
    personality,
    example_dialogues,
    system_prompt,
    visibility,
    temperature,
    top_p,
    max_tokens,
    memory_length,
    category,
    tags
  } = req.body;

  try {
    const chars = await db.query('SELECT * FROM characters WHERE id = $1', [id]);
    if (chars.length === 0) {
      return res.status(404).json({ message: 'Karakter tidak ditemukan.' });
    }

    const char = chars[0];
    if (char.creator_id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Anda tidak memiliki hak untuk mengedit karakter ini.' });
    }

    await db.run(
      `UPDATE characters SET
        name = $1, avatar_url = $2, description = $3, greeting = $4, personality = $5,
        example_dialogues = $6, system_prompt = $7, visibility = $8, temperature = $9,
        top_p = $10, max_tokens = $11, memory_length = $12, category = $13, tags = $14
       WHERE id = $15`,
      [
        name || char.name,
        avatar_url !== undefined ? avatar_url : char.avatar_url,
        description !== undefined ? description : char.description,
        greeting || char.greeting,
        personality !== undefined ? personality : char.personality,
        example_dialogues !== undefined ? example_dialogues : char.example_dialogues,
        system_prompt !== undefined ? system_prompt : char.system_prompt,
        visibility || char.visibility,
        temperature !== undefined ? parseFloat(temperature) : char.temperature,
        top_p !== undefined ? parseFloat(top_p) : char.top_p,
        max_tokens !== undefined ? parseInt(max_tokens) : char.max_tokens,
        memory_length !== undefined ? parseInt(memory_length) : char.memory_length,
        category || char.category,
        tags !== undefined ? tags : char.tags,
        id
      ]
    );

    res.status(200).json({ message: 'Karakter berhasil diperbarui!' });
  } catch (error) {
    console.error('Error updateCharacter:', error);
    res.status(500).json({ message: 'Gagal memperbarui karakter.' });
  }
};

export const deleteCharacter = async (req, res) => {
  const { id } = req.params;

  try {
    const chars = await db.query('SELECT * FROM characters WHERE id = $1', [id]);
    if (chars.length === 0) {
      return res.status(404).json({ message: 'Karakter tidak ditemukan.' });
    }

    const char = chars[0];
    if (char.creator_id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Anda tidak memiliki hak untuk menghapus karakter ini.' });
    }

    await db.run('DELETE FROM characters WHERE id = $1', [id]);
    // Hapus juga pesan dan percakapan terkait
    const convs = await db.query('SELECT id FROM conversations WHERE character_id = $1', [id]);
    for (const c of convs) {
      await db.run('DELETE FROM messages WHERE conversation_id = $1', [c.id]);
    }
    await db.run('DELETE FROM conversations WHERE character_id = $1', [id]);
    await db.run('DELETE FROM memories WHERE character_id = $1', [id]);

    res.status(200).json({ message: 'Karakter berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleteCharacter:', error);
    res.status(500).json({ message: 'Gagal menghapus karakter.' });
  }
};
