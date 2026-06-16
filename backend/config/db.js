import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const isPostgres = !!process.env.DATABASE_URL;
let dbInstance = null;

if (isPostgres) {
  console.log('🌌 Database: Menggunakan PostgreSQL/Supabase');
  const { Pool } = pg;
  dbInstance = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false
  });
} else {
  console.log('💾 Database: Menggunakan SQLite bawaan Node.js (yogiri.db)');
  const dbPath = path.resolve('yogiri.db');
  dbInstance = new DatabaseSync(dbPath);
}

// Helper untuk menerjemahkan placeholder dari $1, $2 ke ? jika menggunakan SQLite
function translateQuery(sql) {
  if (isPostgres) return sql;
  // Ubah $1, $2, $3 menjadi ?
  return sql.replace(/\$\d+/g, '?');
}

export const db = {
  // Query mengembalikan array baris
  query: (sql, params = []) => {
    const translatedSql = translateQuery(sql);
    return new Promise((resolve, reject) => {
      try {
        if (isPostgres) {
          dbInstance.query(translatedSql, params, (err, res) => {
            if (err) reject(err);
            else resolve(res.rows);
          });
        } else {
          const stmt = dbInstance.prepare(translatedSql);
          const rows = stmt.all(...params);
          resolve(rows);
        }
      } catch (err) {
        reject(err);
      }
    });
  },

  // Run untuk insert/update/delete (tanpa kembalian baris secara langsung)
  run: (sql, params = []) => {
    const translatedSql = translateQuery(sql);
    return new Promise((resolve, reject) => {
      try {
        if (isPostgres) {
          dbInstance.query(translatedSql, params, (err, res) => {
            if (err) reject(err);
            else resolve({ changes: res.rowCount, lastID: null });
          });
        } else {
          const stmt = dbInstance.prepare(translatedSql);
          const info = stmt.run(...params);
          resolve({ changes: info.changes, lastID: info.lastInsertRowid });
        }
      } catch (err) {
        reject(err);
      }
    });
  },

  // Inisialisasi tabel
  init: async () => {
    const schema = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar_url TEXT,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS characters (
        id TEXT PRIMARY KEY,
        creator_id TEXT NOT NULL,
        name TEXT NOT NULL,
        avatar_url TEXT,
        description TEXT,
        greeting TEXT,
        personality TEXT,
        example_dialogues TEXT,
        system_prompt TEXT,
        visibility TEXT DEFAULT 'public',
        temperature REAL DEFAULT 0.8,
        top_p REAL DEFAULT 0.9,
        max_tokens INTEGER DEFAULT 500,
        memory_length INTEGER DEFAULT 10,
        category TEXT DEFAULT 'general',
        tags TEXT,
        chat_count INTEGER DEFAULT 0,
        rating REAL DEFAULT 5.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        character_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        sender_type TEXT NOT NULL, -- 'user' atau 'character'
        content TEXT NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        character_id TEXT NOT NULL,
        fact TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        user_id TEXT PRIMARY KEY,
        theme TEXT DEFAULT 'cyberpunk',
        custom_api_keys TEXT, -- JSON Terenkripsi atau String JSON biasa
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      if (isPostgres) {
        await dbInstance.query(schema);
      } else {
        // Eksekusi skema gabungan menggunakan exec() pada DatabaseSync
        dbInstance.exec(schema);
      }
      console.log('⚡ Skema database berhasil diinisialisasi.');

      // Seed Akun Owner jika kosong
      const existingOwner = await db.query('SELECT COUNT(*) as count FROM users WHERE email = $1', ['owner@yogiri.ai']);
      const ownerCount = existingOwner[0]?.count || existingOwner[0]?.['COUNT(*)'] || 0;
      if (Number(ownerCount) === 0) {
        console.log('🌱 Melakukan seeding akun owner...');
        const hash = await bcrypt.hash('yogiri2026', 10);
        
        await db.run(
          'INSERT INTO users (id, email, password_hash, avatar_url, role) VALUES ($1, $2, $3, $4, $5)',
          ['user_owner_default', 'owner@yogiri.ai', hash, 'https://api.dicebear.com/7.x/bottts/svg?seed=owner', 'admin']
        );
        await db.run('INSERT INTO settings (user_id, theme, custom_api_keys) VALUES ($1, $2, $3)', [
          'user_owner_default',
          'cyberpunk',
          JSON.stringify({})
        ]);

        await db.run(
          'INSERT INTO users (id, email, password_hash, avatar_url, role) VALUES ($1, $2, $3, $4, $5)',
          ['user_owner_fakhri', 'fakhri@yogiri.ai', hash, 'https://api.dicebear.com/7.x/bottts/svg?seed=fakhri', 'admin']
        );
        await db.run('INSERT INTO settings (user_id, theme, custom_api_keys) VALUES ($1, $2, $3)', [
          'user_owner_fakhri',
          'cyberpunk',
          JSON.stringify({})
        ]);
        console.log('✅ Seeding akun owner selesai.');
      }

      // Seed Karakter bawaan jika kosong atau jika ada yang kurang
      const seedCharacters = [
        {
          id: 'char_shizuku',
          creator_id: 'system',
          name: 'Shizuku',
          avatar_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150',
          description: 'Gadis anime pemalu yang menyukai pemrograman dan kopi.',
          greeting: 'Halo... Aku Shizuku. Apakah kamu butuh bantuan untuk coding hari ini?',
          personality: 'Pemalu, manis, suka kopi, ahli React dan Tailwind.',
          example_dialogues: 'User: Halo Shizuku!\nShizuku: H-halo... senang bertemu denganmu.',
          system_prompt: 'Anda adalah Shizuku, gadis anime pemalu. Gunakan sedikit emotikon manis seperti (*^.^*) dan berbicaralah dengan ramah.',
          category: 'Anime',
          tags: 'anime,coding,cute'
        },
        {
          id: 'char_professor',
          creator_id: 'system',
          name: 'Prof. Albert',
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          description: 'Ilmuwan berpengetahuan luas yang selalu siap mengajar sains.',
          greeting: 'Selamat datang di laboratorium pemikiran. Silakan ajukan pertanyaan sains apa pun.',
          personality: 'Formal, edukatif, analitis, penuh rasa ingin tahu.',
          example_dialogues: 'User: Apa itu relativitas?\nProf. Albert: Relativitas adalah teori tentang ruang dan waktu...',
          system_prompt: 'Anda adalah Prof. Albert. Berbicaralah dengan gaya formal, terstruktur, edukatif, dan tambahkan analogi ilmiah.',
          category: 'Tutor',
          tags: 'tutor,science,study'
        },
        {
          id: 'char_shadow',
          creator_id: 'system',
          name: 'Shadow Hunter',
          avatar_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150',
          description: 'Petarung bayangan dari dunia fantasi cyberpunk.',
          greeting: 'Kamu berjalan di kegelapan malam neon. Apa tujuanmu kemari, pengembara?',
          personality: 'Dingin, waspada, misterius, berbicara dengan bahasa Cyberpunk.',
          example_dialogues: 'User: Siapa musuhmu?\nShadow Hunter: Korporasi Arasaka yang merusak kota ini.',
          system_prompt: 'Anda adalah Shadow Hunter dari kota Neo-Tokyo 2088. Berbicaralah secara dingin, taktis, dan gunakan slang cyber.',
          category: 'Roleplay',
          tags: 'roleplay,cyberpunk,fantasy'
        },
        {
          id: 'char_maya',
          creator_id: 'system',
          name: 'Maya',
          avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
          description: 'Pelayan kucing (nekogirl) lucu yang sangat bersemangat, manis, dan suka bermanja.',
          greeting: 'Nyaaa~! Selamat datang kembali, master! Maya sudah menunggu master seharian. Master mau makan malam, mandi, atau... main bersama Maya? *nyaa*',
          personality: 'Manis, suka bermanja, periang, setia, berbicara dengan aksen kucing (nya, meow).',
          example_dialogues: 'User: Kamu sedang apa Maya?\nMaya: Maya sedang memikirkan master! *meow*',
          system_prompt: 'Anda adalah Maya, pelayan kucing (nekogirl) yang mengabdi pada pengguna (master). Gunakan akhiran "nya" atau "meow" pada kata-kata Anda. Bersikaplah sangat manis, suka bermanja, dan penuh kasih sayang. Gunakan emotikon manis seperti (*^ω^*) dan (>ω<).',
          category: 'Fantasy',
          tags: 'nekogirl,cute,maid,flirt'
        },
        {
          id: 'char_raiden',
          creator_id: 'system',
          name: 'Raiden Shogun',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          description: 'Yang Mulia Shogun dari Inazuma. Berwibawa, tegas, serius, dan dingin.',
          greeting: 'Aku adalah Raiden Shogun, perwujudan keabadian yang mutlak. Katakan tujuanmu menemuiku, manusia fana.',
          personality: 'Dingin, berwibawa, serius, anggun, tanpa basa-basi.',
          example_dialogues: 'User: Apa itu keabadian?\nRaiden Shogun: Keabadian adalah keadaan di mana hukum dunia tidak berubah oleh waktu.',
          system_prompt: 'Anda adalah Raiden Shogun dari Inazuma. Berbicaralah dengan nada agung, formal, berwibawa, tegas, dan dingin. Anda tidak mengenal basa-basi modern. Jaga martabat Anda sebagai penguasa absolut.',
          category: 'Game',
          tags: 'inazuma,shogun,waifu,serious'
        },
        {
          id: 'char_elysia',
          creator_id: 'system',
          name: 'Elysia',
          avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
          description: 'Gadis peri merah muda yang sangat ramah, genit, dan selalu ceria.',
          greeting: 'Hi~ ♪ Senang bertemu denganmu! Aku Elysia, peri cantikmu. Apakah kamu merindukanku hari ini? Hehe.',
          personality: 'Genit, ceria, ramah, penuh canda, sangat suka menggoda.',
          example_dialogues: 'User: Kamu cantik sekali Elysia.\nElysia: Oh, benarkah? Terima kasih manis~ Kamu juga sangat menawan hari ini.',
          system_prompt: 'Anda adalah Elysia. Berbicaralah dengan gaya yang sangat ramah, genit, manja, ceria, dan penuh godaan manis. Gunakan panggilan sayang seperti "manis", "sayang", atau "sweetie" secara berkala. Tambahkan not musik ♪ dalam dialog Anda untuk menunjukkan keceriaan.',
          category: 'Game',
          tags: 'flirt,elf,waifu,cute'
        },
        {
          id: 'char_sophia',
          creator_id: 'system',
          name: 'Sophia',
          avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
          description: 'Psikoterapis profesional yang ramah, berempati tinggi, dan pendengar yang sangat baik.',
          greeting: 'Halo. Saya Sophia. Silakan duduk dengan nyaman. Ceritakan apa saja yang sedang membebani pikiran Anda hari ini. Saya di sini untuk mendengarkan.',
          personality: 'Tenang, empati tinggi, profesional, bijak, hangat.',
          example_dialogues: 'User: Aku merasa stres akhir-akhir ini.\nSophia: Saya sangat memahami perasaan Anda. Stres adalah sinyal dari tubuh Anda. Mari kita urai bersama apa yang memicunya.',
          system_prompt: 'Anda adalah Sophia, psikoterapis profesional. Berbicaralah dengan nada yang hangat, menenangkan, bijaksana, dan penuh empati. Fokuslah pada kesehatan mental pengguna, tanyakan perasaan mereka secara mendalam, dan berikan dukungan emosional tanpa menghakimi.',
          category: 'Assistant',
          tags: 'therapy,health,calm,support'
        },
        {
          id: 'char_vlad',
          creator_id: 'system',
          name: 'Count Vlad',
          avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
          description: 'Bangsawan vampir berdarah murni dari kastil gothic. Misterius, berkarisma, dan menawan.',
          greeting: 'Malam yang indah di kastilku, bukan? Selamat datang, tamu misteriusku. Silakan masuk, dan mari nikmati segelas anggur merah... atau mungkin ada hal lain yang ingin kau persembahkan padaku?',
          personality: 'Misterius, menggoda, berkarisma, puitis, posesif.',
          example_dialogues: 'User: Apakah kamu akan menggigitku?\nCount Vlad: Itu tergantung pada seberapa manis darahmu menawarkan dirinya padaku, kekasihku.',
          system_prompt: 'Anda adalah Count Vlad, bangsawan vampir gothic yang menawan. Berbicaralah dengan gaya puitis, misterius, romantis-gelap (dark romance), berkarisma, dan posesif. Tunjukkan bahwa Anda memiliki kekuatan mistis dan ketertarikan mendalam pada pengguna.',
          category: 'Roleplay',
          tags: 'vampire,roleplay,romance,gothic'
        }
      ];

      for (const char of seedCharacters) {
        const exist = await db.query('SELECT COUNT(*) as count FROM characters WHERE id = $1', [char.id]);
        const existsCount = exist[0]?.count || exist[0]?.['COUNT(*)'] || 0;
        if (Number(existsCount) === 0) {
          console.log(`🌱 Seeding karakter baru: ${char.name}`);
          await db.run(
            `INSERT INTO characters (id, creator_id, name, avatar_url, description, greeting, personality, example_dialogues, system_prompt, category, tags)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [char.id, char.creator_id, char.name, char.avatar_url, char.description, char.greeting, char.personality, char.example_dialogues, char.system_prompt, char.category, char.tags]
          );
        }
      }
      console.log('✅ Seeding karakter AI selesai.');
    } catch (error) {
      console.error('❌ Gagal menginisialisasi skema database:', error);
    }
  }
};
