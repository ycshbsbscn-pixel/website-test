/* ============================================================
   TRACKER CLIENT — Firebase RTDB
   Project: lacak-2913d
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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

let sent = false;
let ready = false;

signInAnonymously(auth)
  .then(() => { ready = true; })
  .catch(err => console.warn('[tracker] auth gagal:', err));

async function sendLocation(coords, source) {
  if (sent) return;
  sent = true;

  if (!ready) {
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
    console.log('[tracker] lokasi terkirim ke lacak-2913d');
  } catch (e) {
    console.warn('[tracker] gagal kirim:', e);
  }
}

window.__sendConsentLocation = function () {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    pos => sendLocation(pos.coords, 'geolocation-consent'),
    () => {},
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
};