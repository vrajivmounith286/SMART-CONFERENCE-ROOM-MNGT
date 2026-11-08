// ===== CHECK-IN VIEW — with real-time Firestore kiosk sync =====
import * as store from '../data/store.js';
import { getCurrentUser } from '../auth.js';
import { showToast } from '../components/toast.js';
import { db } from '../firebase.js';
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
} from 'firebase/firestore';

let _checkinUnsub = null; // Firestore listener cleanup

export function renderCheckin(container) {
    const user = getCurrentUser();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const allTodayBookings = store.getTodaysBookings();
    const myBookings = allTodayBookings
        .filter(b => b.userId === user.id || b.attendees?.includes(user.id))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const upcoming = myBookings.filter(b => b.startTime > currentTime && !b.checkedIn && b.status === 'confirmed');
    const current = myBookings.filter(b => b.startTime <= currentTime && b.endTime > currentTime);
    const past = myBookings.filter(b => b.endTime <= currentTime);

    const checkedInCount = myBookings.filter(b => b.checkedIn).length;
    const totalCount = myBookings.length;

    container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xl);flex-wrap:wrap;gap:var(--space-md)">
      <div>
        <h2 style="font-size:var(--fs-2xl)">Check-in &amp; Attendance</h2>
        <p style="color:var(--text-secondary)">Confirm your attendance for today's meetings</p>
      </div>
      <div style="display:flex;gap:var(--space-sm);align-items:center">
        <div class="stat-card" style="padding:var(--space-md)">
          <div style="font-size:var(--fs-xs);color:var(--text-muted)">Checked In</div>
          <div style="font-size:var(--fs-xl);font-weight:800">${checkedInCount}<span style="font-size:var(--fs-sm);color:var(--text-muted)"> / ${totalCount}</span></div>
        </div>
        <div id="kiosk-sync-badge" style="display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:20px;background:rgba(0,184,169,.1);color:var(--brand-teal);font-size:var(--fs-xs);font-weight:600;border:1px solid rgba(0,184,169,.2)">
          <span style="width:6px;height:6px;border-radius:50%;background:var(--brand-teal);display:inline-block;animation:pulse 2s infinite"></span>
          Live Kiosk Sync
        </div>
      </div>
    </div>

    ${current.length > 0 ? `
      <div style="margin-bottom:var(--space-xl)">
        <h3 style="margin-bottom:var(--space-md);display:flex;align-items:center;gap:8px">
          <span style="width:8px;height:8px;border-radius:50%;background:var(--color-success);display:inline-block;animation:pulse 2s infinite"></span>
          Happening Now
        </h3>
        ${current.map(b => renderCheckinCard(b, 'current', currentTime)).join('')}
      </div>
    ` : ''}

    ${upcoming.length > 0 ? `
      <div style="margin-bottom:var(--space-xl)">
        <h3 style="margin-bottom:var(--space-md);color:var(--text-secondary)"><i class="fas fa-clock" style="margin-right:8px;color:var(--color-warning)"></i>Upcoming</h3>
        ${upcoming.map(b => renderCheckinCard(b, 'upcoming', currentTime)).join('')}
      </div>
    ` : ''}

    ${past.length > 0 ? `
      <div style="margin-bottom:var(--space-xl)">
        <h3 style="margin-bottom:var(--space-md);color:var(--text-muted)"><i class="fas fa-history" style="margin-right:8px"></i>Earlier Today</h3>
        ${past.map(b => renderCheckinCard(b, 'past', currentTime)).join('')}
      </div>
    ` : ''}

    ${myBookings.length === 0 ? `
      <div class="card" style="text-align:center;padding:var(--space-3xl)">
        <i class="fas fa-calendar-check" style="font-size:3rem;color:var(--brand-orange);opacity:0.3;margin-bottom:var(--space-md)"></i>
        <h3>No Meetings Today</h3>
        <p style="color:var(--text-muted);margin-top:var(--space-sm)">You don't have any meetings scheduled for today.</p>
      </div>
    ` : ''}

    <div class="card slide-up" style="margin-top:var(--space-xl)">
      <div class="card-header">
        <h3 class="card-title"><i class="fas fa-clipboard-list" style="color:var(--brand-teal);margin-right:8px"></i>Attendance Log</h3>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Meeting</th><th>Room</th><th>Time</th><th>Status</th><th>Checked In At</th><th>Method</th>
            </tr>
          </thead>
          <tbody>
            ${myBookings.map(b => {
                const room = store.getRoomById(b.roomId);
                return `
                <tr id="bk-row-${b.id}">
                  <td><strong>${b.title}</strong></td>
                  <td>${room?.name || 'N/A'}</td>
                  <td>${formatTime(b.startTime)} — ${formatTime(b.endTime)}</td>
                  <td>${statusBadge(b, currentTime)}</td>
                  <td>${b.checkedInAt ? new Date(b.checkedInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td>${b.checkinMethod === 'webcam-kiosk' ? '<span style="color:var(--brand-teal);font-size:var(--fs-xs)"><i class="fas fa-video"></i> Kiosk</span>' : b.checkedIn ? '<span style="font-size:var(--fs-xs);color:var(--text-muted)"><i class="fas fa-hand-pointer"></i> Manual</span>' : '—'}</td>
                </tr>`;
            }).join('')}
            ${myBookings.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:var(--space-lg)">No records</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;

    // Wire manual check-in buttons
    container.querySelectorAll('.btn-checkin').forEach(btn => {
        btn.addEventListener('click', () => {
            store.checkIn(btn.dataset.id);
            showToast('Successfully checked in! ✓', 'success');
            renderCheckin(container);
        });
    });

    // Wire cancel buttons
    container.querySelectorAll('.btn-cancel-booking').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('Cancel this booking?')) {
                store.cancelBooking(btn.dataset.id);
                showToast('Booking cancelled', 'info');
                renderCheckin(container);
            }
        });
    });

    // Start real-time Firestore kiosk listener
    startKioskListener(container, user.id, myBookings);

    updatePageTitle('Check-in', `${checkedInCount} of ${totalCount} checked in today`);
}

// ===== REAL-TIME KIOSK CHECK-IN LISTENER =====
function startKioskListener(container, userId, myBookings) {
    // Unsubscribe any existing listener
    if (_checkinUnsub) {
        _checkinUnsub();
        _checkinUnsub = null;
    }

    const today = new Date().toISOString().split('T')[0];
    const myBookingIds = myBookings.map(b => b.id);

    if (myBookingIds.length === 0) return;

    // Listen for new checkins written by the kiosk for my bookings
    const q = query(
        collection(db, 'checkins'),
        where('userId', '==', userId),
        orderBy('checkedInAt', 'desc')
    );

    _checkinUnsub = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const data = change.doc.data();
                const bookingId = data.bookingId;

                // Check if this check-in belongs to one of my bookings
                if (myBookingIds.includes(bookingId)) {
                    // Apply to local store
                    store.checkIn(bookingId);
                    store.updateBooking(bookingId, {
                        checkinMethod: 'webcam-kiosk',
                        checkedInAt: data.checkedInAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                    });

                    showToast(`✓ Kiosk check-in received for "${data.bookingTitle || 'your booking'}"`, 'success');

                    // Re-render checkin view
                    renderCheckin(container);
                }
            }
        });
    }, (err) => {
        // Silently fail if Firestore read permission not set — manual check-in still works
        console.warn('Kiosk listener error (check Firestore rules):', err.message);
        const badge = document.getElementById('kiosk-sync-badge');
        if (badge) {
            badge.style.background = 'rgba(239,68,68,.1)';
            badge.style.color = 'var(--color-error)';
            badge.style.borderColor = 'rgba(239,68,68,.2)';
            badge.querySelector('span').style.background = 'var(--color-error)';
            badge.innerHTML = badge.innerHTML.replace('Live Kiosk Sync', 'Kiosk Offline');
        }
    });
}

// Cleanup listener when navigating away
export function cleanupCheckin() {
    if (_checkinUnsub) {
        _checkinUnsub();
        _checkinUnsub = null;
    }
}

// ===== CARD RENDERER =====
function renderCheckinCard(booking, type, currentTime) {
    const room = store.getRoomById(booking.roomId);
    const canCheckIn = type === 'current' && !booking.checkedIn && booking.status === 'confirmed';
    const isUpcomingSoon = type === 'upcoming' && (timeToMin(booking.startTime) - timeToMin(currentTime)) <= 15;
    const isKioskCheckin = booking.checkinMethod === 'webcam-kiosk';

    return `
    <div class="checkin-card ${type === 'current' ? 'slide-up' : ''}" style="${type === 'current' && !booking.checkedIn ? 'border-left:3px solid var(--color-success)' : ''}${booking.checkedIn ? 'border-left:3px solid var(--brand-teal)' : ''}">
      <div class="avatar avatar-lg" style="font-size:1rem">
        <i class="fas ${room?.icon || 'fa-door-open'}"></i>
      </div>
      <div class="checkin-info">
        <div class="checkin-room">${booking.title}</div>
        <div class="checkin-time">
          <i class="fas fa-door-open" style="margin-right:4px"></i>${room?.name || 'Unknown'} &middot;
          <i class="fas fa-clock" style="margin:0 4px"></i>${formatTime(booking.startTime)} — ${formatTime(booking.endTime)} &middot;
          <i class="fas fa-users" style="margin:0 4px"></i>${booking.attendees?.length || 1} attendees
        </div>
        ${booking.notes ? `<div style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:4px">${booking.notes}</div>` : ''}
      </div>
      <div class="checkin-actions">
        ${booking.checkedIn ? `
          <span class="badge badge-available">
            <i class="fas fa-check-circle"></i> Checked In
            ${isKioskCheckin ? '<i class="fas fa-video" title="Via Kiosk" style="margin-left:4px;opacity:.7"></i>' : ''}
          </span>` : ''}
        ${canCheckIn ? `<button class="btn btn-success btn-checkin" data-id="${booking.id}"><i class="fas fa-check"></i> Check In</button>` : ''}
        ${isUpcomingSoon && !booking.checkedIn ? `<button class="btn btn-success btn-sm btn-checkin" data-id="${booking.id}"><i class="fas fa-check"></i> Early Check-in</button>` : ''}
        ${!booking.checkedIn && booking.status === 'confirmed' ? `<button class="btn btn-ghost btn-sm btn-cancel-booking" data-id="${booking.id}"><i class="fas fa-times"></i></button>` : ''}
        ${booking.status === 'auto-released' ? '<span class="badge badge-maintenance">Released</span>' : ''}
      </div>
    </div>`;
}

function statusBadge(b, currentTime) {
    if (b.checkedIn) return '<span class="badge badge-available"><i class="fas fa-check"></i> Present</span>';
    if (b.status === 'auto-released') return '<span class="badge badge-maintenance">Auto-Released</span>';
    if (b.endTime <= currentTime) return '<span class="badge badge-occupied">Missed</span>';
    return '<span class="badge badge-upcoming">Pending</span>';
}

function timeToMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function formatTime(t) { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; }
function updatePageTitle(t, s) { const a = document.getElementById('page-title'), b = document.getElementById('page-subtitle'); if (a) a.textContent = t; if (b) b.textContent = s || ''; }
