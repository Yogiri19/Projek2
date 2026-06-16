import React, { useState, useEffect } from 'react';

export default function MemoryPage({ user }) {
  const [conversations, setConversations] = useState([]);
  const [selectedCharId, setSelectedCharId] = useState('');
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newFact, setNewFact] = useState('');
  const [editingMemId, setEditingMemId] = useState(null);
  const [editFactText, setEditFactText] = useState('');

  // 1. Ambal daftar karakter yang memiliki riwayat chat dengan user
  const fetchActiveCharacters = async () => {
    try {
      const res = await fetch('/api/chats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('yogiri_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        if (data.length > 0) {
          setSelectedCharId(data[0].character_id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Ambil daftar memori untuk karakter terpilih
  const fetchMemories = async () => {
    if (!selectedCharId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/memories?characterId=${selectedCharId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('yogiri_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveCharacters();
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [selectedCharId]);

  // 3. Tambah memori baru
  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!newFact.trim() || !selectedCharId) return;

    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('yogiri_token')}`
        },
        body: JSON.stringify({ characterId: selectedCharId, fact: newFact })
      });
      if (res.ok) {
        setNewFact('');
        fetchMemories();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Edit memori
  const handleStartEdit = (mem) => {
    setEditingMemId(mem.id);
    setEditFactText(mem.fact);
  };

  const handleSaveEdit = async (memId) => {
    if (!editFactText.trim()) return;
    try {
      const res = await fetch(`/api/memories/${memId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('yogiri_token')}`
        },
        body: JSON.stringify({ fact: editFactText })
      });
      if (res.ok) {
        setEditingMemId(null);
        fetchMemories();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Hapus memori
  const handleDeleteMemory = async (memId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus ingatan ini dari karakter?')) return;
    try {
      const res = await fetch(`/api/memories/${memId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('yogiri_token')}` }
      });
      if (res.ok) {
        fetchMemories();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="font-orbitron font-extrabold text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyberGlow to-cyberPurple">
          MANAJER MEMORI KARAKTER
        </h2>
        <p className="text-white/40 text-sm mt-1">
          Tinjau, suntikkan, atau modifikasi fakta-fakta penting yang tersimpan di dalam memori jangka panjang karakter AI Anda.
        </p>
      </div>

      {/* Select Character dropdown */}
      <div className="glass-panel p-6 rounded-2xl border border-cyberBorder flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <label className="font-orbitron font-bold text-xs text-white/50">PILIH PROSES KEPRIBADIAN:</label>
          <span className="text-[10px] text-white/30">Hanya menampilkan karakter yang sudah pernah Anda ajak mengobrol.</span>
        </div>
        <select
          value={selectedCharId}
          onChange={(e) => setSelectedCharId(e.target.value)}
          className="bg-[#0b0b23] border border-cyberBorder rounded-xl px-4 py-2.5 text-xs text-white/80 focus:outline-none focus:border-cyberGlow font-orbitron w-full sm:max-w-xs"
        >
          {conversations.length === 0 && <option value="">Tidak ada obrolan aktif</option>}
          {conversations.map(c => (
            <option key={c.character_id} value={c.character_id}>
              {c.character_name.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Add New Memory Form */}
      {selectedCharId && (
        <form onSubmit={handleAddMemory} className="flex gap-3 w-full">
          <input
            type="text"
            placeholder="Suntikkan fakta baru... (Contoh: Pengguna menyukai pizza pepperoni)"
            value={newFact}
            onChange={(e) => setNewFact(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-white/20 text-white focus:outline-none focus:border-cyberGlow transition-colors"
            required
          />
          <button
            type="submit"
            className="px-6 bg-cyberGlow/10 border border-cyberGlow/30 hover:bg-cyberGlow/20 text-cyberGlow text-sm font-orbitron font-bold rounded-xl transition-all shadow-neonBlue/10"
          >
            INJEKSI
          </button>
        </form>
      )}

      {/* Memories List */}
      <div className="glass-panel p-6 rounded-2xl border border-cyberBorder flex flex-col gap-4">
        <h3 className="font-orbitron font-bold text-xs text-white/50 border-b border-white/5 pb-3">
          DAFTAR INGATAN AKTIF ({memories.length})
        </h3>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl skeleton w-full" />
            ))}
          </div>
        ) : !selectedCharId ? (
          <div className="py-10 text-center text-white/30 text-xs">
            Pilihlah salah satu karakter terlebih dahulu untuk mengelola ingatan.
          </div>
        ) : memories.length === 0 ? (
          <div className="py-12 text-center text-white/30 text-xs flex flex-col items-center gap-3">
            <i className="fas fa-microchip text-2xl text-white/10" />
            <span>Karakter ini belum merekam ingatan atau fakta khusus apa pun tentang Anda.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {memories.map(mem => (
              <div
                key={mem.id}
                className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-cyberGlow/25 transition-all group"
              >
                {editingMemId === mem.id ? (
                  <div className="flex-1 flex gap-3">
                    <input
                      type="text"
                      value={editFactText}
                      onChange={(e) => setEditFactText(e.target.value)}
                      className="flex-1 bg-[#0b0b23] border border-cyberGlow/30 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyberGlow"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setEditingMemId(null)} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold font-orbitron">BATAL</button>
                      <button onClick={() => handleSaveEdit(mem.id)} className="px-3 py-1.5 rounded-lg bg-cyberGlow text-black text-xs font-bold font-orbitron">SAVE</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <i className="fas fa-brain text-cyberGlow/50 group-hover:text-cyberGlow transition-colors" />
                      <span className="text-sm font-medium text-white/85">{mem.fact}</span>
                    </div>

                    <div className="flex items-center gap-3 text-white/30 group-hover:text-white/60 transition-colors text-xs">
                      <button onClick={() => handleStartEdit(mem)} className="hover:text-cyberGlow transition-colors">
                        <i className="fas fa-edit" />
                      </button>
                      <button onClick={() => handleDeleteMemory(mem.id)} className="hover:text-cyberPink transition-colors">
                        <i className="fas fa-trash-alt" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
