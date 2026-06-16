import crypto from 'crypto';
import { db } from '../config/db.js';
import { aiService } from '../services/aiService.js';

// Ambil semua percakapan milik user saat ini
export const getConversations = async (req, res) => {
  try {
    const sql = `
      SELECT c.*, char.name as character_name, char.avatar_url as character_avatar, char.description as character_description
      FROM conversations c
      JOIN characters char ON c.character_id = char.id
      WHERE c.user_id = $1
      ORDER BY c.updated_at DESC
    `;
    const conversations = await db.query(sql, [req.userId]);
    res.status(200).json(conversations);
  } catch (error) {
    console.error('Error getConversations:', error);
    res.status(500).json({ message: 'Gagal mengambil riwayat percakapan.' });
  }
};

// Buat percakapan baru atau ambil yang sudah ada dengan karakter
export const createConversation = async (req, res) => {
  const { characterId } = req.body;

  if (!characterId) {
    return res.status(400).json({ message: 'ID Karakter diperlukan.' });
  }

  try {
    // Cek apakah percakapan sudah ada
    const existing = await db.query(
      'SELECT * FROM conversations WHERE user_id = $1 AND character_id = $2',
      [req.userId, characterId]
    );

    if (existing.length > 0) {
      return res.status(200).json(existing[0]);
    }

    // Buat percakapan baru
    const id = 'conv_' + crypto.randomUUID();
    await db.run(
      'INSERT INTO conversations (id, user_id, character_id, created_at, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [id, req.userId, characterId]
    );

    // Ambil karakter untuk mendapatkan salam pembukanya (greeting)
    const chars = await db.query('SELECT * FROM characters WHERE id = $1', [characterId]);
    if (chars.length > 0) {
      const char = chars[0];
      const msgId = 'msg_greet_' + crypto.randomUUID();
      // Tambahkan pesan pembuka otomatis dari karakter
      await db.run(
        'INSERT INTO messages (id, conversation_id, sender_type, content) VALUES ($1, $2, $3, $4)',
        [msgId, id, 'character', char.greeting]
      );
    }

    const newConv = await db.query('SELECT * FROM conversations WHERE id = $1', [id]);
    res.status(201).json(newConv[0]);
  } catch (error) {
    console.error('Error createConversation:', error);
    res.status(500).json({ message: 'Gagal membuat percakapan.' });
  }
};

// Ambil semua pesan dalam percakapan tertentu
export const getMessages = async (req, res) => {
  const { conversationId } = req.params;

  try {
    // Pastikan percakapan ini milik user saat ini
    const conv = await db.query('SELECT * FROM conversations WHERE id = $1 AND user_id = $2', [
      conversationId,
      req.userId
    ]);
    if (conv.length === 0) {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    const messages = await db.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId]
    );
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error getMessages:', error);
    res.status(500).json({ message: 'Gagal mengambil pesan.' });
  }
};

// Kirim pesan baru
export const sendMessage = async (req, res) => {
  const { conversationId } = req.params;
  const { content, image_url, model } = req.body;

  if (!content) {
    return res.status(400).json({ message: 'Pesan tidak boleh kosong.' });
  }

  try {
    // 1. Verifikasi kepemilikan percakapan
    const convs = await db.query(
      `SELECT c.*, char.name, char.avatar_url, char.system_prompt, char.description, char.personality, char.example_dialogues, char.greeting, char.temperature, char.top_p, char.max_tokens, char.memory_length
       FROM conversations c
       JOIN characters char ON c.character_id = char.id
       WHERE c.id = $1 AND c.user_id = $2`,
      [conversationId, req.userId]
    );

    if (convs.length === 0) {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    const conv = convs[0];

    // 2. Simpan pesan user ke database
    const userMsgId = 'msg_' + crypto.randomUUID();
    await db.run(
      'INSERT INTO messages (id, conversation_id, sender_type, content, image_url) VALUES ($1, $2, $3, $4, $5)',
      [userMsgId, conversationId, 'user', content, image_url || null]
    );

    // Ambil riwayat chat sebelumnya sesuai batas memory_length karakter
    const limit = conv.memory_length || 10;
    const history = await db.query(
      `SELECT sender_type, content FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC LIMIT $2`,
      [conversationId, limit + 1] // +1 untuk melewati pesan user yang baru di-insert
    );
    // Balik urutan agar kronologis
    history.reverse();
    // Keluarkan pesan user terbaru dari array history untuk parameter terpisah
    const recentHistory = history.filter(h => h.content !== content);

    // Ambil data memori / fakta yang berkaitan dengan karakter ini
    const memories = await db.query(
      'SELECT fact FROM memories WHERE user_id = $1 AND character_id = $2',
      [req.userId, conv.character_id]
    );

    // Ambil API Keys kustom milik user dari tabel settings
    const settingsList = await db.query('SELECT custom_api_keys FROM settings WHERE user_id = $1', [
      req.userId
    ]);
    let customKeys = {};
    if (settingsList.length > 0 && settingsList[0].custom_api_keys) {
      try {
        customKeys = JSON.parse(settingsList[0].custom_api_keys);
      } catch (e) {
        customKeys = {};
      }
    }

    // 3. Panggil AI Service
    const aiResponse = await aiService.generateResponse({
      userId: req.userId,
      character: {
        id: conv.character_id,
        name: conv.name,
        description: conv.description,
        personality: conv.personality,
        example_dialogues: conv.example_dialogues,
        greeting: conv.greeting,
        system_prompt: conv.system_prompt,
        temperature: conv.temperature,
        top_p: conv.top_p,
        max_tokens: conv.max_tokens
      },
      history: recentHistory,
      userMessage: content,
      memories,
      customKeys,
      model
    });

    // 4. Simpan respons AI ke database
    const aiMsgId = 'msg_' + crypto.randomUUID();
    await db.run(
      'INSERT INTO messages (id, conversation_id, sender_type, content) VALUES ($1, $2, $3, $4)',
      [aiMsgId, conversationId, 'character', aiResponse]
    );

    // Update waktu aktif percakapan
    await db.run('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [
      conversationId
    ]);

    // Tingkatkan hitungan chat karakter
    await db.run('UPDATE characters SET chat_count = chat_count + 1 WHERE id = $1', [
      conv.character_id
    ]);

    // Ekstraksi memori baru secara background (fire-and-forget)
    aiService.extractAndSaveMemory(req.userId, conv.character_id, content, aiResponse);

    res.status(200).json({
      userMessage: { id: userMsgId, conversation_id: conversationId, sender_type: 'user', content, image_url, created_at: new Date() },
      aiMessage: { id: aiMsgId, conversation_id: conversationId, sender_type: 'character', content: aiResponse, created_at: new Date() }
    });
  } catch (error) {
    console.error('Error sendMessage:', error);
    res.status(500).json({ message: 'Gagal memproses pesan.' });
  }
};

// Edit pesan user atau AI
export const editMessage = async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;

  try {
    const msgs = await db.query(
      `SELECT m.*, c.user_id FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE m.id = $1`,
      [messageId]
    );

    if (msgs.length === 0) {
      return res.status(404).json({ message: 'Pesan tidak ditemukan.' });
    }

    if (msgs[0].user_id !== req.userId) {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    await db.run('UPDATE messages SET content = $1 WHERE id = $2', [content, messageId]);
    res.status(200).json({ message: 'Pesan berhasil diubah.' });
  } catch (error) {
    console.error('Error editMessage:', error);
    res.status(500).json({ message: 'Gagal mengedit pesan.' });
  }
};

// Hapus pesan
export const deleteMessage = async (req, res) => {
  const { messageId } = req.params;

  try {
    const msgs = await db.query(
      `SELECT m.*, c.user_id FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE m.id = $1`,
      [messageId]
    );

    if (msgs.length === 0) {
      return res.status(404).json({ message: 'Pesan tidak ditemukan.' });
    }

    if (msgs[0].user_id !== req.userId) {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    await db.run('DELETE FROM messages WHERE id = $1', [messageId]);
    res.status(200).json({ message: 'Pesan berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleteMessage:', error);
    res.status(500).json({ message: 'Gagal menghapus pesan.' });
  }
};

// Regenerasi Respons AI Terakhir
export const regenerateResponse = async (req, res) => {
  const { conversationId } = req.params;
  const { model } = req.body;

  try {
    // 1. Dapatkan percakapan dan validasi kepemilikan
    const convs = await db.query(
      `SELECT c.*, char.name, char.avatar_url, char.system_prompt, char.description, char.personality, char.example_dialogues, char.greeting, char.temperature, char.top_p, char.max_tokens, char.memory_length
       FROM conversations c
       JOIN characters char ON c.character_id = char.id
       WHERE c.id = $1 AND c.user_id = $2`,
      [conversationId, req.userId]
    );

    if (convs.length === 0) {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    const conv = convs[0];

    // 2. Dapatkan pesan-pesan terakhir
    const messages = await db.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 2',
      [conversationId]
    );

    if (messages.length < 2) {
      return res.status(400).json({ message: 'Tidak ada pesan yang bisa diregenerasi.' });
    }

    let lastAI = null;
    let lastUser = null;

    if (messages[0].sender_type === 'character' && messages[1].sender_type === 'user') {
      lastAI = messages[0];
      lastUser = messages[1];
    } else {
      return res.status(400).json({ message: 'Struktur pesan terakhir tidak valid untuk regenerasi.' });
    }

    // Hapus pesan AI yang lama dari database
    await db.run('DELETE FROM messages WHERE id = $1', [lastAI.id]);

    // Ambil riwayat chat sebelumnya
    const limit = conv.memory_length || 10;
    const history = await db.query(
      `SELECT sender_type, content FROM messages
       WHERE conversation_id = $1 AND id != $2
       ORDER BY created_at DESC LIMIT $3`,
      [conversationId, lastUser.id, limit]
    );
    history.reverse();

    // Ambil data memori / fakta
    const memories = await db.query(
      'SELECT fact FROM memories WHERE user_id = $1 AND character_id = $2',
      [req.userId, conv.character_id]
    );

    // Ambil API Keys kustom milik user
    const settingsList = await db.query('SELECT custom_api_keys FROM settings WHERE user_id = $1', [
      req.userId
    ]);
    let customKeys = {};
    if (settingsList.length > 0 && settingsList[0].custom_api_keys) {
      try {
        customKeys = JSON.parse(settingsList[0].custom_api_keys);
      } catch (e) {
        customKeys = {};
      }
    }

    // 3. Panggil AI Service
    const aiResponse = await aiService.generateResponse({
      userId: req.userId,
      character: {
        id: conv.character_id,
        name: conv.name,
        description: conv.description,
        personality: conv.personality,
        example_dialogues: conv.example_dialogues,
        greeting: conv.greeting,
        system_prompt: conv.system_prompt,
        temperature: conv.temperature,
        top_p: conv.top_p,
        max_tokens: conv.max_tokens
      },
      history,
      userMessage: lastUser.content,
      memories,
      customKeys,
      model
    });

    // 4. Simpan respons AI yang baru
    const aiMsgId = 'msg_' + crypto.randomUUID();
    await db.run(
      'INSERT INTO messages (id, conversation_id, sender_type, content) VALUES ($1, $2, $3, $4)',
      [aiMsgId, conversationId, 'character', aiResponse]
    );

    res.status(200).json({
      aiMessage: { id: aiMsgId, conversation_id: conversationId, sender_type: 'character', content: aiResponse, created_at: new Date() }
    });
  } catch (error) {
    console.error('Error regenerateResponse:', error);
    res.status(500).json({ message: 'Gagal melakukan regenerasi.' });
  }
};
