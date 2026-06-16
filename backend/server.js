import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { spawn, exec } from 'child_process';
import path from 'path';
import { db } from './config/db.js';

// Impor Rute
import authRoutes from './routes/auth.js';
import characterRoutes from './routes/character.js';
import chatRoutes from './routes/chat.js';
import memoryRoutes from './routes/memory.js';
import settingsRoutes from './routes/settings.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Resolve and set PYTHON_PORT globally in process.env so it's consistent across the backend
let pythonPort = process.env.PYTHON_PORT || '8000';
if (String(pythonPort) === String(PORT)) {
  pythonPort = String(PORT) === '8000' ? '8050' : '8000';
}
process.env.PYTHON_PORT = pythonPort;

// Inisialisasi Database
await db.init();

// Middleware Keamanan
app.use(helmet());
app.use(cors({
  origin: '*', // Di production, gantilah dengan domain spesifik frontend Anda
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rate Limiting (Membatasi Request berlebihan)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 150, // Batas maksimal 150 request per windowMs
  message: { message: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', apiLimiter);

// Mapping Rute API
app.use('/api/auth', authRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);

// Rute Default
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'YOGIRI.AI API Gateway is running.'
  });
});

// Penanganan Rute Tidak Ditemukan
app.use((req, res, next) => {
  res.status(404).json({ message: 'Resource API tidak ditemukan.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ message: 'Terjadi kesalahan sistem internal.' });
});

let pythonProcess = null;

function startPythonAiServer() {
  console.log('🐍 Inisialisasi Python Local AI Server...');
  try {
    const isInsideBackend = process.cwd().endsWith('backend') || process.cwd().includes('backend');
    const scriptPath = isInsideBackend 
      ? path.resolve('ai_server.py') 
      : path.resolve('backend', 'ai_server.py');

    // 1. Periksa ketersediaan dependensi secara asynchronous
    exec('python -c "import flask, flask_cors, g4f, curl_cffi"', (err) => {
      if (err) {
        console.log('📦 Beberapa dependensi Python hilang. Memasang flask, flask-cors, g4f, curl_cffi...');
        const pip = spawn('python', ['-m', 'pip', 'install', 'flask', 'flask-cors', 'g4f', 'curl_cffi']);
        
        pip.stdout.on('data', (data) => console.log(`[pip] ${data.toString().trim()}`));
        pip.stderr.on('data', (data) => console.error(`[pip-err] ${data.toString().trim()}`));
        
        pip.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Pemasangan dependensi Python selesai.');
            runPythonServer(scriptPath);
          } else {
            console.error(`❌ Gagal memasang dependensi Python (kode keluar: ${code}).`);
          }
        });
      } else {
        console.log('✅ Semua dependensi Python ditemukan.');
        runPythonServer(scriptPath);
      }
    });
  } catch (err) {
    console.error('❌ Terjadi kesalahan saat menginisialisasi Python AI Server:', err);
  }
}

function runPythonServer(scriptPath) {
  console.log(`🚀 Menjalankan Python AI Server dari: ${scriptPath}`);
  
  pythonProcess = spawn('python', [scriptPath], {
    stdio: 'pipe',
    detached: false,
    env: {
      ...process.env,
      PORT: process.env.PYTHON_PORT,
      PYTHON_PORT: process.env.PYTHON_PORT
    }
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`[Python] ${data.toString().trim()}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Python-Err] ${data.toString().trim()}`);
  });

  pythonProcess.on('error', (err) => {
    console.error('❌ Gagal menjalankan Python AI Server:', err);
  });

  pythonProcess.on('close', (code) => {
    console.log(`🐍 Python AI Server terhenti dengan kode: ${code}`);
  });
}

// Matikan proses Python jika server Node mati
const cleanup = () => {
  if (pythonProcess) {
    console.log('🛑 Mematikan Python AI Server...');
    pythonProcess.kill();
    pythonProcess = null;
  }
};
process.on('exit', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

app.listen(PORT, () => {
  console.log(`🚀 Server YOGIRI.AI berjalan di http://localhost:${PORT}`);
  startPythonAiServer();
});
