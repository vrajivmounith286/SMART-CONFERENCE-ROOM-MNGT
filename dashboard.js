// ===== DASHBOARD VIEW =====
import * as store from '../data/store.js';
import { getCurrentUser } from '../auth.js';
import { navigate } from '../router.js';

export function renderDashboard(container) {
    const user = getCurrentUser();
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = store.getTodaysBookings();
    const myBookings = todayBookings.filter(b => b.userId === user.id || b.attendees?.includes(user.id));
    const allRooms = store.getRooms();
    const offices = store.getOffices();
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Compute stats
    const availableNow = allRooms.filter(r => {
        if (r.status === 'maintenance') return false;
        const roomBookings = store.getBookingsForRoom(r.id, today);
        return !roomBookings.some(b => currentTime >= b.startTime && currentTime < b.endTime);
    }).length;
    const occupiedNow = allRooms.filter(r => r.status !== 'maintenance').length - availableNow;
    const totalToday = todayBookings.length;
    const checkedInToday = todayBookings.filter(b => b.checkedIn).length;

    container.innerHTML = `
    <div class="dashboard-welcome slide-up">
      <h2>Good ${getGreeting()}, ${user.name.split(' ')[0]}! 👋</h2>
      <p>You have <strong>${myBookings.length}</strong> meeting${myBookings.length !== 1 ? 's' : ''} scheduled today. ${availableNow} room${availableNow !== 1 ? 's' : ''} available right now.</p>
    </div>

    <div class="grid-stats slide-up" style="animation-delay: 0.1s">
      <div class="stat-card">
        <div class="stat-icon orange"><i class="fas fa-calendar-check"></i></div>
        <div class="stat-value">${totalToday}</div>
        <div class="stat-label">Bookings Today</div>
        <div class="stat-change positive"><i class="fas fa-arrow-up"></i> Active</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green"><i class="fas fa-door-open"></i></div>
        <div class="stat-value">${availableNow}</div>
        <div class="stat-label">Rooms Available</div>
        <div class="stat-change positive"><i class="fas fa-circle"></i> Now</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red"><i class="fas fa-users"></i></div>
        <div class="stat-value">${occupiedNow}</div>
        <div class="stat-label">Rooms Occupied</div>
        <div class="stat-change"><i class="fas fa-clock"></i> Current</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon teal"><i class="fas fa-user-check"></i></div>
        <div class="stat-value">${checkedInToday}</div>
        <div class="stat-label">Checked In</div>
        <div class="stat-change positive"><i class="fas fa-check"></i> of ${totalToday}</div>
      </div>
    </div>

    <div class="grid-2" style="margin-top: var(--space-xl)">
      <div class="card slide-up" style="animation-delay: 0.2s">
        <div class="card-header">
          <h3 class="card-title"><i class="fas fa-clock" style="color: var(--brand-orange); margin-right: 8px"></i>My Schedule Today</h3>
          <button class="btn btn-secondary btn-sm" id="btn-book-quick"><i class="fas fa-plus"></i> Book</button>
        </div>
        <div class="card-body" id="my-schedule">
          ${myBookings.length === 0 ? `
            <div class="empty-state">
              <i class="fas fa-calendar-check"></i>
              <h4>No meetings today</h4>
              <p>You're free! Book a room to get started.</p>
            </div>
          ` : `
            <div class="timeline">
              ${myBookings.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(b => {
        const room = store.getRoomById(b.roomId);
        const isPast = b.endTime <= currentTime;
        const isNow = b.startTime <= currentTime && b.endTime > currentTime;
        return `
                  <div class="timeline-item ${isNow ? 'active' : ''}">
                    <div class="timeline-time">${formatTime(b.startTime)} — ${formatTime(b.endTime)}</div>
                    <div class="timeline-title">${b.title}</div>
                    <div class="timeline-desc">${room?.name || 'Unknown Room'} · ${b.attendees?.length || 1} attendees</div>
                    ${isNow && !b.checkedIn ? `<button class="btn btn-success btn-sm" style="margin-top:6px" data-checkin="${b.id}"><i class="fas fa-check"></i> Check In</button>` : ''}
                    ${b.checkedIn ? '<span class="badge badge-available" style="margin-top:4px"><i class="fas fa-check"></i> Checked In</span>' : ''}
                    ${isPast && !b.checkedIn ? '<span class="badge badge-maintenance" style="margin-top:4px">Missed</span>' : ''}
                  </div>
                `;
    }).join('')}
            </div>
          `}
        </div>
      </div>

      <div class="card slide-up" style="animation-delay: 0.3s">
        <div class="card-header">
          <h3 class="card-title"><i class="fas fa-door-open" style="color: var(--brand-teal); margin-right: 8px"></i>Room Status</h3>
          <button class="btn btn-secondary btn-sm" id="btn-view-rooms"><i class="fas fa-grid"></i> All</button>
        </div>
        <div class="card-body">
          ${allRooms.slice(0, 6).map(room => {
        const roomBookings = store.getBookingsForRoom(room.id, today);
        const currentBooking = roomBookings.find(b => currentTime >= b.startTime && currentTime < b.endTime);
        const nextBooking = roomBookings.find(b => b.startTime > currentTime);
        const office = offices.find(o => o.id === room.officeId);
        let statusClass, statusText;
        if (room.status === 'maintenance') {
            statusClass = 'maintenance'; statusText = 'Maintenance';
        } else if (currentBooking) {
            statusClass = 'occupied'; statusText = 'Occupied';
        } else if (nextBooking) {
            statusClass = 'upcoming'; statusText = `Free until ${formatTime(nextBooking.startTime)}`;
        } else {
            statusClass = 'available'; statusText = 'Available';
        }
        return `
              <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-color-light)">
                <div class="avatar" style="font-size:0.8rem"><i class="fas ${room.icon}"></i></div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:var(--fs-sm)">${room.name}</div>
                  <div style="font-size:var(--fs-xs);color:var(--text-muted)">${office?.name.split('—')[0].trim() || ''} · ${room.capacity} seats</div>
                </div>
                <span class="badge badge-${statusClass}">${statusText}</span>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    </div>

    <div class="card slide-up" style="margin-top: var(--space-xl); animation-delay: 0.4s">
      <div class="card-header">
        <h3 class="card-title"><i class="fas fa-list" style="color: var(--color-info); margin-right: 8px"></i>All Bookings Today</h3>
        <span class="badge badge-employee">${todayBookings.length} total</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Meeting</th>
              <th>Room</th>
              <th>Organizer</th>
              <th>Attendees</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${todayBookings.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(b => {
        const room = store.getRoomById(b.roomId);
        const organizer = store.getUserById(b.userId);
        return `
                <tr>
                  <td style="white-space:nowrap">${formatTime(b.startTime)} — ${formatTime(b.endTime)}</td>
                  <td><strong>${b.title}</strong></td>
                  <td>${room?.name || 'N/A'}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div class="avatar" style="width:28px;height:28px;font-size:0.6rem">${organizer?.initials || '?'}</div>
                      ${organizer?.name || 'Unknown'}
                    </div>
                  </td>
                  <td>${b.attendees?.length || 1}</td>
                  <td>${b.checkedIn ? '<span class="badge badge-available">Checked In</span>' : b.status === 'auto-released' ? '<span class="badge badge-maintenance">Released</span>' : '<span class="badge badge-upcoming">Pending</span>'}</td>
                </tr>
              `;
    }).join('')}
            ${todayBookings.length === 0 ? '<tr><td colspan="6" class="empty-state"><i class="fas fa-calendar"></i><h4>No bookings today</h4></td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;

    // Event listeners
    container.querySelector('#btn-book-quick')?.addEventListener('click', () => navigate('/booking'));
    container.querySelector('#btn-view-rooms')?.addEventListener('click', () => navigate('/rooms'));
    container.querySelectorAll('[data-checkin]').forEach(btn => {
        btn.addEventListener('click', () => {
            store.checkIn(btn.dataset.checkin);
            renderDashboard(container);
            import('../components/toast.js').then(m => m.showToast('Checked in successfully!', 'success'));
        });
    });

    updatePageTitle('Dashboard', `${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
}

function formatTime(t) {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function updatePageTitle(title, subtitle) {
    const t = document.getElementById('page-title');
    const s = document.getElementById('page-subtitle');
    if (t) t.textContent = title;
    if (s) s.textContent = subtitle || '';
}
