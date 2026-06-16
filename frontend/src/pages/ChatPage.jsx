import React, { useState, useEffect, useRef } from 'react';

// Custom Markdown Parser with Code Block copy features
function parseMarkdown(text = '') {
  const parts = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Teks sebelum blok kode
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }
    // Blok kode
    parts.push({
      type: 'code',
      language: match[1] || 'code',
      content: match[2]
    });
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  if (parts.length === 0) {
    parts.push({ type: 'text', content: text });
  }

  return parts;
}

// Render styling untuk inline bold, inline code, dll.
function renderInlineText(txt = '') {
  let html = txt
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-white">$1</strong>');
  
  // Inline Code `code`
  html = html.replace(/`(.*?)`/g, '<code class="bg-black/30 border border-white/5 rounded px-1.5 py-0.5 text-cyberGlow font-mono text-xs">$1</code>');

  // Bullet Points
  html = html.replace(/^\s*-\s+(.*)$/gm, '<li class="ml-4 list-disc text-white/80 my-1">$1</li>');

  // Newlines to br
  html = html.replace(/\n/g, '<br />');

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function ChatPage({ selectedCharacterId, setSelectedCharacterId, user }) {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [typing, setTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [activeModel, setActiveModel] = useState('Local Python Engine');
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // States untuk Edit Pesan
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');

  const chatEndRef = useRef(null);
  const audioSynth = window.speechSynthesis;

  // 1. Ambil riwayat percakapan pengguna
  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/chats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('yogiri_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        
        // Jika ada selectedCharacterId dari luar (Explore Page), buat percakapan baru atau arahkan ke yang sudah ada
        if (selectedCharacterId) {
          const matched = data.find(c => c.character_id === selectedCharacterId);
          if (matched) {
            handleSelectConversation(matched);
            setSelectedCharacterId(null); // Reset trigger luar
          } else {
            // Jalankan request buat obrolan baru
            startNewConversation(selectedCharacterId);
          }
        } else if (data.length > 0 && !activeConv) {
          // Buka obrolan paling atas sebagai default
          handleSelectConversation(data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startNewConversation = async (charId) => {
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('yogiri_token')}`
        },
        body: JSON.stringify({ characterId: charId })
      });
      if (res.ok) {
        const newConv = await res.json();
        setConversations(prev => [newConv, ...prev]);
        handleSelectConversation(newConv);
        setSelectedCharacterId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectConversation = async (conv) => {
    setActiveConv(conv);
    setMessages([]);
    setStreamingText('');
    try {
      const res = await fetch(`/api/chats/${conv.id}/messages`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('yogiri_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [selectedCharacterId]);

  // Scroll ke paling bawah saat pesan berubah atau ada efek mengetik
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing, streamingText]);

  // 2. Fungsi Kirim Pesan
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    const userText = inputText;
    const imgToSend = imageUrl;
    setInputText('');
    setImageUrl('');
    setShowImageInput(false);

    // Render pesan user langsung secara lokal agar instan
    const tempUserMsg = {
      id: 'temp_user_' + Date.now(),
      sender_type: 'user',
      content: userText,
      image_url: imgToSend,
      created_at: new Date()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setTyping(true);

    try {
      const res = await fetch(`/api/chats/${activeConv.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('yogiri_token')}`
        },
        body: JSON.stringify({ content: userText, image_url: imgToSend, model: activeModel })
      });
      const data = await res.json();

      if (res.ok) {
        // Hapus pesan sementara dan gantikan dengan data database asli
        setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
        setMessages(prev => [...prev, data.userMessage]);

        // Simulasikan Text Streaming premium pada frontend
        simulateStreaming(data.aiMessage);
      } else {
        setTyping(false);
      }
    } catch (error) {
      console.error(error);
      setTyping(false);
    }
  };

  // Typewriter streaming simulator
  const simulateStreaming = (aiMessageObj) => {
    setTyping(false);
    let index = 0;
    const fullText = aiMessageObj.content;
    setStreamingText('');

    const interval = setInterval(() => {
      setStreamingText(prev => prev + fullText.charAt(index));
      index++;
      if (index >= fullText.length) {
        clearInterval(interval);
        setMessages(prev => [...prev, aiMessageObj]);
        setStreamingText('');
      }
    }, 15); // Kecepatan ketik 15ms per huruf
  };

  // 3. Edit & Delete Pesan
  const handleStartEdit = (msg) => {
    setEditingMessageId(msg.id);
    setEditText(msg.content);
  };

  const handleSaveEdit = async (msgId) => {
    try {
      const res = await fetch(`/api/chats/message/${msgId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('yogiri_token')}`
        },
        body: JSON.stringify({ content: editText })
      });
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: editText } : m));
        setEditingMessageId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pesan ini?')) return;
    try {
      const res = await fetch(`/api/chats/message/${msgId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('yogiri_token')}` }
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== msgId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Regenerasi Pesan Terakhir
  const handleRegenerate = async () => {
    if (!activeConv || messages.length < 2) return;
    setTyping(true);
    
    // Hapus pesan terakhir secara lokal jika itu pesan AI
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender_type !== 'character') {
      setTyping(false);
      return;
    }

    try {
      const res = await fetch(`/api/chats/${activeConv.id}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('yogiri_token')}`
        },
        body: JSON.stringify({ model: activeModel })
      });
      const data = await res.json();

      if (res.ok) {
        setMessages(prev => prev.slice(0, -1)); // Potong pesan AI lama
        simulateStreaming(data.aiMessage);
      } else {
        setTyping(false);
      }
    } catch (e) {
      console.error(e);
      setTyping(false);
    }
  };

  // 5. Text-To-Speech (Membaca Jawaban Karakter)
  const handleSpeak = (text) => {
    if (!audioSynth) return;
    if (audioSynth.speaking) {
      audioSynth.cancel();
      return;
    }
    const cleanText = text.replace(/```[\s\S]*?```/g, '').replace(/[\*`#]/g, ''); // Hapus markdown
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'id-ID'; // Gunakan aksen Indonesia
    audioSynth.speak(utterance);
  };

  // 6. Menyalin Kode ke Clipboard
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert('Kode berhasil disalin ke clipboard!');
  };

  // Model LLM selection options
  const models = ['Local Python Engine', 'Gemini 1.5 Flash', 'GPT-4o Mini', 'Claude 3 Haiku', 'Llama 3 Instruct', 'DeepSeek V4 Pro'];

  return (
    <div className="absolute inset-0 flex overflow-hidden bg-cyberBg">
      {/* 1. Left Side: Active Obrolan list */}
      <aside className="w-64 border-r border-cyberBorder bg-[#070718]/40 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="p-4 flex flex-col gap-4 overflow-hidden flex-1">
          <div className="flex justify-between items-center">
            <h3 className="font-orbitron font-bold text-xs text-white/50">RIWAYAT AKTIF</h3>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
            {conversations.map(conv => {
              const isActive = activeConv?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isActive ? 'bg-cyberGlow/10 border-cyberGlow/30 text-cyberGlow' : 'bg-[#0f0f29]/30 border-white/5 text-white/60 hover:bg-[#0f0f29]/50'}`}
                >
                  <img src={conv.character_avatar} alt={conv.character_name} className="w-9 h-9 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold truncate">{conv.character_name}</h4>
                    <p className="text-[10px] text-white/30 truncate mt-0.5">{conv.character_description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* 2. Center: Chat viewport */}
      <section className="flex-1 flex flex-col justify-between overflow-hidden bg-[#03030b]/20 relative">
        {/* Chat top header */}
        {activeConv && (
          <div className="h-16 border-b border-cyberBorder px-6 flex items-center justify-between bg-[#050511]/60 z-10 shrink-0">
            <div className="flex items-center gap-3">
              <img src={activeConv.character_avatar} alt={activeConv.character_name} className="w-10 h-10 rounded-xl object-cover border border-cyberBorder" />
              <div>
                <h3 className="font-orbitron font-bold text-sm text-white/90">{activeConv.character_name}</h3>
                <span className="text-[9px] font-orbitron text-cyberGlow flex items-center gap-1 mt-0.5">
                  <i className="fas fa-circle text-[6px] animate-pulse" /> TERHUBUNG
                </span>
              </div>
            </div>

            {/* Model select dropdown */}
            <div className="flex items-center gap-3">
              <select
                value={activeModel}
                onChange={(e) => setActiveModel(e.target.value)}
                className="bg-[#0b0b23] border border-cyberBorder rounded-lg px-3 py-1.5 text-[10px] text-white/80 focus:outline-none focus:border-cyberGlow font-orbitron"
              >
                {models.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
              </select>

              <button 
                onClick={() => setRightPanelOpen(!rightPanelOpen)}
                className="w-8 h-8 border border-white/10 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-colors"
              >
                <i className="fas fa-circle-info" />
              </button>
            </div>
          </div>
        )}

        {/* Message Feed Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
              <i className="fas fa-comment-slash text-white/20 text-5xl mb-4" />
              <h3 className="font-orbitron font-bold text-base text-white/60">Tidak Ada Percakapan Terbuka</h3>
              <p className="text-white/35 text-xs max-w-xs mt-1">
                Silakan pilih salah satu karakter AI dari tab Jelajahi Karakter untuk memulai dialog digital.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const isUser = msg.sender_type === 'user';
                return (
                  <div key={msg.id || i} className={`flex gap-4 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                    {/* Avatar icon */}
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-white/5 border border-white/10 flex items-center justify-center select-none font-orbitron font-bold text-xs text-cyberGlow">
                      {isUser ? 'ME' : <img src={activeConv.character_avatar} alt="Character Avatar" className="w-full h-full object-cover" />}
                    </div>

                    {/* Chat Bubble container */}
                    <div className={`flex flex-col gap-1.5 max-w-[85%] sm:max-w-[70%]`}>
                      {/* Bubble body */}
                      <div className={`glass-card p-4 rounded-2xl relative ${isUser ? 'bg-cyberPurple/10 border-cyberPurple/30 text-white/95 rounded-tr-none' : 'bg-cyberGlow/5 border-cyberGlow/25 text-white/90 rounded-tl-none'}`}>
                        {/* Rendered Text */}
                        {editingMessageId === msg.id ? (
                          <div className="flex flex-col gap-2">
                            <textarea
                              rows={2}
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full bg-[#0a0a1a] border border-cyberGlow/30 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyberGlow font-quicksand resize-none"
                            />
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setEditingMessageId(null)} className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold">BATAL</button>
                              <button onClick={() => handleSaveEdit(msg.id)} className="px-2.5 py-1 rounded bg-cyberGlow text-black text-[10px] font-bold">SAVE</button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm leading-relaxed whitespace-pre-wrap select-text font-quicksand font-medium">
                            {/* Render image inside chat if present */}
                            {msg.image_url && (
                              <img src={msg.image_url} alt="Attached asset" className="w-full max-h-48 rounded-lg object-cover border border-white/10 mb-3 shadow-md" />
                            )}

                            {/* Parse markdown contents */}
                            {parseMarkdown(msg.content).map((chunk, idx) => {
                              if (chunk.type === 'code') {
                                return (
                                  <div key={idx} className="my-3 rounded-lg overflow-hidden border border-cyberBorder bg-[#050512]">
                                    <div className="px-4 py-2 border-b border-white/5 bg-white/5 flex items-center justify-between text-[10px] font-mono text-white/50">
                                      <span>{chunk.language.toUpperCase()}</span>
                                      <button onClick={() => handleCopyCode(chunk.content)} className="hover:text-cyberGlow transition-colors">
                                        <i className="fas fa-copy mr-1.5" /> COPY CODE
                                      </button>
                                    </div>
                                    <pre className="p-4 overflow-x-auto text-xs text-cyberGlow font-mono leading-relaxed bg-[#02020a]">
                                      <code>{chunk.content}</code>
                                    </pre>
                                  </div>
                                );
                              }
                              return renderInlineText(chunk.content);
                            })}
                          </div>
                        )}
                      </div>

                      {/* Bubble actions (TTS, edit, delete, regenerate) */}
                      {!editingMessageId && (
                        <div className="flex items-center gap-3 text-[10px] font-orbitron font-bold text-white/30 px-1 mt-0.5">
                          {isUser ? (
                            <>
                              <button onClick={() => handleStartEdit(msg)} className="hover:text-cyberGlow"><i className="fas fa-edit" /> EDIT</button>
                              <span>•</span>
                              <button onClick={() => handleDeleteMessage(msg.id)} className="hover:text-cyberPink"><i className="fas fa-trash-alt" /> HAPUS</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleSpeak(msg.content)} className="hover:text-cyberGlow"><i className="fas fa-volume-up" /> SUARA</button>
                              {i === messages.length - 1 && (
                                <>
                                  <span>•</span>
                                  <button onClick={handleRegenerate} className="hover:text-cyberPurple"><i className="fas fa-sync" /> REGENERASI</button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Streaming typewriter effect renderer */}
              {streamingText && (
                <div className="flex gap-4 max-w-3xl mr-auto">
                  <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-cyberBorder">
                    <img src={activeConv.character_avatar} alt="Character Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col gap-1.5 max-w-[85%] sm:max-w-[70%]">
                    <div className="glass-card p-4 rounded-2xl rounded-tl-none bg-cyberGlow/5 border-cyberGlow/25 text-white/90">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap select-text font-quicksand font-medium">
                        {renderInlineText(streamingText)}
                        <span className="inline-block w-1.5 h-4 bg-cyberGlow/80 animate-ping ml-1" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Typing loader anim */}
              {typing && (
                <div className="flex gap-4 items-center mr-auto">
                  <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-cyberBorder bg-white/5 flex items-center justify-center">
                    <img src={activeConv.character_avatar} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="glass-card px-5 py-3.5 rounded-2xl rounded-tl-none bg-cyberGlow/5 border-cyberGlow/25 flex items-center justify-center">
                    <div className="dot-typing my-1" />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input box */}
        {activeConv && (
          <div className="p-4 border-t border-cyberBorder bg-[#050511]/40 shrink-0 z-10">
            {/* Optional image attachment bar */}
            {showImageInput && (
              <div className="flex gap-3 items-center p-3 mb-3 bg-[#0a0a20]/80 border border-cyberBorder/50 rounded-xl">
                <i className="fas fa-image text-cyberGlow" />
                <input
                  type="text"
                  placeholder="Tempel tautan URL gambar di sini... (Contoh: https://example.com/asset.jpg)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-white/20"
                />
                <button onClick={() => setShowImageInput(false)} className="text-white/40 hover:text-white"><i className="fas fa-times" /></button>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
              {/* Image attachment toggle */}
              <button
                type="button"
                onClick={() => setShowImageInput(!showImageInput)}
                className={`w-11 h-11 border rounded-xl flex items-center justify-center transition-all ${showImageInput ? 'border-cyberGlow text-cyberGlow bg-cyberGlow/10 shadow-neonBlue' : 'border-white/10 text-white/40 hover:text-white bg-white/5'}`}
              >
                <i className="fas fa-paperclip" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                placeholder={`Ketik pesan digital untuk ${activeConv.character_name}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-white/20 text-white focus:outline-none focus:border-cyberGlow transition-colors"
                disabled={typing || !!streamingText}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || typing || !!streamingText}
                className="w-11 h-11 bg-gradient-to-r from-cyberGlow to-cyberPurple hover:opacity-90 disabled:opacity-30 rounded-xl text-black flex items-center justify-center shadow-neonBlue transition-all shrink-0"
              >
                <i className="fas fa-paper-plane" />
              </button>
            </form>
          </div>
        )}
      </section>

      {/* 3. Right Side: Character Inspector Profile */}
      {activeConv && rightPanelOpen && (
        <aside className="w-80 border-l border-cyberBorder bg-[#070718]/40 p-6 flex flex-col gap-6 hidden lg:flex overflow-y-auto shrink-0 z-10">
          <div className="flex flex-col items-center text-center gap-3">
            <img src={activeConv.character_avatar} alt={activeConv.character_name} className="w-24 h-24 rounded-2xl object-cover border border-cyberBorder shadow-lg shadow-neonBlue/10" />
            <h3 className="font-orbitron font-extrabold text-lg tracking-wider text-white">{activeConv.character_name}</h3>
            <span className="text-[10px] font-orbitron font-bold text-cyberPurple/80 bg-cyberPurple/10 border border-cyberPurple/25 px-3 py-1 rounded-full">
              {activeConv.character_description || 'AI Personality Matrix'}
            </span>
          </div>

          <div className="flex flex-col gap-4 border-t border-white/5 pt-5 text-xs text-white/70 leading-relaxed font-quicksand">
            <div>
              <span className="font-orbitron font-bold text-white/40 block mb-1">PROFIL DIGITAL</span>
              <p>{activeConv.character_description || 'Karakter AI bawaan sistem YOGIRI.AI.'}</p>
            </div>

            {/* Link to memories page */}
            <div className="bg-[#0b0b26]/50 p-4 border border-cyberBorder/30 rounded-xl flex flex-col gap-2.5">
              <span className="font-orbitron font-bold text-cyberGlow block"><i className="fas fa-brain mr-1.5" /> MEMORI AI</span>
              <p className="text-[10px] text-white/40 leading-snug">Karakter ini menyimpan memori khusus berdasarkan ucapan Anda selama obrolan berlangsung.</p>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  // Arahkan ke halaman memori secara global (handled via dashboard tab change)
                  // Butuh trigger event atau trigger dashboard. Untuk kemudahan, biarkan user berpindah ke tab Memory secara manual.
                  alert('Silakan klik tab "Manajer Memori" di sidebar sebelah kiri untuk mengedit memori karakter ini.');
                }}
                className="py-1.5 text-center bg-cyberGlow/10 border border-cyberGlow/20 hover:bg-cyberGlow hover:text-black rounded-lg text-[9px] font-orbitron font-bold text-cyberGlow transition-colors"
              >
                KELOLA MEMORI
              </a>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
