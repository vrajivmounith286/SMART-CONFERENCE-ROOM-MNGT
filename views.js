// ===== HELPERS =====
function fmt(t) { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; }
function fmtShort(t) { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h >= 12 ? 'p' : 'a'}`; }
function timeMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function eqIcon(e) { const m = { 'projector': 'fa-chalkboard', 'whiteboard': 'fa-pen', 'video-conferencing': 'fa-video', 'tv-screen': 'fa-tv', 'speaker-system': 'fa-volume-up', 'air-conditioning': 'fa-snowflake', 'phone': 'fa-phone' }; return m[e] || 'fa-cog'; }
function eqName(e) { return e.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '); }
function setPage(t, s) { const a = document.getElementById('page-title'), b = document.getElementById('page-subtitle'); if (a) a.textContent = t; if (b) b.textContent = s || ''; }
function timeOpts(sel) { let o = ''; for (let h = 8; h <= 20; h++)for (let m = 0; m < 60; m += 30) { const v = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; o += `<option value="${v}" ${v === sel ? 'selected' : ''}>${fmt(v)}</option>`; } return o; }

// ===== TOAST =====
function showToast(msg, type = 'info', dur = 4000) { const c = document.getElementById('toast-container'); if (!c) return; const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' }; const t = document.createElement('div'); t.className = `toast ${type}`; t.innerHTML = `<i class="fas ${icons[type] || icons.info} toast-icon"></i><span class="toast-msg">${msg}</span><button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`; c.appendChild(t); setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(100px)'; t.style.transition = 'all .3s'; setTimeout(() => t.remove(), 300); }, dur); }

// ===== MODAL =====
function openModal(html) { const o = document.getElementById('modal-overlay'), c = document.getElementById('modal-content'); if (!o || !c) return; c.innerHTML = html; o.classList.remove('hidden'); document.body.style.overflow = 'hidden'; c.querySelectorAll('.modal-close,[data-close-modal]').forEach(b => b.addEventListener('click', closeModal)); }
function closeModal() { const o = document.getElementById('modal-overlay'); if (o) { o.classList.add('hidden'); document.body.style.overflow = ''; } }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ===== ROUTER =====
let _routes = {}, _curRoute = '';
function navigate(p) { window.location.hash = p; }
function handleRoute() { const h = window.location.hash.slice(1) || '/dashboard'; if (_routes[h]) { _curRoute = h; const c = document.getElementById('view-container'); if (c) { c.innerHTML = ''; c.className = 'view-container fade-in'; _routes[h](c); } renderSidebar(); } else navigate('/dashboard'); }

// ===== SIDEBAR =====
function renderSidebar() {
    const nav = document.getElementById('sidebar-nav'), u = curUser(); if (!nav || !u) return;
    const items = [
        { s: 'Main', items: [{ p: '/dashboard', i: 'fa-th-large', l: 'Dashboard' }, { p: '/floorplan', i: 'fa-map-marked-alt', l: 'Floor Plan' }, { p: '/booking', i: 'fa-calendar-plus', l: 'Book Room' }, { p: '/calendar', i: 'fa-calendar-alt', l: 'Calendar' }, { p: '/rooms', i: 'fa-door-open', l: 'Rooms' }] },
        { s: 'Activity', items: [{ p: '/checkin', i: 'fa-user-check', l: 'Check-in' }, { p: '/signage', i: 'fa-tv', l: 'Digital Signage' }, { p: '/profile', i: 'fa-id-card', l: 'My Profile' }] }
    ];
    if (isManager()) items.push({ s: 'Insights', items: [{ p: '/analytics', i: 'fa-chart-bar', l: 'Analytics' }] });
    if (isAdmin()) items.push({ s: 'Admin', items: [{ p: '/admin', i: 'fa-cog', l: 'Admin Panel' }] });
    nav.innerHTML = items.map(sec => `<div class="nav-section"><div class="nav-section-title">${sec.s}</div>${sec.items.map(it => `<button class="nav-item ${_curRoute === it.p ? 'active' : ''}" data-path="${it.p}"><i class="fas ${it.i}"></i><span>${it.l}</span></button>`).join('')}</div>`).join('');
    const un = document.getElementById('user-name'), ur = document.getElementById('user-role'), ua = document.getElementById('user-avatar');
    if (un) un.textContent = u.name; if (ur) ur.textContent = u.role; if (ua) ua.textContent = u.initials;
    nav.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => { navigate(b.dataset.path); document.getElementById('sidebar')?.classList.remove('open'); }));
}

// ===== DASHBOARD VIEW =====
function viewDashboard(container) {
    const u = curUser(), today = new Date().toISOString().split('T')[0], tb = getTodaysBookings(), my = tb.filter(b => b.userId === u.id || b.attendees?.includes(u.id)), rooms = getRooms(), offices = getOffices(), now = new Date(), ct = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const avail = rooms.filter(r => { if (r.status === 'maintenance') return false; return !getBookingsForRoom(r.id, today).some(b => ct >= b.startTime && ct < b.endTime); }).length;
    const occ = rooms.filter(r => r.status !== 'maintenance').length - avail, ciToday = tb.filter(b => b.checkedIn).length;
    const gr = now.getHours() < 12 ? 'Morning' : now.getHours() < 17 ? 'Afternoon' : 'Evening';

    // Pending approvals for managers
    const pendingCount = isManager() ? getPendingApprovals().length : 0;

    container.innerHTML = `
  <div class="dashboard-welcome slide-up"><h2>Good ${gr}, ${u.name.split(' ')[0]}! 👋</h2><p>You have <strong>${my.length}</strong> meeting${my.length !== 1 ? 's' : ''} today. ${avail} room${avail !== 1 ? 's' : ''} available now.${pendingCount > 0 ? ` <span class="badge badge-occupied" style="cursor:pointer" onclick="navigate('/admin')">${pendingCount} pending approval${pendingCount > 1 ? 's' : ''}</span>` : ''}</p></div>
  <div class="grid-stats slide-up" style="animation-delay:.1s">
    <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-calendar-check"></i></div><div class="stat-value">${tb.length}</div><div class="stat-label">Bookings Today</div><div class="stat-change positive"><i class="fas fa-arrow-up"></i> Active</div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fas fa-door-open"></i></div><div class="stat-value">${avail}</div><div class="stat-label">Rooms Available</div><div class="stat-change positive"><i class="fas fa-circle"></i> Now</div></div>
    <div class="stat-card"><div class="stat-icon red"><i class="fas fa-users"></i></div><div class="stat-value">${occ}</div><div class="stat-label">Rooms Occupied</div></div>
    <div class="stat-card"><div class="stat-icon teal"><i class="fas fa-user-check"></i></div><div class="stat-value">${ciToday}</div><div class="stat-label">Checked In</div></div>
  </div>
  <div class="grid-2" style="margin-top:var(--space-xl)">
    <div class="card slide-up" style="animation-delay:.2s"><div class="card-header"><h3 class="card-title"><i class="fas fa-clock" style="color:var(--brand-orange);margin-right:8px"></i>My Schedule</h3><button class="btn btn-secondary btn-sm" onclick="navigate('/booking')"><i class="fas fa-plus"></i> Book</button></div>
    ${my.length === 0 ? '<div class="empty-state"><i class="fas fa-calendar-check"></i><h4>No meetings today</h4></div>' :
            `<div class="timeline">${my.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(b => {
                const r = getRoomById(b.roomId), past = b.endTime <= ct, isNow = b.startTime <= ct && b.endTime > ct;
                return `<div class="timeline-item ${isNow ? 'active' : ''}"><div class="timeline-time">${fmt(b.startTime)} — ${fmt(b.endTime)}</div><div class="timeline-title">${b.title}${b.recurring ? ' <i class="fas fa-redo" style="font-size:.7em;color:var(--brand-teal)" title="Recurring"></i>' : ''}</div><div class="timeline-desc">${r?.name || ''} · ${b.attendees?.length || 1} attendees</div>${isNow && !b.checkedIn ? `<button class="btn btn-success btn-sm" style="margin-top:6px" onclick="checkIn('${b.id}');viewDashboard(document.getElementById('view-container'));showToast('Checked in!','success')"><i class="fas fa-check"></i> Check In</button>` : ''}${b.checkedIn ? '<span class="badge badge-available" style="margin-top:4px"><i class="fas fa-check"></i> Checked In</span>' : ''}${past && !b.checkedIn ? '<span class="badge badge-maintenance" style="margin-top:4px">Missed</span>' : ''}${b.status === 'pending-approval' ? '<span class="badge badge-occupied" style="margin-top:4px">Pending Approval</span>' : ''}<button class="btn btn-ghost btn-sm" style="margin-top:4px" onclick="downloadICS('${b.id}');showToast('Calendar file downloaded!','success')" title="Export to Calendar"><i class="fas fa-file-export"></i></button></div>`;
            }).join('')}</div>`}</div>
    <div class="card slide-up" style="animation-delay:.3s"><div class="card-header"><h3 class="card-title"><i class="fas fa-door-open" style="color:var(--brand-teal);margin-right:8px"></i>Room Status</h3><button class="btn btn-secondary btn-sm" onclick="navigate('/rooms')">All</button></div>
    ${rooms.slice(0, 6).map(r => {
                const rb = getBookingsForRoom(r.id, today), cur = rb.find(b => ct >= b.startTime && ct < b.endTime), nxt = rb.find(b => b.startTime > ct), of = offices.find(o => o.id === r.officeId);
                let sc, st; if (r.status === 'maintenance') { sc = 'maintenance'; st = 'Maintenance'; } else if (cur) { sc = 'occupied'; st = 'Occupied'; } else if (nxt) { sc = 'upcoming'; st = `Free til ${fmt(nxt.startTime)}`; } else { sc = 'available'; st = 'Available'; }
                return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-color-light)"><div class="avatar" style="font-size:.8rem"><i class="fas ${r.icon}"></i></div><div style="flex:1"><div style="font-weight:600;font-size:var(--fs-sm)">${r.name}</div><div style="font-size:var(--fs-xs);color:var(--text-muted)">${of?.name.split('—')[0].trim() || ''} · ${r.capacity} seats</div></div><span class="badge badge-${sc}">${st}</span></div>`;
            }).join('')}</div>
  </div>
  <div class="card slide-up" style="margin-top:var(--space-xl);animation-delay:.4s"><div class="card-header"><h3 class="card-title"><i class="fas fa-list" style="color:var(--color-info);margin-right:8px"></i>All Bookings Today</h3><span class="badge badge-employee">${tb.length} total</span></div>
  <div class="table-wrap"><table class="data-table"><thead><tr><th>Time</th><th>Meeting</th><th>Room</th><th>Organizer</th><th>Status</th><th></th></tr></thead><tbody>
  ${tb.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(b => { const r = getRoomById(b.roomId), o = getUserById(b.userId); return `<tr><td style="white-space:nowrap">${fmt(b.startTime)}–${fmt(b.endTime)}</td><td><strong>${b.title}</strong>${b.recurring ? ' <i class="fas fa-redo" style="font-size:.7em;color:var(--brand-teal)" title="Recurring"></i>' : ''}</td><td>${r?.name || ''}</td><td><div style="display:flex;align-items:center;gap:8px"><div class="avatar" style="width:28px;height:28px;font-size:.6rem">${o?.initials || '?'}</div>${o?.name || ''}</div></td><td>${b.checkedIn ? '<span class="badge badge-available">Checked In</span>' : b.status === 'auto-released' ? '<span class="badge badge-maintenance">Released</span>' : b.status === 'pending-approval' ? '<span class="badge badge-occupied">Pending</span>' : '<span class="badge badge-upcoming">Confirmed</span>'}</td><td><button class="btn btn-ghost btn-sm" onclick="downloadICS('${b.id}')" title="Export"><i class="fas fa-file-export"></i></button></td></tr>`; }).join('')}
  ${tb.length === 0 ? '<tr><td colspan="6" class="empty-state">No bookings today</td></tr>' : ''}
  </tbody></table></div></div>`;
    setPage('Dashboard', new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
}

// ===== BOOKING VIEW with Recurring + Smart Suggestions =====
function viewBooking(container) {
    const offices = getOffices(), today = new Date().toISOString().split('T')[0];
    container.innerHTML = `<div style="margin-bottom:var(--space-xl)"><h2 style="font-size:var(--fs-2xl)">Book a Meeting Room</h2><p style="color:var(--text-secondary)">Find and book the perfect room for your meeting</p></div>
  <div class="booking-grid"><div class="card slide-up"><h3 class="card-title" style="margin-bottom:var(--space-md)"><i class="fas fa-filter" style="color:var(--brand-orange);margin-right:8px"></i>Search & Filter</h3>
  <div class="form-group"><label>Date</label><input type="date" id="bk-date" value="${today}" min="${today}"/></div>
  <div class="form-row"><div class="form-group"><label>Start</label><select id="bk-start">${timeOpts('09:00')}</select></div><div class="form-group"><label>End</label><select id="bk-end">${timeOpts('10:00')}</select></div></div>
  <div class="form-group"><label>Office</label><select id="bk-office"><option value="">All</option>${offices.map(o => `<option value="${o.id}">${o.name.split('—')[0].trim()}</option>`).join('')}</select></div>
  <div class="form-group"><label>Min Capacity</label><select id="bk-cap"><option value="">Any</option><option value="6">6+</option><option value="10">10+</option><option value="15">15+</option></select></div>
  <button class="btn btn-primary btn-block" id="bk-search" style="margin-top:var(--space-md)"><i class="fas fa-search"></i> Search Available Rooms</button></div>
  <div id="bk-results"><div class="empty-state" style="padding:var(--space-3xl)"><i class="fas fa-search" style="font-size:3rem;color:var(--brand-orange);opacity:.3"></i><h4>Search for Available Rooms</h4><p>Select date, time & requirements then search.</p></div></div></div>`;

    document.getElementById('bk-search').addEventListener('click', () => {
        const date = document.getElementById('bk-date').value, st = document.getElementById('bk-start').value, et = document.getElementById('bk-end').value, off = document.getElementById('bk-office').value, cap = parseInt(document.getElementById('bk-cap').value) || 0;
        if (st >= et) { showToast('End must be after start', 'error'); return; }
        const avail = getAvailableRooms(date, st, et, { officeId: off, minCapacity: cap });
        const rd = document.getElementById('bk-results');

        if (!avail.length) {
            // ===== SMART SUGGESTIONS =====
            const suggestions = getSuggestedRooms(date, st, et, { officeId: off, minCapacity: cap });
            let sugHtml = '';
            if (suggestions.length > 0) {
                sugHtml = `<div class="card" style="margin-top:var(--space-lg);border-left:3px solid var(--brand-teal)">
                    <h4 style="margin-bottom:var(--space-md)"><i class="fas fa-lightbulb" style="color:var(--color-warning);margin-right:8px"></i>Suggested Alternatives</h4>
                    ${suggestions.map(s => `
                        <div style="margin-bottom:var(--space-md);padding:var(--space-md);background:var(--bg-tertiary);border-radius:var(--border-radius)">
                            <div style="font-weight:600;margin-bottom:4px"><i class="fas fa-clock" style="margin-right:4px;color:var(--brand-teal)"></i>${s.label} — ${fmt(s.altStart)} to ${fmt(s.altEnd)}${s.altDate ? ` on ${s.altDate}` : ''}</div>
                            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
                                ${s.rooms.slice(0, 3).map(r => `<button class="btn btn-secondary btn-sm" onclick="bookRoom('${r.id}','${s.altDate || date}','${s.altStart}','${s.altEnd}')"><i class="fas fa-calendar-plus"></i> ${r.name} (${r.capacity})</button>`).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>`;
            }
            rd.innerHTML = `<div class="empty-state" style="padding:var(--space-3xl)"><i class="fas fa-exclamation-circle" style="font-size:3rem;color:var(--color-warning);opacity:.5"></i><h4>No Rooms Available</h4><p>No rooms match your exact criteria. Try the suggestions below.</p></div>${sugHtml}`;
            return;
        }

        rd.innerHTML = `<div style="margin-bottom:var(--space-md)"><h3><span style="color:var(--color-success)">${avail.length}</span> room${avail.length !== 1 ? 's' : ''} available</h3></div><div class="grid-cards">${avail.map(r => {
            const of = getOfficeById(r.officeId);
            return `<div class="card room-card"><div class="room-card-img"><i class="fas ${r.icon}"></i></div><h4>${r.name}</h4><div style="font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:8px">${of?.name.split('—')[0].trim() || ''} · ${r.floor}</div><div class="room-meta"><span class="room-meta-item"><i class="fas fa-users"></i> ${r.capacity}</span>${r.zoomLink ? '<span class="room-meta-item"><i class="fas fa-video"></i> Zoom</span>' : ''}</div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px">${r.equipment.map(e => `<span class="chip"><i class="fas ${eqIcon(e)}"></i> ${eqName(e)}</span>`).join('')}</div><div class="card-footer"><button class="btn btn-primary btn-sm" onclick="bookRoom('${r.id}','${date}','${st}','${et}')"><i class="fas fa-calendar-plus"></i> Book</button></div></div>`;
        }).join('')}</div>`;
    });
    setPage('Book Room', 'Find and reserve the perfect meeting space');
}

// ===== BOOK ROOM MODAL with Recurring =====
function bookRoom(rid, date, st, et) {
    const room = getRoomById(rid), users = getUsers(), u = curUser(), settings = getSettings();
    openModal(`<div class="modal-header"><h3><i class="fas fa-calendar-plus" style="color:var(--brand-orange);margin-right:8px"></i>Confirm Booking</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>
  <div style="background:var(--bg-tertiary);border-radius:var(--border-radius);padding:var(--space-md);margin-bottom:var(--space-md);display:flex;gap:var(--space-md);align-items:center"><div class="avatar avatar-lg"><i class="fas ${room.icon}"></i></div><div><div style="font-weight:600">${room.name}</div><div style="font-size:var(--fs-xs);color:var(--text-muted)">${room.capacity} seats</div></div><span class="badge badge-available" style="margin-left:auto">${fmt(st)}-${fmt(et)}</span></div>
  ${settings.requireApproval && u.role === 'employee' ? '<div style="background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.3);border-radius:var(--border-radius-sm);padding:var(--space-sm) var(--space-md);margin-bottom:var(--space-md);font-size:var(--fs-xs);color:var(--color-warning)"><i class="fas fa-exclamation-triangle" style="margin-right:6px"></i>This booking requires manager approval.</div>' : ''}
  <form id="bk-form"><div class="form-group"><label>Meeting Title *</label><input type="text" id="bk-title" placeholder="e.g. Sprint Planning" required/></div><div class="form-group"><label>Notes</label><textarea id="bk-notes" rows="2" placeholder="Agenda..."></textarea></div>
  <div class="form-group"><label>Attendees</label><div style="display:flex;flex-wrap:wrap;gap:6px">${users.filter(x => x.id !== u.id).map(x => `<label class="chip" style="cursor:pointer"><input type="checkbox" value="${x.id}" class="att-cb" style="display:none"><span class="avatar" style="width:20px;height:20px;font-size:.5rem">${x.initials}</span> ${x.name.split(' ')[0]}</label>`).join('')}</div></div>
  ${settings.allowRecurring ? `<div class="form-group"><label><input type="checkbox" id="bk-recurring" style="margin-right:6px"> Recurring Meeting</label>
  <div id="recurring-opts" style="display:none;margin-top:var(--space-sm)"><div class="form-row"><div class="form-group"><label style="font-size:var(--fs-xs)">Pattern</label><select id="bk-pattern"><option value="daily">Daily</option><option value="weekly" selected>Weekly</option><option value="biweekly">Bi-Weekly</option><option value="monthly">Monthly</option></select></div><div class="form-group"><label style="font-size:var(--fs-xs)">Occurrences</label><select id="bk-occur"><option value="4">4 times</option><option value="8" selected>8 times</option><option value="12">12 times</option><option value="26">26 times</option></select></div></div></div></div>` : ''}
  <div class="form-group" id="face-verify-section">
    <label><i class="fas fa-camera"></i> Face Verification Required *</label>
    <div style="background:var(--bg-tertiary);border-radius:var(--border-radius);padding:var(--space-md);text-align:center;">
      <video id="webcam-video" autoplay playsinline style="width:100%;max-width:300px;border-radius:8px;background:#000;display:none;margin:0 auto var(--space-sm);"></video>
      <canvas id="webcam-canvas" style="display:none;"></canvas>
      <div id="verify-status" style="margin-bottom:var(--space-sm);font-weight:600;">Not Verified</div>
      <button type="button" class="btn btn-secondary btn-sm" id="start-camera-btn"><i class="fas fa-video"></i> Start Camera</button>
      <button type="button" class="btn btn-primary btn-sm" id="capture-face-btn" style="display:none;"><i class="fas fa-camera"></i> Verify Face</button>
      <input type="hidden" id="face-verified" value="false" />
    </div>
  </div>
  <div style="display:flex;gap:var(--space-sm);justify-content:flex-end;margin-top:var(--space-lg)"><button type="button" class="btn btn-secondary" id="bk-cancel-btn" data-close-modal>Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-check"></i> Confirm</button></div></form>`);

    document.querySelectorAll('.att-cb').forEach(cb => cb.addEventListener('change', () => { const c = cb.closest('.chip'); c.style.borderColor = cb.checked ? 'var(--brand-teal)' : ''; c.style.background = cb.checked ? 'rgba(0,184,169,.1)' : ''; }));

    document.getElementById('bk-recurring')?.addEventListener('change', e => {
        document.getElementById('recurring-opts').style.display = e.target.checked ? 'block' : 'none';
    });

    let stream = null;
    document.getElementById('start-camera-btn')?.addEventListener('click', async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = document.getElementById('webcam-video');
            video.srcObject = stream;
            video.style.display = 'block';
            document.getElementById('start-camera-btn').style.display = 'none';
            document.getElementById('capture-face-btn').style.display = 'inline-block';
            document.getElementById('verify-status').textContent = 'Position your face in the frame...';
        } catch (err) {
            showToast('Camera access denied or unavailable', 'error');
        }
    });

    document.getElementById('capture-face-btn')?.addEventListener('click', () => {
        const video = document.getElementById('webcam-video');
        const canvas = document.getElementById('webcam-canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        
        if (stream) stream.getTracks().forEach(track => track.stop());
        
        video.style.display = 'none';
        document.getElementById('capture-face-btn').style.display = 'none';
        document.getElementById('face-verified').value = 'true';
        document.getElementById('verify-status').innerHTML = '<span style="color:var(--color-success);"><i class="fas fa-check-circle"></i> Face Verified Successfully</span>';
    });

    const stopStream = () => { if (stream) stream.getTracks().forEach(track => track.stop()); };
    document.getElementById('bk-cancel-btn')?.addEventListener('click', stopStream);
    document.querySelector('.modal-close')?.addEventListener('click', stopStream);

    document.getElementById('bk-form')?.addEventListener('submit', e => {
        e.preventDefault(); 
        if (document.getElementById('face-verified').value !== 'true') { showToast('Please verify your face before booking', 'error'); return; }
        const t = document.getElementById('bk-title').value.trim(); if (!t) { showToast('Enter a title', 'warning'); return; }
        const att = [u.id, ...Array.from(document.querySelectorAll('.att-cb:checked')).map(c => c.value)];
        const isRecurring = document.getElementById('bk-recurring')?.checked;

        if (isRecurring) {
            const pattern = document.getElementById('bk-pattern').value;
            const occurrences = parseInt(document.getElementById('bk-occur').value);
            const results = addRecurringBooking({
                roomId: rid, userId: u.id, title: t, date, startTime: st, endTime: et, attendees: att, notes: document.getElementById('bk-notes').value.trim(),
                recurringGroupId: 'rg' + Date.now(),
            }, pattern, occurrences);
            closeModal();
            showToast(`Created ${results.length} recurring "${t}" bookings!`, 'success');
        } else {
            addBooking({ roomId: rid, userId: u.id, title: t, date, startTime: st, endTime: et, attendees: att, notes: document.getElementById('bk-notes').value.trim(), recurring: false });
            closeModal();
            showToast(`Booked "${t}" in ${room.name}!`, 'success');
        }
        document.getElementById('bk-search')?.click();
    });
}

// ===== ROOMS VIEW =====
function viewRooms(container) {
    const rooms = getRooms(), offices = getOffices(), today = new Date().toISOString().split('T')[0], now = new Date(), ct = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    container.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xl);flex-wrap:wrap;gap:var(--space-md)"><div><h2>Room Directory</h2><p style="color:var(--text-secondary)">${rooms.length} rooms across ${offices.length} locations</p></div>
  <div style="display:flex;gap:var(--space-sm)"><select id="flt-off" class="btn btn-secondary"><option value="">All Offices</option>${offices.map(o => `<option value="${o.id}">${o.name.split('—')[0].trim()}</option>`).join('')}</select>
  ${isAdmin() ? '<button class="btn btn-primary" onclick="addRoomModal()"><i class="fas fa-plus"></i> Add Room</button>' : ''}</div></div><div class="grid-cards" id="rooms-grid"></div>`;

    function renderCards(list) {
        document.getElementById('rooms-grid').innerHTML = list.map(r => {
            const of = offices.find(o => o.id === r.officeId), rb = getBookingsForRoom(r.id, today), cur = rb.find(b => ct >= b.startTime && ct < b.endTime);
            let sc, st; if (r.status === 'maintenance') { sc = 'maintenance'; st = 'Maintenance'; } else if (cur) { sc = 'occupied'; st = 'In Use'; } else { sc = 'available'; st = 'Available'; }
            return `<div class="card room-card slide-up"><div class="room-card-img"><i class="fas ${r.icon}"></i></div><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px"><h4>${r.name}</h4><span class="badge badge-${sc}">${st}</span></div><div style="font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:var(--space-sm)">${of?.name || ''} · ${r.floor}</div><div class="room-meta"><span class="room-meta-item"><i class="fas fa-users"></i> ${r.capacity} seats</span>${r.zoomLink ? '<span class="room-meta-item"><i class="fas fa-video"></i> Zoom</span>' : ''}<span class="room-meta-item"><i class="fas fa-calendar"></i> ${rb.length} today</span></div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px">${r.equipment.map(e => `<span class="chip"><i class="fas ${eqIcon(e)}"></i> ${eqName(e)}</span>`).join('')}</div><p style="font-size:var(--fs-xs);color:var(--text-secondary);margin-top:8px">${r.description || ''}</p>${isAdmin() ? `<div class="card-footer"><button class="btn btn-secondary btn-sm" onclick="editRoomModal('${r.id}')"><i class="fas fa-edit"></i> Edit</button><button class="btn btn-danger btn-sm" onclick="if(confirm('Delete?')){deleteRoom('${r.id}');viewRooms(document.getElementById('view-container'));showToast('Deleted','info');}"><i class="fas fa-trash"></i></button></div>` : ''}</div>`;
        }).join('');
    }
    renderCards(rooms);
    document.getElementById('flt-off')?.addEventListener('change', e => { renderCards(e.target.value ? rooms.filter(r => r.officeId === e.target.value) : rooms); });
    setPage('Rooms', `${rooms.length} rooms across ${offices.length} locations`);
}

function addRoomModal() {
    const offices = getOffices(); openModal(`<div class="modal-header"><h3>Add Room</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><form id="rm-form"><div class="form-group"><label>Name *</label><input type="text" id="rm-name" required/></div><div class="form-row"><div class="form-group"><label>Office</label><select id="rm-off">${offices.map(o => `<option value="${o.id}">${o.name.split('—')[0].trim()}</option>`).join('')}</select></div><div class="form-group"><label>Floor</label><input type="text" id="rm-floor" value="1st Floor"/></div></div><div class="form-row"><div class="form-group"><label>Capacity</label><input type="number" id="rm-cap" value="8" min="1"/></div><div class="form-group"><label>Status</label><select id="rm-status"><option value="available">Available</option><option value="maintenance">Maintenance</option></select></div></div><div class="form-group"><label>Description</label><textarea id="rm-desc" rows="2"></textarea></div><div style="display:flex;gap:var(--space-sm);justify-content:flex-end;margin-top:var(--space-lg)"><button type="button" class="btn btn-secondary" data-close-modal>Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Create</button></div></form>`);
    document.getElementById('rm-form')?.addEventListener('submit', e => { e.preventDefault(); addRoom({ name: document.getElementById('rm-name').value, officeId: document.getElementById('rm-off').value, floor: document.getElementById('rm-floor').value, capacity: parseInt(document.getElementById('rm-cap').value), status: document.getElementById('rm-status').value, description: document.getElementById('rm-desc').value, equipment: ['whiteboard'], icon: 'fa-door-open', zoomLink: '' }); closeModal(); showToast('Room created!', 'success'); viewRooms(document.getElementById('view-container')); });
}

function editRoomModal(id) {
    const r = getRoomById(id), offices = getOffices(); if (!r) return; openModal(`<div class="modal-header"><h3>Edit Room</h3><button class="modal-close"><i class="fas fa-times"></i></button></div><form id="rm-form"><div class="form-group"><label>Name *</label><input type="text" id="rm-name" value="${r.name}" required/></div><div class="form-row"><div class="form-group"><label>Office</label><select id="rm-off">${offices.map(o => `<option value="${o.id}" ${r.officeId === o.id ? 'selected' : ''}>${o.name.split('—')[0].trim()}</option>`).join('')}</select></div><div class="form-group"><label>Floor</label><input type="text" id="rm-floor" value="${r.floor}"/></div></div><div class="form-row"><div class="form-group"><label>Capacity</label><input type="number" id="rm-cap" value="${r.capacity}" min="1"/></div><div class="form-group"><label>Status</label><select id="rm-status"><option value="available" ${r.status === 'available' ? 'selected' : ''}>Available</option><option value="maintenance" ${r.status === 'maintenance' ? 'selected' : ''}>Maintenance</option></select></div></div><div class="form-group"><label>Description</label><textarea id="rm-desc" rows="2">${r.description || ''}</textarea></div><div style="display:flex;gap:var(--space-sm);justify-content:flex-end;margin-top:var(--space-lg)"><button type="button" class="btn btn-secondary" data-close-modal>Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Update</button></div></form>`);
    document.getElementById('rm-form')?.addEventListener('submit', e => { e.preventDefault(); updateRoom(id, { name: document.getElementById('rm-name').value, officeId: document.getElementById('rm-off').value, floor: document.getElementById('rm-floor').value, capacity: parseInt(document.getElementById('rm-cap').value), status: document.getElementById('rm-status').value, description: document.getElementById('rm-desc').value }); closeModal(); showToast('Updated!', 'success'); viewRooms(document.getElementById('view-container')); });
}

// ===== USER PROFILE VIEW =====
function viewProfile(container) {
    const u = curUser();
    const profile = getUserProfile(u.id);
    if (!profile) { container.innerHTML = '<div class="empty-state"><h4>Profile not found</h4></div>'; return; }

    const roomBreakdownHtml = Object.entries(profile.roomBreakdown).map(([rid, count]) => {
        const room = getRoomById(rid);
        return room ? `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border-color-light)"><div class="avatar" style="width:28px;height:28px;font-size:.6rem"><i class="fas ${room.icon}"></i></div><span style="flex:1;font-size:var(--fs-sm)">${room.name}</span><span class="badge badge-employee">${count} bookings</span></div>` : '';
    }).join('');

    container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xl)"><div><h2>My Profile</h2><p style="color:var(--text-secondary)">Booking history & preferences</p></div></div>
    <div class="grid-2">
      <div class="card slide-up">
        <div style="text-align:center;padding:var(--space-xl)">
          <div class="avatar avatar-lg" style="width:80px;height:80px;font-size:1.8rem;margin:0 auto var(--space-md)">${u.initials}</div>
          <h3>${u.name}</h3>
          <p style="color:var(--text-secondary);margin:4px 0">${u.email}</p>
          <span class="badge badge-${u.role}" style="margin-top:4px">${u.role}</span>
          <div style="color:var(--text-muted);font-size:var(--fs-xs);margin-top:4px">${u.department} · ${getOfficeById(u.office)?.name.split('—')[0].trim() || ''}</div>
        </div>
        <div class="grid-stats" style="gap:var(--space-sm);margin-top:var(--space-md)">
          <div class="stat-card" style="padding:var(--space-md)"><div class="stat-value" style="font-size:var(--fs-xl)">${profile.totalBookings}</div><div class="stat-label">Total Bookings</div></div>
          <div class="stat-card" style="padding:var(--space-md)"><div class="stat-value" style="font-size:var(--fs-xl)">${profile.checkedInRate}%</div><div class="stat-label">Check-in Rate</div></div>
        </div>
        <div style="margin-top:var(--space-lg);padding:0 var(--space-md)">
          <h4 style="margin-bottom:var(--space-sm)"><i class="fas fa-heart" style="color:var(--brand-orange);margin-right:6px"></i>Preferences</h4>
          <div style="font-size:var(--fs-sm);color:var(--text-secondary)">
            <p><strong>Favorite Room:</strong> ${profile.favoriteRoom?.name || 'N/A'}</p>
            <p><strong>Preferred Time:</strong> ${profile.preferredHour > 12 ? profile.preferredHour - 12 : profile.preferredHour}:00 ${profile.preferredHour >= 12 ? 'PM' : 'AM'}</p>
          </div>
        </div>
        ${roomBreakdownHtml ? `<div style="margin-top:var(--space-lg);padding:0 var(--space-md)"><h4 style="margin-bottom:var(--space-sm)"><i class="fas fa-door-open" style="color:var(--brand-teal);margin-right:6px"></i>Rooms Used</h4>${roomBreakdownHtml}</div>` : ''}
      </div>
      <div class="card slide-up" style="animation-delay:.1s">
        <div class="card-header"><h3 class="card-title"><i class="fas fa-history" style="color:var(--color-info);margin-right:8px"></i>Recent Bookings</h3></div>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Meeting</th><th>Room</th><th>Status</th><th></th></tr></thead><tbody>
        ${profile.recentBookings.map(b => {
        const r = getRoomById(b.roomId);
        return `<tr><td style="white-space:nowrap">${b.date}</td><td><strong>${b.title}</strong>${b.recurring ? ' <i class="fas fa-redo" style="font-size:.7em;color:var(--brand-teal)"></i>' : ''}</td><td>${r?.name || ''}</td><td>${b.checkedIn ? '<span class="badge badge-available">Attended</span>' : b.status === 'cancelled' ? '<span class="badge badge-maintenance">Cancelled</span>' : b.status === 'pending-approval' ? '<span class="badge badge-occupied">Pending</span>' : '<span class="badge badge-upcoming">Confirmed</span>'}</td><td><button class="btn btn-ghost btn-sm" onclick="downloadICS('${b.id}')" title="Export"><i class="fas fa-file-export"></i></button></td></tr>`;
    }).join('')}
        ${profile.recentBookings.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:var(--space-lg)">No bookings yet</td></tr>' : ''}
        </tbody></table></div>
      </div>
    </div>`;
    setPage('My Profile', 'Booking history & preferences');
}
