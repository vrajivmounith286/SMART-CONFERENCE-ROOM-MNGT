// ===== FLOOR PLAN VIEW — Interactive 2D Heatmap =====
function viewFloorPlan(container) {
    const offices = getOffices();
    let selectedOffice = curUser()?.office || 'off1';
    let selectedRoom = null;
    let hoveredRoom = null;

    function render() {
        const layout = getFloorPlanLayout(selectedOffice);
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const ct = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const u = curUser();

        // Get AI recommendations
        const recs = getAIRecommendations(4, [], selectedOffice);

        // Get room statuses
        const roomStatuses = {};
        layout.rooms.forEach(lr => {
            const room = getRoomById(lr.roomId);
            if (!room) return;
            const bookings = getBookingsForRoom(lr.roomId, today);
            const cur = bookings.find(b => ct >= b.startTime && ct < b.endTime);
            const next = bookings.find(b => b.startTime > ct);
            const nextSoon = next && (timeMin(next.startTime) - timeMin(ct) <= 30);
            let status;
            if (room.status === 'maintenance') status = 'maintenance';
            else if (cur) status = 'occupied';
            else if (nextSoon) status = 'reserved-soon';
            else status = 'available';
            roomStatuses[lr.roomId] = { status, cur, next, room, bookingsToday: bookings.length };
        });

        container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:var(--space-md)">
            <div><h2 style="font-size:var(--fs-2xl)">Floor Plan</h2><p style="color:var(--text-secondary)">Interactive office heatmap — real-time room status</p></div>
            <div style="display:flex;gap:var(--space-sm);align-items:center">
                <select id="fp-office" class="btn btn-secondary">${offices.map(o => `<option value="${o.id}" ${o.id === selectedOffice ? 'selected' : ''}>${o.name.split('—')[0].trim()}</option>`).join('')}</select>
                <div style="display:flex;gap:var(--space-lg);align-items:center;font-size:var(--fs-xs)">
                    <span><span class="fp-legend-dot" style="background:var(--color-success)"></span> Available</span>
                    <span><span class="fp-legend-dot" style="background:var(--color-error)"></span> Occupied</span>
                    <span><span class="fp-legend-dot" style="background:var(--color-warning)"></span> Reserved Soon</span>
                    <span><span class="fp-legend-dot" style="background:var(--text-muted)"></span> Maintenance</span>
                </div>
            </div>
        </div>
        <div class="floorplan-layout">
            <!-- LEFT: AI Recommendation Widget -->
            <div class="fp-sidebar slide-up">
                <div class="card fp-ai-card">
                    <div class="fp-ai-header">
                        <div class="fp-ai-icon"><i class="fas fa-brain"></i></div>
                        <div><h3 style="font-size:var(--fs-lg);margin:0">AI Smart Recommendations</h3><p style="font-size:var(--fs-xs);color:var(--text-muted);margin:0">Based on your preferences & availability</p></div>
                    </div>
                    <div class="fp-ai-settings">
                        <div class="form-group" style="margin-bottom:var(--space-sm)"><label style="font-size:.65rem">Participants</label><select id="fp-attendees" style="padding:8px;width:100%;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--border-radius-sm);color:var(--text-primary);font-size:var(--fs-xs)"><option value="2">2 people</option><option value="4" selected>4 people</option><option value="6">6 people</option><option value="8">8 people</option><option value="12">12 people</option><option value="15">15+ people</option></select></div>
                        <div class="form-group" style="margin-bottom:var(--space-sm)"><label style="font-size:.65rem">Equipment</label><div style="display:flex;flex-wrap:wrap;gap:4px" id="fp-equip-chips">
                            <label class="chip fp-equip-chip" style="cursor:pointer;font-size:.65rem"><input type="checkbox" value="projector" class="fp-eq-cb" style="display:none"><i class="fas fa-chalkboard"></i> Projector</label>
                            <label class="chip fp-equip-chip" style="cursor:pointer;font-size:.65rem"><input type="checkbox" value="video-conferencing" class="fp-eq-cb" style="display:none"><i class="fas fa-video"></i> Video</label>
                            <label class="chip fp-equip-chip" style="cursor:pointer;font-size:.65rem"><input type="checkbox" value="whiteboard" class="fp-eq-cb" style="display:none"><i class="fas fa-pen"></i> Whiteboard</label>
                            <label class="chip fp-equip-chip" style="cursor:pointer;font-size:.65rem"><input type="checkbox" value="speaker-system" class="fp-eq-cb" style="display:none"><i class="fas fa-volume-up"></i> Speaker</label>
                        </div></div>
                    </div>
                    <div id="fp-recs-list"></div>
                </div>
            </div>

            <!-- CENTER: Interactive Floor Plan SVG -->
            <div class="fp-center slide-up" style="animation-delay:.1s">
                <div class="card fp-map-card" id="fp-map-container">
                    <div class="fp-map-header">
                        <h4><i class="fas fa-map" style="color:var(--brand-orange);margin-right:6px"></i>${layout.officeName}</h4>
                        <span style="font-size:var(--fs-xs);color:var(--text-muted)">Live • ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div class="fp-svg-wrap" id="fp-svg-wrap"></div>
                </div>

                <!-- Room Detail Panel -->
                <div class="card fp-detail-card slide-up" style="animation-delay:.2s;margin-top:var(--space-md)" id="fp-detail">
                    <div style="text-align:center;padding:var(--space-lg);color:var(--text-muted)">
                        <i class="fas fa-mouse-pointer" style="font-size:1.5rem;opacity:.3;margin-bottom:8px;display:block"></i>
                        Click a room on the map to see details
                    </div>
                </div>
            </div>

        </div>`;

        // Render SVG floor plan
        renderFloorPlanSVG(layout, roomStatuses);

        // Render AI recommendations
        renderRecommendations();



        // Event handlers
        document.getElementById('fp-office')?.addEventListener('change', e => {
            selectedOffice = e.target.value;
            selectedRoom = null;
            render();
        });

        document.querySelectorAll('.fp-eq-cb').forEach(cb => {
            cb.addEventListener('change', () => {
                const chip = cb.closest('.fp-equip-chip');
                chip.style.borderColor = cb.checked ? 'var(--brand-teal)' : '';
                chip.style.background = cb.checked ? 'rgba(0,184,169,.15)' : '';
                renderRecommendations();
            });
        });

        document.getElementById('fp-attendees')?.addEventListener('change', renderRecommendations);

        setPage('Floor Plan', 'Interactive room heatmap');
    }

    function renderFloorPlanSVG(layout, roomStatuses) {
        const wrap = document.getElementById('fp-svg-wrap');
        if (!wrap) return;

        const statusColors = {
            'available': { fill: 'rgba(34,197,94,0.2)', stroke: '#22C55E', glow: 'rgba(34,197,94,0.4)' },
            'occupied': { fill: 'rgba(239,68,68,0.2)', stroke: '#EF4444', glow: 'rgba(239,68,68,0.4)' },
            'reserved-soon': { fill: 'rgba(251,191,36,0.2)', stroke: '#FBBF24', glow: 'rgba(251,191,36,0.4)' },
            'maintenance': { fill: 'rgba(91,107,141,0.1)', stroke: '#5B6B8D', glow: 'rgba(91,107,141,0.2)' },
        };

        let svg = `<svg viewBox="0 0 ${layout.width} ${layout.height}" class="fp-svg" preserveAspectRatio="xMidYMid meet">`;

        // Defs for glow effects
        svg += `<defs>
            <filter id="glow-green"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="glow-red"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="glow-yellow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(148,163,196,0.04)" stroke-width="0.5"/></pattern>
        </defs>`;

        // Background grid
        svg += `<rect width="${layout.width}" height="${layout.height}" fill="url(#grid)" rx="12"/>`;
        svg += `<rect width="${layout.width}" height="${layout.height}" fill="none" stroke="rgba(148,163,196,0.08)" rx="12" stroke-width="1"/>`;

        // Corridors
        layout.corridors.forEach(c => {
            svg += `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" fill="rgba(148,163,196,0.03)" stroke="rgba(148,163,196,0.06)" stroke-width="0.5" stroke-dasharray="4,4"/>`;
            // Corridor label
            svg += `<text x="${c.x + c.w / 2}" y="${c.y + c.h / 2 + 3}" text-anchor="middle" fill="rgba(148,163,196,0.15)" font-size="9" font-family="Inter">CORRIDOR</text>`;
        });

        // Amenities
        layout.amenities.forEach(a => {
            svg += `<text x="${a.x + a.w / 2}" y="${a.y + a.h / 2 + 5}" text-anchor="middle" font-size="16">${a.label}</text>`;
            svg += `<text x="${a.x + a.w / 2}" y="${a.y + a.h + 12}" text-anchor="middle" fill="rgba(148,163,196,0.3)" font-size="7" font-family="Inter">${a.name}</text>`;
        });

        // Rooms
        layout.rooms.forEach(lr => {
            const rs = roomStatuses[lr.roomId];
            if (!rs) return;
            const sc = statusColors[rs.status];
            const isSelected = selectedRoom === lr.roomId;
            const room = rs.room;
            const filterAttr = rs.status === 'available' ? 'filter="url(#glow-green)"'
                : rs.status === 'occupied' ? 'filter="url(#glow-red)"'
                    : rs.status === 'reserved-soon' ? 'filter="url(#glow-yellow)"' : '';

            // Room rectangle with glow
            svg += `<g class="fp-room-group" data-room-id="${lr.roomId}" style="cursor:pointer">`;

            // Glow border
            if (rs.status !== 'maintenance') {
                svg += `<rect x="${lr.x - 2}" y="${lr.y - 2}" width="${lr.w + 4}" height="${lr.h + 4}" rx="10" fill="none" stroke="${sc.glow}" stroke-width="${isSelected ? 3 : 1.5}" ${filterAttr} class="fp-room-glow"/>`;
            }

            // Room fill
            svg += `<rect x="${lr.x}" y="${lr.y}" width="${lr.w}" height="${lr.h}" rx="8" fill="${sc.fill}" stroke="${sc.stroke}" stroke-width="${isSelected ? 2.5 : 1.5}" class="fp-room-rect"/>`;

            // Heatmap intensity overlay (based on bookings today)
            const intensity = Math.min(rs.bookingsToday / 5, 1);
            if (rs.status === 'available' && intensity > 0) {
                svg += `<rect x="${lr.x}" y="${lr.y}" width="${lr.w}" height="${lr.h}" rx="8" fill="rgba(232,101,45,${intensity * 0.15})"/>`;
            }

            // Status indicator dot
            const dotX = lr.x + lr.w - 14, dotY = lr.y + 14;
            svg += `<circle cx="${dotX}" cy="${dotY}" r="5" fill="${sc.stroke}"/>`;
            if (rs.status === 'available') {
                svg += `<circle cx="${dotX}" cy="${dotY}" r="5" fill="${sc.stroke}" class="fp-pulse-dot"/>`;
            }

            // Room name
            const lines = lr.label.split('\\n');
            lines.forEach((line, i) => {
                svg += `<text x="${lr.x + lr.w / 2}" y="${lr.y + lr.h / 2 - (lines.length - 1) * 7 + i * 16}" text-anchor="middle" fill="${sc.stroke}" font-size="11" font-weight="600" font-family="Outfit">${line}</text>`;
            });

            // Capacity & icon
            svg += `<text x="${lr.x + 10}" y="${lr.y + lr.h - 10}" fill="rgba(148,163,196,0.5)" font-size="8" font-family="Inter"><tspan font-size="9">👥</tspan> ${room.capacity}</text>`;

            // Current meeting label
            if (rs.cur) {
                svg += `<text x="${lr.x + lr.w / 2}" y="${lr.y + lr.h - 12}" text-anchor="middle" fill="rgba(239,68,68,0.7)" font-size="7" font-family="Inter">${rs.cur.title.substring(0, 20)}${rs.cur.title.length > 20 ? '..' : ''}</text>`;
            }

            svg += `</g>`;
        });

        svg += '</svg>';
        wrap.innerHTML = svg;

        // Click handlers for rooms
        wrap.querySelectorAll('.fp-room-group').forEach(g => {
            g.addEventListener('click', () => {
                selectedRoom = g.dataset.roomId;
                renderRoomDetail(g.dataset.roomId, roomStatuses);
                // Update selected state
                wrap.querySelectorAll('.fp-room-rect').forEach(r => r.style.strokeWidth = '1.5');
                g.querySelector('.fp-room-rect').style.strokeWidth = '3';
            });
            g.addEventListener('mouseenter', () => {
                g.querySelector('.fp-room-rect').style.strokeWidth = '2.5';
            });
            g.addEventListener('mouseleave', () => {
                if (selectedRoom !== g.dataset.roomId) {
                    g.querySelector('.fp-room-rect').style.strokeWidth = '1.5';
                }
            });
        });
    }

    function renderRoomDetail(roomId, roomStatuses) {
        const detail = document.getElementById('fp-detail');
        if (!detail) return;
        const rs = roomStatuses[roomId];
        if (!rs) return;
        const room = rs.room;
        const office = getOfficeById(room.officeId);
        const today = new Date().toISOString().split('T')[0];
        const bookings = getBookingsForRoom(roomId, today).sort((a, b) => a.startTime.localeCompare(b.startTime));

        const statusMap = {
            'available': { badge: 'available', label: 'Available', icon: 'fa-check-circle' },
            'occupied': { badge: 'occupied', label: 'In Use', icon: 'fa-lock' },
            'reserved-soon': { badge: 'upcoming', label: 'Reserved Soon', icon: 'fa-clock' },
            'maintenance': { badge: 'maintenance', label: 'Maintenance', icon: 'fa-wrench' },
        };
        const sm = statusMap[rs.status];

        detail.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:var(--space-md)">
                <div style="display:flex;align-items:center;gap:var(--space-md)">
                    <div class="avatar avatar-lg" style="width:52px;height:52px;font-size:1.1rem"><i class="fas ${room.icon}"></i></div>
                    <div>
                        <h3 style="margin:0">${room.name}</h3>
                        <div style="font-size:var(--fs-xs);color:var(--text-muted)">${office?.name || ''} · ${room.floor} · ${room.capacity} seats</div>
                        <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">${room.equipment.map(e => `<span class="chip" style="font-size:.6rem;padding:2px 8px"><i class="fas ${eqIcon(e)}"></i> ${eqName(e)}</span>`).join('')}</div>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:var(--space-sm)">
                    <span class="badge badge-${sm.badge}" style="font-size:var(--fs-sm);padding:6px 14px"><i class="fas ${sm.icon}" style="margin-right:4px"></i>${sm.label}</span>
                    ${rs.status === 'available' ? `<button class="btn btn-primary btn-sm" onclick="navigate('/booking')"><i class="fas fa-calendar-plus"></i> Book Now</button>` : ''}
                    ${room.zoomLink ? `<a href="${room.zoomLink}" target="_blank" class="btn btn-secondary btn-sm"><i class="fas fa-video"></i> Zoom</a>` : ''}
                </div>
            </div>
            ${bookings.length > 0 ? `
            <div style="margin-top:var(--space-md)">
                <h4 style="font-size:var(--fs-sm);color:var(--text-secondary);margin-bottom:var(--space-sm)"><i class="fas fa-calendar" style="margin-right:6px"></i>Today's Schedule</h4>
                <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap">${bookings.map(b => {
            const now = new Date();
            const ct2 = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const isNow = b.startTime <= ct2 && b.endTime > ct2;
            const isPast = b.endTime <= ct2;
            return `<div class="fp-booking-chip ${isNow ? 'now' : ''} ${isPast ? 'past' : ''}">
                        <div style="font-size:.65rem;font-weight:600">${fmtShort(b.startTime)}-${fmtShort(b.endTime)}</div>
                        <div style="font-size:.6rem;color:var(--text-secondary)">${b.title.substring(0, 15)}${b.title.length > 15 ? '..' : ''}</div>
                    </div>`;
        }).join('')}</div>
            </div>` : '<div style="margin-top:var(--space-md);color:var(--text-muted);font-size:var(--fs-sm)"><i class="fas fa-calendar-check" style="margin-right:6px"></i>No bookings today — room is free all day!</div>'}
            ${rs.cur ? `<div style="margin-top:var(--space-md);padding:var(--space-md);background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);border-radius:var(--border-radius-sm)"><div style="font-weight:600;font-size:var(--fs-sm)">"${rs.cur.title}"</div><div style="font-size:var(--fs-xs);color:var(--text-muted)">${fmt(rs.cur.startTime)} — ${fmt(rs.cur.endTime)} · Organizer: ${getUserById(rs.cur.userId)?.name || 'Unknown'}</div></div>` : ''}
        `;
    }

    function renderRecommendations() {
        const list = document.getElementById('fp-recs-list');
        if (!list) return;
        const attendees = parseInt(document.getElementById('fp-attendees')?.value || 4);
        const equip = Array.from(document.querySelectorAll('.fp-eq-cb:checked')).map(c => c.value);
        const recs = getAIRecommendations(attendees, equip, selectedOffice);

        list.innerHTML = recs.map((r, i) => `
            <div class="fp-rec-item ${i === 0 ? 'top-pick' : ''}" onclick="selectedRoom='${r.room.id}';document.querySelector('[data-room-id=\\'${r.room.id}\\']')?.dispatchEvent(new Event('click'))">
                <div class="fp-rec-rank">${i === 0 ? '<i class="fas fa-star"></i>' : i + 1}</div>
                <div class="fp-rec-info">
                    <div class="fp-rec-name">${r.room.name}</div>
                    <div class="fp-rec-tags">${r.reasons.slice(0, 3).map(t => `<span class="fp-rec-tag">${t}</span>`).join('')}</div>
                </div>
                <div class="fp-rec-score">
                    <div class="fp-score-ring" style="--score:${r.score}">
                        <svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(148,163,196,0.1)" stroke-width="3"/><circle cx="18" cy="18" r="15.9" fill="none" stroke="${r.score >= 80 ? '#22C55E' : r.score >= 60 ? '#FBBF24' : '#EF4444'}" stroke-width="3" stroke-dasharray="${r.score} ${100 - r.score}" stroke-dashoffset="25" stroke-linecap="round"/></svg>
                        <span>${r.score}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }



    render();
    // Auto refresh every 30 seconds
    const refreshInterval = setInterval(() => {
        if (!document.getElementById('fp-svg-wrap')) { clearInterval(refreshInterval); return; }
        render();
    }, 30000);
}
