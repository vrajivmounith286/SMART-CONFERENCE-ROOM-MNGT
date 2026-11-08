// ===== CALENDAR VIEW =====
import * as store from '../data/store.js';
import { navigate } from '../router.js';

export function renderCalendar(container) {
    let viewDate = new Date();
    let viewMode = 'month'; // 'month' or 'week'

    function render() {
        const rooms = store.getRooms();
        const bookings = store.getBookings().filter(b => b.status !== 'cancelled');

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xl);flex-wrap:wrap;gap:var(--space-md)">
        <div>
          <h2 style="font-size:var(--fs-2xl)">Calendar</h2>
          <p style="color:var(--text-secondary)">Overview of all room bookings</p>
        </div>
        <div style="display:flex;gap:var(--space-sm);align-items:center">
          <div class="tabs" style="margin-bottom:0;width:auto">
            <button class="tab ${viewMode === 'month' ? 'active' : ''}" data-mode="month">Month</button>
            <button class="tab ${viewMode === 'week' ? 'active' : ''}" data-mode="week">Week</button>
          </div>
          <button class="btn btn-icon" id="cal-prev"><i class="fas fa-chevron-left"></i></button>
          <span style="font-weight:600;min-width:180px;text-align:center">${monthNames[viewDate.getMonth()]} ${viewDate.getFullYear()}</span>
          <button class="btn btn-icon" id="cal-next"><i class="fas fa-chevron-right"></i></button>
          <button class="btn btn-secondary btn-sm" id="cal-today">Today</button>
        </div>
      </div>

      ${viewMode === 'month' ? renderMonthView(viewDate, bookings, rooms, dayNames) : renderWeekView(viewDate, bookings, rooms, dayNames)}
    `;

        container.querySelectorAll('.tab').forEach(btn => {
            btn.addEventListener('click', () => { viewMode = btn.dataset.mode; render(); });
        });
        container.querySelector('#cal-prev')?.addEventListener('click', () => {
            if (viewMode === 'month') viewDate.setMonth(viewDate.getMonth() - 1);
            else viewDate.setDate(viewDate.getDate() - 7);
            render();
        });
        container.querySelector('#cal-next')?.addEventListener('click', () => {
            if (viewMode === 'month') viewDate.setMonth(viewDate.getMonth() + 1);
            else viewDate.setDate(viewDate.getDate() + 7);
            render();
        });
        container.querySelector('#cal-today')?.addEventListener('click', () => { viewDate = new Date(); render(); });

        container.querySelectorAll('.calendar-cell[data-date]').forEach(cell => {
            cell.addEventListener('click', () => navigate('/booking'));
        });

        updatePageTitle('Calendar', 'Overview of all room bookings');
    }

    render();
}

function renderMonthView(viewDate, bookings, rooms, dayNames) {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const today = new Date().toISOString().split('T')[0];
    const colors = ['event-orange', 'event-teal', 'event-blue', 'event-green'];

    let cells = '';
    // Header
    cells += dayNames.map(d => `<div class="calendar-header-cell">${d}</div>`).join('');
    // Previous month fill
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        cells += `<div class="calendar-cell other-month"><div class="calendar-day">${day}</div></div>`;
    }
    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateStr === today;
        const dayBookings = bookings.filter(b => b.date === dateStr);
        cells += `
      <div class="calendar-cell ${isToday ? 'today' : ''}" data-date="${dateStr}">
        <div class="calendar-day">${day}</div>
        ${dayBookings.slice(0, 3).map((b, i) => {
            const room = rooms.find(r => r.id === b.roomId);
            return `<div class="calendar-event ${colors[i % colors.length]}" title="${b.title} — ${room?.name || ''}">${formatTime(b.startTime)} ${b.title}</div>`;
        }).join('')}
        ${dayBookings.length > 3 ? `<div style="font-size:0.6rem;color:var(--text-muted)">+${dayBookings.length - 3} more</div>` : ''}
      </div>
    `;
    }
    // Next month fill
    const totalCells = firstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
        cells += `<div class="calendar-cell other-month"><div class="calendar-day">${i}</div></div>`;
    }

    return `<div class="calendar-grid">${cells}</div>`;
}

function renderWeekView(viewDate, bookings, rooms, dayNames) {
    const startOfWeek = new Date(viewDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const today = new Date().toISOString().split('T')[0];
    const colors = ['event-orange', 'event-teal', 'event-blue', 'event-green'];

    let days = '';
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const isToday = dateStr === today;
        const dayBookings = bookings.filter(b => b.date === dateStr);

        days += `
      <div class="card ${isToday ? 'today' : ''}" style="min-height:300px;${isToday ? 'border-color:var(--brand-orange)' : ''}" data-date="${dateStr}">
        <div style="text-align:center;margin-bottom:var(--space-md)">
          <div style="font-size:var(--fs-xs);color:var(--text-muted)">${dayNames[i]}</div>
          <div style="font-size:var(--fs-xl);font-weight:700;${isToday ? 'color:var(--brand-orange)' : ''}">${d.getDate()}</div>
        </div>
        ${dayBookings.length === 0 ? '<div style="text-align:center;color:var(--text-muted);font-size:var(--fs-xs)">No bookings</div>' : ''}
        ${dayBookings.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((b, idx) => {
            const room = rooms.find(r => r.id === b.roomId);
            return `
            <div class="calendar-event ${colors[idx % colors.length]}" style="padding:8px;margin-bottom:6px;border-radius:var(--border-radius-sm)">
              <div style="font-weight:600;font-size:var(--fs-xs)">${b.title}</div>
              <div style="font-size:0.65rem;opacity:0.8">${formatTime(b.startTime)} - ${formatTime(b.endTime)}</div>
              <div style="font-size:0.65rem;opacity:0.6">${room?.name || ''}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    }

    return `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:var(--space-sm)">${days}</div>`;
}

function formatTime(t) { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h >= 12 ? 'p' : 'a'}`; }
function updatePageTitle(t, s) { const a = document.getElementById('page-title'), b = document.getElementById('page-subtitle'); if (a) a.textContent = t; if (b) b.textContent = s || ''; }
