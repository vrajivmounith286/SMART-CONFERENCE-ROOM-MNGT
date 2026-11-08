// ===== BOOKING VIEW =====
import * as store from '../data/store.js';
import { getCurrentUser } from '../auth.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';

export function renderBooking(container) {
    const user = getCurrentUser();
    const offices = store.getOffices();
    const rooms = store.getRooms();
    const allUsers = store.getUsers();
    const today = new Date().toISOString().split('T')[0];

    container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xl)">
      <div>
        <h2 style="font-size:var(--fs-2xl)">Book a Meeting Room</h2>
        <p style="color:var(--text-secondary)">Find and book the perfect room for your meeting</p>
      </div>
    </div>

    <div class="booking-grid">
      <!-- Filters Panel -->
      <div class="card slide-up">
        <h3 class="card-title" style="margin-bottom:var(--space-md)"><i class="fas fa-filter" style="color:var(--brand-orange);margin-right:8px"></i>Search & Filter</h3>
        
        <div class="form-group">
          <label for="book-date">Date</label>
          <input type="date" id="book-date" value="${today}" min="${today}" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="book-start">Start Time</label>
            <select id="book-start">
              ${generateTimeOptions('09:00')}
            </select>
          </div>
          <div class="form-group">
            <label for="book-end">End Time</label>
            <select id="book-end">
              ${generateTimeOptions('10:00')}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="book-office">Office / Location</label>
          <select id="book-office">
            <option value="">All Offices</option>
            ${offices.map(o => `<option value="${o.id}">${o.name}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label for="book-capacity">Min. Capacity</label>
          <select id="book-capacity">
            <option value="">Any</option>
            <option value="4">4+ people</option>
            <option value="6">6+ people</option>
            <option value="10">10+ people</option>
            <option value="15">15+ people</option>
            <option value="20">20+ people</option>
          </select>
        </div>

        <div class="form-group">
          <label>Equipment Required</label>
          <div style="display:flex;flex-wrap:wrap;gap:6px" id="equip-filters">
            ${['projector', 'whiteboard', 'video-conferencing', 'tv-screen', 'speaker-system'].map(eq => `
              <label class="chip" style="cursor:pointer">
                <input type="checkbox" value="${eq}" style="display:none" class="equip-check">
                <i class="fas ${getEquipIcon(eq)}"></i> ${formatEquipName(eq)}
              </label>
            `).join('')}
          </div>
        </div>

        <button class="btn btn-primary btn-block" id="btn-search-rooms" style="margin-top:var(--space-md)">
          <i class="fas fa-search"></i> Search Available Rooms
        </button>
      </div>

      <!-- Results -->
      <div id="booking-results">
        <div class="empty-state" style="padding:var(--space-3xl)">
          <i class="fas fa-search" style="font-size:3rem;color:var(--brand-orange);opacity:0.3"></i>
          <h4>Search for Available Rooms</h4>
          <p>Select your preferred date, time, and requirements, then click search to find available rooms.</p>
        </div>
      </div>
    </div>
  `;

    // Equipment filter toggle styling
    container.querySelectorAll('.equip-check').forEach(cb => {
        cb.addEventListener('change', () => {
            const chip = cb.closest('.chip');
            if (cb.checked) {
                chip.style.borderColor = 'var(--brand-orange)';
                chip.style.background = 'rgba(232,101,45,0.1)';
                chip.style.color = 'var(--brand-orange)';
            } else {
                chip.style.borderColor = '';
                chip.style.background = '';
                chip.style.color = '';
            }
        });
    });

    // Search
    container.querySelector('#btn-search-rooms').addEventListener('click', () => {
        const date = container.querySelector('#book-date').value;
        const startTime = container.querySelector('#book-start').value;
        const endTime = container.querySelector('#book-end').value;
        const officeId = container.querySelector('#book-office').value;
        const minCapacity = parseInt(container.querySelector('#book-capacity').value) || 0;
        const equipment = Array.from(container.querySelectorAll('.equip-check:checked')).map(c => c.value);

        if (startTime >= endTime) {
            showToast('End time must be after start time', 'error');
            return;
        }

        const available = store.getAvailableRooms(date, startTime, endTime, { officeId, minCapacity, equipment });
        const resultsDiv = container.querySelector('#booking-results');

        if (available.length === 0) {
            resultsDiv.innerHTML = `
        <div class="empty-state" style="padding:var(--space-3xl)">
          <i class="fas fa-exclamation-circle" style="font-size:3rem;color:var(--color-warning);opacity:0.5"></i>
          <h4>No Rooms Available</h4>
          <p>Try adjusting your time, date, or filter criteria.</p>
        </div>
      `;
            return;
        }

        resultsDiv.innerHTML = `
      <div style="margin-bottom:var(--space-md);display:flex;align-items:center;justify-content:space-between">
        <h3><span style="color:var(--color-success)">${available.length}</span> room${available.length !== 1 ? 's' : ''} available</h3>
        <span class="badge badge-available">${date} · ${formatTime(startTime)} - ${formatTime(endTime)}</span>
      </div>
      <div class="grid-cards">
        ${available.map(room => {
            const office = store.getOfficeById(room.officeId);
            return `
            <div class="card room-card" data-room-id="${room.id}">
              <div class="room-card-img">
                <i class="fas ${room.icon}"></i>
              </div>
              <h4 style="margin-bottom:4px">${room.name}</h4>
              <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:8px">${office?.name.split('—')[0].trim()} · ${room.floor}</div>
              <div class="room-meta">
                <span class="room-meta-item"><i class="fas fa-users"></i> ${room.capacity} seats</span>
                ${room.zoomLink ? '<span class="room-meta-item"><i class="fas fa-video"></i> Zoom</span>' : ''}
              </div>
              <div class="room-equipment">
                ${room.equipment.map(eq => `<span class="chip"><i class="fas ${getEquipIcon(eq)}"></i> ${formatEquipName(eq)}</span>`).join('')}
              </div>
              <p style="font-size:var(--fs-xs);color:var(--text-secondary);margin-top:8px">${room.description || ''}</p>
              <div class="card-footer">
                <button class="btn btn-primary btn-sm btn-book-room" data-room="${room.id}">
                  <i class="fas fa-calendar-plus"></i> Book Now
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

        resultsDiv.querySelectorAll('.btn-book-room').forEach(btn => {
            btn.addEventListener('click', () => {
                showBookingModal(btn.dataset.room, date, startTime, endTime, allUsers, user);
            });
        });
    });

    updatePageTitle('Book Room', 'Find and reserve the perfect meeting space');
}

function showBookingModal(roomId, date, startTime, endTime, allUsers, currentUser) {
    const room = store.getRoomById(roomId);
    if (!room) return;

    openModal(`
    <div class="modal-header">
      <h3><i class="fas fa-calendar-plus" style="color:var(--brand-orange);margin-right:8px"></i>Confirm Booking</h3>
      <button class="modal-close"><i class="fas fa-times"></i></button>
    </div>

    <div style="background:var(--bg-tertiary);border-radius:var(--border-radius);padding:var(--space-md);margin-bottom:var(--space-md);display:flex;gap:var(--space-md);align-items:center">
      <div class="avatar avatar-lg" style="font-size:1.2rem"><i class="fas ${room.icon}"></i></div>
      <div>
        <div style="font-weight:600">${room.name}</div>
        <div style="font-size:var(--fs-xs);color:var(--text-muted)">${room.capacity} seats · ${room.floor}</div>
      </div>
      <span class="badge badge-available" style="margin-left:auto">${formatTime(startTime)} - ${formatTime(endTime)}</span>
    </div>

    <form id="booking-form">
      <div class="form-group">
        <label for="meeting-title">Meeting Title *</label>
        <input type="text" id="meeting-title" placeholder="e.g., Sprint Planning" required />
      </div>
      <div class="form-group">
        <label for="meeting-notes">Notes (optional)</label>
        <textarea id="meeting-notes" rows="2" placeholder="Add agenda or notes..."></textarea>
      </div>
      <div class="form-group">
        <label>Add Attendees</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px" id="attendee-list">
          ${allUsers.filter(u => u.id !== currentUser.id).map(u => `
            <label class="chip" style="cursor:pointer">
              <input type="checkbox" value="${u.id}" style="display:none" class="attendee-check">
              <span class="avatar" style="width:20px;height:20px;font-size:0.5rem">${u.initials}</span>
              ${u.name.split(' ')[0]}
            </label>
          `).join('')}
        </div>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="recurring-check" style="margin-right:6px" />
          Recurring Meeting
        </label>
        <select id="recurring-pattern" style="margin-top:8px;display:none" class="form-group">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <div style="display:flex;gap:var(--space-sm);justify-content:flex-end;margin-top:var(--space-lg)">
        <button type="button" class="btn btn-secondary" data-close-modal>Cancel</button>
        <button type="submit" class="btn btn-primary"><i class="fas fa-check"></i> Confirm Booking</button>
      </div>
    </form>
  `);

    // Attendee chip styling
    document.querySelectorAll('.attendee-check').forEach(cb => {
        cb.addEventListener('change', () => {
            const chip = cb.closest('.chip');
            chip.style.borderColor = cb.checked ? 'var(--brand-teal)' : '';
            chip.style.background = cb.checked ? 'rgba(0,184,169,0.1)' : '';
        });
    });

    // Recurring toggle
    document.getElementById('recurring-check')?.addEventListener('change', e => {
        document.getElementById('recurring-pattern').style.display = e.target.checked ? 'block' : 'none';
    });

    // Form submit
    document.getElementById('booking-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const title = document.getElementById('meeting-title').value.trim();
        if (!title) { showToast('Please enter a meeting title', 'warning'); return; }

        const attendees = [currentUser.id, ...Array.from(document.querySelectorAll('.attendee-check:checked')).map(c => c.value)];
        const recurring = document.getElementById('recurring-check').checked;
        const recurringPattern = recurring ? document.getElementById('recurring-pattern').value : null;

        store.addBooking({
            roomId,
            userId: currentUser.id,
            title,
            date,
            startTime,
            endTime,
            attendees,
            notes: document.getElementById('meeting-notes').value.trim(),
            recurring,
            recurringPattern,
        });

        closeModal();
        showToast(`Booked "${title}" in ${room.name}!`, 'success');

        // Refresh the results
        document.getElementById('btn-search-rooms')?.click();
    });
}

function generateTimeOptions(selectedValue) {
    const options = [];
    for (let h = 8; h <= 20; h++) {
        for (let m = 0; m < 60; m += 30) {
            const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            options.push(`<option value="${val}" ${val === selectedValue ? 'selected' : ''}>${formatTime(val)}</option>`);
        }
    }
    return options.join('');
}

function formatTime(t) {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getEquipIcon(eq) {
    const icons = { 'projector': 'fa-chalkboard', 'whiteboard': 'fa-pen', 'video-conferencing': 'fa-video', 'tv-screen': 'fa-tv', 'speaker-system': 'fa-volume-up', 'air-conditioning': 'fa-snowflake', 'sanitizer-station': 'fa-pump-soap', 'phone': 'fa-phone', '3d-printer': 'fa-cube', 'production-dashboard': 'fa-chart-line', 'tile-display-wall': 'fa-border-all', 'mini-kitchen': 'fa-coffee' };
    return icons[eq] || 'fa-cog';
}

function formatEquipName(eq) {
    return eq.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function updatePageTitle(title, subtitle) {
    const t = document.getElementById('page-title');
    const s = document.getElementById('page-subtitle');
    if (t) t.textContent = title;
    if (s) s.textContent = subtitle || '';
}
