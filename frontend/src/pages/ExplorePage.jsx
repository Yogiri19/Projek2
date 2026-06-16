import React, { useState, useEffect } from 'react';

const categories = ['All', 'Anime', 'Game', 'Fantasy', 'Assistant', 'Tutor', 'Roleplay', 'Coding', 'Custom'];

export default function ExplorePage({ onStartChat, showOnlyUserCreated = false, user }) {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('popular');

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      let url = `/api/characters?category=${activeCategory === 'All' ? 'all' : activeCategory}&search=${search}&filter=${sortBy}`;
      if (showOnlyUserCreated && user) {
        url += `&userId=${user.id}`;
      }
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('yogiri_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCharacters(data);
      }
    } catch (e) {
      console.error('Gagal memuat karakter:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, [activeCategory, sortBy, showOnlyUserCreated]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCharacters();
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-orbitron font-extrabold text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyberGlow to-cyberPurple">
            {showOnlyUserCreated ? 'STUDIO KARAKTER SAYA' : 'HUB DATA KARAKTER AI'}
          </h2>
          <p className="text-white/40 text-sm mt-1">
            {showOnlyUserCreated 
              ? 'Kelola atau edit avatar kepribadian buatan Anda sendiri' 
              : 'Pilih manifestasi kepribadian digital yang ingin Anda hubungi'}
          </p>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/30 font-orbitron">SORTIR:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#0b0b23] border border-cyberBorder rounded-xl px-4 py-2.5 text-xs text-white/80 focus:outline-none focus:border-cyberGlow font-orbitron"
          >
            <option value="popular">Tersohor (Popular)</option>
            <option value="trending">Sedang Tren (Trending)</option>
            <option value="new">Krom Baru (Newest)</option>
          </select>
        </div>
      </div>

      {/* Search Bar & Categories */}
      <div className="flex flex-col gap-6 w-full">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-3 w-full">
          <input
            type="text"
            placeholder="Cari nama karakter, deskripsi, atau kecocokan tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-white/20 text-white focus:outline-none focus:border-cyberGlow transition-colors"
          />
          <button
            type="submit"
            className="px-6 bg-cyberGlow/10 border border-cyberGlow/30 hover:bg-cyberGlow/20 text-cyberGlow text-sm font-orbitron font-bold rounded-xl transition-all shadow-neonBlue/10"
          >
            PING
          </button>
        </form>

        {/* Categories Tab list */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {categories.map(cat => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-orbitron font-bold whitespace-nowrap transition-all border ${isActive ? 'bg-cyberGlow/10 border-cyberGlow text-cyberGlow' : 'bg-white/5 border-white/5 text-white/50 hover:text-white/80'}`}
              >
                {cat.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-60 rounded-2xl border border-white/5 bg-[#0b0b23]/50 p-6 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-xl skeleton" />
                <div className="flex-1 flex flex-col gap-2 mt-1">
                  <div className="h-4 w-3/4 rounded skeleton" />
                  <div className="h-3 w-1/2 rounded skeleton" />
                </div>
              </div>
              <div className="h-16 w-full rounded skeleton" />
              <div className="h-8 w-1/3 rounded skeleton mt-auto" />
            </div>
          ))}
        </div>
      ) : characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-panel rounded-2xl p-8 border border-cyberBorder/30">
          <i className="fas fa-satellite text-cyberPurple/40 text-4xl mb-4 animate-bounce" />
          <h3 className="font-orbitron font-bold text-lg text-white/85">Frekuensi Kosong</h3>
          <p className="text-white/30 text-xs mt-1 max-w-sm">
            Tidak ada manifestasi karakter AI yang sesuai dengan filter pencarian ini. Buat satu karakter baru sekarang!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {characters.map(char => (
            <div
              key={char.id}
              onClick={() => onStartChat(char.id)}
              className="glass-card p-5 rounded-2xl flex flex-col gap-4 cursor-pointer relative overflow-hidden group"
            >
              {/* Scanline visual effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none opacity-20" />

              {/* Upper Section */}
              <div className="flex gap-4 items-start z-10">
                <img
                  src={char.avatar_url}
                  alt={char.name}
                  className="w-14 h-14 rounded-xl object-cover border border-cyberBorder group-hover:border-cyberGlow transition-colors duration-300"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-orbitron font-extrabold text-base tracking-wide truncate group-hover:text-cyberGlow transition-colors duration-300">
                    {char.name}
                  </h3>
                  <span className="text-[10px] font-orbitron font-bold text-cyberPurple/80 bg-cyberPurple/10 border border-cyberPurple/25 px-2 py-0.5 rounded mt-1 inline-block">
                    {char.category.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-white/50 text-xs leading-relaxed line-clamp-3 z-10 flex-1">
                {char.description || 'Tidak ada deskripsi.'}
              </p>

              {/* Tags */}
              {char.tags && (
                <div className="flex flex-wrap gap-1 z-10">
                  {char.tags.split(',').map(tag => (
                    <span key={tag} className="text-[9px] text-white/30 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats Footer */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-auto z-10 text-[10px] font-orbitron font-bold text-white/40">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 hover:text-cyberGlow transition-colors">
                    <i className="fas fa-comment-dots text-cyberGlow/60" />
                    {char.chat_count?.toLocaleString() || 0} chats
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-yellow-400 transition-colors">
                    <i className="fas fa-star text-yellow-500/80" />
                    {char.rating?.toFixed(1) || '5.0'}
                  </span>
                </div>

                <button className="px-3 py-1.5 rounded-lg bg-cyberGlow/10 group-hover:bg-cyberGlow group-hover:text-black text-cyberGlow border border-cyberGlow/20 group-hover:border-cyberGlow transition-all duration-300 font-bold text-[9px]">
                  HUBUNGKAN
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
