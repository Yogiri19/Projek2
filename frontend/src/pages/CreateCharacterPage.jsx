import React, { useState } from 'react';

const categories = ['Anime', 'Game', 'Fantasy', 'Assistant', 'Tutor', 'Roleplay', 'Coding', 'Custom'];

export default function CreateCharacterPage({ onCreated }) {
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [description, setDescription] = useState('');
  const [greeting, setGreeting] = useState('');
  const [personality, setPersonality] = useState('');
  const [exampleDialogues, setExampleDialogues] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [category, setCategory] = useState('Anime');
  const [tags, setTags] = useState('');

  // Advanced Sliders
  const [temperature, setTemperature] = useState(0.8);
  const [topP, setTopP] = useState(0.9);
  const [maxTokens, setMaxTokens] = useState(500);
  const [memoryLength, setMemoryLength] = useState(10);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Generate random avatar via DiceBear
  const generateRandomAvatar = () => {
    if (!name) {
      setErrorMsg('Tulis nama karakter terlebih dahulu untuk membuat avatar acak.');
      return;
    }
    setErrorMsg('');
    const randomSeed = Math.random().toString(36).substring(7);
    const styles = ['bottts', 'adventurer', 'avataaars', 'pixel-art'];
    const chosenStyle = styles[Math.floor(Math.random() * styles.length)];
    setAvatarUrl(`https://api.dicebear.com/7.x/${chosenStyle}/svg?seed=${name}_${randomSeed}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !greeting) {
      setErrorMsg('Nama karakter dan greeting pembuka wajib diisi.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('yogiri_token')}`
        },
        body: JSON.stringify({
          name,
          avatar_url: avatarUrl,
          description,
          greeting,
          personality,
          example_dialogues: exampleDialogues,
          system_prompt: systemPrompt,
          visibility,
          temperature,
          top_p: topP,
          max_tokens: maxTokens,
          memory_length: memoryLength,
          category,
          tags
        })
      });

      const data = await res.json();
      if (res.ok) {
        onCreated();
      } else {
        setErrorMsg(data.message || 'Gagal menyimpan karakter.');
      }
    } catch (e) {
      setErrorMsg('Koneksi server gagal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="font-orbitron font-extrabold text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyberGlow to-cyberPurple">
          STUDIO PEMBUAT KARAKTER AI
        </h2>
        <p className="text-white/40 text-sm mt-1">
          Rakit kode kepribadian baru, suntikkan system prompt khusus, dan konfigurasikan visibilitasnya.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-cyberPink/10 border border-cyberPink/30 text-cyberPink rounded-xl text-sm font-semibold flex items-center gap-3">
          <i className="fas fa-exclamation-circle" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
        {/* Core fields card */}
        <div className="glass-panel p-6 rounded-2xl border border-cyberBorder flex flex-col md:grid md:grid-cols-3 gap-6">
          
          {/* Left: Avatar Column */}
          <div className="flex flex-col items-center gap-4">
            <label className="font-orbitron font-bold text-xs text-white/50">PREVIEW AVATAR</label>
            <div className="w-32 h-32 rounded-2xl bg-[#0b0b23] border border-cyberBorder flex items-center justify-center overflow-hidden relative group">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <i className="fas fa-user-robot text-white/20 text-4xl" />
              )}
            </div>
            <button
              type="button"
              onClick={generateRandomAvatar}
              className="py-2 px-4 rounded-xl border border-cyberGlow/30 hover:border-cyberGlow hover:bg-cyberGlow/5 text-cyberGlow text-xs font-orbitron font-bold transition-all"
            >
              GENERATE ACAK
            </button>
            <input
              type="text"
              placeholder="Atau masukkan URL Avatar"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full text-center py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyberGlow text-xs placeholder-white/20"
            />
          </div>

          {/* Right: Info Columns */}
          <div className="md:col-span-2 flex flex-col gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="font-orbitron font-bold text-xs text-white/50">NAMA KARAKTER <span className="text-cyberPink">*</span></label>
              <input
                type="text"
                placeholder="Contoh: Shizuku, Albert, dll."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyberGlow text-sm"
                required
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="font-orbitron font-bold text-xs text-white/50">DESKRIPSI SINGKAT</label>
              <input
                type="text"
                placeholder="Contoh: Gadis pemalu pecinta pemrograman kopi."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyberGlow text-sm"
              />
            </div>

            {/* Category, Visibility & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-orbitron font-bold text-xs text-white/50">KATEGORI</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0b0b23] border border-white/10 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-cyberGlow font-orbitron"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-orbitron font-bold text-xs text-white/50">VISIBILITAS</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full bg-[#0b0b23] border border-white/10 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-cyberGlow font-orbitron"
                >
                  <option value="public">Publik (Public)</option>
                  <option value="private">Pribadi (Private)</option>
                  <option value="unlisted">Tersembunyi (Unlisted)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-orbitron font-bold text-xs text-white/50">TAGS (PISAH DENGAN KOMA)</label>
                <input
                  type="text"
                  placeholder="anime, coding, study"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyberGlow text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Personality, Dialogue, Prompts card */}
        <div className="glass-panel p-6 rounded-2xl border border-cyberBorder flex flex-col gap-4">
          {/* Greeting */}
          <div className="flex flex-col gap-1.5">
            <label className="font-orbitron font-bold text-xs text-white/50">SALAM PEMBUKA (GREETING MESSAGE) <span className="text-cyberPink">*</span></label>
            <textarea
              rows={3}
              placeholder="Pesan pertama yang diucapkan karakter saat obrolan baru dimulai. Contoh: 'Halo, saya Albert. Apa yang kita pelajari hari ini?'"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyberGlow text-sm resize-none"
              required
            />
          </div>

          {/* Personality description */}
          <div className="flex flex-col gap-1.5">
            <label className="font-orbitron font-bold text-xs text-white/50">PERSONALITI (PERSONALITY DESCRIPTION)</label>
            <textarea
              rows={3}
              placeholder="Jelaskan karakteristik kepribadian secara spesifik. Contoh: 'Suka bercanda, cerdas, suka menggunakan analogi fiksi ilmiah.'"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyberGlow text-sm resize-none"
            />
          </div>

          {/* Example Dialogues */}
          <div className="flex flex-col gap-1.5">
            <label className="font-orbitron font-bold text-xs text-white/50">DIALOG CONTOH (EXAMPLE DIALOGUES)</label>
            <textarea
              rows={4}
              placeholder="Tulis contoh alur percakapan agar AI meniru gaya bicaranya. Format:
User: Halo Albert!
Albert: Selamat datang, pengembara sains! Ada teori relativitas baru?"
              value={exampleDialogues}
              onChange={(e) => setExampleDialogues(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyberGlow text-sm font-mono resize-none"
            />
          </div>

          {/* System prompt override */}
          <div className="flex flex-col gap-1.5">
            <label className="font-orbitron font-bold text-xs text-white/50">PROMPT UTAMA SISTEM (SYSTEM PROMPT OVERRIDE)</label>
            <textarea
              rows={4}
              placeholder="Suntikkan instruksi khusus di bawah naungan arsitektur model AI. Contoh: 'Berbicaralah secara formal layaknya profesor fisika legendaris. Jangan gunakan emotikon berlebih.'"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyberGlow text-sm resize-none"
            />
          </div>
        </div>

        {/* Advanced tuning parameters Toggle */}
        <div className="glass-panel rounded-2xl border border-cyberBorder overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-6 py-4 flex items-center justify-between font-orbitron font-bold text-xs hover:bg-white/5 transition-colors"
          >
            <span>PENGATURAN MODEL LANJUTAN (ADVANCED SETTINGS)</span>
            <i className={`fas fa-chevron-${showAdvanced ? 'up' : 'down'} text-cyberGlow`} />
          </button>

          {showAdvanced && (
            <div className="px-6 pb-6 pt-2 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#03030f]/40">
              {/* Temperature */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between font-orbitron text-xs">
                  <span className="text-white/50">TEMPERATURE (KREATIFITAS):</span>
                  <span className="text-cyberGlow font-bold">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyberGlow"
                />
                <span className="text-[10px] text-white/20">Nilai rendah membuat jawaban konsisten/faktual, nilai tinggi membuatnya lebih kreatif/bervariasi.</span>
              </div>

              {/* Top P */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between font-orbitron text-xs">
                  <span className="text-white/50">TOP P (NUKLEUS SAMPLING):</span>
                  <span className="text-cyberPurple font-bold">{topP}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyberPurple"
                />
                <span className="text-[10px] text-white/20">Membatasi keanekaragaman kosakata. Standar: 0.9.</span>
              </div>

              {/* Max Tokens */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between font-orbitron text-xs">
                  <span className="text-white/50">MAX OUTPUT TOKENS:</span>
                  <span className="text-cyberPink font-bold">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="50"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyberPink"
                />
                <span className="text-[10px] text-white/20">Panjang teks maksimum jawaban AI per obrolan.</span>
              </div>

              {/* Memory Length */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between font-orbitron text-xs">
                  <span className="text-white/50">BATAS UKURAN MEMORI (CHAT HISTORY):</span>
                  <span className="text-cyberGlow font-bold">{memoryLength} putaran</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  step="2"
                  value={memoryLength}
                  onChange={(e) => setMemoryLength(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyberGlow"
                />
                <span className="text-[10px] text-white/20">Berapa banyak pesan obrolan sebelumnya yang disertakan ke memori jangka pendek AI.</span>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4 items-center">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3.5 bg-gradient-to-r from-cyberGlow to-cyberPurple text-black font-orbitron font-bold text-sm rounded-xl shadow-neonBlue/20 hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {submitting ? (
              <span><i className="fas fa-spinner animate-spin mr-2" /> MERAKIT KODE KEPRIBADIAN...</span>
            ) : (
              <span><i className="fas fa-save mr-2" /> SAVE & TERBITKAN KARAKTER</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
