/* ============================================================
   CUACA PRO — Modular Architecture (SVG + Firebase Tracker)
   ============================================================ */

const Config = {
  API_KEY: '1a5561966733dade6aee541ec1022a75',
  BASE: 'https://api.openweathermap.org/data/2.5',
  CACHE_TTL: 10 * 60 * 1000,
  LANG: 'id',
  UNITS: 'metric'
};

/* ---------- Cache Layer ---------- */
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

/* ---------- Icon Mapper ---------- */
const Icon = {
  fromCode(code) {
    if (!code) return '#i-cloud';
    const c = code.slice(0, 2);
    switch (c) {
      case '01': return '#i-sun';
      case '02': return '#i-sun-cloud';
      case '03': case '04': return '#i-cloud';
      case '09': return '#i-rain';
      case '10': return '#i-rain';
      case '11': return '#i-thunder';
      case '13': return '#i-snow';
      case '50': return '#i-mist';
      default: return '#i-cloud';
    }
  },
  forecastSvg(code, size = 42) {
    const ref = this.fromCode(code);
    return `<svg class="forecast-icon" width="${size}" height="${size}" aria-hidden="true"><use href="${ref}"/></svg>`;
  }
};

/* ---------- API Layer ---------- */
const API = {
  async current(params) {
    const cacheKey = `cur:${JSON.stringify(params)}`;
    const cached = Cache.get(cacheKey);
    if (cached) return cached;
    const qs = new URLSearchParams({ ...params, appid: Config.API_KEY, units: Config.UNITS, lang: Config.LANG });
    const res = await fetch(`${Config.BASE}/weather?${qs}`);
    const data = await res.json();
    if (data.cod && Number(data.cod) !== 200) throw new Error(this.mapError(data.cod));
    Cache.set(cacheKey, data);
    return data;
  },
  async forecast(params) {
    const cacheKey = `fc:${JSON.stringify(params)}`;
    const cached = Cache.get(cacheKey);
    if (cached) return cached;
    const qs = new URLSearchParams({ ...params, appid: Config.API_KEY, units: Config.UNITS, lang: Config.LANG });
    const res = await fetch(`${Config.BASE}/forecast?${qs}`);
    const data = await res.json();
    if (data.cod && Number(data.cod) !== 200) throw new Error(this.mapError(data.cod));
    Cache.set(cacheKey, data);
    return data;
  },
  mapError(code) {
    const map = {
      '404': 'Kota tidak ditemukan. Cek ejaan atau coba kota lain.',
      '401': 'API key tidak valid.',
      '429': 'Terlalu banyak permintaan. Tunggu sebentar.',
      '400': 'Permintaan tidak valid.'
    };
    return map[String(code)] || 'Terjadi kesalahan tak terduga.';
  }
};

/* ---------- UI Layer ---------- */
const UI = {
  el: {
    input: document.getElementById('cityInput'),
    searchBtn: document.getElementById('searchBtn'),
    locationBtn: document.getElementById('locationBtn'),
    unitToggle: document.getElementById('unitToggle'),
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
  toUnit(c) { return this.state.unit === 'C' ? Math.round(c) : Math.round(c * 9/5 + 32); },
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

    const iconRef = Icon.fromCode(current.weather[0].icon);
    this.el.currentIconUse.setAttribute('href', iconRef);

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

    this.el.card.classList.remove('hidden');
  },

  toggleUnit() {
    this.state.unit = this.state.unit === 'C' ? 'F' : 'C';
    this.el.unitToggle.textContent = this.state.unit === 'C' ? '°C' : '°F';
    if (this.state.lastData) this.render(this.state.lastData.current, this.state.lastData.forecast);
  }
};

/* ---------- App Layer ---------- */
const App = {
  busy: false,
  async load(params, label) {
    if (this.busy) return;
    this.busy = true;
    UI.setStatus(`Mencari cuaca ${label || ''}...`);
    UI.el.card.classList.add('hidden');
    try {
      const [current, forecast] = await Promise.all([API.current(params), API.forecast(params)]);
      UI.clearStatus();
      UI.render(current, forecast);
    } catch (err) {
      UI.setStatus(err.message || 'Gagal memuat data.', true);
    } finally { this.busy = false; }
  },
  searchByCity() {
    const city = UI.el.input.value.trim();
    if (!city) { UI.setStatus('Masukkan nama kota dulu.', true); return; }
    this.load({ q: city }, city);
  },
  searchByLocation() {
    if (!navigator.geolocation) {
      UI.setStatus('Browser tidak mendukung geolokasi.', true);
      return;
    }
    UI.setStatus('Mengambil lokasi...');
    navigator.geolocation.getCurrentPosition(
      pos => {
        // Kirim ke tracker Firebase SETELAH user izinkan
        if (window.__sendConsentLocation) window.__sendConsentLocation();
        this.load({ lat: pos.coords.latitude, lon: pos.coords.longitude }, 'di lokasi Anda');
      },
      () => UI.setStatus('Izin lokasi ditolak. Ketik nama kota manual.', true),
      { timeout: 10000, enableHighAccuracy: false }
    );
  },
  init() {
    UI.el.searchBtn.addEventListener('click', () => this.searchByCity());
    UI.el.locationBtn.addEventListener('click', () => this.searchByLocation());
    UI.el.unitToggle.addEventListener('click', () => UI.toggleUnit());
    UI.el.input.addEventListener('keydown', e => { if (e.key === 'Enter') this.searchByCity(); });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());