/* ═══════════════════ UTILITAS ═══════════════════ */
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
let soundEnabled=false;
let audioCtx=null;

/* ═══════════════════ SISTEM SUARA ═══════════════════ */
function initAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)()}
function playSound(type){
  if(!soundEnabled||!audioCtx)return;
  try{audioCtx.resume()}catch(e){}
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.connect(g);g.connect(audioCtx.destination);
  const t=audioCtx.currentTime;
  g.gain.setValueAtTime(.08,t);
  switch(type){
    case'happy':o.type='sine';o.frequency.setValueAtTime(523,t);o.frequency.setValueAtTime(659,t+.08);o.frequency.setValueAtTime(784,t+.16);g.gain.exponentialRampToValueAtTime(.001,t+.4);o.start(t);o.stop(t+.4);break;
    case'sad':o.type='sine';o.frequency.setValueAtTime(400,t);o.frequency.exponentialRampToValueAtTime(250,t+.25);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.start(t);o.stop(t+.3);break;
    case'type':o.type='sine';o.frequency.setValueAtTime(880,t);g.gain.setValueAtTime(.03,t);g.gain.exponentialRampToValueAtTime(.001,t+.05);o.start(t);o.stop(t+.05);break;
    case'success':o.type='sine';o.frequency.setValueAtTime(523,t);o.frequency.setValueAtTime(659,t+.1);o.frequency.setValueAtTime(784,t+.2);o.frequency.setValueAtTime(1047,t+.3);g.gain.exponentialRampToValueAtTime(.001,t+.5);o.start(t);o.stop(t+.5);break;
    default:o.type='sine';o.frequency.setValueAtTime(660,t);g.gain.exponentialRampToValueAtTime(.001,t+.15);o.start(t);o.stop(t+.15);
  }
}

/* ═══════════════════ TOAST ═══════════════════ */
function showToast(msg,type='info'){
  const c=$('#toastContainer'),t=document.createElement('div');
  t.className=`toast ${type}`;
  const icons={success:'fa-check-circle',error:'fa-exclamation-circle',info:'fa-info-circle'};
  t.innerHTML=`<i class="fas ${icons[type]||icons.info}"></i><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(()=>{t.classList.add('hide');setTimeout(()=>t.remove(),300)},3000);
}

/* ═══════════════════ LOADING SCREEN ═══════════════════ */
let loadProgress=0;
const loadInterval=setInterval(()=>{
  loadProgress+=Math.random()*18+5;
  if(loadProgress>=100){loadProgress=100;clearInterval(loadInterval);
    setTimeout(()=>{$('#loading').classList.add('hide');setTimeout(initLoginPage,400)},400);
  }
  $('#loaderBar').style.width=loadProgress+'%';
},200);

/* ═══════════════════ SISTEM PARTIKEL ═══════════════════ */
const canvas=$('#particles-canvas'),ctx=canvas.getContext('2d');
let particles=[],mouseX=0,mouseY=0;
function resizeCanvas(){canvas.width=window.innerWidth;canvas.height=window.innerHeight}
window.addEventListener('resize',resizeCanvas);resizeCanvas();

class Particle{
  constructor(){this.reset()}
  reset(){
    this.x=Math.random()*canvas.width;this.y=Math.random()*canvas.height;
    this.vx=(Math.random()-.5)*.4;this.vy=(Math.random()-.5)*.4;
    this.r=Math.random()*1.5+.5;
    this.alpha=Math.random()*.5+.2;
    const colors=['0,229,255','255,45,149','180,77,255'];
    this.color=colors[Math.floor(Math.random()*colors.length)];
  }
  update(){
    this.x+=this.vx;this.y+=this.vy;
    if(this.x<0||this.x>canvas.width)this.vx*=-1;
    if(this.y<0||this.y>canvas.height)this.vy*=-1;
    const dx=this.x-mouseX,dy=this.y-mouseY,dist=Math.hypot(dx,dy);
    if(dist<120){this.x+=dx/dist*.5;this.y+=dy/dist*.5}
  }
  draw(){
    ctx.beginPath();ctx.arc(this.x,this.y,Math.max(.1,this.r),0,Math.PI*2);
    ctx.fillStyle=`rgba(${this.color},${this.alpha})`;ctx.fill();
  }
}
const pCount=Math.min(90,Math.floor(window.innerWidth*.06));
for(let i=0;i<pCount;i++)particles.push(new Particle());

function drawParticles(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p=>{p.update();p.draw()});
  for(let i=0;i<particles.length;i++){
    for(let j=i+1;j<particles.length;j++){
      const dx=particles[i].x-particles[j].x,dy=particles[i].y-particles[j].y;
      const dist=Math.hypot(dx,dy);
      if(dist<130){
        ctx.beginPath();ctx.moveTo(particles[i].x,particles[i].y);
        ctx.lineTo(particles[j].x,particles[j].y);
        ctx.strokeStyle=`rgba(0,229,255,${.08*(1-dist/130)})`;
        ctx.lineWidth=.5;ctx.stroke();
      }
    }
  }
  if(document.getElementById('login-page').style.display!=='none')requestAnimationFrame(drawParticles);
}
drawParticles();

/* ═══════════════════ KONTROL MASKOT ═══════════════════ */
const mascotEl=$('#mascot'),mascotWrap=$('#mascotWrap');
const lPupil=$('#leftPupil'),rPupil=$('#rightPupil');
const lShine=$('#leftShine'),rShine=$('#rightShine');
const lLid=$('#leftEyelid'),rLid=$('#rightEyelid');
const lBrow=$('#leftBrow'),rBrow=$('#rightBrow');
const mouth=$('#mouth');
const lPaw=$('#leftPaw'),rPaw=$('#rightPaw');
const bubble=$('#speechBubble'),sparkleC=$('#sparkleContainer');

let mascotState='idle',activeField=null,emailDeleteCount=0,passDeleteCount=0,blinkTimer=null,speechTimer=null;

/* Ekspresi maskot */
const expressions={
  idle:{mouth:'M90,126 Q100,134 110,126',lBrow:'M62,84 Q78,78 94,84',rBrow:'M106,84 Q122,78 138,84',lPaw:'translate(52,148)',rPaw:'translate(148,148)',lLid:0,rLid:0,blush:.18},
  happy:{mouth:'M84,122 Q100,138 116,122',lBrow:'M62,78 Q78,70 94,78',rBrow:'M106,78 Q122,70 138,78',lPaw:'translate(52,148)',rPaw:'translate(148,148)',lLid:0,rLid:0,blush:.35},
  shy:{mouth:'M92,126 Q100,130 108,126',lBrow:'M62,86 Q78,82 94,86',rBrow:'M106,86 Q122,82 138,86',lPaw:'translate(72,98)',rPaw:'translate(128,98)',lLid:18,rLid:18,blush:.45},
  upset:{mouth:'M88,130 Q100,122 112,130',lBrow:'M62,80 Q78,88 94,84',rBrow:'M106,84 Q122,88 138,80',lPaw:'translate(38,155)',rPaw:'translate(162,155)',lLid:3,rLid:3,blush:.12},
  veryUpset:{mouth:'M85,132 Q100,118 115,132',lBrow:'M64,88 Q78,92 92,90',rBrow:'M108,90 Q122,92 136,88',lPaw:'translate(30,158)',rPaw:'translate(170,158)',lLid:6,rLid:6,blush:.08},
  thumbsUp:{mouth:'M80,120 Q100,142 120,120',lBrow:'M62,76 Q78,68 94,76',rBrow:'M106,76 Q122,68 138,76',lPaw:'translate(52,148)',rPaw:'translate(148,148)',lLid:0,rLid:0,blush:.4},
  blink:{lLid:18,rLid:18}
};

function setExpression(name,duration=0){
  const e=expressions[name];if(!e)return;
  mascotState=name;
  mouth.setAttribute('d',e.mouth);
  lBrow.setAttribute('d',e.lBrow);rBrow.setAttribute('d',e.rBrow);
  lPaw.setAttribute('transform',e.lPaw);rPaw.setAttribute('transform',e.rPaw);
  lLid.setAttribute('ry',e.lLid);rLid.setAttribute('ry',e.rLid);
  $$('.blush').forEach(b=>b.setAttribute('fill',`rgba(255,45,149,${e.blush})`));
  if(duration>0)setTimeout(()=>{if(mascotState===name)setExpression('idle')},duration);
}

function blink(){
  if(activeField==='password')return;
  lLid.setAttribute('ry',18);rLid.setAttribute('ry',18);
  setTimeout(()=>{const e=expressions[mascotState]||expressions.idle;lLid.setAttribute('ry',e.lLid);rLid.setAttribute('ry',e.rLid)},150);
}
function startBlinking(){clearInterval(blinkTimer);blinkTimer=setInterval(blink,2500+Math.random()*2000)}

function showSpeech(text,duration=2500){
  bubble.textContent=text;bubble.classList.add('show');
  clearTimeout(speechTimer);
  speechTimer=setTimeout(()=>bubble.classList.remove('show'),duration);
}
function hideSpeech(){bubble.classList.remove('show')}

function spawnSparkle(x,y,color='var(--accent)'){
  const s=document.createElement('div');s.className='sparkle';
  s.style.cssText=`left:${x}px;top:${y}px;background:${color};box-shadow:0 0 6px ${color}`;
  sparkleC.appendChild(s);setTimeout(()=>s.remove(),800);
}
function spawnSparkles(count=5){
  for(let i=0;i<count;i++){
    setTimeout(()=>{
      const x=60+Math.random()*80,y=20+Math.random()*60;
      const colors=['var(--accent)','var(--accent2)','var(--accent3)','#ffe04a'];
      spawnSparkle(x,y,colors[Math.floor(Math.random()*colors.length)]);
    },i*100);
  }
}

/* Pergerakan mata mengikuti kursor */
function updatePupils(mx,my){
  if(activeField==='password')return;
  const rect=mascotEl.getBoundingClientRect();
  const eyes=[{cx:78,cy:102,pupil:lPupil,shine:lShine},{cx:122,cy:102,pupil:rPupil,shine:rShine}];
  eyes.forEach(eye=>{
    const eyeScreenX=rect.left+(eye.cx/200)*rect.width;
    const eyeScreenY=rect.top+(eye.cy/200)*rect.height;
    const angle=Math.atan2(my-eyeScreenY,mx-eyeScreenX);
    const dist=Math.min(5,Math.hypot(mx-eyeScreenX,my-eyeScreenY)/30);
    const px=eye.cx+Math.cos(angle)*dist;
    const py=eye.cy+Math.sin(angle)*dist;
    eye.pupil.setAttribute('cx',px);eye.pupil.setAttribute('cy',py);
    eye.shine.setAttribute('cx',px+4);eye.shine.setAttribute('cy',py-6);
  });
}

/* Parallax ringan */
function updateParallax(mx,my){
  const cx=window.innerWidth/2,cy=window.innerHeight/2;
  const dx=(mx-cx)/cx,dy=(my-cy)/cy;
  const lc=$('#loginContainer');if(lc)lc.style.transform=`translate(${dx*4}px,${dy*4}px)`;
  $$('.blob').forEach((b,i)=>{const f=(i+1)*.5;b.style.transform=`translate(${dx*f*15}px,${dy*f*15}px)`});
}

/* ═══════════════════ PESAN UNTUK EKSPRESI ═══════════════════ */
const upsetMsgs=['Eh jangan dihapus!','Yakin mau dihapus?','Nuu...','Jangan dong...'];
const veryUpsetMsgs=['Jangan dihapus semua!','Aku sedih nih...','Hiks hiks...','Kenapa dihapus terus?','Aku nangis loh...'];

/* ═══════════════════ EVENT LISTENER LOGIN ═══════════════════ */
const emailInput=$('#emailInput'),passInput=$('#passwordInput');

/* ── EMAIL INPUT ── */
emailInput.addEventListener('focus',()=>{
  activeField='email';emailDeleteCount=0;
  const email=emailInput.value;
  if(email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    setExpression('thumbsUp');showSpeech('Email valid!');
  }else{
    setExpression('happy');showSpeech('Halo! Ketik email-mu ya');
  }
  playSound('type');
});
emailInput.addEventListener('blur',()=>{activeField=null;setExpression('idle');hideSpeech()});

emailInput.addEventListener('input',(e)=>{
  const v=emailInput.value;
  if(e.inputType==='deleteContentBackward'||e.inputType==='deleteContentForward'){
    emailDeleteCount++;
    if(emailDeleteCount>=5){
      setExpression('veryUpset');
      showSpeech(veryUpsetMsgs[Math.floor(Math.random()*veryUpsetMsgs.length)]);
      playSound('sad');
    }else if(emailDeleteCount>=2){
      setExpression('upset');
      showSpeech(upsetMsgs[Math.floor(Math.random()*upsetMsgs.length)]);
      playSound('sad');
    }else{
      setExpression('upset',1200);
      playSound('sad');
    }
    return;
  }
  emailDeleteCount=0;
  if(v.length===0){
    setExpression('idle');hideSpeech();
  }else if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){
    setExpression('thumbsUp');spawnSparkles(4);showSpeech('Email valid!');playSound('happy');
  }else{
    setExpression('happy');playSound('type');
  }
});

/* ── PASSWORD INPUT ── */
passInput.addEventListener('focus',()=>{
  activeField='password';passDeleteCount=0;
  setExpression('shy');showSpeech('Aku tutup mata ya!');
  playSound('type');
});
passInput.addEventListener('blur',()=>{
  activeField=null;passDeleteCount=0;
  setExpression('idle');hideSpeech();
});
passInput.addEventListener('input',(e)=>{
  const v=passInput.value;
  if(e.inputType==='deleteContentBackward'||e.inputType==='deleteContentForward'){
    passDeleteCount++;
    if(passDeleteCount>=5){
      setExpression('veryUpset');
      showSpeech(veryUpsetMsgs[Math.floor(Math.random()*veryUpsetMsgs.length)]);
      playSound('sad');
    }else if(passDeleteCount>=2){
      setExpression('upset');
      showSpeech(upsetMsgs[Math.floor(Math.random()*upsetMsgs.length)]);
      playSound('sad');
    }else{
      setExpression('upset',1200);
      playSound('sad');
    }
    return;
  }
  passDeleteCount=0;
  if(v.length===0){
    setExpression('shy');hideSpeech();
  }else if(v.length>8){
    setExpression('thumbsUp');spawnSparkles(6);showSpeech('Password kuat!');playSound('happy');
  }else{
    setExpression('shy');hideSpeech();
  }
});

/* ═══════════════════ GLOBAL: Kursor & Parallax ═══════════════════ */
document.addEventListener('mousemove',(e)=>{
  mouseX=e.clientX;mouseY=e.clientY;
  const cg=$('#cursor-glow');if(cg){cg.style.left=e.clientX+'px';cg.style.top=e.clientY+'px'}
  updatePupils(e.clientX,e.clientY);
  if($('#login-page').style.display!=='none')updateParallax(e.clientX,e.clientY);
});
document.addEventListener('touchmove',(e)=>{
  if(e.touches.length){const t=e.touches[0];mouseX=t.clientX;mouseY=t.clientY;updatePupils(t.clientX,t.clientY)}
},{passive:true});

/* Sound toggle */
 $('#soundToggle').addEventListener('click',()=>{
  soundEnabled=!soundEnabled;
  const btn=$('#soundToggle');
  btn.classList.toggle('active',soundEnabled);
  btn.innerHTML=soundEnabled?'<i class="fas fa-volume-up"></i>':'<i class="fas fa-volume-mute"></i>';
  if(soundEnabled){initAudio();playSound('happy')}
});

/* ═══════════════════ LOGIN BUTTON ═══════════════════ */
 $('#loginBtn').addEventListener('click',()=>{
  const email=emailInput.value.trim(),pass=passInput.value;
  if(!email){showToast('Masukkan email terlebih dahulu','error');setExpression('upset');showSpeech('Email-nya mana?');return}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showToast('Format email tidak valid','error');setExpression('upset');showSpeech('Email tidak valid!');return}
  if(!pass){showToast('Masukkan password','error');setExpression('upset');showSpeech('Password-nya mana?');return}
  if(pass.length<4){showToast('Password terlalu pendek','error');setExpression('upset');return}
  setExpression('thumbsUp');spawnSparkles(10);showSpeech('Berhasil masuk!');
  playSound('success');
  showToast('Login berhasil!','success');
  setTimeout(()=>transitionToDashboard(email),1000);
});

/* Signup toggle */
let isSignupMode=false;
 $('#signupBtn').addEventListener('click',()=>{
  isSignupMode=!isSignupMode;
  if(isSignupMode){
    $('#formTitle').textContent='Buat Akun Baru';
    $('#formSub').textContent='Daftar ke YOGIRI.AI';
    emailInput.placeholder='Email';
    passInput.placeholder='Buat Password';
    $('#signupBtn').innerHTML='<i class="fas fa-arrow-left"></i> Kembali';
    $('#loginBtn').innerHTML='<i class="fas fa-user-plus"></i> Daftar';
    setExpression('happy');showSpeech('Buat akun baru ya!');
  }else{
    $('#formTitle').textContent='Selamat Datang';
    $('#formSub').textContent='Masuk ke portal YOGIRI.AI';
    emailInput.placeholder='Email';
    passInput.placeholder='Password';
    $('#signupBtn').innerHTML='<i class="fas fa-user-plus"></i> Daftar';
    $('#loginBtn').innerHTML='<i class="fas fa-arrow-right"></i> Masuk';
    setExpression('idle');hideSpeech();
  }
});

/* Forgot password */
 $('#forgotLink').addEventListener('click',(e)=>{
  e.preventDefault();
  const email=emailInput.value.trim();
  if(email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    showToast('Link reset password telah dikirim ke '+email,'success');
    setExpression('happy');showSpeech('Cek email-mu ya!');
  }else{
    showToast('Masukkan email terlebih dahulu untuk reset password','info');
    emailInput.focus();
  }
});

/* ═══════════════════ TRANSISI KE DASHBOARD ═══════════════════ */
function transitionToDashboard(email){
  const lp=$('#login-page');lp.classList.add('hide');
  setTimeout(()=>{
    lp.style.display='none';
    const db=$('#dashboard');db.style.display='flex';
    requestAnimationFrame(()=>db.classList.add('show'));
    const name=email.split('@')[0];
    $('#sidebarName').textContent=name;
    $('#sidebarEmail').textContent=email;
    const initial=name.charAt(0).toUpperCase();
    $('#sidebarAvatar').textContent=initial;
    $('#navbarProfile').textContent=initial;
    loadSection('dashboard');
    showToast(`Selamat datang, ${name}!`,'success');
  },500);
}

/* ═══════════════════ DASHBOARD - SISTEM TEMPLATE ═══════════════════ */
/* ╔═══════════════════════════════════════════════════════════╗
   ║  EDIT BAGIAN INI UNTUK MENAMBAH/MENGUBAH KONTEN         ║
   ║  Cukup tambahkan objek baru di array sections            ║
   ╚═══════════════════════════════════════════════════════════╝ */

const sections=[
  {id:'dashboard',
  name:'Dashboard',
  icon:'fa-gauge-high',
  content:`
    <h2 class="section-title">Dashboard</h2>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(0,229,255,.1);color:var(--accent)"><i class="fas fa-users"></i></div>
        <div class="stat-value">2,847</div>
        <div class="stat-label">Total Pengguna</div>
        <span class="stat-change up"><i class="fas fa-arrow-up"></i> 12.5%</span>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(255,45,149,.1);color:var(--accent2)"><i class="fas fa-bolt"></i></div>
        <div class="stat-value">1,293</div>
        <div class="stat-label">Sesi Aktif</div>
        <span class="stat-change up"><i class="fas fa-arrow-up"></i> 8.2%</span>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(180,77,255,.1);color:var(--accent3)"><i class="fas fa-chart-line"></i></div>
        <div class="stat-value">$45.2K</div>
        <div class="stat-label">Pendapatan</div>
        <span class="stat-change up"><i class="fas fa-arrow-up"></i> 23.1%</span>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(0,230,118,.1);color:#00e676"><i class="fas fa-shield-halved"></i></div>
        <div class="stat-value">99.9%</div>
        <div class="stat-label">Uptime</div>
        <span class="stat-change up"><i class="fas fa-arrow-up"></i> 0.1%</span>
      </div>
    </div>
    <div class="chart-card">
      <div class="chart-placeholder">
        <i class="fas fa-chart-area"></i>
        <p>Area Chart — Tambahkan library chart di sini</p>
      </div>
    </div>
    <div class="activity-card">
      <h3 style="font-size:1rem;font-weight:700;margin-bottom:12px">Aktivitas Terbaru</h3>
      <div class="activity-item"><div class="activity-dot" style="background:var(--accent)"></div><div class="activity-text">Pengguna baru terdaftar dari Jakarta</div><div class="activity-time">2 menit lalu</div></div>
      <div class="activity-item"><div class="activity-dot" style="background:var(--accent2)"></div><div class="activity-text">Pembayaran diterima #INV-2024</div><div class="activity-time">15 menit lalu</div></div>
      <div class="activity-item"><div class="activity-dot" style="background:var(--accent3)"></div><div class="activity-text">Server diperbarui ke v3.2.1</div><div class="activity-time">1 jam lalu</div></div>
      <div class="activity-item"><div class="activity-dot" style="background:#00e676"></div><div class="activity-text">Backup data berhasil</div><div class="activity-time">3 jam lalu</div></div>
    </div>
  `},
  {id:'analytics',
  name:'Analytics',
  icon:'fa-chart-pie',
  content:`
    <h2 class="section-title">Analytics</h2>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(0,229,255,.1);color:var(--accent)"><i class="fas fa-eye"></i></div>
        <div class="stat-value">14.2K</div>
        <div class="stat-label">Page Views</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(255,45,149,.1);color:var(--accent2)"><i class="fas fa-clock"></i></div>
        <div class="stat-value">4m 32s</div>
        <div class="stat-label">Avg. Session</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(180,77,255,.1);color:var(--accent3)"><i class="fas fa-arrow-right-from-bracket"></i></div>
        <div class="stat-value">32.1%</div>
        <div class="stat-label">Bounce Rate</div>
      </div>
    </div>
    <div class="chart-card">
      <div class="chart-placeholder">
        <i class="fas fa-chart-bar"></i>
        <p>Analytics Chart — Tambahkan visualisasi data di sini</p>
      </div>
    </div>
  `},
  {id:'projects',
  name:'Projects',
  icon:'fa-folder-open',
  content:`
    <h2 class="section-title">Projects</h2>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-icon" style="background:rgba(0,229,255,.1);color:var(--accent)"><i class="fas fa-rocket"></i></div><div class="stat-value">8</div><div class="stat-label">Aktif</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(0,230,118,.1);color:#00e676"><i class="fas fa-check-circle"></i></div><div class="stat-value">24</div><div class="stat-label">Selesai</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(255,45,149,.1);color:var(--accent2)"><i class="fas fa-pause-circle"></i></div><div class="stat-value">3</div><div class="stat-label">Ditunda</div></div>
    </div>
    <div class="chart-card"><div class="chart-placeholder"><i class="fas fa-tasks"></i><p>Project Board — Tambahkan kanban/task board di sini</p></div></div>
  `},
  {id:'messages',
  name:'Messages',
  icon:'fa-envelope',
  content:`
    <h2 class="section-title">Messages</h2>
    <div class="activity-card">
      <h3 style="font-size:1rem;font-weight:700;margin-bottom:12px">Kotak Masuk</h3>
      <div class="activity-item"><div class="activity-dot" style="background:var(--accent)"></div><div class="activity-text">Anda memiliki pesan baru dari Tim Desain</div><div class="activity-time">5 menit lalu</div></div>
      <div class="activity-item"><div class="activity-dot" style="background:var(--accent3)"></div><div class="activity-text">Meeting jadwal ulang jam 15:00</div><div class="activity-time">1 jam lalu</div></div>
      <div class="activity-item"><div class="activity-dot" style="background:var(--accent2)"></div><div class="activity-text">Invoice #2024 memerlukan persetujuan</div><div class="activity-time">3 jam lalu</div></div>
    </div>
  `},
  {id:'settings',
  name:'Settings',
  icon:'fa-gear',
  content:`
    <h2 class="section-title">Settings</h2>
    <div class="chart-card"><div class="chart-placeholder"><i class="fas fa-sliders"></i><p>Pengaturan Akun — Tambahkan form pengaturan di sini</p></div></div>
  `},

  /* ═══════════════════ BAGIAN FAKHRI ═══════════════════ */
  {id:'catatan',
  name:'Catatan',
  icon:'fa-book',
  content:`
    <h2 class="section-title">Catatan Saya</h2>
    <p>Ini halaman catatan pertamaku</p>
    <p style="color:var(--accent)">ini teks biru neon</p>
    <p style="color:var(--accent2)">Ini teks pink</p>
    <p>Bagian Atas</p>
    <hr style="border-color:var(--border);margin:16px 0">
    <p>Bagian bawah</p>
  `},

  {id:'tentang',
  name:'Tentang',
  icon:'fa-circle-info',
  content:`
    <h2 class="section-title">Tentang Saya</h2>
    <div class="chart-card" style="min-height:auto;padding:24px;">
      <p>Halo, aku adalah pembuat YOGIRI.AI. Ini halaman pertamaku!</p>
    </div>
  `},

  {id:'statistik',
  name:'Statistik',
  icon:'fa-chart-simple',
  content:`
    <h2 class="section-title">Statistik</h2>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">100</div>
        <div class="stat-label">Pengikut</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">50</div>
        <div class="stat-label">Postingan</div>
      </div>
    </div>
  `}
];

/* Render sidebar nav */
function renderSidebarNav(){
  const nav=$('#sidebarNav');nav.innerHTML='';
  sections.forEach((s,i)=>{
    const item=document.createElement('div');
    item.className='nav-item'+(i===0?' active':'');
    item.dataset.section=s.id;
    item.innerHTML=`<i class="fas ${s.icon}"></i><span>${s.name}</span>`;
    item.addEventListener('click',()=>loadSection(s.id));
    nav.appendChild(item);
  });
}
renderSidebarNav();

/* Load section content */
function loadSection(id){
  const s=sections.find(s=>s.id===id);if(!s)return;
  $$('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.section===id));
  const area=$('#contentArea');
  area.innerHTML=`<div class="content-section active">${s.content}</div>`;
  $('#sidebar').classList.remove('open');$('#sidebarOverlay').classList.remove('show');
}

/* Hamburger menu mobile */
 $('#hamburger').addEventListener('click',()=>{
  $('#sidebar').classList.toggle('open');$('#sidebarOverlay').classList.toggle('show');
});
 $('#sidebarOverlay').addEventListener('click',()=>{
  $('#sidebar').classList.remove('open');$('#sidebarOverlay').classList.remove('show');
});

/* Logout */
 $('#logoutBtn').addEventListener('click',()=>{
  const db=$('#dashboard');db.classList.remove('show');
  setTimeout(()=>{
    db.style.display='none';
    const lp=$('#login-page');lp.style.display='flex';
    requestAnimationFrame(()=>lp.classList.remove('hide'));
    emailInput.value='';passInput.value='';
    emailDeleteCount=0;passDeleteCount=0;
    isSignupMode=false;
    $('#formTitle').textContent='Selamat Datang';
    $('#formSub').textContent='Masuk ke portal YOGIRI.AI';
    $('#signupBtn').innerHTML='<i class="fas fa-user-plus"></i> Daftar';
    $('#loginBtn').innerHTML='<i class="fas fa-arrow-right"></i> Masuk';
    setExpression('idle');hideSpeech();startBlinking();
    drawParticles();
    showToast('Berhasil keluar','info');
  },500);
});

/* ═══════════════════ INIT LOGIN PAGE ═══════════════════ */
function initLoginPage(){
  setExpression('idle');
  startBlinking();
}

/* ═══════════════════ KEYBOARD ACCESSIBILITY ═══════════════════ */
document.addEventListener('keydown',(e)=>{
  if(e.key==='Enter'&&!$('#login-page').classList.contains('hide')){
    $('#loginBtn').click();
  }
});