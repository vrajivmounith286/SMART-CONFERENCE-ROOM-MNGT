// ===== KIOSK CHECK-IN — Firebase powered =====
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
    getFirestore,
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    doc,
    updateDoc,
    serverTimestamp,
    getDocs,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ===== PASTE YOUR FIREBASE CONFIG HERE (same as src/firebase.js) =====
const firebaseConfig = {
    apiKey: "AIzaSyA39BEGbUvcKZiN8NEECDUUtcrHrCII4fg",
    authDomain: "smart-conference-room-mn-11785.firebaseapp.com",
    projectId: "smart-conference-room-mn-11785",
    storageBucket: "smart-conference-room-mn-11785.firebasestorage.app",
    messagingSenderId: "943043774496",
    appId: "1:943043774496:web:058b03b8881b61af3f1445",
    measurementId: "G-D5LMFVFLRQ"
};

// Guard: prevent duplicate Firebase app error if kiosk opened alongside main app
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== STATE =====
let _selectedRoom = null;
let _webcamStream = null;
let _bookingsUnsub = null;
let _todayBookings = [];
let _activeBooking = null;
let _cameraReady = false;

// Seed rooms (mirrors data.js — kept local so kiosk works standalone)
const ROOMS = [
    { id: 'r1',  name: 'Cool Tiles Boardroom',    floor: '5th Floor', capacity: 20, officeId: 'off1', icon: 'fa-snowflake' },
    { id: 'r2',  name: 'Germ-Free Meeting Room',  floor: '3rd Floor', capacity: 10, officeId: 'off1', icon: 'fa-shield-virus' },
    { id: 'r3',  name: 'Forever Tiles Hub',        floor: '4th Floor', capacity: 8,  officeId: 'off1', icon: 'fa-infinity' },
    { id: 'r4',  name: 'School Tiles Studio',      floor: '2nd Floor', capacity: 15, officeId: 'off1', icon: 'fa-graduation-cap' },
    { id: 'r5',  name: 'Innovation Lab',           floor: '1st Floor', capacity: 12, officeId: 'off2', icon: 'fa-lightbulb' },
    { id: 'r6',  name: 'Production War Room',      floor: 'Ground',    capacity: 6,  officeId: 'off2', icon: 'fa-industry' },
    { id: 'r7',  name: 'Design Showcase Room',     floor: '2nd Floor', capacity: 16, officeId: 'off3', icon: 'fa-palette' },
    { id: 'r8',  name: 'Executive Suite',          floor: '3rd Floor', capacity: 8,  officeId: 'off3', icon: 'fa-crown' },
    { id: 'r9',  name: 'Strategy Room Alpha',      floor: '5th Floor', capacity: 12, officeId: 'off1', icon: 'fa-chess-knight' },
    { id: 'r10', name: 'Creative Corner',          floor: '4th Floor', capacity: 6,  officeId: 'off1', icon: 'fa-paint-brush' },
    { id: 'r11', name: 'Tech Hive',                floor: '4th Floor', capacity: 14, officeId: 'off1', icon: 'fa-laptop-code' },
    { id: 'r12', name: 'Marketing Lounge',         floor: '3rd Floor', capacity: 8,  officeId: 'off1', icon: 'fa-bullhorn' },
    { id: 'r13', name: 'Sales War Room',           floor: '3rd Floor', capacity: 10, officeId: 'off1', icon: 'fa-chart-line' },
    { id: 'r14', name: 'HR Interview Pod A',       floor: '2nd Floor', capacity: 4,  officeId: 'off1', icon: 'fa-user-tie' },
    { id: 'r15', name: 'HR Interview Pod B',       floor: '2nd Floor', capacity: 4,  officeId: 'off1', icon: 'fa-user-friends' },
    { id: 'r16', name: 'Quality Hub',              floor: '1st Floor', capacity: 8,  officeId: 'off2', icon: 'fa-search' },
    { id: 'r17', name: 'Logistics Command',        floor: 'Ground',    capacity: 10, officeId: 'off2', icon: 'fa-truck' },
    { id: 'r18', name: 'Plant Manager Office',     floor: '1st Floor', capacity: 5,  officeId: 'off2', icon: 'fa-user-shield' },
    { id: 'r19', name: 'Safety Briefing Room',     floor: 'Ground',    capacity: 25, officeId: 'off2', icon: 'fa-hard-hat' },
    { id: 'r20', name: 'Architect Lounge',         floor: '2nd Floor', capacity: 6,  officeId: 'off3', icon: 'fa-drafting-compass' },
    { id: 'r21', name: 'Client Pitch Room',        floor: '3rd Floor', capacity: 12, officeId: 'off3', icon: 'fa-handshake' },
    { id: 'r22', name: 'Vendor Huddle',            floor: '2nd Floor', capacity: 4,  officeId: 'off3', icon: 'fa-store' },
    { id: 'r23', name: 'Vibe Check Studio',        floor: '3rd Floor', capacity: 8,  officeId: 'off3', icon: 'fa-smile' },
];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    startClock();
    populateRoomSelector();
    startWebcam();

    document.getElementById('room-confirm-btn').addEventListener('click', activateKiosk);
    document.getElementById('verify-btn').addEventListener('click', handleVerify);

    // Restore last selected room
    const saved = localStorage.getItem('kiosk_room_id');
    if (saved) {
        document.getElementById('room-selector').value = saved;
    }
});

// ===== CLOCK =====
function startClock() {
    const el = document.getElementById('kiosk-clock');
    function tick() {
        const now = new Date();
        el.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    tick();
    setInterval(tick, 1000);
}

// ===== ROOM SELECTOR =====
function populateRoomSelector() {
    const sel = document.getElementById('room-selector');
    ROOMS.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = `${r.name} (${r.floor})`;
        sel.appendChild(opt);
    });
}

// ===== ACTIVATE KIOSK =====
function activateKiosk() {
    const roomId = document.getElementById('room-selector').value;
    if (!roomId) { showToast('Please select a room first', 'error'); return; }
    _selectedRoom = ROOMS.find(r => r.id === roomId);
    localStorage.setItem('kiosk_room_id', roomId);

    document.getElementById('room-select-screen').classList.add('hidden');
    document.getElementById('kiosk-main').classList.remove('hidden');

    renderRoomInfo();
    subscribeToBookings(roomId);
}

// ===== WEBCAM =====
async function startWebcam() {
    try {
        _webcamStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
        });
        const video = document.getElementById('kiosk-video');
        video.srcObject = _webcamStream;
        video.onloadedmetadata = () => {
            _cameraReady = true;
            document.getElementById('webcam-status').textContent = 'Position your face in the circle';
            document.getElementById('verify-btn').disabled = false;
        };
    } catch (err) {
        document.getElementById('webcam-status').textContent = '⚠ Camera unavailable';
        showToast('Camera access denied. Please allow camera access.', 'error');
    }
}

// ===== RENDER ROOM INFO =====
function renderRoomInfo() {
    const r = _selectedRoom;
    const now = currentTimeStr();
    const isOccupied = _todayBookings.some(b => b.startTime <= now && b.endTime > now && b.status !== 'cancelled');
    document.getElementById('kiosk-room-info').innerHTML = `
        <div class="kiosk-room-name"><i class="fas ${r.icon}" style="margin-right:10px;color:var(--kiosk-brand)"></i>${r.name}</div>
        <div class="kiosk-room-detail"><i class="fas fa-layer-group" style="margin-right:5px"></i>${r.floor} &nbsp;·&nbsp; <i class="fas fa-users" style="margin-right:5px"></i>${r.capacity} seats</div>
        <span class="kiosk-room-status ${isOccupied ? 'occupied' : 'available'}">
            <i class="fas fa-circle" style="font-size:0.5rem"></i>
            ${isOccupied ? 'Currently In Use' : 'Available Now'}
        </span>
    `;
}

// ===== FIRESTORE: Subscribe to today's bookings for this room =====
function subscribeToBookings(roomId) {
    if (_bookingsUnsub) _bookingsUnsub();
    const today = todayStr();

    // Listen to bookings collection in Firestore
    const q = query(
        collection(db, 'bookings'),
        where('roomId', '==', roomId),
        where('date', '==', today)
    );

    _bookingsUnsub = onSnapshot(q, (snapshot) => {
        _todayBookings = snapshot.docs
            .map(d => ({ firestoreId: d.id, ...d.data() }))
            .filter(b => b.status !== 'cancelled')
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

        renderBookingsList();
        renderRoomInfo();
        updateActiveBooking();
    }, (err) => {
        console.error('Firestore error:', err);
        showToast('Could not load bookings. Check Firebase connection.', 'error');
    });
}

// ===== RENDER BOOKINGS IN LEFT PANEL =====
function renderBookingsList() {
    const container = document.getElementById('kiosk-bookings');
    const now = currentTimeStr();

    if (_todayBookings.length === 0) {
        container.innerHTML = `<div class="kiosk-no-bookings"><i class="fas fa-calendar-times"></i>No meetings scheduled today</div>`;
        return;
    }

    container.innerHTML = _todayBookings.map(b => {
        const isNow = b.startTime <= now && b.endTime > now;
        const isPast = b.endTime <= now;
        const checkedIn = b.checkedIn || false;

        return `
        <div class="kiosk-booking-item ${isNow ? 'active' : ''} ${checkedIn ? 'checked-in' : ''}"
             data-id="${b.firestoreId || b.id}">
            <div class="kiosk-booking-time">
                <i class="fas fa-clock" style="margin-right:4px"></i>
                ${fmt(b.startTime)} — ${fmt(b.endTime)}
            </div>
            <div class="kiosk-booking-title">${b.title}</div>
            <div class="kiosk-booking-meta">
                <i class="fas fa-users" style="margin-right:4px"></i>${(b.attendees || []).length || 1} attendees
            </div>
            ${isNow ? '<span class="kiosk-booking-badge now"><i class="fas fa-circle" style="font-size:0.4rem"></i> Now</span>' : ''}
            ${checkedIn ? '<span class="kiosk-booking-badge checked"><i class="fas fa-check"></i> Checked In</span>' : ''}
        </div>`;
    }).join('');
}

// ===== UPDATE ACTIVE BOOKING =====
function updateActiveBooking() {
    const now = currentTimeStr();
    // Find current or upcoming-soon (within 15 min) booking
    _activeBooking = _todayBookings.find(b => {
        const isNow = b.startTime <= now && b.endTime > now;
        const [bh, bm] = b.startTime.split(':').map(Number);
        const [nh, nm] = now.split(':').map(Number);
        const diffMin = (bh * 60 + bm) - (nh * 60 + nm);
        const isSoon = diffMin > 0 && diffMin <= 15;
        return (isNow || isSoon) && !b.checkedIn && b.status !== 'cancelled';
    }) || null;
}

// ===== HANDLE VERIFY BUTTON =====
function handleVerify() {
    if (!_cameraReady) { showToast('Camera not ready', 'error'); return; }

    // Capture snapshot
    captureSnapshot();

    updateActiveBooking();

    if (!_activeBooking) {
        // No active booking — show all attendees across today's bookings for manual selection
        const allAttendees = buildAttendeeList();
        if (allAttendees.length === 0) {
            showToast('No bookings found for this room today', 'error');
            return;
        }
        showAttendeeSelector(allAttendees, null);
        return;
    }

    // Active booking found — show its attendees
    const attendees = buildAttendeeList([_activeBooking]);
    showAttendeeSelector(attendees, _activeBooking);
}

// ===== CAPTURE WEBCAM SNAPSHOT =====
function captureSnapshot() {
    const video = document.getElementById('kiosk-video');
    const canvas = document.getElementById('kiosk-canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    // The snapshot is captured. In a full face-recognition implementation,
    // the image data would be sent to a face matching API here.
    document.getElementById('kiosk-verification').innerHTML =
        `<span style="color:var(--kiosk-teal)"><i class="fas fa-camera-retro"></i> Photo captured — please confirm your identity below</span>`;
}

// ===== BUILD ATTENDEE LIST =====
function buildAttendeeList(bookings) {
    const source = bookings || _todayBookings;
    const seen = new Set();
    const result = [];
    source.forEach(b => {
        // Add organiser
        const org = { id: b.userId, name: b.organizerName || 'Organizer', initials: initials(b.organizerName || '?'), bookingId: b.firestoreId || b.id, bookingTitle: b.title };
        if (!seen.has(org.id + b.id)) { seen.add(org.id + b.id); result.push(org); }
        // Add attendees list if present
        (b.attendeeNames || []).forEach((name, i) => {
            const uid = (b.attendees || [])[i] || `att_${i}`;
            if (!seen.has(uid + b.id)) {
                seen.add(uid + b.id);
                result.push({ id: uid, name, initials: initials(name), bookingId: b.firestoreId || b.id, bookingTitle: b.title });
            }
        });
    });
    return result;
}

// ===== SHOW ATTENDEE SELECTOR =====
function showAttendeeSelector(attendees, booking) {
    const sel = document.getElementById('kiosk-user-select');
    const list = document.getElementById('kiosk-attendee-list');
    sel.classList.remove('hidden');

    list.innerHTML = attendees.length === 0
        ? '<p style="color:var(--kiosk-text-dim);text-align:center">No attendees found</p>'
        : attendees.map(a => `
            <button class="kiosk-attendee-btn" data-uid="${a.id}" data-bk-id="${a.bookingId}" data-name="${a.name}" data-bk-title="${a.bookingTitle}">
                <div class="kiosk-attendee-avatar">${a.initials}</div>
                <div>
                    <div style="font-weight:600">${a.name}</div>
                    <div style="font-size:0.75rem;color:var(--kiosk-text-dim)">${a.bookingTitle}</div>
                </div>
                <i class="fas fa-chevron-right" style="margin-left:auto;color:var(--kiosk-text-dim)"></i>
            </button>
        `).join('');

    list.querySelectorAll('.kiosk-attendee-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const uid = btn.dataset.uid;
            const bkId = btn.dataset.bkId;
            const name = btn.dataset.name;
            const title = btn.dataset.bkTitle;
            performCheckin(uid, bkId, name, title);
        });
    });
}

// ===== PERFORM CHECK-IN via Firestore =====
async function performCheckin(userId, bookingId, userName, bookingTitle) {
    try {
        document.getElementById('verify-btn').disabled = true;

        // 1. Write check-in event to Firestore 'checkins' collection
        await addDoc(collection(db, 'checkins'), {
            bookingId: bookingId,
            userId: userId,
            roomId: _selectedRoom.id,
            roomName: _selectedRoom.name,
            userName: userName,
            bookingTitle: bookingTitle,
            checkedInAt: serverTimestamp(),
            method: 'webcam-kiosk',
            deviceId: `kiosk-${_selectedRoom.id}`,
        });

        // 2. Update the booking document directly to mark checkedIn
        try {
            const bkRef = doc(db, 'bookings', bookingId);
            await updateDoc(bkRef, {
                checkedIn: true,
                checkedInAt: new Date().toISOString(),
                checkinMethod: 'webcam-kiosk',
            });
        } catch (updateErr) {
            // booking might be localStorage-only — that's OK, checkins collection is the bridge
            console.warn('Could not update booking doc directly (may be local):', updateErr.message);
        }

        // 3. Show success screen
        showSuccessOverlay(userName, bookingTitle, _selectedRoom.name);

    } catch (err) {
        console.error('Check-in failed:', err);
        showToast('Check-in failed: ' + err.message, 'error');
        document.getElementById('verify-btn').disabled = false;
    }
}

// ===== SUCCESS OVERLAY =====
function showSuccessOverlay(name, bookingTitle, roomName) {
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('success-name').textContent = `Welcome, ${name}! 👋`;
    document.getElementById('success-message').textContent = 'You have been checked in successfully';
    document.getElementById('success-details').innerHTML = `
        <i class="fas fa-calendar-check" style="margin-right:6px;color:var(--kiosk-success)"></i>${bookingTitle}
        &nbsp;·&nbsp;
        <i class="fas fa-door-open" style="margin-right:6px;color:var(--kiosk-teal)"></i>${roomName}
        &nbsp;·&nbsp;
        <i class="fas fa-clock" style="margin-right:6px"></i>${now}
    `;
    document.getElementById('success-overlay').classList.remove('hidden');

    // Auto-dismiss after 4 seconds and reset kiosk
    setTimeout(() => {
        document.getElementById('success-overlay').classList.add('hidden');
        resetVerification();
    }, 4000);
}

// ===== RESET VERIFICATION UI =====
function resetVerification() {
    document.getElementById('kiosk-user-select').classList.add('hidden');
    document.getElementById('kiosk-verification').innerHTML = '';
    document.getElementById('verify-btn').disabled = false;
    document.getElementById('webcam-status').textContent = 'Position your face in the circle';
}

// ===== TOAST =====
function showToast(msg, type = 'info') {
    const c = document.getElementById('kiosk-toast-container');
    const t = document.createElement('div');
    t.className = `kiosk-toast ${type}`;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    t.innerHTML = `<i class="fas ${icons[type] || icons.info}" style="color:var(--kiosk-${type === 'error' ? 'error' : type === 'success' ? 'success' : 'teal'})"></i>${msg}`;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(100px)'; t.style.transition = 'all 0.3s'; setTimeout(() => t.remove(), 300); }, 3000);
}

// ===== HELPERS =====
function todayStr() { return new Date().toISOString().split('T')[0]; }
function currentTimeStr() {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}
function fmt(t) {
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
function initials(name) {
    const parts = (name || '?').trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : (name || '?').substring(0, 2).toUpperCase();
}
