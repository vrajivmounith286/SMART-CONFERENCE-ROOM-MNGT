// ===== CALENDAR VIEW =====
function viewCalendar(container) {
    let vd = new Date(), vm = 'month'; const dn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], mn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    function render() {
        const bookings = getBookings().filter(b => b.status !== 'cancelled'), rooms = getRooms(), colors = ['event-orange', 'event-teal', 'event-blue', 'event-green'];
        container.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xl);flex-wrap:wrap;gap:var(--space-md)"><div><h2>Calendar</h2><p style="color:var(--text-secondary)">All room bookings</p></div>
  <div style="display:flex;gap:var(--space-sm);align-items:center"><div class="tabs" style="margin-bottom:0;width:auto"><button class="tab ${vm === 'month' ? 'active' : ''}" data-m="month">Month</button><button class="tab ${vm === 'week' ? 'active' : ''}" data-m="week">Week</button></div>
  <button class="btn btn-icon" id="cp"><i class="fas fa-chevron-left"></i></button><span style="font-weight:600;min-width:180px;text-align:center">${mn[vd.getMonth()]} ${vd.getFullYear()}</span><button class="btn btn-icon" id="cn"><i class="fas fa-chevron-right"></i></button><button class="btn btn-secondary btn-sm" id="ct">Today</button></div></div>`;
        if (vm === 'month') {
            const y = vd.getFullYear(), m = vd.getMonth(), fd = new Date(y, m, 1).getDay(), dim = new Date(y, m + 1, 0).getDate(), pdm = new Date(y, m, 0).getDate(), td = new Date().toISOString().split('T')[0];
            let cells = dn.map(d => `<div class="calendar-header-cell">${d}</div>`).join('');
            for (let i = fd - 1; i >= 0; i--)cells += `<div class="calendar-cell other-month"><div class="calendar-day">${pdm - i}</div></div>`;
            for (let d = 1; d <= dim; d++) {
                const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, it = ds === td, db = bookings.filter(b => b.date === ds);
                cells += `<div class="calendar-cell ${it ? 'today' : ''}" data-date="${ds}" onclick="navigate('/booking')"><div class="calendar-day">${d}</div>${db.slice(0, 3).map((b, i) => `<div class="calendar-event ${colors[i % 4]}" title="${b.title}">${fmtShort(b.startTime)} ${b.title}</div>`).join('')}${db.length > 3 ? `<div style="font-size:.6rem;color:var(--text-muted)">+${db.length - 3}</div>` : ''}</div>`;
            }
            const tot = fd + dim, rem = tot % 7 === 0 ? 0 : 7 - tot % 7; for (let i = 1; i <= rem; i++)cells += `<div class="calendar-cell other-month"><div class="calendar-day">${i}</div></div>`;
            container.innerHTML += `<div class="calendar-grid">${cells}</div>`;
        } else {
            const sw = new Date(vd); sw.setDate(sw.getDate() - sw.getDay()); const td = new Date().toISOString().split('T')[0];
            let days = ''; for (let i = 0; i < 7; i++) {
                const d = new Date(sw); d.setDate(d.getDate() + i); const ds = d.toISOString().split('T')[0], it = ds === td, db = bookings.filter(b => b.date === ds);
                days += `<div class="card" style="min-height:280px;${it ? 'border-color:var(--brand-orange)' : ''}"><div style="text-align:center;margin-bottom:var(--space-md)"><div style="font-size:var(--fs-xs);color:var(--text-muted)">${dn[i]}</div><div style="font-size:var(--fs-xl);font-weight:700;${it ? 'color:var(--brand-orange)' : ''}">${d.getDate()}</div></div>${db.length === 0 ? '<div style="text-align:center;color:var(--text-muted);font-size:var(--fs-xs)">Free</div>' : ''}${db.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((b, idx) => { const r = rooms.find(x => x.id === b.roomId); return `<div class="calendar-event ${colors[idx % 4]}" style="padding:8px;margin-bottom:6px;border-radius:var(--border-radius-sm)"><div style="font-weight:600;font-size:var(--fs-xs)">${b.title}</div><div style="font-size:.65rem;opacity:.8">${fmtShort(b.startTime)}-${fmtShort(b.endTime)}</div><div style="font-size:.65rem;opacity:.6">${r?.name || ''}</div></div>`; }).join('')}</div>`;
            }
            container.innerHTML += `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:var(--space-sm)">${days}</div>`;
        }
        container.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { vm = b.dataset.m; render(); }));
        container.querySelector('#cp')?.addEventListener('click', () => { if (vm === 'month') vd.setMonth(vd.getMonth() - 1); else vd.setDate(vd.getDate() - 7); render(); });
        container.querySelector('#cn')?.addEventListener('click', () => { if (vm === 'month') vd.setMonth(vd.getMonth() + 1); else vd.setDate(vd.getDate() + 7); render(); });
        container.querySelector('#ct')?.addEventListener('click', () => { vd = new Date(); render(); });
        setPage('Calendar', 'All room bookings');
    } render();
}

// ===== SIGNAGE VIEW =====
let sigInt = null, sigIdx = 0;
function viewSignage(container) {
    if (sigInt) clearInterval(sigInt);
    const rooms = getRooms().filter(r => r.status !== 'maintenance'), set = getSettings();
    container.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xl)"><div><h2>Digital Signage</h2><p style="color:var(--text-secondary)">Room status display</p></div>
  <div style="display:flex;gap:var(--space-sm)"><select id="sig-room" class="btn btn-secondary"><option value="auto">Auto-Rotate</option>${rooms.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}</select><button class="btn btn-primary" onclick="document.getElementById('sig-disp')?.requestFullscreen?.()"><i class="fas fa-expand"></i> Fullscreen</button></div></div>
  <div id="sig-disp" class="card" style="min-height:480px;padding:var(--space-2xl)"></div>`;
    function upd() { const sel = document.getElementById('sig-room'); let r; if (sel?.value === 'auto') { r = rooms[sigIdx % rooms.length]; sigIdx++; } else r = rooms.find(x => x.id === sel?.value); if (r) renderSig(r); }
    function renderSig(r) {
        const td = new Date().toISOString().split('T')[0], now = new Date(), ct = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, bks = getBookingsForRoom(r.id, td).sort((a, b) => a.startTime.localeCompare(b.startTime)), cur = bks.find(b => ct >= b.startTime && ct < b.endTime), nxt = bks.find(b => b.startTime > ct);
        let sc, st, si; if (cur) { sc = 'occupied'; st = 'In Use'; si = 'fa-lock'; } else if (nxt && timeMin(nxt.startTime) - timeMin(ct) <= 15) { sc = 'upcoming'; st = `Starting in ${timeMin(nxt.startTime) - timeMin(ct)} min`; si = 'fa-clock'; } else { sc = 'available'; st = 'Available'; si = 'fa-check-circle'; }
        const of = getOfficeById(r.officeId);
        document.getElementById('sig-disp').innerHTML = `<div style="display:flex;gap:var(--space-2xl);min-height:400px"><div style="flex:2;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center"><div class="signage-status-icon ${sc}"><i class="fas ${si}"></i></div><div class="signage-room-name">${r.name}</div><div style="font-size:var(--fs-sm);color:var(--text-muted);margin-bottom:var(--space-md)">${of?.name || ''} · ${r.floor} · ${r.capacity} seats</div><div class="signage-status-text" style="color:var(--${sc === 'available' ? 'color-success' : sc === 'occupied' ? 'color-error' : 'color-warning'})">${st}</div>${cur ? `<div style="background:var(--bg-tertiary);border-radius:var(--border-radius);padding:var(--space-md) var(--space-xl);margin-top:var(--space-md)"><div style="font-weight:700;font-size:var(--fs-lg)">${cur.title}</div><div style="color:var(--text-secondary);margin-top:4px">${fmt(cur.startTime)} — ${fmt(cur.endTime)}</div></div>` : ''}<div style="font-family:var(--font-display);font-size:var(--fs-4xl);font-weight:300;color:var(--text-secondary);margin-top:var(--space-xl)">${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div></div>
  <div style="flex:1;border-left:1px solid var(--border-color);padding-left:var(--space-xl)"><h3 style="margin-bottom:var(--space-lg);color:var(--text-secondary)"><i class="fas fa-list" style="margin-right:8px"></i>Today's Schedule</h3>${bks.length === 0 ? '<div style="color:var(--text-muted);text-align:center;padding:var(--space-xl)">No meetings</div>' : ''}
  <div class="timeline">${bks.map(b => { const ip = b.endTime <= ct, iN = b.startTime <= ct && b.endTime > ct; return `<div class="timeline-item ${iN ? 'active' : ''}" style="${ip ? 'opacity:.4' : ''}"><div class="timeline-time">${fmt(b.startTime)} — ${fmt(b.endTime)}</div><div class="timeline-title">${b.title}</div><div class="timeline-desc">${getUserById(b.userId)?.name || ''}</div></div>`; }).join('')}</div></div></div>`;
    }
    upd(); sigInt = setInterval(upd, (set.signageRotateSeconds || 10) * 1000);
    document.getElementById('sig-room')?.addEventListener('change', () => { upd(); if (document.getElementById('sig-room').value !== 'auto') clearInterval(sigInt); else sigInt = setInterval(upd, (set.signageRotateSeconds || 10) * 1000); });
    setPage('Digital Signage', 'Room status display');
}

// ===== CHECK-IN VIEW =====
function viewCheckin(container) {
    const u = curUser(), td = new Date().toISOString().split('T')[0], now = new Date(), ct = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const my = getTodaysBookings().filter(b => b.userId === u.id || b.attendees?.includes(u.id)).sort((a, b) => a.startTime.localeCompare(b.startTime));
    const cur = my.filter(b => b.startTime <= ct && b.endTime > ct), up = my.filter(b => b.startTime > ct && b.status === 'confirmed'), past = my.filter(b => b.endTime <= ct), ci = my.filter(b => b.checkedIn).length;

    function mkCard(b, type) {
        const r = getRoomById(b.roomId), canCI = type === 'cur' && !b.checkedIn && b.status === 'confirmed', earlyCi = type === 'up' && timeMin(b.startTime) - timeMin(ct) <= 15 && !b.checkedIn;
        return `<div class="checkin-card" style="${canCI ? 'border-left:3px solid var(--color-success)' : ''}${b.checkedIn ? 'border-left:3px solid var(--brand-teal)' : ''}"><div class="avatar avatar-lg"><i class="fas ${r?.icon || 'fa-door-open'}"></i></div><div class="checkin-info"><div class="checkin-room">${b.title}</div><div class="checkin-time"><i class="fas fa-door-open"></i> ${r?.name || ''} · <i class="fas fa-clock"></i> ${fmt(b.startTime)}–${fmt(b.endTime)} · <i class="fas fa-users"></i> ${b.attendees?.length || 1}</div>${b.notes ? `<div style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:4px">${b.notes}</div>` : ''}</div><div class="checkin-actions">${b.checkedIn ? '<span class="badge badge-available"><i class="fas fa-check-circle"></i> Checked In</span>' : ''}${canCI ? `<button class="btn btn-success ci-btn" data-id="${b.id}"><i class="fas fa-check"></i> Check In</button>` : ''}${earlyCi ? `<button class="btn btn-success btn-sm ci-btn" data-id="${b.id}"><i class="fas fa-check"></i> Early Check-in</button>` : ''}${!b.checkedIn && b.status === 'confirmed' ? `<button class="btn btn-ghost btn-sm" onclick="if(confirm('Cancel?')){cancelBooking('${b.id}');viewCheckin(document.getElementById('view-container'));showToast('Cancelled','info');}"><i class="fas fa-times"></i></button>` : ''}<button class="btn btn-ghost btn-sm" onclick="downloadICS('${b.id}')" title="Export to Calendar"><i class="fas fa-file-export"></i></button></div></div>`;
    }

    container.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xl)"><div><h2>Check-in & Attendance</h2><p style="color:var(--text-secondary)">Confirm attendance for today's meetings</p></div><div class="stat-card" style="padding:var(--space-md)"><div style="font-size:var(--fs-xs);color:var(--text-muted)">Checked In</div><div style="font-size:var(--fs-xl);font-weight:800">${ci}<span style="font-size:var(--fs-sm);color:var(--text-muted)"> / ${my.length}</span></div></div></div>
  ${cur.length ? `<div style="margin-bottom:var(--space-xl)"><h3 style="margin-bottom:var(--space-md)"><span style="width:8px;height:8px;border-radius:50%;background:var(--color-success);display:inline-block;animation:pulse 2s infinite"></span> Happening Now</h3>${cur.map(b => mkCard(b, 'cur')).join('')}</div>` : ''}
  ${up.length ? `<div style="margin-bottom:var(--space-xl)"><h3 style="margin-bottom:var(--space-md);color:var(--text-secondary)"><i class="fas fa-clock" style="color:var(--color-warning);margin-right:8px"></i>Upcoming</h3>${up.map(b => mkCard(b, 'up')).join('')}</div>` : ''}
  ${past.length ? `<div style="margin-bottom:var(--space-xl)"><h3 style="margin-bottom:var(--space-md);color:var(--text-muted)"><i class="fas fa-history" style="margin-right:8px"></i>Earlier</h3>${past.map(b => mkCard(b, 'past')).join('')}</div>` : ''}
  ${my.length === 0 ? '<div class="card" style="text-align:center;padding:var(--space-3xl)"><i class="fas fa-calendar-check" style="font-size:3rem;color:var(--brand-orange);opacity:.3;margin-bottom:var(--space-md)"></i><h3>No Meetings Today</h3></div>' : ''}
  <div class="card" style="margin-top:var(--space-xl)"><div class="card-header"><h3 class="card-title"><i class="fas fa-clipboard-list" style="color:var(--brand-teal);margin-right:8px"></i>Attendance Log</h3></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Meeting</th><th>Room</th><th>Time</th><th>Status</th></tr></thead><tbody>${my.map(b => { const r = getRoomById(b.roomId); return `<tr><td><strong>${b.title}</strong></td><td>${r?.name || ''}</td><td>${fmt(b.startTime)}–${fmt(b.endTime)}</td><td>${b.checkedIn ? '<span class="badge badge-available">Present</span>' : b.endTime <= ct ? '<span class="badge badge-occupied">Missed</span>' : '<span class="badge badge-upcoming">Pending</span>'}</td></tr>`; }).join('')}${my.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:var(--space-lg)">No records</td></tr>' : ''}</tbody></table></div></div>`;
    container.querySelectorAll('.ci-btn').forEach(b => b.addEventListener('click', () => { checkIn(b.dataset.id); showToast('Checked in! ✓', 'success'); viewCheckin(container); }));
    setPage('Check-in', `${ci} of ${my.length} checked in`);
}

// ===== ANALYTICS VIEW with Department & Real Comparisons =====
let _charts = [];
function viewAnalytics(container) {
    _charts.forEach(c => c.destroy()); _charts = []; const a = getAnalytics(30);

    const changeIcon = v => v > 0 ? 'fa-arrow-up' : v < 0 ? 'fa-arrow-down' : 'fa-minus';
    const changeClass = v => v > 0 ? 'positive' : v < 0 ? 'negative' : '';

    container.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xl)"><div><h2>Analytics & Insights</h2><p style="color:var(--text-secondary)">Room usage patterns and trends</p></div>
    <div style="display:flex;gap:var(--space-sm)"><select id="analytics-range" class="btn btn-secondary"><option value="7">7 Days</option><option value="14">14 Days</option><option value="30" selected>30 Days</option></select><button class="btn btn-secondary" onclick="exportCSV()"><i class="fas fa-download"></i> Export CSV</button></div></div>
  <div class="grid-stats slide-up">
    <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-calendar-check"></i></div><div class="stat-value">${a.totalBookings}</div><div class="stat-label">Total Bookings</div><div class="stat-change ${changeClass(a.bookingChange)}"><i class="fas ${changeIcon(a.bookingChange)}"></i> ${a.bookingChange > 0 ? '+' : ''}${a.bookingChange}% vs prev period</div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fas fa-user-check"></i></div><div class="stat-value">${a.checkedInRate}%</div><div class="stat-label">Check-in Rate</div><div class="stat-change ${changeClass(a.ciRateChange)}"><i class="fas ${changeIcon(a.ciRateChange)}"></i> ${a.ciRateChange > 0 ? '+' : ''}${a.ciRateChange}% vs prev</div></div>
    <div class="stat-card"><div class="stat-icon teal"><i class="fas fa-clock"></i></div><div class="stat-value">${a.avgDuration}<span style="font-size:var(--fs-sm)">m</span></div><div class="stat-label">Avg Duration</div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-users"></i></div><div class="stat-value">${a.avgAttendees}</div><div class="stat-label">Avg Attendees</div></div>
  </div>
  <div class="grid-2" style="margin-top:var(--space-xl)"><div class="card slide-up"><div class="card-header"><h3 class="card-title"><i class="fas fa-chart-line" style="color:var(--brand-orange);margin-right:8px"></i>Booking Trends</h3></div><div class="chart-container"><canvas id="ch-trend"></canvas></div></div>
  <div class="card slide-up"><div class="card-header"><h3 class="card-title"><i class="fas fa-chart-bar" style="color:var(--brand-teal);margin-right:8px"></i>Room Utilization</h3></div><div class="chart-container"><canvas id="ch-util"></canvas></div></div></div>
  <div class="grid-2" style="margin-top:var(--space-lg)"><div class="card slide-up"><div class="card-header"><h3 class="card-title"><i class="fas fa-fire" style="color:var(--color-warning);margin-right:8px"></i>Peak Hours</h3></div><div class="chart-container"><canvas id="ch-peak"></canvas></div></div>
  <div class="card slide-up"><div class="card-header"><h3 class="card-title"><i class="fas fa-trophy" style="color:var(--color-warning);margin-right:8px"></i>Top Rooms</h3></div><div class="chart-container"><canvas id="ch-top"></canvas></div></div></div>

  <!-- NEW: Department Analytics -->
  <div class="grid-2" style="margin-top:var(--space-lg)">
    <div class="card slide-up"><div class="card-header"><h3 class="card-title"><i class="fas fa-building" style="color:var(--color-info);margin-right:8px"></i>Department Usage</h3></div><div class="chart-container"><canvas id="ch-dept"></canvas></div></div>
    <div class="card slide-up"><div class="card-header"><h3 class="card-title"><i class="fas fa-map-marker-alt" style="color:var(--brand-orange);margin-right:8px"></i>Office Utilization</h3></div><div class="chart-container"><canvas id="ch-office"></canvas></div></div>
  </div>

  <div class="card" style="margin-top:var(--space-lg)"><div class="card-header"><h3 class="card-title"><i class="fas fa-table" style="color:var(--color-info);margin-right:8px"></i>Room Summary</h3></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Room</th><th>Bookings</th><th>Hours</th><th>Utilization</th></tr></thead><tbody>${Object.values(a.roomUsage).map(d => { const h = (d.totalMinutes / 60).toFixed(1), p = Math.min(Math.round(d.totalMinutes / (30 * 12 * 60) * 100), 100); return `<tr><td><strong>${d.name}</strong></td><td>${d.count}</td><td>${h}h</td><td><div style="display:flex;align-items:center;gap:8px"><div class="progress-bar" style="flex:1;max-width:120px"><div class="progress-fill" style="width:${p}%"></div></div><span style="font-size:var(--fs-xs)">${p}%</span></div></td></tr>`; }).join('')}</tbody></table></div></div>

  <!-- NEW: Department Breakdown Table -->
  <div class="card" style="margin-top:var(--space-lg)"><div class="card-header"><h3 class="card-title"><i class="fas fa-users-cog" style="color:var(--brand-teal);margin-right:8px"></i>Department Breakdown</h3></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Department</th><th>Bookings</th><th>Hours</th><th>Check-in Rate</th></tr></thead><tbody>${Object.entries(a.deptUsage).sort((x, y) => y[1].count - x[1].count).map(([dept, d]) => { const h = (d.totalMinutes / 60).toFixed(1); const ciRate = d.count > 0 ? Math.round(d.checkedIn / d.count * 100) : 0; return `<tr><td><strong>${dept}</strong></td><td>${d.count}</td><td>${h}h</td><td><span class="badge badge-${ciRate >= 70 ? 'available' : 'occupied'}">${ciRate}%</span></td></tr>`; }).join('')}${Object.keys(a.deptUsage).length === 0 ? '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No data</td></tr>' : ''}</tbody></table></div></div>`;

    // Date range change
    container.querySelector('#analytics-range')?.addEventListener('change', e => {
        const days = parseInt(e.target.value);
        _charts.forEach(c => c.destroy()); _charts = [];
        viewAnalytics(container);
    });

    setTimeout(() => {
        const co = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#5B6B8D', font: { size: 10 } }, grid: { color: 'rgba(148,163,196,.06)' } }, y: { beginAtZero: true, ticks: { color: '#5B6B8D', font: { size: 10 } }, grid: { color: 'rgba(148,163,196,.06)' } } } };
        const tl = Object.keys(a.dailyCounts).map(d => { const x = new Date(d); return `${x.getDate()}/${x.getMonth() + 1}`; });
        _charts.push(new Chart(document.getElementById('ch-trend'), { type: 'line', data: { labels: tl, datasets: [{ label: 'Bookings', data: Object.values(a.dailyCounts), borderColor: '#E8652D', backgroundColor: 'rgba(232,101,45,.1)', fill: true, tension: .4, pointRadius: 3, pointBackgroundColor: '#E8652D' }] }, options: co }));
        const rd = Object.values(a.roomUsage).filter(r => r.count > 0);
        _charts.push(new Chart(document.getElementById('ch-util'), { type: 'bar', data: { labels: rd.map(r => r.name.length > 15 ? r.name.substring(0, 15) + '..' : r.name), datasets: [{ label: 'Hours', data: rd.map(r => (r.totalMinutes / 60).toFixed(1)), backgroundColor: ['rgba(232,101,45,.7)', 'rgba(0,184,169,.7)', 'rgba(59,130,246,.7)', 'rgba(34,197,94,.7)', 'rgba(251,191,36,.7)', 'rgba(168,85,247,.7)', 'rgba(236,72,153,.7)', 'rgba(239,68,68,.7)'], borderRadius: 8, barThickness: 28 }] }, options: co }));
        const pd = a.hourCounts.slice(8, 21), pl = pd.map((_, i) => `${i + 8}:00`), mx = Math.max(...pd);
        _charts.push(new Chart(document.getElementById('ch-peak'), { type: 'bar', data: { labels: pl, datasets: [{ label: 'Meetings', data: pd, backgroundColor: pd.map(v => `rgba(0,184,169,${.2 + v / Math.max(mx, 1) * .7})`), borderRadius: 6, barThickness: 20 }] }, options: co }));
        const tp = a.topRooms.slice(0, 5);
        _charts.push(new Chart(document.getElementById('ch-top'), { type: 'doughnut', data: { labels: tp.map(r => r.name.length > 18 ? r.name.substring(0, 18) + '..' : r.name), datasets: [{ data: tp.map(r => r.count), backgroundColor: ['rgba(232,101,45,.8)', 'rgba(0,184,169,.8)', 'rgba(59,130,246,.8)', 'rgba(251,191,36,.8)', 'rgba(168,85,247,.8)'], borderColor: '#0B0F19', borderWidth: 3 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94A3C4', padding: 16, font: { size: 11 } } } }, cutout: '65%' } }));

        // NEW: Department chart
        const deptEntries = Object.entries(a.deptUsage).sort((x, y) => y[1].count - x[1].count);
        if (deptEntries.length > 0 && document.getElementById('ch-dept')) {
            _charts.push(new Chart(document.getElementById('ch-dept'), { type: 'bar', data: { labels: deptEntries.map(([d]) => d), datasets: [{ label: 'Bookings', data: deptEntries.map(([, d]) => d.count), backgroundColor: ['rgba(232,101,45,.7)', 'rgba(0,184,169,.7)', 'rgba(59,130,246,.7)', 'rgba(34,197,94,.7)', 'rgba(251,191,36,.7)', 'rgba(168,85,247,.7)'], borderRadius: 8, barThickness: 28 }] }, options: co }));
        }

        // NEW: Office chart
        const offEntries = Object.values(a.officeUsage).filter(o => o.totalBookings > 0);
        if (offEntries.length > 0 && document.getElementById('ch-office')) {
            _charts.push(new Chart(document.getElementById('ch-office'), { type: 'doughnut', data: { labels: offEntries.map(o => o.name.split('—')[0].trim()), datasets: [{ data: offEntries.map(o => o.totalBookings), backgroundColor: ['rgba(232,101,45,.8)', 'rgba(0,184,169,.8)', 'rgba(59,130,246,.8)'], borderColor: '#0B0F19', borderWidth: 3 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94A3C4', padding: 16, font: { size: 11 } } } }, cutout: '60%' } }));
        }
    }, 200); setPage('Analytics', 'Room usage patterns and insights');
}

function exportCSV() {
    const a = getAnalytics(30);
    const rows = ['Room,Bookings,Minutes,Office'];
    Object.entries(a.roomUsage).forEach(([id, d]) => {
        const room = getRoomById(id);
        const office = room ? getOfficeById(room.officeId) : null;
        rows.push(`"${d.name}",${d.count},${d.totalMinutes},"${office?.name?.split('—')[0].trim() || ''}"`);
    });
    rows.push('');
    rows.push('Department,Bookings,Minutes,CheckInRate');
    Object.entries(a.deptUsage).forEach(([dept, d]) => {
        const ciRate = d.count > 0 ? Math.round(d.checkedIn / d.count * 100) : 0;
        rows.push(`"${dept}",${d.count},${d.totalMinutes},${ciRate}%`);
    });
    const b = new Blob([rows.join('\n')], { type: 'text/csv' }); const u = URL.createObjectURL(b); const l = document.createElement('a'); l.href = u; l.download = 'room-analytics.csv'; l.click(); URL.revokeObjectURL(u); showToast('Report exported!', 'success');
}

// ===== ADMIN VIEW with Approval Workflow =====
function viewAdmin(container) {
    if (!isAdmin()) { container.innerHTML = '<div class="card" style="text-align:center;padding:var(--space-3xl)"><i class="fas fa-lock" style="font-size:3rem;color:var(--color-error);opacity:.4;margin-bottom:var(--space-md)"></i><h3>Access Denied</h3></div>'; return; }
    const users = getUsers(), rooms = getRooms(), offices = getOffices(), set = getSettings(); let tab = 'settings';
    const pending = getPendingApprovals();

    function render() {
        container.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xl)"><div><h2>Admin Panel</h2><p style="color:var(--text-secondary)">System settings & management</p></div><button class="btn btn-danger btn-sm" onclick="if(confirm('Reset all data?')){resetData();showToast('Data reset','info');viewAdmin(document.getElementById('view-container'));}"><i class="fas fa-undo"></i> Reset Data</button></div>
  <div class="tabs" id="at"><button class="tab ${tab === 'settings' ? 'active' : ''}" data-t="settings">Settings</button><button class="tab ${tab === 'users' ? 'active' : ''}" data-t="users">Users</button><button class="tab ${tab === 'rooms' ? 'active' : ''}" data-t="rooms">Rooms</button><button class="tab ${tab === 'approvals' ? 'active' : ''}" data-t="approvals">Approvals${pending.length > 0 ? ` <span class="badge badge-occupied" style="font-size:.7em">${pending.length}</span>` : ''}</button></div><div id="atc"></div>`;
        const atc = document.getElementById('atc');
        if (tab === 'settings') {
            atc.innerHTML = `<div class="settings-grid">
  <div class="setting-item"><div class="setting-info"><h4>Auto-Release (min)</h4><p>Release if no check-in</p></div><input type="number" id="s-ar" value="${set.autoReleaseMinutes}" min="5" max="60" style="width:70px;padding:8px;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--border-radius-sm);color:var(--text-primary);text-align:center"/></div>
  <div class="setting-item"><div class="setting-info"><h4>Max Duration (hrs)</h4><p>Max booking length</p></div><input type="number" id="s-md" value="${set.maxBookingDurationHours}" min="1" max="12" style="width:70px;padding:8px;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--border-radius-sm);color:var(--text-primary);text-align:center"/></div>
  <div class="setting-item"><div class="setting-info"><h4>Advance Booking (days)</h4><p>How far ahead to book</p></div><input type="number" id="s-ad" value="${set.advanceBookingDays}" min="1" max="90" style="width:70px;padding:8px;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--border-radius-sm);color:var(--text-primary);text-align:center"/></div>
  <div class="setting-item"><div class="setting-info"><h4>Allow Recurring</h4><p>Enable recurring bookings</p></div><label class="toggle-switch"><input type="checkbox" id="s-rec" ${set.allowRecurring ? 'checked' : ''}><span class="toggle-slider"></span></label></div>
  <div class="setting-item"><div class="setting-info"><h4>Require Approval</h4><p>Employees need manager approval</p></div><label class="toggle-switch"><input type="checkbox" id="s-apv" ${set.requireApproval ? 'checked' : ''}><span class="toggle-slider"></span></label></div>
  <div class="setting-item"><div class="setting-info"><h4>Reminder (min before)</h4><p>When to send meeting reminders</p></div><input type="number" id="s-rem" value="${set.reminderMinutes || 15}" min="5" max="60" style="width:70px;padding:8px;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--border-radius-sm);color:var(--text-primary);text-align:center"/></div>
  <div class="setting-item"><div class="setting-info"><h4>Signage Rotation (sec)</h4><p>Auto-rotate interval</p></div><input type="number" id="s-sig" value="${set.signageRotateSeconds}" min="5" max="60" style="width:70px;padding:8px;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--border-radius-sm);color:var(--text-primary);text-align:center"/></div>
  <div class="setting-item"><div class="setting-info"><h4>Organization</h4><p>Brand name</p></div><input type="text" id="s-bn" value="${set.brandName}" style="width:150px;padding:8px;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--border-radius-sm);color:var(--text-primary)"/></div>
  </div><div style="margin-top:var(--space-lg);display:flex;justify-content:flex-end"><button class="btn btn-primary" id="s-save"><i class="fas fa-save"></i> Save</button></div>`;
            document.getElementById('s-save')?.addEventListener('click', () => {
                updateSettings({
                    autoReleaseMinutes: parseInt(document.getElementById('s-ar').value),
                    maxBookingDurationHours: parseInt(document.getElementById('s-md').value),
                    advanceBookingDays: parseInt(document.getElementById('s-ad').value),
                    allowRecurring: document.getElementById('s-rec').checked,
                    requireApproval: document.getElementById('s-apv').checked,
                    reminderMinutes: parseInt(document.getElementById('s-rem').value),
                    signageRotateSeconds: parseInt(document.getElementById('s-sig').value),
                    brandName: document.getElementById('s-bn').value
                }); showToast('Saved!', 'success');
            });
        }
        else if (tab === 'users') { atc.innerHTML = `<div class="table-wrap"><table class="data-table"><thead><tr><th>User</th><th>Email</th><th>Dept</th><th>Role</th><th>Change</th></tr></thead><tbody>${users.map(u => `<tr><td><div style="display:flex;align-items:center;gap:8px"><div class="avatar" style="width:32px;height:32px;font-size:.6rem">${u.initials}</div><strong>${u.name}</strong></div></td><td style="color:var(--text-secondary)">${u.email}</td><td>${u.department}</td><td><span class="badge badge-${u.role}">${u.role}</span></td><td><select onchange="updateUser('${u.id}',{role:this.value});showToast('Role updated','success')" style="padding:6px;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--border-radius-sm);color:var(--text-primary);font-size:var(--fs-xs)"><option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option><option value="manager" ${u.role === 'manager' ? 'selected' : ''}>Manager</option><option value="employee" ${u.role === 'employee' ? 'selected' : ''}>Employee</option></select></td></tr>`).join('')}</tbody></table></div>`; }
        else if (tab === 'rooms') { atc.innerHTML = `<div class="table-wrap"><table class="data-table"><thead><tr><th>Room</th><th>Office</th><th>Cap</th><th>Status</th></tr></thead><tbody>${rooms.map(r => { const of = offices.find(o => o.id === r.officeId); return `<tr><td><div style="display:flex;align-items:center;gap:8px"><div class="avatar" style="width:32px;height:32px;font-size:.7rem"><i class="fas ${r.icon}"></i></div><strong>${r.name}</strong></div></td><td style="font-size:var(--fs-xs);color:var(--text-secondary)">${of?.name.split('—')[0].trim() || ''}</td><td>${r.capacity}</td><td><span class="badge badge-${r.status === 'available' ? 'available' : 'maintenance'}">${r.status}</span></td></tr>`; }).join('')}</tbody></table></div>`; }
        else if (tab === 'approvals') {
            const allPending = getPendingApprovals();
            atc.innerHTML = `<div class="admin-section slide-up"><h3 style="margin-bottom:var(--space-md)"><i class="fas fa-clipboard-check" style="color:var(--color-warning);margin-right:8px"></i>Pending Approvals <span class="badge badge-occupied">${allPending.length}</span></h3>
            ${allPending.length === 0 ? '<div class="empty-state" style="padding:var(--space-xl)"><i class="fas fa-check-circle" style="font-size:2rem;color:var(--color-success);opacity:.4"></i><h4>All Clear!</h4><p>No pending approvals</p></div>' : ''}
            ${allPending.map(b => {
                const room = getRoomById(b.roomId);
                const user = getUserById(b.userId);
                return `<div class="checkin-card" style="border-left:3px solid var(--color-warning)">
                    <div class="avatar avatar-lg"><i class="fas ${room?.icon || 'fa-door-open'}"></i></div>
                    <div class="checkin-info">
                        <div class="checkin-room">${b.title}</div>
                        <div class="checkin-time"><strong>${user?.name || ''}</strong> (${user?.department || ''}) · ${room?.name || ''} · ${b.date} · ${fmt(b.startTime)}–${fmt(b.endTime)}</div>
                        ${b.notes ? `<div style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:4px">${b.notes}</div>` : ''}
                    </div>
                    <div class="checkin-actions">
                        <button class="btn btn-success btn-sm" onclick="approveBooking('${b.id}');showToast('Approved','success');viewAdmin(document.getElementById('view-container'));"><i class="fas fa-check"></i> Approve</button>
                        <button class="btn btn-danger btn-sm" onclick="rejectBooking('${b.id}');showToast('Rejected','info');viewAdmin(document.getElementById('view-container'));"><i class="fas fa-times"></i> Reject</button>
                    </div>
                </div>`;
            }).join('')}</div>`;
        }
        container.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { tab = b.dataset.t; render(); }));
    }
    render(); setPage('Admin Panel', 'System configuration');
}
