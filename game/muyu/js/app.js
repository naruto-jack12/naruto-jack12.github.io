const AudioCtx = window.AudioContext || window.webkitAudioContext;
let ctx;

function initAudio() { if (!ctx) ctx = new AudioCtx(); }

function playHit() {
  initAudio();
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime, sr = ctx.sampleRate;

  // Attack
  const nLen = 0.025;
  const nBuf = ctx.createBuffer(1, Math.ceil(sr * nLen), sr);
  const n = nBuf.getChannelData(0);
  for (let i = 0; i < n.length; i++) n[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.002));
  const nSrc = ctx.createBufferSource(); nSrc.buffer = nBuf;
  const nBP = ctx.createBiquadFilter();
  nBP.type = 'bandpass'; nBP.frequency.value = 2800; nBP.Q.value = 4;
  const nG = ctx.createGain();
  nG.gain.setValueAtTime(0.18, t); nG.gain.exponentialRampToValueAtTime(0.001, t + 0.018);
  nSrc.connect(nBP); nBP.connect(nG); nG.connect(ctx.destination);
  nSrc.start(t); nSrc.stop(t + nLen);

  // Partials
  [[465,0.45,0.32],[610,0.28,0.24],[755,0.18,0.16],[920,0.12,0.11],[1100,0.07,0.08],[1300,0.04,0.05]]
    .forEach(([f,g,d]) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const og = ctx.createGain();
      og.gain.setValueAtTime(g, t+0.004); og.gain.exponentialRampToValueAtTime(0.001, t+d);
      o.connect(og); og.connect(ctx.destination); o.start(t+0.004); o.stop(t+d+0.01);
    });

  // Warmth
  const w = ctx.createOscillator(); w.type = 'sawtooth'; w.frequency.value = 465;
  const wG = ctx.createGain();
  wG.gain.setValueAtTime(0.07, t+0.005); wG.gain.exponentialRampToValueAtTime(0.001, t+0.12);
  const wLP = ctx.createBiquadFilter(); wLP.type = 'lowpass'; wLP.frequency.value = 900;
  w.connect(wLP); wLP.connect(wG); wG.connect(ctx.destination);
  w.start(t+0.005); w.stop(t+0.14);

  // Resonance
  const r = ctx.createOscillator(); r.type = 'sine'; r.frequency.value = 460;
  const rG = ctx.createGain();
  rG.gain.setValueAtTime(0.18, t+0.005); rG.gain.exponentialRampToValueAtTime(0.001, t+0.38);
  const rBP = ctx.createBiquadFilter(); rBP.type = 'bandpass'; rBP.frequency.value = 465; rBP.Q.value = 6;
  r.connect(rBP); rBP.connect(rG); rG.connect(ctx.destination);
  r.start(t+0.005); r.stop(t+0.4);

  // Tail
  const rvLen = 0.12;
  const rvBuf = ctx.createBuffer(1, Math.ceil(sr*rvLen), sr);
  const rv = rvBuf.getChannelData(0);
  for (let i = 0; i < rv.length; i++) rv[i] = (Math.random()*2-1) * Math.exp(-i/(sr*0.04));
  const rvSrc = ctx.createBufferSource(); rvSrc.buffer = rvBuf;
  const rvG = ctx.createGain();
  rvG.gain.setValueAtTime(0.05, t+0.025); rvG.gain.exponentialRampToValueAtTime(0.001, t+0.18);
  const rvLP = ctx.createBiquadFilter(); rvLP.type = 'lowpass'; rvLP.frequency.value = 1100;
  rvSrc.connect(rvLP); rvLP.connect(rvG); rvG.connect(ctx.destination);
  rvSrc.start(t+0.025); rvSrc.stop(t+rvLen+0.025);
}

// State
let count = 0, total = 0, combo = 0, lastTap = 0, autoInt = null, isAuto = false, tapTimes = [];
let rank = 0;

const $ = id => document.getElementById(id);
const el = {
  count: $('count'), combo: $('combo'), total: $('total'),
  rank: $('rankBadge'), wrap: $('muyuWrap'), svg: $('muyuSvg'),
  glow: $('hitGlow'), autoBtn: $('autoBtn'), resetBtn: $('resetBtn'),
  themeBtn: $('themeBtn'), mallet: $('malletSvg')
};

const msgs = ['功德 +1','🙏 善哉','✨ 福报','☸ 功德无量','🌸 欢喜','🧘 禅定','⭐ 积善','🪷 清净'];
const ranks = [
  { min: 0, text: '— 心诚则灵 —' },
  { min: 5, text: '— 小有成就 —' },
  { min: 20, text: '— 修行中人 —' },
  { min: 50, text: '— 大德高僧 —' },
  { min: 100, text: '— 功德圆满 —' },
  { min: 500, text: '— 功德无量 —' },
];

function getRank() {
  let r = ranks[0];
  for (const x of ranks) if (count >= x.min) r = x;
  return r;
}

function updateUI() {
  el.count.textContent = count;
  el.combo.textContent = combo;
  el.total.textContent = total;
  const r = getRank();
  if (r.min !== rank) {
    rank = r.min;
    el.rank.textContent = r.text;
    el.rank.style.transition = 'none';
    el.rank.style.opacity = '0';
    setTimeout(() => {
      el.rank.style.transition = 'opacity 0.4s';
      el.rank.style.opacity = '1';
    }, 50);
  }
  const now = Date.now();
  tapTimes = tapTimes.filter(t => now - t < 2000);
  document.getElementById('speed').textContent = tapTimes.length;
}

function tap() {
  const now = Date.now();
  combo = now - lastTap < 600 ? combo + 1 : 1;
  lastTap = now;
  tapTimes.push(now);
  count++; total++;
  updateUI();
  playHit();

  el.svg.classList.remove('shake');
  void el.svg.offsetWidth;
  el.svg.classList.add('shake');

  el.mallet.classList.remove('hit');
  void el.mallet.offsetWidth;
  el.mallet.classList.add('hit');
  setTimeout(() => el.mallet.classList.remove('hit'), 100);

  el.glow.classList.remove('active');
  void el.glow.offsetWidth;
  el.glow.classList.add('active');
  setTimeout(() => el.glow.classList.remove('active'), 350);

  const ft = document.createElement('div');
  ft.className = 'floating-text';
  ft.textContent = msgs[Math.floor(Math.random() * msgs.length)];
  const r = el.wrap.getBoundingClientRect();
  ft.style.left = (r.left + r.width / 2 - 40 + Math.random() * 80) + 'px';
  ft.style.top = (r.top + 20) + 'px';
  document.body.appendChild(ft);
  setTimeout(() => ft.remove(), 1000);
}

// Theme
let isDark = true;

function toggleTheme() {
  isDark = !isDark;
  const t = isDark ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
  el.themeBtn.textContent = isDark ? '🌙' : '☀️';
  localStorage.setItem('muyu-theme', t);
}

function loadTheme() {
  const saved = localStorage.getItem('muyu-theme');
  if (saved === 'light') {
    isDark = false;
    document.documentElement.setAttribute('data-theme', 'light');
    el.themeBtn.textContent = '☀️';
  }
}

function resetAll() {
  count = 0; total = 0; combo = 0; lastTap = 0; tapTimes = [];
  if (isAuto) { clearInterval(autoInt); isAuto = false; el.autoBtn.textContent = '⏣ 自动功德'; el.autoBtn.classList.remove('running'); }
  updateUI();
}

// Events
el.wrap.addEventListener('click', tap);
document.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); tap(); }
});

el.autoBtn.addEventListener('click', () => {
  isAuto = !isAuto;
  if (isAuto) {
    el.autoBtn.textContent = '⏹ 停止';
    el.autoBtn.classList.add('running');
    let i = 0;
    autoInt = setInterval(() => { tap(); if (++i >= 500) { clearInterval(autoInt); el.autoBtn.textContent = '⏣ 自动功德'; el.autoBtn.classList.remove('running'); isAuto = false; } }, 80);
  } else {
    clearInterval(autoInt);
    el.autoBtn.textContent = '⏣ 自动功德';
    el.autoBtn.classList.remove('running');
    autoInt = null;
  }
});

el.resetBtn.addEventListener('click', resetAll);
el.themeBtn.addEventListener('click', toggleTheme);

// Init
loadTheme();
updateUI();
