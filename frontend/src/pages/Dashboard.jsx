import React, { useState, useEffect } from 'react';
import ExplorePage from './ExplorePage';
import CreateCharacterPage from './CreateCharacterPage';
import ChatPage from './ChatPage';
import MemoryPage from './MemoryPage';
import SettingsPage from './SettingsPage';
import AdminPage from './AdminPage';

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('explore');
  const [selectedCharId, setSelectedCharId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState(user?.role || 'user');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar_url || '');

  // Sync details from localStorage
  useEffect(() => {
    const cachedUser = localStorage.getItem('yogiri_user');
    if (cachedUser) {
      try {
        const u = JSON.parse(cachedUser);
        setUserRole(u.role);
        setProfileAvatar(u.avatar_url);
      } catch (e) {}
    }
  }, [activeTab]);

  const handleStartChat = (characterId) => {
    setSelectedCharId(characterId);
    setActiveTab('chats');
  };

  const menuItems = [
    { id: 'explore', name: 'Jelajahi Karakter', icon: 'fa-compass' },
    { id: 'my-characters', name: 'Karakter Saya', icon: 'fa-user-ninja' },
    { id: 'create-character', name: 'Buat Karakter', icon: 'fa-plus-circle' },
    { id: 'chats', name: 'Obrolan (Chats)', icon: 'fa-comments' },
    { id: 'memory', name: 'Manajer Memori', icon: 'fa-brain' },
    { id: 'settings', name: 'Pengaturan API', icon: 'fa-sliders-h' },
  ];

  if (userRole === 'admin') {
    menuItems.push({ id: 'admin', name: 'Panel Admin', icon: 'fa-shield-halved' });
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'explore':
        return <ExplorePage onStartChat={handleStartChat} showOnlyUserCreated={false} user={user} />;
      case 'my-characters':
        return <ExplorePage onStartChat={handleStartChat} showOnlyUserCreated={true} user={user} />;
      case 'create-character':
        return <CreateCharacterPage onCreated={() => setActiveTab('my-characters')} />;
      case 'chats':
        return <ChatPage selectedCharacterId={selectedCharId} setSelectedCharacterId={setSelectedCharId} user={user} />;
      case 'memory':
        return <MemoryPage user={user} />;
      case 'settings':
        return <SettingsPage user={user} onAvatarUpdate={(url) => setProfileAvatar(url)} />;
      case 'admin':
        return <AdminPage />;
      default:
        return <ExplorePage onStartChat={handleStartChat} showOnlyUserCreated={false} user={user} />;
    }
  };

  const username = user?.email?.split('@')[0] || 'Pengguna';
  const initial = username.charAt(0).toUpperCase();

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-cyberBg text-[#e8e8f0]">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar navigation */}
      <aside 
        className={`fixed md:relative inset-y-0 left-0 w-72 z-40 bg-[#070715]/95 md:bg-[#070715]/70 border-r border-cyberBorder backdrop-blur-xl flex flex-col justify-between transform transition-transform duration-300 md:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div>
          {/* Sidebar Header */}
          <div className="p-6 border-b border-cyberBorder flex items-center gap-3">
            <i className="fas fa-gem text-cyberGlow text-xl drop-shadow-[0_0_8px_#00e5ff]" />
            <h1 className="font-orbitron font-black text-lg tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyberGlow to-cyberPurple">
              YOGIRI.AI
            </h1>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 flex flex-col gap-1.5">
            {menuItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl flex items-center gap-4 text-sm font-semibold transition-all ${isActive ? 'bg-gradient-to-r from-cyberGlow/15 to-cyberPurple/15 border border-cyberGlow/30 text-cyberGlow shadow-neonBlue/10' : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'}`}
                >
                  <i className={`fas ${item.icon} w-5 text-center text-base ${isActive ? 'text-cyberGlow' : 'text-white/40'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-cyberBorder bg-[#03030d]/50 flex flex-col gap-3">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
            {profileAvatar ? (
              <img src={profileAvatar} alt={username} className="w-10 h-10 rounded-xl object-cover border border-cyberGlow/20 shadow-neonBlue/20" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-cyberPurple/20 text-cyberPurple font-orbitron font-bold flex items-center justify-center border border-cyberPurple/40">
                {initial}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <h4 className="text-sm font-bold truncate leading-tight text-white/90">{username}</h4>
              <span className="text-[10px] text-white/30 truncate block mt-0.5">{user?.email}</span>
            </div>
          </div>

          <button 
            onClick={onLogout}
            className="w-full py-2.5 rounded-xl border border-cyberPink/20 text-cyberPink/80 hover:text-cyberPink hover:bg-cyberPink/5 text-xs font-orbitron font-bold transition-all"
          >
            <i className="fas fa-sign-out-alt mr-2" /> KELUAR SISTEM
          </button>
        </div>
      </aside>

      {/* Main viewport */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Navbar */}
        <nav className="h-16 border-b border-cyberBorder bg-[#05050f]/80 backdrop-blur-md px-6 flex items-center justify-between z-20">
          {/* Mobile hamburger */}
          <button 
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 border border-white/10 rounded-xl flex items-center justify-center text-white/60 hover:text-white md:hidden"
          >
            <i className="fas fa-bars" />
          </button>

          {/* Search bar placeholder (aesthetic) */}
          <div className="hidden sm:flex items-center gap-3 w-72 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm text-white/40 focus-within:border-cyberGlow focus-within:text-white transition-all">
            <i className="fas fa-search" />
            <input 
              type="text" 
              placeholder="Cari portal digital..." 
              className="bg-transparent border-none outline-none w-full placeholder-white/20 text-white"
            />
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-4">
            <button className="relative w-10 h-10 border border-white/10 hover:border-cyberGlow hover:text-cyberGlow rounded-xl flex items-center justify-center text-white/60 transition-all">
              <i className="fas fa-bell" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-cyberPink shadow-neonPink animate-pulse" />
            </button>
            
            <button 
              onClick={() => setActiveTab('settings')}
              className="w-10 h-10 border border-white/10 hover:border-cyberPurple hover:text-cyberPurple rounded-xl flex items-center justify-center text-white/60 transition-all"
            >
              <i className="fas fa-cog" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyberGlow to-cyberPurple p-[1px] shadow-neonPurple/20">
              <div className="w-full h-full rounded-xl bg-cyberBg flex items-center justify-center font-orbitron font-bold text-cyberGlow text-sm">
                {initial}
              </div>
            </div>
          </div>
        </nav>

        {/* Content panel */}
        <div className="flex-1 overflow-y-auto relative p-6 md:p-8 z-10">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
