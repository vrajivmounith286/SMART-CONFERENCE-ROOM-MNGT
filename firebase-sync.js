// ===== FIREBASE SYNC BRIDGE =====
// Syncs localStorage bookings → Firestore (so kiosk can read them)
// Syncs Firestore checkins → localStorage (so main app sees kiosk check-ins)

import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    getDocs,
    serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ===== Firebase Config (same as src/firebase.js) =====
const firebaseConfig = {
    apiKey: "AIzaSyA39BEGbUvcKZiN8NEECDUUtcrHrCII4fg",
    authDomain: "smart-conference-room-mn-11785.firebaseapp.com",
    projectId: "smart-conference-room-mn-11785",
    storageBucket: "smart-conference-room-mn-11785.firebasestorage.app",
    messagingSenderId: "943043774496",
    appId: "1:943043774496:web:058b03b8881b61af3f1445",
    measurementId: "G-D5LMFVFLRQ"
};

// Guard: prevent duplicate Firebase app error
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const STORAGE_KEY = 'orientbell_crm_data_v2';
const AUTH_KEY = 'orientbell_crm_auth';

// ===== SYNC: Push all bookings from localStorage → Firestore =====
async function syncBookingsToFirestore() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        const bookings = data.bookings || [];
        const users = data.users || [];

        // Sync each booking to Firestore
        for (const booking of bookings) {
            const organizer = users.find(u => u.id === booking.userId);
            const attendeeNames = (booking.attendees || []).map(aid => {
                const u = users.find(x => x.id === aid);
                return u ? u.name : 'Unknown';
            });

            const firestoreBooking = {
                ...booking,
                organizerName: organizer?.name || 'Unknown',
                attendeeNames: attendeeNames,
                syncedAt: new Date().toISOString(),
            };

            await setDoc(doc(db, 'bookings', booking.id), firestoreBooking);
        }

        console.log(`[Firebase Sync] Pushed ${bookings.length} bookings to Firestore`);
    } catch (err) {
        console.error('[Firebase Sync] Error pushing bookings:', err);
    }
}

// ===== SYNC: Listen for kiosk check-ins from Firestore → update localStorage =====
function startCheckinListener() {
    const today = new Date().toISOString().split('T')[0];

    const q = query(collection(db, 'checkins'));

    onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const checkinData = change.doc.data();
                applyCheckinToLocalStorage(checkinData);
            }
        });
    }, (err) => {
        console.warn('[Firebase Sync] Checkin listener error:', err.message);
    });
}

// ===== Apply a kiosk check-in to localStorage =====
function applyCheckinToLocalStorage(checkinData) {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);

        const idx = data.bookings.findIndex(b => b.id === checkinData.bookingId);
        if (idx >= 0 && !data.bookings[idx].checkedIn) {
            data.bookings[idx].checkedIn = true;
            data.bookings[idx].checkedInAt = checkinData.checkedInAt?.toDate?.()?.toISOString() || new Date().toISOString();
            data.bookings[idx].checkinMethod = 'webcam-kiosk';
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            console.log(`[Firebase Sync] Kiosk check-in applied: ${checkinData.bookingId}`);

            // Show visual notification if on dashboard/calendar
            showSyncNotification(checkinData);
        }
    } catch (err) {
        console.error('[Firebase Sync] Error applying check-in:', err);
    }
}

// ===== Show a non-intrusive sync notification =====
function showSyncNotification(checkinData) {
    // Use the app's existing toast system if available
    if (typeof showToast === 'function') {
        showToast(`✓ ${checkinData.userName || 'Someone'} checked in via kiosk — ${checkinData.roomName || ''}`, 'success');
    }
}

// ===== Watch for localStorage changes (when user creates/edits bookings) =====
let _lastSync = '';
function watchLocalStorage() {
    setInterval(async () => {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        // Simple hash to detect changes
        const hash = simpleHash(raw);
        if (hash !== _lastSync) {
            _lastSync = hash;
            await syncBookingsToFirestore();
        }
    }, 3000); // Check every 3 seconds
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + c;
        hash |= 0;
    }
    return String(hash);
}

// ===== INIT =====
async function initSync() {
    console.log('[Firebase Sync] Initializing...');

    // 1. Push current bookings to Firestore
    await syncBookingsToFirestore();

    // 2. Start listening for kiosk check-ins
    startCheckinListener();

    // 3. Watch localStorage for new bookings
    watchLocalStorage();

    console.log('[Firebase Sync] ✓ Ready — bookings synced, listening for kiosk check-ins');
}

// Start sync when page loads
initSync();
