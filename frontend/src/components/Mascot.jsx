import React, { useState, useEffect, useRef } from 'react';

const expressions = {
  idle: { mouth: 'M90,126 Q100,134 110,126', lBrow: 'M62,84 Q78,78 94,84', rBrow: 'M106,84 Q122,78 138,84', lPaw: 'translate(52,148)', rPaw: 'translate(148,148)', lLid: 0, rLid: 0, blush: 0.18 },
  happy: { mouth: 'M84,122 Q100,138 116,122', lBrow: 'M62,78 Q78,70 94,78', rBrow: 'M106,78 Q122,70 138,78', lPaw: 'translate(52,148)', rPaw: 'translate(148,148)', lLid: 0, rLid: 0, blush: 0.35 },
  shy: { mouth: 'M92,126 Q100,130 108,126', lBrow: 'M62,86 Q78,82 94,86', rBrow: 'M106,86 Q122,82 138,86', lPaw: 'translate(72,98)', rPaw: 'translate(128,98)', lLid: 18, rLid: 18, blush: 0.45 },
  upset: { mouth: 'M88,130 Q100,122 112,130', lBrow: 'M62,80 Q78,88 94,84', rBrow: 'M106,84 Q122,88 138,80', lPaw: 'translate(38,155)', rPaw: 'translate(162,155)', lLid: 3, rLid: 3, blush: 0.12 },
  veryUpset: { mouth: 'M85,132 Q100,118 115,132', lBrow: 'M64,88 Q78,92 92,90', rBrow: 'M108,90 Q122,92 136,88', lPaw: 'translate(30,158)', rPaw: 'translate(170,158)', lLid: 6, rLid: 6, blush: 0.08 },
  thumbsUp: { mouth: 'M80,120 Q100,142 120,120', lBrow: 'M62,76 Q78,68 94,76', rBrow: 'M106,76 Q122,68 138,76', lPaw: 'translate(52,148)', rPaw: 'translate(148,148)', lLid: 0, rLid: 0, blush: 0.4 }
};

export default function Mascot({ activeState = 'idle', speechText = '', soundEnabled = false }) {
  const [state, setState] = useState(activeState);
  const [speech, setSpeech] = useState(speechText);
  const [showSpeech, setShowSpeech] = useState(false);
  const [sparkles, setSparkles] = useState([]);
  
  const audioCtxRef = useRef(null);
  const mascotSvgRef = useRef(null);

  // Pupil DOM Refs for high-performance direct DOM manipulation (No re-renders!)
  const leftPupilRef = useRef(null);
  const leftShineRef = useRef(null);
  const rightPupilRef = useRef(null);
  const rightShineRef = useRef(null);

  // Blink state (React state still handles this as it is low-frequency: once every few seconds)
  const [blinking, setBlinking] = useState(false);

  // Sync state & speech props
  useEffect(() => {
    setState(activeState);
    if (activeState === 'happy' || activeState === 'thumbsUp') {
      spawnSparkles();
    }
  }, [activeState]);

  useEffect(() => {
    if (speechText) {
      setSpeech(speechText);
      setShowSpeech(true);
      const timer = setTimeout(() => setShowSpeech(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowSpeech(false);
    }
  }, [speechText]);

  // Audio synthesizers (Web Audio API)
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  const playSound = (type) => {
    if (!soundEnabled) return;
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) {}

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.06, t);

    switch (type) {
      case 'happy':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, t); // C5
        osc.frequency.setValueAtTime(659, t + 0.08); // E5
        osc.frequency.setValueAtTime(784, t + 0.16); // G5
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.start(t);
        osc.stop(t + 0.4);
        break;
      case 'sad':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(250, t + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
        break;
      case 'type':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        gain.gain.setValueAtTime(0.02, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.start(t);
        osc.stop(t + 0.05);
        break;
      case 'success':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, t);
        osc.frequency.setValueAtTime(659, t + 0.1);
        osc.frequency.setValueAtTime(784, t + 0.2);
        osc.frequency.setValueAtTime(1047, t + 0.3); // C6
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.start(t);
        osc.stop(t + 0.5);
        break;
      default:
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
    }
  };

  // Play sound when state changes
  useEffect(() => {
    if (state === 'happy' || state === 'thumbsUp') playSound('happy');
    if (state === 'upset' || state === 'veryUpset') playSound('sad');
  }, [state]);

  // Handle blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (state === 'shy') return;
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, [state]);

  // Track cursor globally via high-performance DOM manipulation
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (state === 'shy') return;
      if (!mascotSvgRef.current) return;

      const rect = mascotSvgRef.current.getBoundingClientRect();
      const mx = e.clientX;
      const my = e.clientY;

      const updateEyeRef = (eyeX, eyeY, pupilRef, shineRef) => {
        if (!pupilRef.current || !shineRef.current) return;
        const screenX = rect.left + (eyeX / 200) * rect.width;
        const screenY = rect.top + (eyeY / 200) * rect.height;
        const angle = Math.atan2(my - screenY, mx - screenX);
        const dist = Math.min(5, Math.hypot(mx - screenX, my - screenY) / 35);
        
        const px = eyeX + Math.cos(angle) * dist;
        const py = eyeY + Math.sin(angle) * dist;
        
        pupilRef.current.setAttribute('cx', px);
        pupilRef.current.setAttribute('cy', py);
        shineRef.current.setAttribute('cx', px + 4);
        shineRef.current.setAttribute('cy', py - 6);
      };

      updateEyeRef(78, 102, leftPupilRef, leftShineRef);
      updateEyeRef(122, 102, rightPupilRef, rightShineRef);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [state]);

  // Reset eye positions to center when mascot state becomes shy
  useEffect(() => {
    if (state === 'shy') {
      if (leftPupilRef.current && leftShineRef.current && rightPupilRef.current && rightShineRef.current) {
        leftPupilRef.current.setAttribute('cx', 78);
        leftPupilRef.current.setAttribute('cy', 102);
        leftShineRef.current.setAttribute('cx', 82);
        leftShineRef.current.setAttribute('cy', 96);
        rightPupilRef.current.setAttribute('cx', 122);
        rightPupilRef.current.setAttribute('cy', 102);
        rightShineRef.current.setAttribute('cx', 126);
        rightShineRef.current.setAttribute('cy', 96);
      }
    }
  }, [state]);

  // Helper for sparkling explosion
  const spawnSparkles = () => {
    const newSparkles = Array.from({ length: 6 }).map((_, i) => {
      const angle = (i / 6) * Math.PI * 2;
      const dist = 30 + Math.random() * 20;
      return {
        id: Math.random(),
        dx: `${Math.cos(angle) * dist}px`,
        dy: `${Math.sin(angle) * dist}px`,
        x: 60 + Math.random() * 80,
        y: 30 + Math.random() * 40,
        color: ['#00e5ff', '#ff2d95', '#b44dff', '#ffe04a'][Math.floor(Math.random() * 4)]
      };
    });
    setSparkles(newSparkles);
    setTimeout(() => setSparkles([]), 800);
  };

  const exp = expressions[state] || expressions.idle;

  // Decide Eyelid radius (Blink / Shy / Upset)
  let lidRy = exp.lLid;
  if (blinking) lidRy = 18;
  else if (state === 'shy') lidRy = 18;

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[200px] relative">
      {/* Speech bubble */}
      <div className={`speech-bubble absolute -top-12 z-20 transition-all ${showSpeech ? 'show' : ''}`}>
        {speech}
      </div>

      {/* Sparkles Container */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {sparkles.map(s => (
          <div
            key={s.id}
            className="sparkle"
            style={{
              left: `${s.x}px`,
              top: `${s.y}px`,
              backgroundColor: s.color,
              boxShadow: `0 0 6px ${s.color}`,
              '--dx': s.dx,
              '--dy': s.dy
            }}
          />
        ))}
      </div>

      {/* SVG Mascot */}
      <svg
        ref={mascotSvgRef}
        id="mascot"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-[0_0_15px_rgba(0,229,255,0.15)]"
      >
        <defs>
          <filter id="glowF">
            <feGaussianBlur stdDeviation="2.5" result="g" />
            <feMerge>
              <feMergeNode in="g" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="headGrad" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#1e1e3a" />
            <stop offset="100%" stopColor="#111128" />
          </radialGradient>
        </defs>

        {/* Antenna */}
        <line x1="100" y1="52" x2="100" y2="30" stroke="rgba(0,229,255,.4)" strokeWidth="2" />
        <circle cx="100" cy="26" r="5" fill="rgba(0,229,255,.6)" filter="url(#glowF)">
          <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values=".6;1;.6" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* Ears */}
        <polygon points="52,72 38,26 76,56" fill="url(#headGrad)" stroke="rgba(0,229,255,.25)" strokeWidth="1.5" />
        <polygon points="54,68 44,34 72,56" fill="rgba(255,45,149,.25)" />
        
        <polygon points="148,72 162,26 124,56" fill="url(#headGrad)" stroke="rgba(0,229,255,.25)" strokeWidth="1.5" />
        <polygon points="146,68 156,34 128,56" fill="rgba(255,45,149,.25)" />

        {/* Head */}
        <circle cx="100" cy="108" r="60" fill="url(#headGrad)" stroke="rgba(0,229,255,.2)" strokeWidth="1.5" />

        {/* Left Eye background */}
        <ellipse cx="78" cy="102" rx="16" ry="18" fill="#e8e8f0" />
        {/* Left Pupil (Direct Ref) */}
        <circle ref={leftPupilRef} cx="78" cy="102" r="8" fill="#0a0a0f" />
        <circle ref={leftShineRef} cx="82" cy="96" r="3" fill="#fff" opacity=".85" />
        {/* Left Eyelid */}
        <ellipse cx="78" cy="102" rx="17" ry={lidRy} fill="#1a1a30" />

        {/* Right Eye background */}
        <ellipse cx="122" cy="102" rx="16" ry="18" fill="#e8e8f0" />
        {/* Right Pupil (Direct Ref) */}
        <circle ref={rightPupilRef} cx="122" cy="102" r="8" fill="#0a0a0f" />
        <circle ref={rightShineRef} cx="126" cy="96" r="3" fill="#fff" opacity=".85" />
        {/* Right Eyelid */}
        <ellipse cx="122" cy="102" rx="17" ry={lidRy} fill="#1a1a30" />

        {/* Eyebrows */}
        <path d={exp.lBrow} fill="none" stroke="#c8c8e0" strokeWidth="2.5" strokeLinecap="round" />
        <path d={exp.rBrow} fill="none" stroke="#c8c8e0" strokeWidth="2.5" strokeLinecap="round" />

        {/* Nose */}
        <path d="M97,115 L100,119 L103,115" fill="rgba(255,45,149,.6)" />

        {/* Mouth */}
        <path d={exp.mouth} fill="none" stroke="#c8c8e0" strokeWidth="2.5" strokeLinecap="round" />

        {/* Blush cheeks */}
        <ellipse cx="62" cy="114" rx="9" ry="5" fill={`rgba(255,45,149,${exp.blush})`} />
        <ellipse cx="138" cy="114" rx="9" ry="5" fill={`rgba(255,45,149,${exp.blush})`} />

        {/* Paws */}
        <g transform={exp.lPaw} className="transition-transform duration-300">
          <ellipse cx="0" cy="0" rx="16" ry="11" fill="#15152a" stroke="rgba(0,229,255,.2)" strokeWidth="1.5" />
          <circle cx="-5" cy="-2" r="3" fill="rgba(255,45,149,.3)" />
          <circle cx="5" cy="-2" r="3" fill="rgba(255,45,149,.3)" />
          <circle cx="0" cy="3" r="2.5" fill="rgba(255,45,149,.3)" />
        </g>
        <g transform={exp.rPaw} className="transition-transform duration-300">
          <ellipse cx="0" cy="0" rx="16" ry="11" fill="#15152a" stroke="rgba(0,229,255,.2)" strokeWidth="1.5" />
          <circle cx="-5" cy="-2" r="3" fill="rgba(255,45,149,.3)" />
          <circle cx="5" cy="-2" r="3" fill="rgba(255,45,149,.3)" />
          <circle cx="0" cy="3" r="2.5" fill="rgba(255,45,149,.3)" />
        </g>
      </svg>
    </div>
  );
}
