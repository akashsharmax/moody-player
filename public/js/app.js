/* ═══════════════════════════════════════════════
   Moody Player — Frontend App
   face-api.js emotion detection + backend API
═══════════════════════════════════════════════ */

const API_BASE = '/api';

// ── Mood config (emoji + color) ──
const MOOD_CONFIG = {
  happy:     { emoji: '😄', color: '#f9ca24', msg: 'Great vibes! Here\'s your happy playlist 🎉' },
  sad:       { emoji: '😢', color: '#74b9ff', msg: 'Feeling blue? Let the music heal 💙' },
  angry:     { emoji: '😠', color: '#ff6b6b', msg: 'Channel that energy! 🔥' },
  surprised: { emoji: '😲', color: '#55efc4', msg: 'Surprised? Let\'s ride that feeling! 🌟' },
  neutral:   { emoji: '😐', color: '#a29bfe', msg: 'Cool and collected — ambient vibes for you 🎵' },
  fearful:   { emoji: '😨', color: '#b2bec3', msg: 'Something haunting this way comes 🌑' },
  disgusted: { emoji: '🤢', color: '#e17055', msg: 'Raw energy — here\'s your playlist 💢' },
};

const MOOD_GENRES = {
  happy:     '🎉', sad: '💧', angry: '🔥',
  surprised: '⚡', neutral: '🌊', fearful: '🌑', disgusted: '🎸'
};

// ── State ──
let stream = null;
let detectionInterval = null;
let modelsLoaded = false;
let currentSongs = [];
let currentIdx = 0;
let isPlaying = false;
let allSongs = [];

// ── DOM refs ──
const video         = document.getElementById('video');
const overlayCanvas = document.getElementById('overlay-canvas');
const cameraIdle    = document.getElementById('camera-idle');
const scanLine      = document.getElementById('scan-line');
const emotionBadge  = document.getElementById('emotion-badge');
const badgeEmoji    = document.getElementById('badge-emoji');
const badgeLabel    = document.getElementById('badge-label');

const btnStart     = document.getElementById('btn-start');
const btnSnap      = document.getElementById('btn-snap');
const btnStop      = document.getElementById('btn-stop');

const moodEmoji    = document.getElementById('mood-emoji');
const moodName     = document.getElementById('mood-name');
const songsList    = document.getElementById('songs-list');
const npBar        = document.getElementById('now-playing-bar');
const npTitle      = document.getElementById('np-title');
const npArtist     = document.getElementById('np-artist');
const btnPlayPause = document.getElementById('btn-play-pause');
const btnPrev      = document.getElementById('btn-prev');
const btnNext      = document.getElementById('btn-next');

const confWrap     = document.getElementById('confidence-wrap');
const confBar      = document.getElementById('conf-bar');
const confPct      = document.getElementById('conf-pct');

// ── NAV ──
document.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    const view = pill.dataset.view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');
    if (view === 'library') loadLibrary();
    if (view === 'history') loadHistory();
  });
});

// ── LOAD face-api MODELS ──
async function loadModels() {
  showToast('⏳ Loading AI models…');
  // Use CDN-hosted models from a public GitHub repo
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    showToast('✅ AI models ready!');
  } catch (err) {
    console.error('Model load error:', err);
    showToast('⚠️ Using demo mode (models unavailable)');
    modelsLoaded = false; // will use mock detection
  }
}

// ── START CAMERA ──
btnStart.addEventListener('click', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    video.srcObject = stream;
    video.style.display = 'block';
    cameraIdle.style.display = 'none';
    scanLine.style.display = 'block';
    emotionBadge.style.display = 'flex';

    btnStart.disabled = true;
    btnSnap.disabled = false;
    btnStop.disabled = false;

    if (!modelsLoaded) await loadModels();

    // Start continuous detection
    video.addEventListener('loadedmetadata', () => {
      overlayCanvas.width  = video.videoWidth;
      overlayCanvas.height = video.videoHeight;
    });

    detectionInterval = setInterval(runDetection, 600);
    showToast('📷 Camera started! Click "Detect Mood" anytime');
  } catch (err) {
    showToast('❌ Camera access denied. Please allow camera permissions.');
    console.error(err);
  }
});

// ── STOP CAMERA ──
btnStop.addEventListener('click', stopCamera);

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  clearInterval(detectionInterval);
  video.style.display = 'none';
  cameraIdle.style.display = 'flex';
  scanLine.style.display = 'none';
  emotionBadge.style.display = 'none';
  confWrap.style.display = 'none';
  btnStart.disabled = false;
  btnSnap.disabled  = true;
  btnStop.disabled  = true;
  const ctx = overlayCanvas.getContext('2d');
  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
}

// ── DETECT BUTTON (snap + send to backend) ──
btnSnap.addEventListener('click', async () => {
  btnSnap.disabled = true;
  btnSnap.textContent = 'Detecting…';
  const result = await runDetection(true);
  if (result) {
    await fetchSongsForMood(result.mood, result.confidence);
  }
  btnSnap.disabled = false;
  btnSnap.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M20.94 13A9 9 0 1 1 11 3.06M22 7l-3-3-3 3"/></svg> Detect Mood`;
});

// ── DETECTION ──
async function runDetection(snap = false) {
  if (!video || video.readyState < 2) return null;

  let mood, confidence;

  if (modelsLoaded) {
    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (!detection) {
        badgeLabel.textContent = 'No face found';
        badgeEmoji.textContent = '🔍';
        return null;
      }

      // Draw bounding box
      const ctx = overlayCanvas.getContext('2d');
      ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      const { x, y, width, height } = detection.detection.box;
      ctx.strokeStyle = '#7c6af7';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      ctx.fillStyle = 'rgba(124, 106, 247, 0.15)';
      ctx.fillRect(x, y, width, height);

      // Get top emotion
      const expressions = detection.expressions;
      const top = Object.entries(expressions).sort((a, b) => b[1] - a[1])[0];
      mood = top[0];
      confidence = top[1];

    } catch (e) {
      console.warn('Detection error, using mock:', e);
      ({ mood, confidence } = mockDetection());
    }
  } else {
    ({ mood, confidence } = mockDetection());
  }

  // Update badge
  const cfg = MOOD_CONFIG[mood] || MOOD_CONFIG.neutral;
  badgeEmoji.textContent = cfg.emoji;
  badgeLabel.textContent = mood;

  // Update confidence bar
  confWrap.style.display = 'flex';
  const pct = Math.round(confidence * 100);
  confBar.style.width = `${pct}%`;
  confPct.textContent = `${pct}%`;

  return snap ? { mood, confidence } : null;
}

// ── MOCK DETECTION (fallback if models can't load) ──
function mockDetection() {
  const moods = Object.keys(MOOD_CONFIG);
  const mood = moods[Math.floor(Math.random() * moods.length)];
  const confidence = 0.6 + Math.random() * 0.39;
  return { mood, confidence };
}

// ── FETCH SONGS FROM BACKEND ──
async function fetchSongsForMood(mood, confidence) {
  try {
    // Log mood to backend
    await fetch(`${API_BASE}/mood/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mood, confidence }),
    });

    // Fetch song recommendations
    const res = await fetch(`${API_BASE}/songs?mood=${mood}`);
    const data = await res.json();

    if (!data.success || !data.songs.length) {
      showToast('No songs found for this mood.');
      return;
    }

    currentSongs = data.songs;
    currentIdx = 0;

    // Update mood display
    const cfg = MOOD_CONFIG[mood];
    moodEmoji.textContent = cfg.emoji;
    moodName.textContent = mood;
    moodName.style.color = cfg.color;

    renderSongs(currentSongs, mood);
    showToast(cfg.msg);

  } catch (err) {
    console.error('API error:', err);
    showToast('⚠️ Backend offline — showing demo songs');
    renderDemoSongs(mood);
  }
}

// ── RENDER SONGS ──
function renderSongs(songs, mood) {
  songsList.innerHTML = '';
  const cfg = MOOD_CONFIG[mood] || MOOD_CONFIG.neutral;

  songs.forEach((song, i) => {
    const card = document.createElement('div');
    card.className = 'song-card' + (i === 0 ? ' playing' : '');
    card.dataset.index = i;
    card.innerHTML = `
      <span class="song-num">${i === 0 ? '▶' : i + 1}</span>
      <div class="song-cover" style="background: ${song.coverColor || cfg.color}22">
        ${MOOD_GENRES[mood] || '🎵'}
      </div>
      <div class="song-info">
        <div class="song-title">${escHtml(song.title)}</div>
        <div class="song-artist">${escHtml(song.artist)}</div>
      </div>
      <span class="song-duration">${song.duration || '—'}</span>
    `;
    card.addEventListener('click', () => selectSong(i));
    songsList.appendChild(card);
  });

  updateNowPlaying();
}

// ── SONG SELECTION ──
function selectSong(idx) {
  currentIdx = idx;
  document.querySelectorAll('.song-card').forEach((card, i) => {
    card.classList.toggle('playing', i === idx);
    const numEl = card.querySelector('.song-num');
    numEl.textContent = i === idx ? '▶' : i + 1;
  });
  updateNowPlaying();
}

function updateNowPlaying() {
  if (!currentSongs.length) return;
  const song = currentSongs[currentIdx];
  npTitle.textContent = song.title;
  npArtist.textContent = song.artist;
  npBar.style.display = 'flex';
}

btnPrev.addEventListener('click', () => {
  if (!currentSongs.length) return;
  selectSong((currentIdx - 1 + currentSongs.length) % currentSongs.length);
});
btnNext.addEventListener('click', () => {
  if (!currentSongs.length) return;
  selectSong((currentIdx + 1) % currentSongs.length);
});
btnPlayPause.addEventListener('click', () => {
  isPlaying = !isPlaying;
  btnPlayPause.textContent = isPlaying ? '⏸' : '▶';
  showToast(isPlaying ? `▶ Playing: ${currentSongs[currentIdx]?.title}` : '⏸ Paused');
});

// ── LIBRARY ──
async function loadLibrary() {
  const grid = document.getElementById('library-grid');
  grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading songs…</p></div>';

  try {
    const res = await fetch(`${API_BASE}/songs/all`);
    const data = await res.json();
    allSongs = data.songs;
    renderLibrary(allSongs);
  } catch {
    allSongs = [];
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">📡</div><p>Backend offline. Start the server to see songs.</p></div>';
  }
}

function renderLibrary(songs) {
  const grid = document.getElementById('library-grid');
  if (!songs.length) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🎵</div><p>No songs found.</p></div>';
    return;
  }
  grid.innerHTML = songs.map((song, i) => {
    const cfg = MOOD_CONFIG[song.mood] || {};
    return `
      <div class="lib-card" style="animation-delay:${i * 0.04}s">
        <div class="lib-card-top" style="background: ${song.coverColor || '#141721'}33">
          ${MOOD_GENRES[song.mood] || '🎵'}
          <span class="lib-mood-badge">${song.mood}</span>
        </div>
        <div class="lib-card-body">
          <div class="lib-title">${escHtml(song.title)}</div>
          <div class="lib-artist">${escHtml(song.artist)}</div>
          <div class="lib-meta">
            <span class="lib-genre">${song.genre || '—'}</span>
            <span class="lib-duration">${song.duration || '—'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Mood filter
document.getElementById('mood-filter-pills').addEventListener('click', e => {
  const pill = e.target.closest('.mood-pill');
  if (!pill) return;
  document.querySelectorAll('.mood-pill').forEach(p => p.classList.remove('active'));
  pill.classList.add('active');
  const mood = pill.dataset.mood;
  const filtered = mood === 'all' ? allSongs : allSongs.filter(s => s.mood === mood);
  renderLibrary(filtered);
});

// ── HISTORY ──
async function loadHistory() {
  const list = document.getElementById('history-list');
  list.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading history…</p></div>';

  try {
    const res = await fetch(`${API_BASE}/mood/history`);
    const data = await res.json();

    if (!data.history.length) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">📜</div><p>No mood history yet. Detect your first mood!</p></div>';
      return;
    }

    list.innerHTML = data.history.map((log, i) => {
      const cfg = MOOD_CONFIG[log.mood] || {};
      const songs = log.songsRecommended?.map(s => s.title).join(', ') || 'No songs';
      const time = new Date(log.createdAt).toLocaleString();
      const conf = log.confidence ? `${Math.round(log.confidence * 100)}% confidence` : '';
      return `
        <div class="history-item" style="animation-delay:${i * 0.06}s; border-left: 3px solid ${MOOD_CONFIG[log.mood]?.color || '#444'}">
          <div class="history-emoji">${cfg.emoji || '🎵'}</div>
          <div class="history-info">
            <div class="history-mood">${log.mood}</div>
            <div class="history-songs">Songs: ${escHtml(songs)}</div>
            <div class="history-time">${time} ${conf ? `· <span class="history-conf">${conf}</span>` : ''}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📡</div><p>Backend offline. Start the server to see history.</p></div>';
  }
}

// ── DEMO SONGS (offline fallback) ──
function renderDemoSongs(mood) {
  const cfg = MOOD_CONFIG[mood] || MOOD_CONFIG.neutral;
  const demos = [
    { title: 'Demo Song 1', artist: 'Artist A', duration: '3:30', coverColor: cfg.color },
    { title: 'Demo Song 2', artist: 'Artist B', duration: '4:10', coverColor: cfg.color },
    { title: 'Demo Song 3', artist: 'Artist C', duration: '3:55', coverColor: cfg.color },
  ];
  moodEmoji.textContent = cfg.emoji;
  moodName.textContent = mood;
  moodName.style.color = cfg.color;
  currentSongs = demos;
  currentIdx = 0;
  renderSongs(demos, mood);
}

// ── TOAST ──
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── UTILS ──
function escHtml(str) {
  const el = document.createElement('div');
  el.textContent = str || '';
  return el.innerHTML;
}

// ── INIT ──
(async () => {
  // Pre-load models in background
  if (typeof faceapi !== 'undefined') {
    setTimeout(loadModels, 1000);
  } else {
    // faceapi not loaded yet — wait
    window.addEventListener('load', () => setTimeout(loadModels, 500));
  }
})();
