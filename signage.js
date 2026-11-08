// ===== DIGITAL SIGNAGE VIEW =====
import * as store from '../data/store.js';

let signageInterval = null;
let currentRoomIndex = 0;

export function renderSignage(container) {
    const rooms = store.getRooms().filter(r => r.status !== 'maintenance');
    const settings = store.getSettings();

    container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xl)">
      <div>
        <h2 style="font-size:var(--fs-2xl)">Digital Signage</h2>
        <p style="color:var(--text-secondary)">Display room schedules on screens outside meeting rooms</p>
      </div>
      <div style="display:flex;gap:var(--space-sm)">
        <select id="signage-room" class="btn btn-secondary">
          <option value="auto">Auto-Rotate All Rooms</option>
          ${rooms.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
        </select>
        <button class="btn btn-primary" id="btn-fullscreen"><i class="fas fa-expand"></i> Fullscreen</button>
      </div>
    </div>

    <div id="signage-display" class="card" style="min-height:500px;padding:var(--space-2xl)">
      ${renderSignageContent(rooms[0])}
    </div>
  `;

    function updateSignage() {
        const select = container.querySelector('#signage-room');
        let room;
        if (select.value === 'auto') {
            room = rooms[currentRoomIndex % rooms.length];
            currentRoomIndex++;
        } else {
            room = rooms.find(r => r.id === select.value);
        }
        if (room) {
            container.querySelector('#signage-display').innerHTML = renderSignageContent(room);
        }
    }

    // Auto-rotate
    if (signageInterval) clearInterval(signageInterval);
    signageInterval = setInterval(updateSignage, (settings.signageRotateSeconds || 10) * 1000);

    container.querySelector('#signage-room')?.addEventListener('change', () => {
        updateSignage();
        if (container.querySelector('#signage-room').value !== 'auto') {
            clearInterval(signageInterval);
        } else {
            signageInterval = setInterval(updateSignage, (settings.signageRotateSeconds || 10) * 1000);
        }
    });

    container.querySelector('#btn-fullscreen')?.addEventListener('click', () => {
        const display = container.querySelector('#signage-display');
        if (display.requestFullscreen) display.requestFullscreen();
        else if (display.webkitRequestFullscreen) display.webkitRequestFullscreen();
    });

    updatePageTitle('Digital Signage', 'Real-time room status display');
}

function renderSignageContent(room) {
    if (!room) return '<div class="empty-state"><h4>No rooms available</h4></div>';

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const bookings = store.getBookingsForRoom(room.id, today).sort((a, b) => a.startTime.localeCompare(b.startTime));
    const currentBooking = bookings.find(b => currentTime >= b.startTime && currentTime < b.endTime);
    const nextBooking = bookings.find(b => b.startTime > currentTime);

    let statusClass, statusText, statusIcon;
    if (currentBooking) {
        statusClass = 'occupied'; statusText = 'In Use'; statusIcon = 'fa-lock';
    } else if (nextBooking) {
        const minsUntil = timeToMinutes(nextBooking.startTime) - timeToMinutes(currentTime);
        statusClass = minsUntil <= 15 ? 'upcoming' : 'available';
        statusText = minsUntil <= 15 ? `Starting in ${minsUntil} min` : 'Available';
        statusIcon = minsUntil <= 15 ? 'fa-clock' : 'fa-check-circle';
    } else {
        statusClass = 'available'; statusText = 'Available'; statusIcon = 'fa-check-circle';
    }

    const office = store.getOfficeById(room.officeId);

    return `
    <div style="display:flex;gap:var(--space-2xl);min-height:400px">
      <div style="flex:2;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
        <div class="signage-status-icon ${statusClass}">
          <i class="fas ${statusIcon}"></i>
        </div>
        <div class="signage-room-name">${room.name}</div>
        <div style="font-size:var(--fs-sm);color:var(--text-muted);margin-bottom:var(--space-md)">${office?.name || ''} · ${room.floor} · ${room.capacity} seats</div>
        <div class="signage-status-text" style="color:var(--status-${statusClass === 'upcoming' ? 'upcoming' : statusClass})">${statusText}</div>
        ${currentBooking ? `
          <div style="background:var(--bg-tertiary);border-radius:var(--border-radius);padding:var(--space-md) var(--space-xl);margin-top:var(--space-md)">
            <div style="font-weight:700;font-size:var(--fs-lg)">${currentBooking.title}</div>
            <div style="color:var(--text-secondary);margin-top:4px">${formatTime(currentBooking.startTime)} — ${formatTime(currentBooking.endTime)}</div>
            <div style="color:var(--text-muted);font-size:var(--fs-sm);margin-top:2px">${store.getUserById(currentBooking.userId)?.name || ''} · ${currentBooking.attendees?.length || 1} attendees</div>
          </div>
        ` : ''}
        <div class="signage-clock" id="signage-clock" style="margin-top:var(--space-xl)">${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <div style="flex:1;border-left:1px solid var(--border-color);padding-left:var(--space-xl)">
        <h3 style="margin-bottom:var(--space-lg);color:var(--text-secondary)"><i class="fas fa-list" style="margin-right:8px"></i>Today's Schedule</h3>
        ${bookings.length === 0 ? '<div style="color:var(--text-muted);text-align:center;padding:var(--space-xl)">No meetings scheduled</div>' : ''}
        <div class="timeline">
          ${bookings.map(b => {
        const isPast = b.endTime <= currentTime;
        const isNow = b.startTime <= currentTime && b.endTime > currentTime;
        return `
              <div class="timeline-item ${isNow ? 'active' : ''}" style="${isPast ? 'opacity:0.4' : ''}">
                <div class="timeline-time">${formatTime(b.startTime)} — ${formatTime(b.endTime)}</div>
                <div class="timeline-title">${b.title}</div>
                <div class="timeline-desc">${store.getUserById(b.userId)?.name || ''}</div>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    </div>
  `;
}

function timeToMinutes(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function formatTime(t) { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; }
function updatePageTitle(t, s) { const a = document.getElementById('page-title'), b = document.getElementById('page-subtitle'); if (a) a.textContent = t; if (b) b.textContent = s || ''; }

export function cleanupSignage() {
    if (signageInterval) { clearInterval(signageInterval); signageInterval = null; }
}
