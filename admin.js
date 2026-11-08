// ===== ADMIN PANEL VIEW =====
import * as store from '../data/store.js';
import { isAdmin } from '../auth.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';

export function renderAdmin(container) {
    if (!isAdmin()) {
        container.innerHTML = `
      <div class="card" style="text-align:center;padding:var(--space-3xl)">
        <i class="fas fa-lock" style="font-size:3rem;color:var(--color-error);opacity:0.4;margin-bottom:var(--space-md)"></i>
        <h3>Access Denied</h3>
        <p style="color:var(--text-muted)">You need admin privileges to access this panel.</p>
      </div>
    `;
        return;
    }

    const users = store.getUsers();
    const rooms = store.getRooms();
    const offices = store.getOffices();
    const settings = store.getSettings();

    container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xl)">
      <div>
        <h2 style="font-size:var(--fs-2xl)">Admin Panel</h2>
        <p style="color:var(--text-secondary)">Manage system settings, users, and rooms</p>
      </div>
      <button class="btn btn-danger btn-sm" id="btn-reset-data"><i class="fas fa-undo"></i> Reset All Data</button>
    </div>

    <!-- Tabs -->
    <div class="tabs" id="admin-tabs">
      <button class="tab active" data-tab="settings">Settings</button>
      <button class="tab" data-tab="users">Users</button>
      <button class="tab" data-tab="rooms">Rooms</button>
      <button class="tab" data-tab="branding">Branding</button>
    </div>

    <div id="admin-tab-content"></div>
  `;

    let activeTab = 'settings';

    function renderTab() {
        const content = container.querySelector('#admin-tab-content');
        switch (activeTab) {
            case 'settings': renderSettingsTab(content, settings); break;
            case 'users': renderUsersTab(content, users); break;
            case 'rooms': renderRoomsTab(content, rooms, offices); break;
            case 'branding': renderBrandingTab(content, settings); break;
        }
    }

    container.querySelectorAll('.tab').forEach(t => {
        t.addEventListener('click', () => {
            container.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            activeTab = t.dataset.tab;
            renderTab();
        });
    });

    container.querySelector('#btn-reset-data')?.addEventListener('click', () => {
        if (confirm('Reset all data to defaults? This will erase all bookings and changes.')) {
            store.resetData();
            showToast('All data reset to defaults', 'info');
            renderAdmin(container);
        }
    });

    renderTab();
    updatePageTitle('Admin Panel', 'System configuration and management');
}

function renderSettingsTab(content, settings) {
    content.innerHTML = `
    <div class="admin-section slide-up">
      <h3 style="margin-bottom:var(--space-lg)"><i class="fas fa-sliders-h" style="color:var(--brand-orange);margin-right:8px"></i>Booking Policies</h3>
      <div class="settings-grid">
        <div class="setting-item">
          <div class="setting-info">
            <h4>Auto-Release Timer</h4>
            <p>Release room if no check-in after this many minutes</p>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="number" id="set-autorelease" value="${settings.autoReleaseMinutes}" min="5" max="60" style="width:70px;padding:8px;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--border-radius-sm);color:var(--text-primary);text-align:center" />
            <span style="font-size:var(--fs-xs);color:var(--text-muted)">min</span>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <h4>Max Booking Duration</h4>
            <p>Maximum hours for a single booking</p>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="number" id="set-maxduration" value="${settings.maxBookingDurationHours}" min="1" max="12" style="width:70px;padding:8px;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--border-radius-sm);color:var(--text-primary);text-align:center" />
            <span style="font-size:var(--fs-xs);color:var(--text-muted)">hrs</span>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <h4>Advance Booking</h4>
            <p>How many days in advance can rooms be booked</p>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="number" id="set-advance" value="${settings.advanceBookingDays}" min="1" max="90" style="width:70px;padding:8px;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--border-radius-sm);color:var(--text-primary);text-align:center" />
            <span style="font-size:var(--fs-xs);color:var(--text-muted)">days</span>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <h4>Allow Recurring Meetings</h4>
            <p>Enable recurring booking patterns</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="set-recurring" ${settings.allowRecurring ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <h4>Require Approval</h4>
            <p>Require manager approval for bookings</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="set-approval" ${settings.requireApproval ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <h4>Working Hours</h4>
            <p>Allowed booking hours</p>
          </div>
          <div style="display:flex;align-items:center;gap:4px;font-size:var(--fs-sm)">
            <input type="time" id="set-workhrs-start" value="${settings.workingHoursStart}" style="padding:6px;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--border-radius-sm);color:var(--text-primary)" />
            <span style="color:var(--text-muted)">to</span>
            <input type="time" id="set-workhrs-end" value="${settings.workingHoursEnd}" style="padding:6px;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--border-radius-sm);color:var(--text-primary)" />
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <h4>Signage Rotation</h4>
            <p>Seconds between room changes on digital signage</p>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="number" id="set-signage" value="${settings.signageRotateSeconds}" min="5" max="60" style="width:70px;padding:8px;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--border-radius-sm);color:var(--text-primary);text-align:center" />
            <span style="font-size:var(--fs-xs);color:var(--text-muted)">sec</span>
          </div>
        </div>
      </div>
      <div style="margin-top:var(--space-lg);display:flex;justify-content:flex-end">
        <button class="btn btn-primary" id="btn-save-settings"><i class="fas fa-save"></i> Save Settings</button>
      </div>
    </div>
  `;

    content.querySelector('#btn-save-settings')?.addEventListener('click', () => {
        store.updateSettings({
            autoReleaseMinutes: parseInt(document.getElementById('set-autorelease').value) || 15,
            maxBookingDurationHours: parseInt(document.getElementById('set-maxduration').value) || 4,
            advanceBookingDays: parseInt(document.getElementById('set-advance').value) || 30,
            allowRecurring: document.getElementById('set-recurring').checked,
            requireApproval: document.getElementById('set-approval').checked,
            workingHoursStart: document.getElementById('set-workhrs-start').value || '08:00',
            workingHoursEnd: document.getElementById('set-workhrs-end').value || '20:00',
            signageRotateSeconds: parseInt(document.getElementById('set-signage').value) || 10,
        });
        showToast('Settings saved!', 'success');
    });
}

function renderUsersTab(content, users) {
    content.innerHTML = `
    <div class="admin-section slide-up">
      <div class="admin-section-header">
        <h3><i class="fas fa-users-cog" style="color:var(--brand-teal);margin-right:8px"></i>User Management</h3>
        <span class="badge badge-employee">${users.length} users</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Department</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="avatar" style="width:32px;height:32px;font-size:0.6rem">${u.initials}</div>
                    <strong>${u.name}</strong>
                  </div>
                </td>
                <td style="color:var(--text-secondary)">${u.email}</td>
                <td>${u.department}</td>
                <td>
                  <span class="badge badge-${u.role}">${u.role}</span>
                </td>
                <td>
                  <select class="role-select" data-user="${u.id}" style="padding:6px 10px;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--border-radius-sm);color:var(--text-primary);font-size:var(--fs-xs)">
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                    <option value="manager" ${u.role === 'manager' ? 'selected' : ''}>Manager</option>
                    <option value="employee" ${u.role === 'employee' ? 'selected' : ''}>Employee</option>
                  </select>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

    content.querySelectorAll('.role-select').forEach(sel => {
        sel.addEventListener('change', () => {
            store.updateUser(sel.dataset.user, { role: sel.value });
            showToast(`Role updated to ${sel.value}`, 'success');
        });
    });
}

function renderRoomsTab(content, rooms, offices) {
    content.innerHTML = `
    <div class="admin-section slide-up">
      <div class="admin-section-header">
        <h3><i class="fas fa-building" style="color:var(--color-info);margin-right:8px"></i>Room Management</h3>
        <span class="badge badge-employee">${rooms.length} rooms across ${offices.length} offices</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Room</th>
              <th>Office</th>
              <th>Floor</th>
              <th>Capacity</th>
              <th>Equipment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rooms.map(r => {
        const office = offices.find(o => o.id === r.officeId);
        return `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div class="avatar" style="width:32px;height:32px;font-size:0.7rem"><i class="fas ${r.icon}"></i></div>
                      <strong>${r.name}</strong>
                    </div>
                  </td>
                  <td style="font-size:var(--fs-xs);color:var(--text-secondary)">${office?.name.split('—')[0].trim() || ''}</td>
                  <td>${r.floor}</td>
                  <td>${r.capacity}</td>
                  <td><div style="display:flex;flex-wrap:wrap;gap:2px">${r.equipment.slice(0, 3).map(e => `<span class="chip" style="font-size:0.6rem">${e}</span>`).join('')}${r.equipment.length > 3 ? `<span class="chip" style="font-size:0.6rem">+${r.equipment.length - 3}</span>` : ''}</div></td>
                  <td><span class="badge badge-${r.status === 'available' ? 'available' : 'maintenance'}">${r.status}</span></td>
                </tr>
              `;
    }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderBrandingTab(content, settings) {
    content.innerHTML = `
    <div class="admin-section slide-up">
      <h3 style="margin-bottom:var(--space-lg)"><i class="fas fa-paint-brush" style="color:var(--brand-orange);margin-right:8px"></i>Branding & Customization</h3>
      <div class="settings-grid">
        <div class="card">
          <div class="form-group">
            <label>Organization Name</label>
            <input type="text" id="set-brand-name" value="${settings.brandName || 'Orientbell'}" />
          </div>
          <div class="form-group">
            <label>Tagline</label>
            <input type="text" id="set-brand-tagline" value="${settings.brandTagline || ''}" />
          </div>
          <button class="btn btn-primary btn-sm" id="btn-save-branding"><i class="fas fa-save"></i> Save Branding</button>
        </div>
        <div class="card">
          <h4 style="margin-bottom:var(--space-md)">Current Theme</h4>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <div style="width:48px;height:48px;border-radius:var(--border-radius-sm);background:var(--brand-orange);display:flex;align-items:center;justify-content:center;color:white;font-size:var(--fs-xs)">Primary</div>
            <div style="width:48px;height:48px;border-radius:var(--border-radius-sm);background:var(--brand-teal);display:flex;align-items:center;justify-content:center;color:white;font-size:var(--fs-xs)">Accent</div>
            <div style="width:48px;height:48px;border-radius:var(--border-radius-sm);background:var(--bg-secondary);display:flex;align-items:center;justify-content:center;color:var(--text-primary);font-size:var(--fs-xs);border:1px solid var(--border-color)">BG</div>
            <div style="width:48px;height:48px;border-radius:var(--border-radius-sm);background:var(--bg-card);display:flex;align-items:center;justify-content:center;color:var(--text-primary);font-size:var(--fs-xs);border:1px solid var(--border-color)">Card</div>
          </div>
          <p style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:var(--space-md)">Dark glassmorphism theme with Orientbell brand colors</p>
        </div>
      </div>
    </div>

    <div class="admin-section" style="margin-top:var(--space-xl)">
      <h3 style="margin-bottom:var(--space-lg)"><i class="fas fa-info-circle" style="color:var(--color-info);margin-right:8px"></i>System Information</h3>
      <div class="settings-grid">
        <div class="setting-item">
          <div class="setting-info"><h4>Version</h4><p>Application version</p></div>
          <span class="badge badge-available">v1.0.0</span>
        </div>
        <div class="setting-item">
          <div class="setting-info"><h4>Data Storage</h4><p>Storage type</p></div>
          <span class="badge badge-employee">localStorage</span>
        </div>
        <div class="setting-item">
          <div class="setting-info"><h4>Total Users</h4><p>Registered users</p></div>
          <span style="font-weight:700">${store.getUsers().length}</span>
        </div>
        <div class="setting-item">
          <div class="setting-info"><h4>Total Rooms</h4><p>Configured rooms</p></div>
          <span style="font-weight:700">${store.getRooms().length}</span>
        </div>
      </div>
    </div>
  `;

    content.querySelector('#btn-save-branding')?.addEventListener('click', () => {
        store.updateSettings({
            brandName: document.getElementById('set-brand-name').value.trim(),
            brandTagline: document.getElementById('set-brand-tagline').value.trim(),
        });
        showToast('Branding updated!', 'success');
    });
}

function updatePageTitle(t, s) { const a = document.getElementById('page-title'), b = document.getElementById('page-subtitle'); if (a) a.textContent = t; if (b) b.textContent = s || ''; }
