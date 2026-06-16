# YOGIRI.AI - Platform AI Character Chat Modern 🌌

Selamat datang di **YOGIRI.AI**, sebuah platform AI Character Chat futuristik tahun 2026 yang terinspirasi oleh Character AI, Janitor AI, dan SillyTavern. Aplikasi ini dibangun menggunakan stack modern dan modular.

---

## 🚀 Fitur Utama

1. **Aesthetics Cyber UI & Neon Glassmorphism:**
   - Antarmuka premium dengan dominasi warna gelap, efek Cursor Glow, Floating Gradients, Glassmorphism, dan animasi mikro interaktif.
2. **Mascot Login Interaktif:**
   - Maskot robot SVG interaktif yang matanya mengikuti kursor, menutup mata saat mengetik password, bereaksi sedih/marah saat menghapus teks, dan gembira saat validasi sukses, lengkap dengan synthesizer Web Audio API.
3. **Explore & Filter Karakter:**
   - Sistem pencarian, kategori (Anime, Game, Fantasy, dll.), sorting trending/popular, dan rating.
4. **Studio Pembuat Karakter (Create Character):**
   - Membuat AI Character dengan pengaturan dasar (Nama, Deskripsi, Greeting, Personality) hingga advanced tuning (Temperature, Top P, Max Tokens, Memory Length, System Prompt).
5. **Chat Room Imersif:**
   - Mendukung text streaming, Markdown, syntax highlighting kode, pengiriman gambar, text-to-speech (voice), serta edit/delete/regenerate pesan.
6. **Sistem Memori (Memory Manager):**
   - Karakter mengingat preferensi, nama user, dan fakta penting yang didapatkan selama chat. User dapat mengelola memori ini (tambah, edit, hapus).
7. **Multi-LLM Engine:**
   - Mendukung OpenAI, Gemini, Claude, dan OpenRouter. Jika API Key tidak diisi, sistem otomatis menggunakan **Mock AI Engine** agar aplikasi tetap dapat dicoba secara offline/tanpa kunci API.
8. **Admin Panel:**
   - Dashboard moderasi untuk mengawasi jumlah pengguna, statistik obrolan, penggunaan API, serta moderasi karakter.

---

## 📁 Struktur Folder Proyek

```text
yogiri-ai-copy/
├── package.json              # Script utama untuk menjalankan client & server sekaligus
├── README.md                 # Dokumentasi ini
├── backend/                  # Server Node.js + Express
│   ├── package.json          # Dependencies backend
│   ├── server.js             # Entrypoint server Express
│   ├── .env                  # Variabel lingkungan (API Keys, JWT Secrets)
│   ├── config/
│   │   └── db.js             # Inisialisasi Database (SQLite & Postgres pg)
│   ├── controllers/          # Kontroler untuk logika API
│   ├── routes/               # Endpoint routing REST API
│   └── services/
│       └── aiService.js      # Integrasi API OpenAI, Gemini, Claude, OpenRouter & Memori
└── frontend/                 # Client React + Vite + Tailwind CSS
    ├── package.json          # Dependencies frontend
    ├── index.html            # Main HTML wrapper
    ├── vite.config.js        # Konfigurasi Vite
    ├── tailwind.config.js    # Konfigurasi Tailwind CSS
    └── src/
        ├── main.jsx          # Entrypoint React
        ├── App.jsx           # Routing & Tema Utama
        ├── index.css         # Desain Cyber UI & Core Design Tokens
        ├── components/
        │   └── Mascot.jsx    # Maskot SVG Interaktif & Web Audio API
        └── pages/            # Halaman Dashboard, Chat, Explore, Settings, dll.
```

---

## 🛠️ Cara Menggunakan

### Prasyarat
Pastikan Anda sudah menginstal **Node.js (versi v18 ke atas)** di komputer Anda.

### Langkah-langkah:

1. **Instalasi Semua Dependencies:**
   Buka terminal di root folder (`yogiri-ai copy/`), lalu jalankan perintah berikut:
   ```bash
   npm run install:all
   ```
   Perintah ini akan secara otomatis mengunduh dependencies untuk root, folder `frontend`, dan folder `backend`.

2. **Konfigurasi Environment Variables (`backend/.env`):**
   Masuk ke folder `backend`, buka file `.env`, lalu konfigurasikan port, JWT secret, dan API Keys Anda (OpenAI, Gemini, Claude, dll.). Jika tidak diisi, aplikasi akan menggunakan mode demonstrasi (Mock AI).

3. **Menjalankan Aplikasi secara Dev Mode:**
   Kembali ke root folder (`yogiri-ai copy/`), lalu jalankan perintah:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan secara paralel:
   - **Backend Server:** berjalan di `http://localhost:5000`
   - **Frontend Client:** berjalan di `http://localhost:5173`

---

## 🗄️ Database: Zero-Setup SQLite Fallback

Aplikasi ini mendukung database **PostgreSQL/Supabase** dan **SQLite**:
- **Secara default (out-of-the-box)**, backend akan membuat file database lokal bernama `yogiri.db` menggunakan SQLite. Anda tidak perlu menginstal atau mengatur PostgreSQL di komputer lokal Anda untuk langsung menguji aplikasi.
- Untuk beralih ke PostgreSQL/Supabase, cukup tambahkan variabel `DATABASE_URL` di dalam file `backend/.env` dengan URI database PostgreSQL Anda. Backend akan mendeteksi secara otomatis dan mengalihkan semua query ke PostgreSQL.
