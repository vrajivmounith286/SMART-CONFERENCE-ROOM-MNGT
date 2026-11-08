// ===== MAIN APPLICATION ENTRY POINT — Firebase Auth =====
import './styles/layout.css';
import { initAuth, loginWithEmail, registerWithEmail, loginWithGoogle, createGoogleProfile, logout, getCurrentUser, onAuthChange } from './auth.js';
import { registerRoutes, initRouter, navigate, setBeforeNavigate } from './router.js';
import { initToasts, showToast } from './components/toast.js';
import { initModal, openModal, closeModal } from './components/modal.js';
import { renderSidebar } from './components/navbar.js';
import * as store from './data/store.js';

// Views
import { renderDashboard } from './views/dashboard.js';
import { renderBooking } from './views/booking.js';
import { renderRooms } from './views/rooms.js';
import { renderCalendar } from './views/calendar.js';
import { renderSignage, cleanupSignage } from './views/signage.js';
import { renderCheckin, cleanupCheckin } from './views/checkin.js';
import { renderAnalytics } from './views/analytics.js';
import { renderAdmin } from './views/admin.js';

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    initToasts();
    initModal();

    // Setup auth UI
    setupAuthTabs();
    setupLoginForm();
    setupRegisterForm();
    setupGoogleButtons();
    setupLogout();
    setupMobileMenu();
    setupNotifications();
    setupGlobalSearch();

    // Populate offices in register form
    populateOffices();

    // Check for existing session
    const user = await initAuth();
    if (user) {
        showApp();
    } else {
        showLogin();
    }

    // Auto-release check every minute
    setInterval(() => store.autoRelease(), 60000);
});

// ===== AUTH TABS =====
function setupAuthTabs() {
    document.querySelectorAll('#auth-tabs .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('#auth-tabs .tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (tab.dataset.tab === 'login') {
                document.getElementById('login-form').classList.remove('hidden');
                document.getElementById('register-form').classList.add('hidden');
            } else {
                document.getElementById('login-form').classList.add('hidden');
                document.getElementById('register-form').classList.remove('hidden');
            }
        });
    });
}

// ===== LOGIN =====
function showLogin() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app-shell').classList.add('hidden');
    // Reset forms
    document.getElementById('login-form')?.reset();
    document.getElementById('register-form')?.reset();
    // Show login tab by default
    document.getElementById('login-form')?.classList.remove('hidden');
    document.getElementById('register-form')?.classList.add('hidden');
    document.querySelectorAll('#auth-tabs .tab').forEach((t, i) => {
        t.classList.toggle('active', i === 0);
    });
}

function setupLoginForm() {
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email) { showToast('Enter your email address', 'warning'); return; }
        if (!password) { showToast('Enter your password', 'warning'); return; }

        // Disable button while loading
        const btn = document.getElementById('login-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

        const result = await loginWithEmail(email, password);

        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';

        if (result.error) {
            showToast(result.error, 'error');
            return;
        }

        showApp();
        showToast(`Welcome back, ${result.user.name}!`, 'success');
    });
}

// ===== REGISTER =====
function setupRegisterForm() {
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const mobile = document.getElementById('reg-mobile').value.trim();
        const role = document.getElementById('reg-role').value;
        const dept = document.getElementById('reg-dept').value;
        const office = document.getElementById('reg-office').value;
        const pw = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm').value;

        if (!name || name.length < 2) { showToast('Enter your full name', 'warning'); return; }
        if (!email || !email.includes('@')) { showToast('Enter a valid email address', 'warning'); return; }
        if (mobile && (mobile.length < 10 || !/^\d+$/.test(mobile))) { showToast('Enter a valid mobile number (10+ digits)', 'warning'); return; }
        if (pw.length < 6) { showToast('Password must be at least 6 characters', 'warning'); return; }
        if (pw !== confirm) { showToast('Passwords do not match', 'error'); return; }

        // Disable button while loading
        const btn = e.target.querySelector('[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

        const result = await registerWithEmail(email, pw, {
            name, mobile, role, department: dept, office,
        });

        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';

        if (result.error) {
            showToast(result.error, 'error');
            return;
        }

        showApp();
        showToast(`Welcome, ${result.user.name}! Account created as ${result.user.role}.`, 'success');
    });
}

// ===== GOOGLE SIGN-IN =====
function setupGoogleButtons() {
    document.getElementById('google-login-btn')?.addEventListener('click', async () => {
        const result = await loginWithGoogle();
        if (result.error) {
            showToast(result.error, 'error');
            return;
        }
        if (result.isNewUser) {
            // New Google user — needs role selection
            showRolePickerModal(result.authUser);
        } else if (result.user) {
            showApp();
            showToast(`Welcome back, ${result.user.name}!`, 'success');
        }
    });

    document.getElementById('google-register-btn')?.addEventListener('click', async () => {
        const result = await loginWithGoogle();
        if (result.error) {
            showToast(result.error, 'error');
            return;
        }
        if (result.isNewUser) {
            showRolePickerModal(result.authUser);
        } else if (result.user) {
            showApp();
            showToast(`Welcome back, ${result.user.name}!`, 'success');
        }
    });
}

// ===== ROLE PICKER MODAL (for new Google users) =====
function showRolePickerModal(authUser) {
    const name = authUser.displayName || authUser.email.split('@')[0];
    openModal(`
        <div style="text-align:center;padding:var(--space-md)">
            <div style="width:64px;height:64px;border-radius:50%;background:var(--gradient-brand);display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-lg);font-size:1.5rem;color:#fff">
                <i class="fas fa-user-plus"></i>
            </div>
            <h2 style="margin-bottom:var(--space-sm)">Welcome, ${name}!</h2>
            <p style="color:var(--text-secondary);margin-bottom:var(--space-xl)">Select your role to complete registration</p>
            <div class="form-group" style="text-align:left;max-width:300px;margin:0 auto var(--space-lg)">
                <label for="google-role">Your Role</label>
                <select id="google-role" style="width:100%">
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="employee" selected>Employee</option>
                </select>
            </div>
            <button class="btn btn-primary btn-block" id="google-role-confirm" style="max-width:300px;margin:0 auto">
                <i class="fas fa-check"></i> Continue
            </button>
        </div>
    `, '480px');

    document.getElementById('google-role-confirm')?.addEventListener('click', async () => {
        const role = document.getElementById('google-role').value;
        const btn = document.getElementById('google-role-confirm');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Setting up...';

        const result = await createGoogleProfile(authUser, role);
        closeModal();

        if (result.error) {
            showToast(result.error, 'error');
            return;
        }

        showApp();
        showToast(`Welcome, ${result.user.name}! Account created as ${role}.`, 'success');
    });
}

// ===== POPULATE OFFICES =====
function populateOffices() {
    const offSel = document.getElementById('reg-office');
    if (offSel) {
        offSel.innerHTML = '';
        store.getOffices().forEach(o => {
            const opt = document.createElement('option');
            opt.value = o.id;
            opt.textContent = o.name.split('—')[0].trim();
            offSel.appendChild(opt);
        });
    }
}

// ===== APP SHELL =====
function showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');

    // Register routes
    registerRoutes({
        '/dashboard': renderDashboard,
        '/booking': renderBooking,
        '/rooms': renderRooms,
        '/calendar': renderCalendar,
        '/signage': (c) => { renderSignage(c); },
        '/checkin': () => { window.open('kiosk.html', '_blank'); },
        '/analytics': renderAnalytics,
        '/admin': renderAdmin,
    });

    // Before navigate hook — cleanup signage interval on route change
    setBeforeNavigate((path) => {
        if (path !== '/signage') cleanupSignage();
        if (path !== '/checkin') cleanupCheckin();
        // Update sidebar active state
        setTimeout(() => renderSidebar(), 50);
        return true;
    });

    renderSidebar();
    initRouter();
}

// ===== LOGOUT =====
function setupLogout() {
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        await logout();
        cleanupSignage();
        showLogin();
        window.location.hash = '';
        showToast('Logged out', 'info');
    });
}

// ===== MOBILE MENU =====
function setupMobileMenu() {
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    // Close sidebar on overlay click (mobile)
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const menuBtn = document.getElementById('mobile-menu-btn');
        if (sidebar?.classList.contains('open') && !sidebar.contains(e.target) && e.target !== menuBtn) {
            sidebar.classList.remove('open');
        }
    });
}

// ===== NOTIFICATIONS =====
function setupNotifications() {
    const notifBtn = document.getElementById('notif-btn');
    const notifPanel = document.getElementById('notif-panel');
    const notifClose = document.getElementById('notif-close');

    notifBtn?.addEventListener('click', () => {
        notifPanel.classList.toggle('hidden');
        if (!notifPanel.classList.contains('hidden')) {
            renderNotifications();
        }
    });

    notifClose?.addEventListener('click', () => {
        notifPanel.classList.add('hidden');
    });

    // Update badge count
    updateNotifBadge();
    store.on('notifications:added', updateNotifBadge);
    store.on('notifications:updated', updateNotifBadge);
}

function updateNotifBadge() {
    const user = getCurrentUser();
    if (!user) return;
    const count = store.getUnreadCount(user.id);
    const badge = document.getElementById('notif-badge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function renderNotifications() {
    const user = getCurrentUser();
    if (!user) return;
    const notifs = store.getNotifications(user.id);
    const list = document.getElementById('notif-list');

    const typeIcons = {
        booking: { icon: 'fa-calendar-check', bg: 'rgba(232,101,45,0.15)', color: 'var(--brand-orange)' },
        reminder: { icon: 'fa-bell', bg: 'rgba(251,191,36,0.15)', color: 'var(--color-warning)' },
        checkin: { icon: 'fa-user-check', bg: 'rgba(34,197,94,0.15)', color: 'var(--color-success)' },
        release: { icon: 'fa-door-open', bg: 'rgba(239,68,68,0.15)', color: 'var(--color-error)' },
    };

    if (!list) return;
    list.innerHTML = notifs.length === 0
        ? '<div style="text-align:center;padding:var(--space-xl);color:var(--text-muted)"><i class="fas fa-bell-slash" style="font-size:2rem;margin-bottom:8px;display:block;opacity:0.3"></i>No notifications</div>'
        : `
      <div style="padding:var(--space-sm) var(--space-md)">
        <button class="btn btn-ghost btn-sm" id="mark-all-read" style="width:100%;justify-content:center"><i class="fas fa-check-double"></i> Mark all as read</button>
      </div>
      ${notifs.map(n => {
            const t = typeIcons[n.type] || typeIcons.booking;
            const timeAgo = getTimeAgo(new Date(n.time));
            return `
          <div class="notif-item ${n.read ? '' : 'unread'}" data-notif="${n.id}">
            <div class="notif-icon" style="background:${t.bg};color:${t.color}"><i class="fas ${t.icon}"></i></div>
            <div class="notif-body">
              <div class="notif-title">${n.title}</div>
              <div class="notif-desc">${n.message}</div>
              <div class="notif-time">${timeAgo}</div>
            </div>
          </div>
        `;
        }).join('')}
    `;

    list.querySelector('#mark-all-read')?.addEventListener('click', () => {
        store.markAllNotifsRead(user.id);
        renderNotifications();
        updateNotifBadge();
    });

    list.querySelectorAll('.notif-item').forEach(item => {
        item.addEventListener('click', () => {
            store.markNotifRead(item.dataset.notif);
            item.classList.remove('unread');
            updateNotifBadge();
        });
    });
}

function getTimeAgo(date) {
    const diff = (new Date() - date) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ===== GLOBAL SEARCH =====
function setupGlobalSearch() {
    const searchInput = document.getElementById('global-search');
    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (query.length < 2) return;

        const rooms = store.getRooms().filter(r => r.name.toLowerCase().includes(query));
        const bookings = store.getBookings().filter(b => b.title.toLowerCase().includes(query));

        // For now just navigate to relevant page
        if (rooms.length > 0) {
            navigate('/rooms');
        } else if (bookings.length > 0) {
            navigate('/calendar');
        }
    });

    searchInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = e.target.value.trim().toLowerCase();
            if (query) {
                showToast(`Searching for "${query}"...`, 'info');
            }
        }
    });
}
