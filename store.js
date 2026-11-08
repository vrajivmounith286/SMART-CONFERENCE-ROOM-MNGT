// ===== DATA STORE — localStorage persistence + event system =====
import { getSeedData } from './seed.js';

const STORAGE_KEY = 'orientbell_crm_data_v2';
let _data = null;
const _listeners = new Map();

function init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            _data = JSON.parse(saved);
            // Ensure all collections exist
            const seed = getSeedData();
            for (const key of Object.keys(seed)) {
                if (!_data[key]) _data[key] = seed[key];
            }
        } catch {
            _data = getSeedData();
        }
    } else {
        _data = getSeedData();
    }
    _save();
}

function _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_data));
}

function _emit(event, payload) {
    const handlers = _listeners.get(event) || [];
    handlers.forEach(fn => fn(payload));
}

// Event system
export function on(event, handler) {
    if (!_listeners.has(event)) _listeners.set(event, []);
    _listeners.get(event).push(handler);
    return () => off(event, handler);
}

export function off(event, handler) {
    const handlers = _listeners.get(event) || [];
    _listeners.set(event, handlers.filter(h => h !== handler));
}

// ===== USERS =====
export function getUsers() { return _data.users; }
export function getUserById(id) { return _data.users.find(u => u.id === id); }
export function getUsersByRole(role) { return _data.users.filter(u => u.role === role); }
export function updateUser(id, updates) {
    const idx = _data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    _data.users[idx] = { ..._data.users[idx], ...updates };
    _save();
    _emit('users:updated', _data.users[idx]);
    return _data.users[idx];
}

// ===== OFFICES =====
export function getOffices() { return _data.offices; }
export function getOfficeById(id) { return _data.offices.find(o => o.id === id); }

// ===== ROOMS =====
export function getRooms() { return _data.rooms; }
export function getRoomById(id) { return _data.rooms.find(r => r.id === id); }
export function getRoomsByOffice(officeId) { return _data.rooms.filter(r => r.officeId === officeId); }

export function addRoom(room) {
    room.id = 'r' + Date.now();
    _data.rooms.push(room);
    _save();
    _emit('rooms:added', room);
    return room;
}

export function updateRoom(id, updates) {
    const idx = _data.rooms.findIndex(r => r.id === id);
    if (idx === -1) return null;
    _data.rooms[idx] = { ..._data.rooms[idx], ...updates };
    _save();
    _emit('rooms:updated', _data.rooms[idx]);
    return _data.rooms[idx];
}

export function deleteRoom(id) {
    _data.rooms = _data.rooms.filter(r => r.id !== id);
    _save();
    _emit('rooms:deleted', id);
}

// ===== BOOKINGS =====
export function getBookings() { return _data.bookings; }
export function getBookingById(id) { return _data.bookings.find(b => b.id === id); }

export function getBookingsForRoom(roomId, date) {
    return _data.bookings.filter(b => b.roomId === roomId && b.date === date && b.status !== 'cancelled');
}

export function getBookingsForDate(date) {
    return _data.bookings.filter(b => b.date === date && b.status !== 'cancelled');
}

export function getBookingsForUser(userId) {
    return _data.bookings.filter(b => (b.userId === userId || b.attendees?.includes(userId)) && b.status !== 'cancelled');
}

export function getTodaysBookings() {
    const today = new Date().toISOString().split('T')[0];
    return getBookingsForDate(today);
}

export function checkAvailability(roomId, date, startTime, endTime, excludeBookingId = null) {
    const roomBookings = getBookingsForRoom(roomId, date);
    return !roomBookings.some(b => {
        if (b.id === excludeBookingId) return false;
        return !(endTime <= b.startTime || startTime >= b.endTime);
    });
}

export function getAvailableRooms(date, startTime, endTime, filters = {}) {
    return _data.rooms.filter(room => {
        if (room.status === 'maintenance') return false;
        if (filters.officeId && room.officeId !== filters.officeId) return false;
        if (filters.minCapacity && room.capacity < filters.minCapacity) return false;
        if (filters.equipment?.length) {
            if (!filters.equipment.every(eq => room.equipment.includes(eq))) return false;
        }
        return checkAvailability(room.id, date, startTime, endTime);
    });
}

export function addBooking(booking) {
    booking.id = 'b' + Date.now();
    booking.status = booking.status || 'confirmed';
    booking.checkedIn = false;
    _data.bookings.push(booking);
    _save();
    _emit('bookings:added', booking);

    addNotification({
        userId: booking.userId,
        type: 'booking',
        title: 'Booking Confirmed',
        message: `${booking.title} — ${getRoomById(booking.roomId)?.name} at ${booking.startTime}`,
        time: new Date().toISOString(),
        read: false,
    });

    return booking;
}

export function updateBooking(id, updates) {
    const idx = _data.bookings.findIndex(b => b.id === id);
    if (idx === -1) return null;
    _data.bookings[idx] = { ..._data.bookings[idx], ...updates };
    _save();
    _emit('bookings:updated', _data.bookings[idx]);
    return _data.bookings[idx];
}

export function cancelBooking(id) {
    return updateBooking(id, { status: 'cancelled' });
}

export function checkIn(bookingId) {
    return updateBooking(bookingId, {
        checkedIn: true,
        checkedInAt: new Date().toISOString(),
    });
}

// Auto-release: cancel bookings with no check-in after N minutes
export function autoRelease() {
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
                addNotification({
                    userId: b.userId,
                    type: 'release',
                    title: 'Room Auto-Released',
                    message: `${b.title} was released due to no check-in after ${minutes} minutes`,
                    time: now.toISOString(),
                    read: false,
                });
            }
        }
    });
}

// ===== NOTIFICATIONS =====
export function getNotifications(userId) {
    return (_data.notifications || []).filter(n => n.userId === userId).sort((a, b) => new Date(b.time) - new Date(a.time));
}

export function getUnreadCount(userId) {
    return getNotifications(userId).filter(n => !n.read).length;
}

export function addNotification(notif) {
    notif.id = 'n' + Date.now() + Math.random().toString(36).substr(2, 4);
    if (!_data.notifications) _data.notifications = [];
    _data.notifications.push(notif);
    _save();
    _emit('notifications:added', notif);
    return notif;
}

export function markNotifRead(id) {
    const notif = (_data.notifications || []).find(n => n.id === id);
    if (notif) {
        notif.read = true;
        _save();
        _emit('notifications:updated', notif);
    }
}

export function markAllNotifsRead(userId) {
    (_data.notifications || []).forEach(n => {
        if (n.userId === userId) n.read = true;
    });
    _save();
    _emit('notifications:updated', null);
}

// ===== SETTINGS =====
export function getSettings() { return _data.settings; }
export function updateSettings(updates) {
    _data.settings = { ..._data.settings, ...updates };
    _save();
    _emit('settings:updated', _data.settings);
    return _data.settings;
}

// ===== ANALYTICS =====
export function getAnalytics(dateRange = 7) {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - dateRange);
    const startStr = start.toISOString().split('T')[0];

    const allBookings = _data.bookings.filter(b => b.date >= startStr && b.status !== 'cancelled');
    const completed = allBookings.filter(b => b.status === 'completed' || b.checkedIn);

    // Room utilization
    const roomUsage = {};
    _data.rooms.forEach(r => { roomUsage[r.id] = { name: r.name, count: 0, totalMinutes: 0 }; });
    allBookings.forEach(b => {
        if (roomUsage[b.roomId]) {
            roomUsage[b.roomId].count++;
            const [sh, sm] = b.startTime.split(':').map(Number);
            const [eh, em] = b.endTime.split(':').map(Number);
            roomUsage[b.roomId].totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
        }
    });

    // Daily booking count
    const dailyCounts = {};
    for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0];
        dailyCounts[key] = allBookings.filter(b => b.date === key).length;
    }

    // Peak hours
    const hourCounts = Array(24).fill(0);
    allBookings.forEach(b => {
        const h = parseInt(b.startTime.split(':')[0]);
        hourCounts[h]++;
    });

    const totalBookings = allBookings.length;
    const checkedInCount = completed.length;
    const avgAttendees = allBookings.reduce((sum, b) => sum + (b.attendees?.length || 1), 0) / Math.max(totalBookings, 1);
    const avgDuration = allBookings.reduce((sum, b) => {
        const [sh, sm] = b.startTime.split(':').map(Number);
        const [eh, em] = b.endTime.split(':').map(Number);
        return sum + ((eh * 60 + em) - (sh * 60 + sm));
    }, 0) / Math.max(totalBookings, 1);

    return {
        totalBookings,
        checkedInRate: totalBookings > 0 ? Math.round((checkedInCount / totalBookings) * 100) : 0,
        avgAttendees: Math.round(avgAttendees * 10) / 10,
        avgDuration: Math.round(avgDuration),
        roomUsage,
        dailyCounts,
        hourCounts,
        topRooms: Object.values(roomUsage).sort((a, b) => b.count - a.count).slice(0, 5),
    };
}

// ===== RESET =====
export function resetData() {
    _data = getSeedData();
    _save();
    _emit('data:reset', null);
}

// Initialize on import
init();
