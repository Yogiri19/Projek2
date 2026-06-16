import React, { useState, useEffect, useRef } from 'react';
import Mascot from '../components/Mascot';

const upsetMsgs = ['Eh jangan dihapus!', 'Yakin mau dihapus?', 'Nuu...', 'Jangan dong...'];
const veryUpsetMsgs = ['Jangan dihapus semua!', 'Aku sedih nih...', 'Hiks hiks...', 'Kenapa dihapus terus?', 'Aku nangis loh...'];

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Mascot Controller States
  const [mascotState, setMascotState] = useState('idle');
  const [mascotSpeech, setMascotSpeech] = useState('');
  
  const [emailDeletes, setEmailDeletes] = useState(0);
  const [passDeletes, setPassDeletes] = useState(0);

  // OAuth Simulation States
  const [oauthProvider, setOauthProvider] = useState(null); // 'google' | 'facebook' | null
  const [oauthEmail, setOauthEmail] = useState('');
  const [oauthPassword, setOauthPassword] = useState('');
  const [oauthName, setOauthName] = useState('');
  const [oauthError, setOauthError] = useState('');
  
  const canvasRef = useRef(null);

  // 1. Particles System (Ported from original script.js)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    let mouse = { x: 0, y: 0 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.r = Math.random() * 1.5 + 0.5;
        this.alpha = Math.random() * 0.5 + 0.2;
        const colors = ['0,229,255', '255,45,149', '180,77,255'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 120) {
          this.x += dx / dist * 0.5;
          this.y += dy / dist * 0.5;
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.1, this.r), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color},${this.alpha})`;
        ctx.fill();
      }
    }

    const pCount = Math.min(95, Math.floor(window.innerWidth * 0.06));
    for (let i = 0; i < pCount; i++) particles.push(new Particle());

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      // Draw links
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,229,255,${0.08 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // 2. Mascot Interactions for Inputs
  const handleEmailFocus = () => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (email && isValid) {
      setMascotState('thumbsUp');
      setMascotSpeech('Email valid!');
    } else {
      setMascotState('happy');
      setMascotSpeech('Halo! Ketik email-mu ya');
    }
  };

  const handleEmailBlur = () => {
    setMascotState('idle');
    setMascotSpeech('');
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    
    // Check for Backspace deletions
    if (val.length < email.length) {
      const deletes = emailDeletes + 1;
      setEmailDeletes(deletes);
      if (deletes >= 5) {
        setMascotState('veryUpset');
        setMascotSpeech(veryUpsetMsgs[Math.floor(Math.random() * veryUpsetMsgs.length)]);
      } else if (deletes >= 2) {
        setMascotState('upset');
        setMascotSpeech(upsetMsgs[Math.floor(Math.random() * upsetMsgs.length)]);
      } else {
        setMascotState('upset');
      }
      return;
    }

    setEmailDeletes(0);
    if (val.length === 0) {
      setMascotState('idle');
      setMascotSpeech('');
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setMascotState('thumbsUp');
      setMascotSpeech('Email valid!');
    } else {
      setMascotState('happy');
    }
  };

  const handlePasswordFocus = () => {
    setMascotState('shy');
    setMascotSpeech('Aku tutup mata ya!');
  };

  const handlePasswordBlur = () => {
    setMascotState('idle');
    setMascotSpeech('');
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);

    if (val.length < password.length) {
      const deletes = passDeletes + 1;
      setPassDeletes(deletes);
      if (deletes >= 5) {
        setMascotState('veryUpset');
        setMascotSpeech(veryUpsetMsgs[Math.floor(Math.random() * veryUpsetMsgs.length)]);
      } else if (deletes >= 2) {
        setMascotState('upset');
        setMascotSpeech(upsetMsgs[Math.floor(Math.random() * upsetMsgs.length)]);
      } else {
        setMascotState('upset');
      }
      return;
    }

    setPassDeletes(0);
    if (val.length === 0) {
      setMascotState('shy');
      setMascotSpeech('Aku tutup mata ya!');
    } else if (val.length > 8) {
      setMascotState('thumbsUp');
      setMascotSpeech('Password kuat!');
    } else {
      setMascotState('shy');
      setMascotSpeech('');
    }
  };

  // 3. API Submissions
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMascotState('upset');
      setMascotSpeech('Isi formulirnya dulu!');
      return;
    }

    const endpoint = isSignup ? '/api/auth/register' : '/api/auth/login';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok) {
        setMascotState('thumbsUp');
        setMascotSpeech(isSignup ? 'Akun berhasil dibuat!' : 'Berhasil masuk!');
        
        // Simpan token ke local storage
        localStorage.setItem('yogiri_token', data.token);
        localStorage.setItem('yogiri_user', JSON.stringify(data.user));

        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 1200);
      } else {
        setMascotState('veryUpset');
        setMascotSpeech(data.message || 'Proses gagal.');
      }
    } catch (error) {
      setMascotState('veryUpset');
      setMascotSpeech('Koneksi server gagal.');
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!email) {
      setMascotState('upset');
      setMascotSpeech('Masukkan email Anda dulu!');
      return;
    }
    setMascotState('happy');
    setMascotSpeech('Link reset dikirim ke email!');
  };

  const handleGoogleLogin = () => {
    setOauthProvider('google');
    setOauthEmail('');
    setOauthPassword('');
    setOauthName('');
    setOauthError('');
    setMascotState('happy');
    setMascotSpeech('Membuka gerbang Google...');
  };

  const handleFacebookLogin = () => {
    setOauthProvider('facebook');
    setOauthEmail('');
    setOauthPassword('');
    setOauthName('');
    setOauthError('');
    setMascotState('happy');
    setMascotSpeech('Menghubungkan Facebook...');
  };

  const handleOauthSubmit = async (e) => {
    e.preventDefault();
    if (!oauthEmail || !oauthPassword) {
      setOauthError('Email dan Password harus diisi untuk autentikasi.');
      return;
    }
    
    const isGoogle = oauthProvider === 'google';
    const endpoint = isGoogle ? '/api/auth/google' : '/api/auth/facebook';
    const mockToken = isGoogle 
      ? 'google_id_token_mock_' + Math.random().toString(36).substring(7)
      : 'facebook_access_token_mock_' + Math.random().toString(36).substring(7);

    setMascotState('happy');
    setMascotSpeech(isGoogle ? 'Memverifikasi Google OAuth...' : 'Memverifikasi Facebook Token...');

    try {
      const bodyParams = isGoogle ? {
        idToken: mockToken,
        email: oauthEmail,
        name: oauthName || 'Google User',
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${oauthName || oauthEmail}`
      } : {
        accessToken: mockToken,
        email: oauthEmail,
        name: oauthName || 'Facebook User',
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${oauthName || oauthEmail}`
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyParams)
      });
      const data = await res.json();
      if (res.ok) {
        setMascotState('thumbsUp');
        setMascotSpeech(isGoogle ? 'Google terhubung!' : 'Facebook terhubung!');
        localStorage.setItem('yogiri_token', data.token);
        localStorage.setItem('yogiri_user', JSON.stringify(data.user));
        setOauthProvider(null); // Tutup modal
        setTimeout(() => onLoginSuccess(data.user), 1200);
      } else {
        setOauthError(data.message || 'OAuth gagal.');
        setMascotState('veryUpset');
        setMascotSpeech(data.message || 'OAuth gagal.');
      }
    } catch (err) {
      setOauthError('Koneksi server gagal.');
      setMascotState('veryUpset');
      setMascotSpeech('Koneksi server gagal.');
    }
  };

  // 4. Parallax Background effect
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const handleMouseMoveParallax = (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    setParallax({
      x: (e.clientX - cx) / cx * 8,
      y: (e.clientY - cy) / cy * 8
    });
  };

  return (
    <div 
      className="relative w-screen h-screen flex items-center justify-center overflow-hidden bg-cyberBg text-white select-none"
      onMouseMove={handleMouseMoveParallax}
    >
      {/* Background Particles Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Futuristic Blobs */}
      <div className="blob blob-1" style={{ transform: `translate(${parallax.x * 1.5}px, ${parallax.y * 1.5}px)` }}></div>
      <div className="blob blob-2" style={{ transform: `translate(${parallax.x * -1.5}px, ${parallax.y * -1.5}px)` }}></div>
      <div className="blob blob-3" style={{ transform: `translate(${parallax.x * 0.8}px, ${parallax.y * 0.8}px)` }}></div>

      {/* Sound Toggle (Top Right) */}
      <button 
        onClick={() => setSoundEnabled(!soundEnabled)}
        className={`absolute top-6 right-6 z-20 w-12 h-12 rounded-xl flex items-center justify-center border transition-all text-lg ${soundEnabled ? 'border-cyberGlow text-cyberGlow bg-cyberGlow/10 shadow-neonBlue' : 'border-white/20 text-white/50 bg-white/5'}`}
      >
        <i className={`fas ${soundEnabled ? 'fa-volume-up' : 'fa-volume-mute'}`} />
      </button>

      {/* Outer container */}
      <div 
        className="w-full max-w-md mx-4 z-10 flex flex-col items-center gap-6 transition-transform duration-200"
        style={{ transform: `translate(${parallax.x}px, ${parallax.y}px)` }}
      >
        {/* Mascot Wrapper */}
        <Mascot activeState={mascotState} speechText={mascotSpeech} soundEnabled={soundEnabled} />

        {/* Glassmorphism Login Card */}
        <div className="w-full glass-panel p-8 rounded-2xl border border-cyberBorder shadow-lg flex flex-col gap-6">
          <div className="text-center">
            <h2 className="font-orbitron font-bold text-3xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyberGlow to-cyberPurple">
              {isSignup ? 'BUAT AKUN NEW-GEN' : 'YOGIRI.AI PORTAL'}
            </h2>
            <p className="text-white/40 text-xs mt-1">
              {isSignup ? 'Daftarkan chip kepribadian Anda' : 'Silakan hubungkan syaraf digital Anda'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email Field */}
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-white/30 group-focus-within:text-cyberGlow transition-colors">
                <i className="fas fa-envelope" />
              </span>
              <input
                type="email"
                placeholder="Alamat Email"
                value={email}
                onChange={handleEmailChange}
                onFocus={handleEmailFocus}
                onBlur={handleEmailBlur}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyberGlow focus:bg-cyberGlow/5 transition-all text-sm font-quicksand placeholder-white/20"
                required
              />
            </div>

            {/* Password Field */}
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-white/30 group-focus-within:text-cyberPurple transition-colors">
                <i className="fas fa-lock" />
              </span>
              <input
                type="password"
                placeholder="Kata Sandi"
                value={password}
                onChange={handlePasswordChange}
                onFocus={handlePasswordFocus}
                onBlur={handlePasswordBlur}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyberPurple focus:bg-cyberPurple/5 transition-all text-sm font-quicksand placeholder-white/20"
                required
              />
            </div>

            {/* Submit / Reset Actions */}
            <div className="flex gap-3 mt-2">
              <button
                type="submit"
                className="flex-1 py-3 font-orbitron font-bold text-sm bg-gradient-to-r from-cyberGlow to-cyberPurple hover:opacity-90 rounded-xl text-black shadow-neonBlue transition-all"
              >
                <i className={`fas ${isSignup ? 'fa-user-plus' : 'fa-arrow-right'} mr-2`} />
                {isSignup ? 'DAFTAR' : 'MASUK'}
              </button>

              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="px-4 py-3 font-orbitron text-xs font-semibold bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all"
              >
                {isSignup ? 'KEMBALI' : 'DAFTAR'}
              </button>
            </div>

            <div className="text-center mt-2">
              <a 
                href="#" 
                onClick={handleForgotPassword}
                className="text-xs text-white/40 hover:text-cyberGlow transition-colors font-quicksand"
              >
                Lupa sandi dekripsi?
              </a>
            </div>

            {/* Divider */}
            <div className="flex items-center my-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="mx-3 text-[9px] font-orbitron font-bold text-white/30 tracking-wider">KONEKSI SYARAF SOSIAL</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            {/* Tombol OAuth Google & Facebook */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:border-cyberGlow hover:bg-cyberGlow/5 rounded-xl flex items-center justify-center gap-2 text-xs font-orbitron font-bold text-white/70 hover:text-cyberGlow transition-all"
              >
                <i className="fab fa-google text-xs" />
                GOOGLE
              </button>

              <button
                type="button"
                onClick={handleFacebookLogin}
                className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:border-cyberPurple hover:bg-cyberPurple/5 rounded-xl flex items-center justify-center gap-2 text-xs font-orbitron font-bold text-white/70 hover:text-cyberPurple transition-all"
              >
                <i className="fab fa-facebook-f text-xs" />
                FACEBOOK
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* OAuth Mock Modal Overlay */}
      {oauthProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md transition-all">
          <div className="w-full max-w-sm mx-4 bg-[#111128]/95 border border-cyberBorder p-6 rounded-2xl shadow-2xl relative flex flex-col gap-4 font-quicksand">
            
            {/* Provider Logo Header */}
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-base ${oauthProvider === 'google' ? 'bg-[#ea4335]' : 'bg-[#1877f2]'}`}>
                <i className={`fab ${oauthProvider === 'google' ? 'fa-google' : 'fa-facebook-f'}`} />
              </span>
              <div>
                <h3 className="font-orbitron font-bold text-sm tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyberGlow to-cyberPurple">
                  {oauthProvider === 'google' ? 'GOOGLE ACCOUNT VERIFICATION' : 'FACEBOOK AUTHENTICATION'}
                </h3>
                <p className="text-[10px] text-white/40 tracking-wider">SECURE NEURAL GATEWAY</p>
              </div>
            </div>

            <form onSubmit={handleOauthSubmit} className="flex flex-col gap-3">
              {oauthError && (
                <div className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
                  {oauthError}
                </div>
              )}

              {/* Full Name (Optional) */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-orbitron font-bold tracking-wider text-white/50">NAMA LENGKAP (OPSIONAL)</label>
                <input
                  type="text"
                  placeholder={oauthProvider === 'google' ? 'Contoh: Google Explorer' : 'Contoh: Facebook Gamer'}
                  value={oauthName}
                  onChange={(e) => setOauthName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-cyberGlow focus:bg-cyberGlow/5 text-xs placeholder-white/20 text-white font-quicksand"
                />
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-orbitron font-bold tracking-wider text-white/50">EMAIL HUBUNGAN (WAJIB)</label>
                <input
                  type="email"
                  placeholder={oauthProvider === 'google' ? 'username@gmail.com' : 'username@facebook.com'}
                  value={oauthEmail}
                  onChange={(e) => setOauthEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-cyberGlow focus:bg-cyberGlow/5 text-xs placeholder-white/20 text-white font-quicksand"
                  required
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-orbitron font-bold tracking-wider text-white/50">KATA SANDI DEKRIPSI (WAJIB)</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={oauthPassword}
                  onChange={(e) => setOauthPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-cyberPurple focus:bg-cyberPurple/5 text-xs placeholder-white/20 text-white font-quicksand"
                  required
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 font-orbitron font-bold text-xs bg-gradient-to-r from-cyberGlow to-cyberPurple hover:opacity-90 rounded-lg text-black shadow-neonBlue transition-all"
                >
                  OTORISASI
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOauthProvider(null);
                    setMascotState('idle');
                    setMascotSpeech('');
                  }}
                  className="px-3 py-2 font-orbitron text-[10px] font-semibold bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all text-white"
                >
                  BATAL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
