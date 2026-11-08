// ===== ROOMS VIEW =====
import * as store from '../data/store.js';
import { isAdmin } from '../auth.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';

export function renderRooms(container) {
    const rooms = store.getRooms();
    const offices = store.getOffices();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xl);flex-wrap:wrap;gap:var(--space-md)">
      <div>
        <h2 style="font-size:var(--fs-2xl)">Room Directory</h2>
        <p style="color:var(--text-secondary)">Manage and view all conference rooms across offices</p>
      </div>
      <div style="display:flex;gap:var(--space-sm)">
        <select id="filter-office" class="btn btn-secondary">
          <option value="">All Offices</option>
          ${offices.map(o => `<option value="${o.id}">${o.name.split('—')[0].trim()}</option>`).join('')}
        </select>
        ${isAdmin() ? '<button class="btn btn-primary" id="btn-add-room"><i class="fas fa-plus"></i> Add Room</button>' : ''}
      </div>
    </div>

    <div class="grid-cards" id="rooms-grid">
      ${renderRoomCards(rooms, offices, today, currentTime)}
    </div>
  `;

    // Filter
    container.querySelector('#filter-office')?.addEventListener('change', e => {
        const filtered = e.target.value ? rooms.filter(r => r.officeId === e.target.value) : rooms;
        container.querySelector('#rooms-grid').innerHTML = renderRoomCards(filtered, offices, today, currentTime);
        wireRoomActions(container);
    });

    // Add room
    container.querySelector('#btn-add-room')?.addEventListener('click', () => showRoomModal(null, offices, container));

    wireRoomActions(container);
    updatePageTitle('Rooms', `${rooms.length} rooms across ${offices.length} locations`);
}

function renderRoomCards(rooms, offices, today, currentTime) {
    return rooms.map(room => {
        const office = offices.find(o => o.id === room.officeId);
        const roomBookings = store.getBookingsForRoom(room.id, today);
        const currentBooking = roomBookings.find(b => currentTime >= b.startTime && currentTime < b.endTime);
        const nextBooking = roomBookings.filter(b => b.startTime > currentTime).sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
        let statusClass, statusText;
        if (room.status === 'maintenance') { statusClass = 'maintenance'; statusText = 'Maintenance'; }
        else if (currentBooking) { statusClass = 'occupied'; statusText = 'In Use'; }
        else { statusClass = 'available'; statusText = 'Available'; }

        return `
      <div class="card room-card slide-up">
        <div class="room-card-img"><i class="fas ${room.icon}"></i></div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <h4>${room.name}</h4>
          <span class="badge badge-${statusClass}">${statusText}</span>
        </div>
        <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:var(--space-sm)">${office?.name || ''} · ${room.floor}</div>
        <div class="room-meta">
          <span class="room-meta-item"><i class="fas fa-users"></i> ${room.capacity} seats</span>
          ${room.zoomLink ? '<span class="room-meta-item"><i class="fas fa-video"></i> Zoom</span>' : ''}
          <span class="room-meta-item"><i class="fas fa-calendar"></i> ${roomBookings.length} today</span>
        </div>
        <div class="room-equipment">${room.equipment.map(eq => `<span class="chip"><i class="fas ${getEquipIcon(eq)}"></i> ${formatEquip(eq)}</span>`).join('')}</div>
        ${currentBooking ? `<div style="margin-top:var(--space-sm);padding:8px 12px;background:var(--color-error-bg);border-radius:var(--border-radius-sm);font-size:var(--fs-xs)"><strong>Now:</strong> ${currentBooking.title} (until ${formatTime(currentBooking.endTime)})</div>` : ''}
        ${!currentBooking && nextBooking ? `<div style="margin-top:var(--space-sm);padding:8px 12px;background:var(--color-warning-bg);border-radius:var(--border-radius-sm);font-size:var(--fs-xs)"><strong>Next:</strong> ${nextBooking.title} at ${formatTime(nextBooking.startTime)}</div>` : ''}
        ${isAdmin() ? `
          <div class="card-footer">
            <button class="btn btn-secondary btn-sm btn-edit-room" data-room="${room.id}"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn btn-danger btn-sm btn-delete-room" data-room="${room.id}"><i class="fas fa-trash"></i></button>
          </div>
        ` : ''}
      </div>
    `;
    }).join('');
}

function wireRoomActions(container) {
    container.querySelectorAll('.btn-edit-room').forEach(btn => {
        btn.addEventListener('click', () => {
            const room = store.getRoomById(btn.dataset.room);
            if (room) showRoomModal(room, store.getOffices(), container);
        });
    });
    container.querySelectorAll('.btn-delete-room').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('Delete this room? This cannot be undone.')) {
                store.deleteRoom(btn.dataset.room);
                renderRooms(container);
                showToast('Room deleted', 'info');
            }
        });
    });
}

function showRoomModal(room, offices, container) {
    const isEdit = !!room;
    openModal(`
    <div class="modal-header">
      <h3>${isEdit ? 'Edit Room' : 'Add New Room'}</h3>
      <button class="modal-close"><i class="fas fa-times"></i></button>
    </div>
    <form id="room-form">
      <div class="form-group">
        <label>Room Name *</label>
        <input type="text" id="room-name" value="${room?.name || ''}" required placeholder="e.g., Innovation Lab" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Office *</label>
          <select id="room-office" required>
            ${offices.map(o => `<option value="${o.id}" ${room?.officeId === o.id ? 'selected' : ''}>${o.name.split('—')[0].trim()}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Floor</label>
          <input type="text" id="room-floor" value="${room?.floor || ''}" placeholder="e.g., 3rd Floor" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Capacity *</label>
          <input type="number" id="room-capacity" value="${room?.capacity || 8}" min="1" max="100" required />
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="room-status">
            <option value="available" ${room?.status === 'available' ? 'selected' : ''}>Available</option>
            <option value="maintenance" ${room?.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Zoom Link</label>
        <input type="url" id="room-zoom" value="${room?.zoomLink || ''}" placeholder="https://zoom.us/j/..." />
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="room-desc" rows="2" placeholder="Brief description...">${room?.description || ''}</textarea>
      </div>
      <div style="display:flex;gap:var(--space-sm);justify-content:flex-end;margin-top:var(--space-lg)">
        <button type="button" class="btn btn-secondary" data-close-modal>Cancel</button>
        <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> ${isEdit ? 'Update' : 'Create'} Room</button>
      </div>
    </form>
  `);

    document.getElementById('room-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const data = {
            name: document.getElementById('room-name').value.trim(),
            officeId: document.getElementById('room-office').value,
            floor: document.getElementById('room-floor').value.trim(),
            capacity: parseInt(document.getElementById('room-capacity').value),
            status: document.getElementById('room-status').value,
            zoomLink: document.getElementById('room-zoom').value.trim(),
            description: document.getElementById('room-desc').value.trim(),
            equipment: room?.equipment || ['whiteboard'],
            icon: room?.icon || 'fa-door-open',
        };
        if (isEdit) {
            store.updateRoom(room.id, data);
            showToast('Room updated!', 'success');
        } else {
            store.addRoom(data);
            showToast('Room created!', 'success');
        }
        closeModal();
        renderRooms(container);
    });
}

function getEquipIcon(eq) {
    const icons = { 'projector': 'fa-chalkboard', 'whiteboard': 'fa-pen', 'video-conferencing': 'fa-video', 'tv-screen': 'fa-tv', 'speaker-system': 'fa-volume-up', 'air-conditioning': 'fa-snowflake', 'sanitizer-station': 'fa-pump-soap', 'phone': 'fa-phone', '3d-printer': 'fa-cube', 'production-dashboard': 'fa-chart-line', 'tile-display-wall': 'fa-border-all', 'mini-kitchen': 'fa-coffee' };
    return icons[eq] || 'fa-cog';
}
function formatEquip(eq) { return eq.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '); }
function formatTime(t) { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; }
function updatePageTitle(t, s) { const a = document.getElementById('page-title'), b = document.getElementById('page-subtitle'); if (a) a.textContent = t; if (b) b.textContent = s || ''; }
