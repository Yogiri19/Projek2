import React, { useState, useEffect, useRef } from 'react';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const glowRef = useRef(null);

  // 1. Cek sesi login aktif saat pertama kali load
  useEffect(() => {
    const token = localStorage.getItem('yogiri_token');
    const cachedUser = localStorage.getItem('yogiri_user');
    
    if (token && cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (e) {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  // 2. Cursor Glow tracker di seluruh aplikasi
  useEffect(() => {
    const handleMouseMove = (e) => {
      const glow = glowRef.current;
      if (glow) {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('yogiri_token');
    localStorage.removeItem('yogiri_user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#05050f] flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-16 h-16 border-t-2 border-cyberGlow border-r-2 border-transparent rounded-full animate-spin shadow-neonBlue" />
        <span className="font-orbitron font-bold text-xs text-cyberGlow tracking-widest">MENGINISIALISASI MATRIKS...</span>
      </div>
    );
  }

  return (
    <>
      {/* Efek kursor glow global */}
      <div id="cursor-glow" ref={glowRef} />

      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <LoginPage onLoginSuccess={(u) => setUser(u)} />
      )}
    </>
  );
}
