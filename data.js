// ===== DATA & STORE =====
const STORAGE_KEY = 'orientbell_crm_data_v2';
const AUTH_KEY = 'orientbell_crm_auth';
let _data = null;
let _currentUser = null;
const _listeners = new Map();

function getSeedData() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const mkDate = (d, h, m = 0) => { const x = new Date(now); x.setDate(x.getDate() + d); x.setHours(h, m, 0, 0); return x.toISOString(); };
    const mkPast = d => { const x = new Date(now); x.setDate(x.getDate() + d); return x.toISOString().split('T')[0]; };
    const mkFuture = d => mkPast(d);

    return {
        users: [],
        offices: [
            { id: 'off1', name: 'Orientbell HQ — New Delhi', address: 'Iris Tech Park, Gurugram' },
            { id: 'off2', name: 'Manufacturing Plant — Sikandrabad', address: 'Sikandrabad Industrial Area, UP' },
            { id: 'off3', name: 'Experience Center — Mumbai', address: 'Andheri East, Mumbai' },
        ],
        rooms: [
            { id: 'r1', name: 'Cool Tiles Boardroom', officeId: 'off1', floor: '5th Floor', capacity: 20, status: 'available', equipment: ['projector', 'whiteboard', 'video-conferencing', 'air-conditioning'], icon: 'fa-snowflake', zoomLink: 'https://zoom.us/j/123', description: 'Executive boardroom named after Cool Tiles line.' },
            { id: 'r2', name: 'Germ-Free Meeting Room', officeId: 'off1', floor: '3rd Floor', capacity: 10, status: 'available', equipment: ['tv-screen', 'whiteboard', 'air-conditioning'], icon: 'fa-shield-virus', zoomLink: 'https://zoom.us/j/234', description: 'Sanitized room with Germ-Free tile surfaces.' },
            { id: 'r3', name: 'Forever Tiles Hub', officeId: 'off1', floor: '4th Floor', capacity: 8, status: 'available', equipment: ['tv-screen', 'phone', 'whiteboard'], icon: 'fa-infinity', zoomLink: '', description: 'Collaborative space with Forever Tiles.' },
            { id: 'r4', name: 'School Tiles Studio', officeId: 'off1', floor: '2nd Floor', capacity: 15, status: 'available', equipment: ['projector', 'whiteboard', 'video-conferencing', 'speaker-system'], icon: 'fa-graduation-cap', zoomLink: 'https://zoom.us/j/456', description: 'Training room with School Tiles theme.' },
            { id: 'r9', name: 'Strategy Room Alpha', officeId: 'off1', floor: '5th Floor', capacity: 12, status: 'available', equipment: ['projector', 'video-conferencing', 'whiteboard'], icon: 'fa-chess-knight', zoomLink: 'https://zoom.us/j/101', description: 'Quiet room for leadership planning.' },
            { id: 'r10', name: 'Creative Corner', officeId: 'off1', floor: '4th Floor', capacity: 6, status: 'available', equipment: ['tv-screen', 'whiteboard'], icon: 'fa-paint-brush', zoomLink: '', description: 'Small burst-meeting room.' },
            { id: 'r11', name: 'Tech Hive', officeId: 'off1', floor: '4th Floor', capacity: 14, status: 'available', equipment: ['projector', 'whiteboard', 'speaker-system'], icon: 'fa-laptop-code', zoomLink: 'https://zoom.us/j/102', description: 'IT and Engineering scrum room.' },
            { id: 'r12', name: 'Marketing Lounge', officeId: 'off1', floor: '3rd Floor', capacity: 8, status: 'available', equipment: ['tv-screen', 'video-conferencing'], icon: 'fa-bullhorn', zoomLink: 'https://zoom.us/j/103', description: 'Comfortable seating for brainstorms.' },
            { id: 'r13', name: 'Sales War Room', officeId: 'off1', floor: '3rd Floor', capacity: 10, status: 'maintenance', equipment: ['projector', 'phone', 'whiteboard'], icon: 'fa-chart-line', zoomLink: '', description: 'High energy target tracking room.' },
            { id: 'r14', name: 'HR Interview Pod A', officeId: 'off1', floor: '2nd Floor', capacity: 4, status: 'available', equipment: ['tv-screen', 'video-conferencing'], icon: 'fa-user-tie', zoomLink: 'https://zoom.us/j/104', description: 'Private interview room.' },
            { id: 'r15', name: 'HR Interview Pod B', officeId: 'off1', floor: '2nd Floor', capacity: 4, status: 'available', equipment: ['tv-screen', 'phone'], icon: 'fa-user-friends', zoomLink: '', description: 'Private interview room.' },

            { id: 'r5', name: 'Innovation Lab', officeId: 'off2', floor: '1st Floor', capacity: 12, status: 'available', equipment: ['projector', 'whiteboard', 'video-conferencing'], icon: 'fa-lightbulb', zoomLink: 'https://zoom.us/j/567', description: 'R&D collaboration space.' },
            { id: 'r6', name: 'Production War Room', officeId: 'off2', floor: 'Ground', capacity: 6, status: 'available', equipment: ['tv-screen', 'phone'], icon: 'fa-industry', zoomLink: '', description: 'Quick huddle room.' },
            { id: 'r16', name: 'Quality Hub', officeId: 'off2', floor: '1st Floor', capacity: 8, status: 'available', equipment: ['tv-screen', 'whiteboard'], icon: 'fa-search', zoomLink: '', description: 'QA testing review center.' },
            { id: 'r17', name: 'Logistics Command', officeId: 'off2', floor: 'Ground', capacity: 10, status: 'available', equipment: ['projector', 'phone', 'whiteboard'], icon: 'fa-truck', zoomLink: 'https://zoom.us/j/201', description: 'Supply chain tracking.' },
            { id: 'r18', name: 'Plant Manager Office', officeId: 'off2', floor: '1st Floor', capacity: 5, status: 'available', equipment: ['tv-screen', 'video-conferencing'], icon: 'fa-user-shield', zoomLink: 'https://zoom.us/j/202', description: 'Private management meetings.' },
            { id: 'r19', name: 'Safety Briefing Room', officeId: 'off2', floor: 'Ground', capacity: 25, status: 'available', equipment: ['projector', 'speaker-system', 'whiteboard'], icon: 'fa-hard-hat', zoomLink: '', description: 'Large training facility.' },

            { id: 'r7', name: 'Design Showcase Room', officeId: 'off3', floor: '2nd Floor', capacity: 16, status: 'available', equipment: ['projector', 'video-conferencing', 'speaker-system'], icon: 'fa-palette', zoomLink: 'https://zoom.us/j/789', description: 'Client-facing room in Mumbai.' },
            { id: 'r8', name: 'Executive Suite', officeId: 'off3', floor: '3rd Floor', capacity: 8, status: 'maintenance', equipment: ['video-conferencing', 'whiteboard'], icon: 'fa-crown', zoomLink: 'https://zoom.us/j/890', description: 'Premium VIP meeting suite.' },
            { id: 'r20', name: 'Architect Lounge', officeId: 'off3', floor: '2nd Floor', capacity: 6, status: 'available', equipment: ['tv-screen', 'whiteboard'], icon: 'fa-drafting-compass', zoomLink: '', description: 'Co-creation space.' },
            { id: 'r21', name: 'Client Pitch Room', officeId: 'off3', floor: '3rd Floor', capacity: 12, status: 'available', equipment: ['projector', 'video-conferencing', 'air-conditioning'], icon: 'fa-handshake', zoomLink: 'https://zoom.us/j/301', description: 'Main sales pitch area.' },
            { id: 'r22', name: 'Vendor Huddle', officeId: 'off3', floor: '2nd Floor', capacity: 4, status: 'available', equipment: ['phone', 'whiteboard'], icon: 'fa-store', zoomLink: '', description: 'Quick chats with suppliers.' },
            { id: 'r23', name: 'Vibe Check Studio', officeId: 'off3', floor: '3rd Floor', capacity: 8, status: 'available', equipment: ['tv-screen', 'speaker-system', 'video-conferencing'], icon: 'fa-smile', zoomLink: 'https://zoom.us/j/302', description: 'Casual internal syncs.' },
        ],
        bookings: [],
        notifications: [],
        settings: {
            autoReleaseMinutes: 15,
            maxBookingDurationHours: 4,
            advanceBookingDays: 30,
            workingHoursStart: '08:00',
            workingHoursEnd: '20:00',
            brandName: 'Orientbell',
            brandTagline: 'Smart Conference Room Management',
            allowRecurring: true,
            requireApproval: false,
            signageRotateSeconds: 10,
            reminderMinutes: 15,
        }
    };
}

function initStore() {
    const s = localStorage.getItem(STORAGE_KEY);
    const seed = getSeedData();
    if (s) {
        try {
            _data = JSON.parse(s);
            for (const k of Object.keys(seed)) { if (!_data[k]) _data[k] = seed[k]; }
            // Seed merger for new rooms added later
            seed.rooms.forEach(sr => {
                if (!_data.rooms.find(r => r.id === sr.id)) _data.rooms.push(sr);
            });
            // Ensure new settings keys exist
            if (!_data.settings.reminderMinutes) _data.settings.reminderMinutes = 15;
        } catch { _data = seed; }
    }
    else { _data = seed; }
    saveStore();
}
function saveStore() { localStorage.setItem(STORAGE_KEY, JSON.stringify(_data)); }
function emit(e, p) { (_listeners.get(e) || []).forEach(f => f(p)); }
function on(e, h) { if (!_listeners.has(e)) _listeners.set(e, []); _listeners.get(e).push(h); }

// Auth
function initAuth() { const s = localStorage.getItem(AUTH_KEY); if (s) { try { _currentUser = JSON.parse(s); } catch { _currentUser = null; } } return _currentUser; }
function doLogin(u) { _currentUser = u; localStorage.setItem(AUTH_KEY, JSON.stringify(u)); }
function doLogout() { _currentUser = null; localStorage.removeItem(AUTH_KEY); }
function curUser() { return _currentUser; }
function isAdmin() { return _currentUser?.role === 'admin'; }
function isManager() { return _currentUser?.role === 'manager' || _currentUser?.role === 'admin'; }

// Store accessors
function getUsers() { return _data.users; }
function getUserById(id) { return _data.users.find(u => u.id === id); }
function getOffices() { return _data.offices; }
function getOfficeById(id) { return _data.offices.find(o => o.id === id); }
function getRooms() { return _data.rooms; }
function getRoomById(id) { return _data.rooms.find(r => r.id === id); }
function getSettings() { return _data.settings; }
function updateSettings(u) { _data.settings = { ..._data.settings, ...u }; saveStore(); }
function updateUser(id, u) { const i = _data.users.findIndex(x => x.id === id); if (i >= 0) { _data.users[i] = { ..._data.users[i], ...u }; saveStore(); } }
function addRoom(r) { r.id = 'r' + Date.now(); _data.rooms.push(r); saveStore(); return r; }
function updateRoom(id, u) { const i = _data.rooms.findIndex(x => x.id === id); if (i >= 0) { _data.rooms[i] = { ..._data.rooms[i], ...u }; saveStore(); } }
function deleteRoom(id) { _data.rooms = _data.rooms.filter(r => r.id !== id); saveStore(); }
function resetData() { _data = getSeedData(); saveStore(); }

// Find user by email or mobile
function findUserByEmailOrMobile(input) {
    const q = input.trim().toLowerCase();
    return _data.users.find(u => u.email?.toLowerCase() === q || u.mobile === q);
}

// Register a new user — role chosen by user during registration
function registerUser(info) {
    const existing = _data.users.find(u => u.email?.toLowerCase() === info.email.toLowerCase());
    if (existing) return { error: 'Email already registered' };
    if (info.mobile) {
        const mobExists = _data.users.find(u => u.mobile === info.mobile);
        if (mobExists) return { error: 'Mobile number already registered' };
    }
    const parts = info.name.trim().split(' ');
    const initials = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : info.name.substring(0, 2).toUpperCase();
    const newUser = {
        id: 'u' + Date.now(),
        name: info.name.trim(),
        email: info.email.trim().toLowerCase(),
        mobile: info.mobile?.trim() || '',
        password: info.password,
        role: info.role || 'employee',
        department: info.department || 'IT',
        initials: initials,
        office: info.office || 'off1',
    };
    _data.users.push(newUser);
    saveStore();
    return { user: newUser };
}

function getBookings() { return _data.bookings; }
function getBookingsForRoom(rid, date) { return _data.bookings.filter(b => b.roomId === rid && b.date === date && b.status !== 'cancelled'); }
function getBookingsForDate(date) { return _data.bookings.filter(b => b.date === date && b.status !== 'cancelled'); }
function getTodaysBookings() { return getBookingsForDate(new Date().toISOString().split('T')[0]); }
function getBookingsForUser(uid) { return _data.bookings.filter(b => (b.userId === uid || b.attendees?.includes(uid)) && b.status !== 'cancelled'); }
function checkAvail(rid, date, st, et, exId) { return !getBookingsForRoom(rid, date).some(b => { if (b.id === exId) return false; return !(et <= b.startTime || st >= b.endTime); }); }
function getAvailableRooms(date, st, et, f = {}) {
    return _data.rooms.filter(r => { if (r.status === 'maintenance') return false; if (f.officeId && r.officeId !== f.officeId) return false; if (f.minCapacity && r.capacity < f.minCapacity) return false; if (f.equipment?.length && !f.equipment.every(e => r.equipment.includes(e))) return false; return checkAvail(r.id, date, st, et); });
}

// ===== ENHANCED addBooking with APPROVAL WORKFLOW =====
function addBooking(b) {
    b.id = 'b' + Date.now();
    // Approval workflow: if requireApproval is on AND user is employee, set pending
    if (_data.settings.requireApproval && _currentUser?.role === 'employee') {
        b.status = 'pending-approval';
    } else {
        b.status = b.status || 'confirmed';
    }
    b.checkedIn = false;
    b.createdAt = new Date().toISOString();
    _data.bookings.push(b);
    saveStore();

    // Notification
    const notifTitle = b.status === 'pending-approval' ? 'Booking Pending Approval' : 'Booking Confirmed';
    addNotif({ userId: b.userId, type: 'booking', title: notifTitle, message: `${b.title} — ${getRoomById(b.roomId)?.name} at ${b.startTime}`, time: new Date().toISOString(), read: false });

    // Notify attendees
    if (b.attendees) {
        b.attendees.filter(a => a !== b.userId).forEach(attendeeId => {
            addNotif({ userId: attendeeId, type: 'booking', title: 'Meeting Invitation', message: `You've been invited to "${b.title}" at ${b.startTime}`, time: new Date().toISOString(), read: false });
        });
    }

    return b;
}

// ===== RECURRING BOOKINGS — Generate actual instances =====
function addRecurringBooking(booking, pattern, occurrences = 8) {
    const results = [];
    const baseDate = new Date(booking.date + 'T00:00:00');

    for (let i = 0; i < occurrences; i++) {
        const d = new Date(baseDate);
        switch (pattern) {
            case 'daily': d.setDate(d.getDate() + i); break;
            case 'weekly': d.setDate(d.getDate() + i * 7); break;
            case 'biweekly': d.setDate(d.getDate() + i * 14); break;
            case 'monthly': d.setMonth(d.getMonth() + i); break;
        }
        const dateStr = d.toISOString().split('T')[0];

        // Check availability for each occurrence
        if (checkAvail(booking.roomId, dateStr, booking.startTime, booking.endTime)) {
            const instance = {
                ...booking,
                date: dateStr,
                recurring: true,
                recurringPattern: pattern,
                recurringGroupId: booking.recurringGroupId || 'rg' + Date.now(),
                recurringIndex: i,
            };
            results.push(addBooking(instance));
        }
    }
    return results;
}

function updateBooking(id, u) { const i = _data.bookings.findIndex(x => x.id === id); if (i >= 0) { _data.bookings[i] = { ..._data.bookings[i], ...u }; saveStore(); } }
function cancelBooking(id) { updateBooking(id, { status: 'cancelled' }); }
function checkIn(id) { updateBooking(id, { checkedIn: true, checkedInAt: new Date().toISOString() }); }

// ===== APPROVAL WORKFLOW =====
function approveBooking(id) {
    const b = _data.bookings.find(x => x.id === id);
    if (b && b.status === 'pending-approval') {
        updateBooking(id, { status: 'confirmed', approvedAt: new Date().toISOString(), approvedBy: _currentUser?.id });
        addNotif({ userId: b.userId, type: 'booking', title: 'Booking Approved', message: `"${b.title}" has been approved`, time: new Date().toISOString(), read: false });
    }
}
function rejectBooking(id) {
    const b = _data.bookings.find(x => x.id === id);
    if (b && b.status === 'pending-approval') {
        updateBooking(id, { status: 'rejected', rejectedAt: new Date().toISOString(), rejectedBy: _currentUser?.id });
        addNotif({ userId: b.userId, type: 'release', title: 'Booking Rejected', message: `"${b.title}" was rejected`, time: new Date().toISOString(), read: false });
    }
}
function getPendingApprovals() {
    return _data.bookings.filter(b => b.status === 'pending-approval');
}

// ===== AUTO-RELEASE =====
function autoRelease() {
    const minutes = _data.settings.autoReleaseMinutes || 15;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const bookings = getBookingsForDate(today);
    bookings.forEach(b => {
        if (b.status === 'confirmed' && !b.checkedIn) {
            const [h, m] = b.startTime.split(':').map(Number);
            const startDate = new Date(now);
            startDate.setHours(h, m, 0, 0);
            const diff = (now - startDate) / 60000;
            if (diff > minutes) {
                updateBooking(b.id, { status: 'auto-released' });
                addNotif({ userId: b.userId, type: 'release', title: 'Room Auto-Released', message: `"${b.title}" was released (no check-in after ${minutes}min)`, time: now.toISOString(), read: false });
            }
        }
    });
}

// ===== MEETING REMINDERS (Browser Notifications) =====
let _reminderInterval = null;
function startReminderService() {
    if (_reminderInterval) clearInterval(_reminderInterval);
    // Request permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    _reminderInterval = setInterval(checkReminders, 30000); // Check every 30 seconds
    checkReminders();
}

function checkReminders() {
    const u = curUser();
    if (!u) return;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const reminderMinutes = _data.settings.reminderMinutes || 15;

    const todayBookings = getBookingsForDate(today).filter(b =>
        (b.userId === u.id || b.attendees?.includes(u.id)) && b.status === 'confirmed' && !b.checkedIn
    );

    todayBookings.forEach(b => {
        const [h, m] = b.startTime.split(':').map(Number);
        const bookingMinutes = h * 60 + m;
        const diff = bookingMinutes - currentMinutes;

        // Send reminder at configured time before meeting
        if (diff > 0 && diff <= reminderMinutes && !b._reminded) {
            const room = getRoomById(b.roomId);
            // Mark as reminded to avoid duplicate notifications
            b._reminded = true;
            saveStore();

            // In-app notification
            addNotif({ userId: u.id, type: 'reminder', title: `Meeting in ${diff} min`, message: `"${b.title}" in ${room?.name || 'Unknown'} starts at ${b.startTime}`, time: now.toISOString(), read: false });

            // Browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`Meeting in ${diff} min`, {
                    body: `${b.title} — ${room?.name}`,
                    icon: '🏢',
                    tag: b.id,
                });
            }
        }
    });
}

function getNotifs(uid) { return (_data.notifications || []).filter(n => n.userId === uid).sort((a, b) => new Date(b.time) - new Date(a.time)); }
function getUnreadCount(uid) { return getNotifs(uid).filter(n => !n.read).length; }
function addNotif(n) { n.id = 'n' + Date.now() + Math.random().toString(36).substr(2, 4); if (!_data.notifications) _data.notifications = []; _data.notifications.push(n); saveStore(); emit('notif', n); }
function markNotifRead(id) { const n = (_data.notifications || []).find(x => x.id === id); if (n) { n.read = true; saveStore(); } }
function markAllRead(uid) { (_data.notifications || []).forEach(n => { if (n.userId === uid) n.read = true; }); saveStore(); }

// ===== ENHANCED ANALYTICS with real comparisons =====
function getAnalytics(days = 30) {
    const now = new Date(), start = new Date(now); start.setDate(start.getDate() - days); const ss = start.toISOString().split('T')[0];
    const all = _data.bookings.filter(b => b.date >= ss && b.status !== 'cancelled');
    const ru = {}; _data.rooms.forEach(r => { ru[r.id] = { name: r.name, count: 0, totalMinutes: 0, officeId: r.officeId }; });
    all.forEach(b => { if (ru[b.roomId]) { ru[b.roomId].count++; const [sh, sm] = b.startTime.split(':').map(Number), e = b.endTime.split(':').map(Number); ru[b.roomId].totalMinutes += (e[0] * 60 + e[1]) - (sh * 60 + sm); } });
    const dc = {}; for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) { dc[d.toISOString().split('T')[0]] = all.filter(b => b.date === d.toISOString().split('T')[0]).length; }
    const hc = Array(24).fill(0); all.forEach(b => { hc[parseInt(b.startTime)]++; });
    const tot = all.length, ci = all.filter(b => b.checkedIn).length;
    const avgA = all.reduce((s, b) => s + (b.attendees?.length || 1), 0) / Math.max(tot, 1);
    const avgD = all.reduce((s, b) => { const [sh, sm] = b.startTime.split(':').map(Number), e = b.endTime.split(':').map(Number); return s + ((e[0] * 60 + e[1]) - (sh * 60 + sm)); }, 0) / Math.max(tot, 1);

    // ===== REAL period-over-period comparison =====
    const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - days);
    const prevSS = prevStart.toISOString().split('T')[0];
    const prevAll = _data.bookings.filter(b => b.date >= prevSS && b.date < ss && b.status !== 'cancelled');
    const prevTotal = prevAll.length;
    const bookingChange = prevTotal > 0 ? Math.round(((tot - prevTotal) / prevTotal) * 100) : (tot > 0 ? 100 : 0);
    const prevCi = prevAll.filter(b => b.checkedIn).length;
    const prevCiRate = prevTotal > 0 ? Math.round(prevCi / prevTotal * 100) : 0;
    const ciRateChange = prevCiRate > 0 ? Math.round(((ci / Math.max(tot, 1) * 100) - prevCiRate)) : 0;

    // ===== Department-wise analytics =====
    const deptUsage = {};
    all.forEach(b => {
        const user = getUserById(b.userId);
        if (user) {
            const dept = user.department || 'Unknown';
            if (!deptUsage[dept]) deptUsage[dept] = { count: 0, totalMinutes: 0, checkedIn: 0 };
            deptUsage[dept].count++;
            const [sh, sm] = b.startTime.split(':').map(Number), e = b.endTime.split(':').map(Number);
            deptUsage[dept].totalMinutes += (e[0] * 60 + e[1]) - (sh * 60 + sm);
            if (b.checkedIn) deptUsage[dept].checkedIn++;
        }
    });

    // ===== User-level analytics for profiling =====
    const userUsage = {};
    all.forEach(b => {
        if (!userUsage[b.userId]) userUsage[b.userId] = { count: 0, totalMinutes: 0, rooms: {}, checkedIn: 0 };
        userUsage[b.userId].count++;
        const [sh, sm] = b.startTime.split(':').map(Number), e = b.endTime.split(':').map(Number);
        userUsage[b.userId].totalMinutes += (e[0] * 60 + e[1]) - (sh * 60 + sm);
        userUsage[b.userId].rooms[b.roomId] = (userUsage[b.userId].rooms[b.roomId] || 0) + 1;
        if (b.checkedIn) userUsage[b.userId].checkedIn++;
    });

    // ===== Occupancy by office =====
    const officeUsage = {};
    _data.offices.forEach(o => { officeUsage[o.id] = { name: o.name, totalBookings: 0, totalMinutes: 0 }; });
    all.forEach(b => {
        const room = getRoomById(b.roomId);
        if (room && officeUsage[room.officeId]) {
            officeUsage[room.officeId].totalBookings++;
            const [sh, sm] = b.startTime.split(':').map(Number), e = b.endTime.split(':').map(Number);
            officeUsage[room.officeId].totalMinutes += (e[0] * 60 + e[1]) - (sh * 60 + sm);
        }
    });

    return {
        totalBookings: tot,
        checkedInRate: tot > 0 ? Math.round(ci / tot * 100) : 0,
        avgAttendees: Math.round(avgA * 10) / 10,
        avgDuration: Math.round(avgD),
        roomUsage: ru,
        dailyCounts: dc,
        hourCounts: hc,
        topRooms: Object.values(ru).sort((a, b) => b.count - a.count).slice(0, 5),
        // NEW: Real comparisons
        bookingChange,
        ciRateChange,
        prevTotal,
        // NEW: Department analytics
        deptUsage,
        // NEW: User analytics
        userUsage,
        // NEW: Office analytics
        officeUsage,
    };
}

// ===== SMART ROOM SUGGESTIONS (when no exact match) =====
function getSuggestedRooms(date, st, et, filters = {}) {
    const suggestions = [];

    // Try nearby time slots (30 min before/after)
    const timeSlots = [
        { startAdj: -30, endAdj: -30, label: '30 min earlier' },
        { startAdj: 30, endAdj: 30, label: '30 min later' },
        { startAdj: -60, endAdj: -60, label: '1 hr earlier' },
        { startAdj: 60, endAdj: 60, label: '1 hr later' },
    ];

    for (const slot of timeSlots) {
        const newSt = adjustTime(st, slot.startAdj);
        const newEt = adjustTime(et, slot.endAdj);
        if (newSt >= '08:00' && newEt <= '20:00' && newSt < newEt) {
            const avail = getAvailableRooms(date, newSt, newEt, filters);
            if (avail.length > 0) {
                suggestions.push({ rooms: avail, altStart: newSt, altEnd: newEt, label: slot.label });
            }
        }
        if (suggestions.length >= 3) break;
    }

    // Try next day if no slots today
    if (suggestions.length === 0) {
        const nextDate = new Date(date + 'T00:00:00');
        nextDate.setDate(nextDate.getDate() + 1);
        const nextDateStr = nextDate.toISOString().split('T')[0];
        const avail = getAvailableRooms(nextDateStr, st, et, filters);
        if (avail.length > 0) {
            suggestions.push({ rooms: avail, altStart: st, altEnd: et, altDate: nextDateStr, label: 'Next day' });
        }
    }

    return suggestions;
}

function adjustTime(time, minutes) {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutes;
    const newH = Math.floor(total / 60);
    const newM = total % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

// ===== CALENDAR EXPORT (.ics) =====
function generateICS(bookingId) {
    const b = _data.bookings.find(x => x.id === bookingId);
    if (!b) return null;
    const room = getRoomById(b.roomId);
    const office = getOfficeById(room?.officeId);
    const user = getUserById(b.userId);

    const dtStart = b.date.replace(/-/g, '') + 'T' + b.startTime.replace(':', '') + '00';
    const dtEnd = b.date.replace(/-/g, '') + 'T' + b.endTime.replace(':', '') + '00';
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    let ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Orientbell//Smart Conference Room//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `DTSTAMP:${now}`,
        `UID:${b.id}@orientbell-crm`,
        `SUMMARY:${b.title}`,
        `LOCATION:${room?.name || ''} - ${office?.name || ''}`,
        `DESCRIPTION:${b.notes || ''} | Organizer: ${user?.name || ''}`,
        `STATUS:CONFIRMED`,
        'END:VEVENT',
        'END:VCALENDAR',
    ].join('\r\n');

    return ics;
}

function downloadICS(bookingId) {
    const ics = generateICS(bookingId);
    if (!ics) return;
    const b = _data.bookings.find(x => x.id === bookingId);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${b.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
}

// ===== USER PROFILE / BOOKING HISTORY =====
function getUserProfile(userId) {
    const user = getUserById(userId);
    if (!user) return null;
    const allBookings = _data.bookings.filter(b => b.userId === userId || b.attendees?.includes(userId));
    const confirmed = allBookings.filter(b => b.status !== 'cancelled' && b.status !== 'rejected');
    const checkedIn = confirmed.filter(b => b.checkedIn);
    const rooms = {};
    confirmed.forEach(b => { rooms[b.roomId] = (rooms[b.roomId] || 0) + 1; });
    const favoriteRoomId = Object.entries(rooms).sort((a, b) => b[1] - a[1])[0]?.[0];
    const favoriteRoom = favoriteRoomId ? getRoomById(favoriteRoomId) : null;

    // Preferred time analysis
    const hours = {};
    confirmed.forEach(b => {
        const h = parseInt(b.startTime);
        hours[h] = (hours[h] || 0) + 1;
    });
    const preferredHour = Object.entries(hours).sort((a, b) => b[1] - a[1])[0]?.[0] || '10';

    return {
        user,
        totalBookings: confirmed.length,
        checkedInCount: checkedIn.length,
        checkedInRate: confirmed.length > 0 ? Math.round(checkedIn.length / confirmed.length * 100) : 0,
        favoriteRoom,
        preferredHour: parseInt(preferredHour),
        recentBookings: allBookings.sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime)).slice(0, 10),
        roomBreakdown: rooms,
    };
}

// ===== AI SMART ROOM RECOMMENDATIONS =====
function getAIRecommendations(attendeeCount = 4, equipmentNeeded = [], preferredOffice = '') {
    const u = curUser();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const ct = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Get user's booking history for preference analysis
    const userBookings = u ? _data.bookings.filter(b => b.userId === u.id && b.status !== 'cancelled') : [];
    const roomFrequency = {};
    userBookings.forEach(b => { roomFrequency[b.roomId] = (roomFrequency[b.roomId] || 0) + 1; });

    // Score each room
    const scored = _data.rooms.filter(r => r.status !== 'maintenance').map(r => {
        let score = 50; // base score
        let reasons = [];

        // Capacity fit (prefer rooms that aren't too big or small)
        const capRatio = attendeeCount / r.capacity;
        if (capRatio >= 0.5 && capRatio <= 1.0) { score += 30; reasons.push('Perfect size'); }
        else if (capRatio > 0.3 && capRatio < 0.5) { score += 15; reasons.push('Good fit'); }
        else if (capRatio > 1.0) { score -= 50; reasons.push('Too small'); }
        else { score += 5; reasons.push('Spacious'); }

        // Equipment match
        if (equipmentNeeded.length > 0) {
            const matched = equipmentNeeded.filter(e => r.equipment.includes(e)).length;
            const pct = matched / equipmentNeeded.length;
            score += Math.round(pct * 25);
            if (pct === 1) reasons.push('All equipment');
            else if (pct > 0) reasons.push(`${matched}/${equipmentNeeded.length} equipment`);
        }

        // User preference (frequently used rooms get bonus)
        if (roomFrequency[r.id]) {
            score += Math.min(roomFrequency[r.id] * 3, 15);
            reasons.push('Your favorite');
        }

        // Office preference
        if (preferredOffice && r.officeId === preferredOffice) {
            score += 10;
            reasons.push('Preferred office');
        } else if (u?.office && r.officeId === u.office) {
            score += 5;
            reasons.push('Your office');
        }

        // Current availability bonus
        const roomBookings = getBookingsForRoom(r.id, today);
        const isCurrentlyFree = !roomBookings.some(b => ct >= b.startTime && ct < b.endTime);
        if (isCurrentlyFree) { score += 10; reasons.push('Available now'); }

        // Zoom link bonus for remote meetings
        if (r.zoomLink) { score += 5; }

        return { room: r, score: Math.min(score, 100), reasons, isCurrentlyFree };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, 5);
}

// ===== FLOOR PLAN ROOM POSITIONS (SVG coordinates for 2D map) =====
function getFloorPlanLayout(officeId) {
    // Define room positions, sizes, and shapes for each office floor plan
    const layouts = {
        'off1': {
            officeName: 'Orientbell HQ — New Delhi',
            width: 1000, height: 600,
            corridors: [
                { x: 0, y: 280, w: 1000, h: 60 },    // Main Horizontal Corridor
                { x: 450, y: 0, w: 60, h: 600 },     // Main Vertical Corridor
                { x: 750, y: 0, w: 40, h: 280 },     // Right Vertical Wing
            ],
            amenities: [
                { x: 10, y: 290, w: 40, h: 40, label: '🚻', name: 'Restroom' },
                { x: 950, y: 290, w: 40, h: 40, label: '☕', name: 'Pantry' },
                { x: 460, y: 550, w: 40, h: 40, label: '🛗', name: 'Elevator' },
                { x: 460, y: 10, w: 40, h: 40, label: '🚪', name: 'Entry' },
                { x: 750, y: 10, w: 40, h: 40, label: '🖨️', name: 'Print Station' },
            ],
            rooms: [
                { roomId: 'r1', x: 10, y: 10, w: 200, h: 260, label: 'Cool Tiles\nBoardroom' },
                { roomId: 'r2', x: 220, y: 10, w: 220, h: 125, label: 'Germ-Free\nMeeting Room' },
                { roomId: 'r3', x: 220, y: 145, w: 220, h: 125, label: 'Forever Tiles\nHub' },
                { roomId: 'r9', x: 520, y: 10, w: 220, h: 125, label: 'Strategy Room\nAlpha' },
                { roomId: 'r10', x: 520, y: 145, w: 110, h: 125, label: 'Creative\nCorner' },
                { roomId: 'r14', x: 640, y: 145, w: 100, h: 60, label: 'HR Pod A' },
                { roomId: 'r15', x: 640, y: 210, w: 100, h: 60, label: 'HR Pod B' },
                { roomId: 'r4', x: 800, y: 10, w: 190, h: 260, label: 'School Tiles\nStudio' },

                { roomId: 'r11', x: 10, y: 350, w: 250, h: 240, label: 'Tech Hive\n(Engineering)' },
                { roomId: 'r12', x: 270, y: 350, w: 170, h: 115, label: 'Marketing\nLounge' },
                { roomId: 'r13', x: 270, y: 475, w: 170, h: 115, label: 'Sales\nWar Room' },
            ],
        },
        'off2': {
            officeName: 'Manufacturing Plant — Sikandrabad',
            width: 1000, height: 600,
            corridors: [
                { x: 0, y: 260, w: 1000, h: 80 },    // Extra wide plant corridor
                { x: 300, y: 340, w: 80, h: 260 },   // Vertical factory floor access
            ],
            amenities: [
                { x: 10, y: 280, w: 40, h: 40, label: '🚻', name: 'Restroom' },
                { x: 950, y: 280, w: 40, h: 40, label: '🚪', name: 'Exit to floor' },
                { x: 320, y: 550, w: 40, h: 40, label: '🦺', name: 'PPE Station' },
            ],
            rooms: [
                { roomId: 'r5', x: 10, y: 10, w: 280, h: 240, label: 'Innovation\nLab' },
                { roomId: 'r6', x: 300, y: 10, w: 200, h: 240, label: 'Production\nWar Room' },
                { roomId: 'r16', x: 510, y: 10, w: 230, h: 240, label: 'Quality\nHub' },
                { roomId: 'r18', x: 750, y: 10, w: 240, h: 240, label: 'Plant Manager\nOffice' },

                { roomId: 'r17', x: 10, y: 350, w: 280, h: 240, label: 'Logistics\nCommand' },
                { roomId: 'r19', x: 390, y: 350, w: 600, h: 240, label: 'Safety Briefing\nTraining Center' },
            ],
        },
        'off3': {
            officeName: 'Experience Center — Mumbai',
            width: 1000, height: 600,
            corridors: [
                { x: 0, y: 250, w: 800, h: 100 },    // Grand aesthetic corridor
                { x: 800, y: 0, w: 200, h: 600 },    // Reception / Atrium area
            ],
            amenities: [
                { x: 10, y: 280, w: 40, h: 40, label: '🚻', name: 'Restroom' },
                { x: 450, y: 280, w: 40, h: 40, label: '☕', name: 'Barista Bar' },
                { x: 880, y: 280, w: 40, h: 40, label: '🛎️', name: 'Reception' },
            ],
            rooms: [
                { roomId: 'r7', x: 10, y: 10, w: 350, h: 230, label: 'Design Showcase\n(Main Gallery)' },
                { roomId: 'r8', x: 370, y: 10, w: 250, h: 230, label: 'Executive\nSuite' },
                { roomId: 'r22', x: 630, y: 10, w: 160, h: 230, label: 'Vendor\nHuddle' },

                { roomId: 'r21', x: 10, y: 360, w: 350, h: 230, label: 'Client Pitch\nRoom' },
                { roomId: 'r20', x: 370, y: 360, w: 200, h: 230, label: 'Architect\nLounge' },
                { roomId: 'r23', x: 580, y: 360, w: 210, h: 230, label: 'Vibe Check\nStudio' },
            ],
        },
    };
    return layouts[officeId] || layouts['off1'];
}

// ===== QR CODE GENERATOR (simple SVG-based) =====
function generateQRCodeSVG(text, size = 200) {
    // Simple deterministic pattern generator for QR-like appearance
    const cells = 21;
    const cellSize = size / cells;
    let svg = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${size}" height="${size}" fill="white" rx="8"/>`;

    // Finder patterns (top-left, top-right, bottom-left)
    const drawFinder = (ox, oy) => {
        svg += `<rect x="${ox}" y="${oy}" width="${cellSize * 7}" height="${cellSize * 7}" fill="black" rx="2"/>`;
        svg += `<rect x="${ox + cellSize}" y="${oy + cellSize}" width="${cellSize * 5}" height="${cellSize * 5}" fill="white" rx="1"/>`;
        svg += `<rect x="${ox + cellSize * 2}" y="${oy + cellSize * 2}" width="${cellSize * 3}" height="${cellSize * 3}" fill="black" rx="1"/>`;
    };
    drawFinder(cellSize, cellSize);
    drawFinder(cellSize * 13, cellSize);
    drawFinder(cellSize, cellSize * 13);

    // Data pattern (seeded from text hash)
    let hash = 0;
    for (let i = 0; i < text.length; i++) { hash = ((hash << 5) - hash) + text.charCodeAt(i); hash |= 0; }
    for (let r = 0; r < cells; r++) {
        for (let c = 0; c < cells; c++) {
            // Skip finder pattern areas
            if ((r < 8 && c < 8) || (r < 8 && c > 12) || (r > 12 && c < 8)) continue;
            const idx = r * cells + c;
            const bit = ((hash * (idx + 1) * 7) >> (idx % 16)) & 1;
            if (bit) {
                svg += `<rect x="${c * cellSize + cellSize * 0.1}" y="${r * cellSize + cellSize * 0.1}" width="${cellSize * 0.8}" height="${cellSize * 0.8}" fill="black" rx="1"/>`;
            }
        }
    }
    svg += '</svg>';
    return svg;
}
