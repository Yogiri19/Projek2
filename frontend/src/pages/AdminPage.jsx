import React, { useState, useEffect } from 'react';

export default function AdminPage() {
  const [stats, setStats] = useState({ totalUsers: 0, totalCharacters: 0, totalMessages: 0, totalConversations: 0 });
  const [users, setUsers] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [monitor, setMonitor] = useState({ cpuLoad: '0%', memoryUsage: '0 MB', avgResponseTime: '0ms', activeConnections: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('yogiri_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setUsers(data.users);
        setCharacters(data.characters);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonitor = async () => {
    try {
      const res = await fetch('/api/admin/monitor', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('yogiri_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMonitor(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchMonitor();
    // Poll monitor stats every 5s
    const timer = setInterval(fetchMonitor, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleDeleteUser = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus akun pengguna ini? Semua karakter buatan mereka dan pesan chat akan ikut terhapus secara permanen.')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('yogiri_token')}` }
      });
      if (res.ok) {
        alert('Pengguna berhasil dihapus.');
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteChar = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus karakter ini secara permanen dari sistem?')) return;
    try {
      const res = await fetch(`/api/admin/characters/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('yogiri_token')}` }
      });
      if (res.ok) {
        alert('Karakter berhasil dihapus.');
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col gap-8">
      {/* Header */}
      <div>
        <h2 className="font-orbitron font-extrabold text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyberPink to-cyberPurple">
          PANEL ADMINISTRATOR SISTEM
        </h2>
        <p className="text-white/40 text-sm mt-1">
          Pantau kesehatan server API, awasi statistik obrolan, dan moderasi konten digital.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { name: 'Total Pengguna', value: stats.totalUsers, icon: 'fa-users', color: 'var(--accent)' },
          { name: 'Total Karakter', value: stats.totalCharacters, icon: 'fa-user-ninja', color: 'var(--accent3)' },
          { name: 'Total Pesan', value: stats.totalMessages, icon: 'fa-comment-alt', color: 'var(--accent2)' },
          { name: 'Total Obrolan', value: stats.totalConversations, icon: 'fa-comments', color: '#00e676' }
        ].map((item, idx) => (
          <div key={idx} className="glass-panel p-5 rounded-2xl border border-cyberBorder flex items-center justify-between">
            <div>
              <span className="text-white/40 text-[10px] font-orbitron font-bold block">{item.name.toUpperCase()}</span>
              <span className="font-orbitron font-black text-2xl text-white mt-1 block leading-none">{item.value}</span>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm" style={{ background: `${item.color}15`, color: item.color }}>
              <i className={`fas ${item.icon}`} />
            </div>
          </div>
        ))}
      </div>

      {/* API monitor & performance metrics */}
      <div className="glass-panel p-6 rounded-2xl border border-cyberBorder flex flex-col gap-4">
        <h3 className="font-orbitron font-bold text-xs text-white/50 border-b border-white/5 pb-3">
          SISTEM MONITOR BEBAN (APIGATEWAY TELEMETRY)
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs leading-none">
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-2">
            <span className="text-white/30 font-orbitron">BEBAN CPU:</span>
            <span className="text-cyberGlow font-orbitron font-bold text-sm">{monitor.cpuLoad}</span>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-2">
            <span className="text-white/30 font-orbitron">RAM TERPAKAI:</span>
            <span className="text-cyberPurple font-orbitron font-bold text-sm truncate">{monitor.memoryUsage}</span>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-2">
            <span className="text-white/30 font-orbitron">LATENSI RESPONS:</span>
            <span className="text-cyberPink font-orbitron font-bold text-sm">{monitor.avgResponseTime}</span>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-2">
            <span className="text-white/30 font-orbitron">SESI KONEKSI AKTIF:</span>
            <span className="text-green-400 font-orbitron font-bold text-sm">{monitor.activeConnections} sockets</span>
          </div>
        </div>
      </div>

      {/* Moderation section */}
      <div className="glass-panel p-6 rounded-2xl border border-cyberBorder flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('users')}
              className={`font-orbitron font-bold text-xs pb-1 border-b-2 transition-all ${activeTab === 'users' ? 'border-cyberGlow text-cyberGlow' : 'border-transparent text-white/50 hover:text-white'}`}
            >
              MODERASI PENGGUNA ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('characters')}
              className={`font-orbitron font-bold text-xs pb-1 border-b-2 transition-all ${activeTab === 'characters' ? 'border-cyberPurple text-cyberPurple' : 'border-transparent text-white/50 hover:text-white'}`}
            >
              MODERASI KARAKTER ({characters.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-40 flex items-center justify-center"><i className="fas fa-spinner animate-spin text-2xl text-cyberGlow" /></div>
        ) : activeTab === 'users' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-white/40 font-orbitron">
                  <th className="py-3 px-4">EMAIL PENGGUNA</th>
                  <th className="py-3 px-4">ROLE</th>
                  <th className="py-3 px-4">TANGGAL REGISTER</th>
                  <th className="py-3 px-4 text-right">TINDAKAN</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-white/90">{u.email}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded font-orbitron font-bold text-[9px] ${u.role === 'admin' ? 'bg-cyberPink/10 border border-cyberPink/20 text-cyberPink' : 'bg-white/5 border border-white/5 text-white/40'}`}>{u.role.toUpperCase()}</span></td>
                    <td className="py-3 px-4 text-white/50">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="py-1 px-3 bg-cyberPink/15 border border-cyberPink/30 hover:bg-cyberPink text-cyberPink hover:text-black font-orbitron font-bold text-[9px] rounded-md transition-all"
                      >
                        BANNED / DELETE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-white/40 font-orbitron">
                  <th className="py-3 px-4">NAMA KARAKTER</th>
                  <th className="py-3 px-4">KATEGORI</th>
                  <th className="py-3 px-4">TOTAL CHATS</th>
                  <th className="py-3 px-4">RATING</th>
                  <th className="py-3 px-4 text-right">TINDAKAN</th>
                </tr>
              </thead>
              <tbody>
                {characters.map(c => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-white/90">{c.name}</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-cyberPurple/10 border border-cyberPurple/20 text-cyberPurple font-orbitron font-bold text-[9px]">{c.category.toUpperCase()}</span></td>
                    <td className="py-3 px-4 text-white/50">{c.chat_count?.toLocaleString() || 0}</td>
                    <td className="py-3 px-4 text-yellow-400 font-bold"><i className="fas fa-star mr-1" />{c.rating?.toFixed(1) || '5.0'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteChar(c.id)}
                        className="py-1 px-3 bg-cyberPink/15 border border-cyberPink/30 hover:bg-cyberPink text-cyberPink hover:text-black font-orbitron font-bold text-[9px] rounded-md transition-all"
                      >
                        HAPUS
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
