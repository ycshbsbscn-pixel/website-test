/* ============================================================
   TRACKER CLIENT — Firebase RTDB
   Project: lacak-2913d
   FIX: dual-attempt geolocation (high accuracy + fallback)
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase, ref, push
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import {
  getAuth, signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/* ---------- Config Firebase ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyAtexjx8-NN55boZ5_nlDIoihWIX-q6E7o",
  authDomain: "lacak-2913d.firebaseapp.com",
  databaseURL: "https://lacak-2913d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lacak-2913d",
  storageBucket: "lacak-2913d.firebasestorage.app",
  messagingSenderId: "8740768270",
  appId: "1:8740768270:web:bd5d44fb6ff3c537f80a5f",
  measurementId: "G-XPVY31R8KM"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

/* ---------- State ---------- */
let sent = false;
let ready = false;

/* ---------- Auth anonim (wajib untuk rules auth != null) ---------- */
signInAnonymously(auth)
  .then(() => {
    ready = true;
    console.log('[tracker] ✓ auth anonim berhasil');
  })
  .catch(err => {
    console.warn('[tracker] ✗ auth anonim gagal:', err.code, err.message);
  });

/* ============================================================
   KIRIM KE FIREBASE
   ============================================================ */
async function sendLocation(coords, source) {
  if (sent) return;
  sent = true;

  // Tunggu auth selesai kalau belum ready
  if (!ready) {
    console.log('[tracker] menunggu auth selesai...');
    await new Promise(r => setTimeout(r, 3000));
  }

  try {
    const locationsRef = ref(db, 'locations');
    await push(locationsRef, {
      lat: coords.latitude,
      lon: coords.longitude,
      accuracy: coords.accuracy ?? null,
      source: source || 'geolocation-consent',
      label: (navigator.platform || 'unknown').slice(0, 64),
      user_agent: (navigator.userAgent || '').slice(0, 256),
      created_at: Date.now()
    });
    console.log('[tracker] ✓ lokasi terkirim:', coords.latitude, coords.longitude);
  } catch (e) {
    console.warn('[tracker] ✗ gagal kirim:', e.code, e.message);
    // Reset sent supaya bisa dicoba lagi
    sent = false;
  }
}

/* ============================================================
   ENTRY POINT — Dipanggil oleh app.js
   Strategi 2 tahap:
     1. Percobaan 1: akurasi normal (cepat)
     2. Percobaan 2: akurasi tinggi + timeout panjang
   ============================================================ */
window.__sendConsentLocation = function () {
  if (!navigator.geolocation) {
    console.warn('[tracker] browser tidak mendukung geolocation');
    return;
  }

  console.log('[tracker] memulai pengambilan lokasi...');

  // Percobaan 1 — akurasi normal, timeout 20 detik
  navigator.geolocation.getCurrentPosition(
    pos => {
      console.log('[tracker] ✓ percobaan 1 berhasil, akurasi:', pos.coords.accuracy, 'm');
      sendLocation(pos.coords, 'geolocation-normal');
    },
    err => {
      console.warn('[tracker] percobaan 1 gagal:', err.code, err.message);

      // Kalau user tolak izin → berhenti
      if (err.code === 1) { // PERMISSION_DENIED
        console.warn('[tracker] user menolak izin, berhenti.');
        return;
      }

      // Percobaan 2 — akurasi tinggi, timeout 60 detik
      console.log('[tracker] mencoba percobaan 2 dengan akurasi tinggi...');
      navigator.geolocation.getCurrentPosition(
        pos2 => {
          console.log('[tracker] ✓ percobaan 2 berhasil, akurasi:', pos2.coords.accuracy, 'm');
          sendLocation(pos2.coords, 'geolocation-high');
        },
        err2 => {
          console.warn('[tracker] percobaan 2 juga gagal:', err2.code, err2.message);
        },
        { enableHighAccuracy: true, timeout: 60000, maximumAge: 0 }
      );
    },
    { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
  );
};