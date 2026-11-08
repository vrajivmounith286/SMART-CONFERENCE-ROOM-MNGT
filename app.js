// ===== APP ENTRY POINT =====

// Switch between Login and Register tabs
window.switchAuthTab = function (tabName) {
    document.querySelectorAll('#auth-tabs .tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tabName);
    });

    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');

    if (tabName === 'login') {
        loginForm?.classList.remove('hidden');
        regForm?.classList.add('hidden');
    } else {
        loginForm?.classList.add('hidden');
        regForm?.classList.remove('hidden');

        // Populate offices dropdown if not already populated
        const offSel = document.getElementById('reg-office');
        if (offSel && offSel.options.length === 0 && typeof getOffices === 'function') {
            getOffices().forEach(o => {
                const opt = document.createElement('option');
                opt.value = o.id;
                opt.textContent = o.name.split('—')[0].trim();
                offSel.appendChild(opt);
            });
        }
    }
};

// Trigger Google Sign-In with instant button visual feedback
window.triggerGoogleAuth = function (btnElement) {
    if (typeof window.handleGoogleSignIn === 'function') {
        window.handleGoogleSignIn(btnElement);
    } else {
        showToast('Connecting to Google service...', 'info');
        setTimeout(() => {
            if (typeof window.handleGoogleSignIn === 'function') {
                window.handleGoogleSignIn(btnElement);
            }
        }, 1000);
    }
};

function initApp() {
    initStore();
    const user = initAuth();

    if (user) {
        showApp();
    } else {
        showLogin();
    }

    // ===== AUTH TABS =====
    document.querySelectorAll('#auth-tabs .tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            window.switchAuthTab(tab.dataset.tab);
        });
    });

    // ===== LOGIN FORM (FIREBASE CLOUD LOGIN) =====
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailOrMobile = document.getElementById('login-email')?.value.trim();
        const pw = document.getElementById('login-password')?.value;

        if (!emailOrMobile) {
            showToast('Please enter your email address', 'warning');
            return;
        }
        if (!pw) {
            showToast('Please enter your password', 'warning');
            return;
        }

        const btn = document.getElementById('login-btn');

        // 1. Try Firebase Cloud Login first
        if (typeof window.handleEmailLogin === 'function') {
            await window.handleEmailLogin(emailOrMobile, pw, btn);
        } else {
            // Local fallback
            const u = findUserByEmailOrMobile(emailOrMobile);
            if (!u || u.password !== pw) {
                showToast('Account not found! Click "Register" to create an account first.', 'error', 5000);
                return;
            }
            doLogin(u);
            showApp();
            showToast(`Welcome back, ${u.name}!`, 'success');
        }
    });

    // ===== REGISTER FORM (FIREBASE CLOUD REGISTRATION) =====
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name')?.value.trim();
        const email = document.getElementById('reg-email')?.value.trim();
        const mobile = document.getElementById('reg-mobile')?.value.trim();
        const dept = document.getElementById('reg-dept')?.value;
        const office = document.getElementById('reg-office')?.value;
        const pw = document.getElementById('reg-password')?.value;
        const confirm = document.getElementById('reg-confirm')?.value;

        if (!name || name.length < 2) {
            showToast('Please enter your full name (at least 2 characters)', 'warning');
            return;
        }
        if (!email || !email.includes('@')) {
            showToast('Please enter a valid email address', 'warning');
            return;
        }
        if (mobile && (mobile.length < 10 || !/^\d+$/.test(mobile))) {
            showToast('Please enter a valid 10-digit mobile number', 'warning');
            return;
        }
        if (!pw || pw.length < 6) {
            showToast('Password must be at least 6 characters long', 'warning');
            return;
        }
        if (pw !== confirm) {
            showToast('Passwords do not match! Please check and re-type.', 'error');
            return;
        }

        const role = document.getElementById('reg-role')?.value || 'employee';
        const btn = e.target.querySelector('button[type="submit"]');

        const info = {
            name,
            email,
            mobile,
            department: dept,
            office: office || 'off1',
            password: pw,
            role
        };

        // 1. Create account in Firebase Cloud
        if (typeof window.handleEmailRegister === 'function') {
            await window.handleEmailRegister(info, btn);
        } else {
            // Local fallback
            const result = registerUser(info);
            if (result && result.error) {
                showToast(result.error, 'error');
                return;
            }
            doLogin(result.user);
            showApp();
            showToast(`Welcome, ${result.user.name}! Your account has been created.`, 'success');
        }
    });

    // ===== GOOGLE AUTH BUTTONS =====
    document.getElementById('google-login-btn')?.addEventListener('click', function () {
        window.triggerGoogleAuth(this);
    });
    document.getElementById('google-register-btn')?.addEventListener('click', function () {
        window.triggerGoogleAuth(this);
    });

    // ===== LOGOUT =====
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        if (typeof window.handleLogout === 'function') {
            window.handleLogout();
        } else {
            doLogout();
            if (typeof sigInt !== 'undefined' && sigInt) clearInterval(sigInt);
            showLogin();
            window.location.hash = '';
            showToast('Logged out successfully', 'info');
        }
    });

    // ===== MOBILE MENU =====
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.toggle('open');
    });
    document.addEventListener('click', e => {
        const sb = document.getElementById('sidebar');
        const mb = document.getElementById('mobile-menu-btn');
        if (sb?.classList.contains('open') && !sb.contains(e.target) && e.target !== mb && !mb?.contains(e.target)) {
            sb.classList.remove('open');
        }
    });

    // ===== NOTIFICATIONS =====
    document.getElementById('notif-btn')?.addEventListener('click', () => {
        const p = document.getElementById('notif-panel');
        p?.classList.toggle('hidden');
        if (p && !p.classList.contains('hidden')) renderNotifs();
    });
    document.getElementById('notif-close')?.addEventListener('click', () => {
        document.getElementById('notif-panel')?.classList.add('hidden');
    });

    // Modal overlay click
    document.getElementById('modal-overlay')?.addEventListener('click', e => {
        if (e.target.id === 'modal-overlay') closeModal();
    });

    on('notif', updateBadge);

    // Auto-release check every minute
    setInterval(() => autoRelease(), 60000);
}

// Start app either on DOMContentLoaded or immediately if already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function showLogin() {
    document.getElementById('login-screen')?.classList.remove('hidden');
    document.getElementById('app-shell')?.classList.add('hidden');

    // Reset forms
    document.getElementById('login-form')?.reset();
    document.getElementById('register-form')?.reset();

    // Show login tab by default
    window.switchAuthTab('login');

    // Populate offices for register form
    const offSel = document.getElementById('reg-office');
    if (offSel && typeof getOffices === 'function') {
        offSel.innerHTML = '';
        getOffices().forEach(o => {
            const opt = document.createElement('option');
            opt.value = o.id;
            opt.textContent = o.name.split('—')[0].trim();
            offSel.appendChild(opt);
        });
    }
}

function showApp() {
    document.getElementById('login-screen')?.classList.add('hidden');
    document.getElementById('app-shell')?.classList.remove('hidden');
    _routes = {
        '/dashboard': viewDashboard,
        '/booking': viewBooking,
        '/rooms': viewRooms,
        '/calendar': viewCalendar,
        '/signage': viewSignage,
        '/checkin': () => { window.open('kiosk.html', '_blank'); },
        '/analytics': viewAnalytics,
        '/admin': viewAdmin,
        '/profile': viewProfile,
        '/floorplan': viewFloorPlan,
    };
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
    updateBadge();

    // Start reminder service and auto-release
    startReminderService();
    setInterval(() => autoRelease(), 60000);
}

function updateBadge() {
    const u = curUser(); if (!u) return;
    const c = getUnreadCount(u.id);
    const b = document.getElementById('notif-badge');
    if (b) { b.textContent = c; b.style.display = c > 0 ? 'flex' : 'none'; }
}

function renderNotifs() {
    const u = curUser(); if (!u) return;
    const ns = getNotifs(u.id), list = document.getElementById('notif-list');
    const ti = { booking: { i: 'fa-calendar-check', bg: 'rgba(232,101,45,.15)', c: 'var(--brand-orange)' }, reminder: { i: 'fa-bell', bg: 'rgba(251,191,36,.15)', c: 'var(--color-warning)' }, checkin: { i: 'fa-user-check', bg: 'rgba(34,197,94,.15)', c: 'var(--color-success)' }, release: { i: 'fa-door-open', bg: 'rgba(239,68,68,.15)', c: 'var(--color-error)' } };
    if (!list) return;
    list.innerHTML = ns.length === 0
        ? '<div style="text-align:center;padding:var(--space-xl);color:var(--text-muted)"><i class="fas fa-bell-slash" style="font-size:2rem;margin-bottom:8px;display:block;opacity:.3"></i>No notifications</div>'
        : `<div style="padding:4px var(--space-md)"><button class="btn btn-ghost btn-sm" style="width:100%" onclick="markAllRead('${u.id}');renderNotifs();updateBadge();"><i class="fas fa-check-double"></i> Mark all read</button></div>`
        + ns.map(n => {
            const t = ti[n.type] || ti.booking;
            const d = (Date.now() - new Date(n.time)) / 1000;
            const ago = d < 60 ? 'Just now' : d < 3600 ? `${Math.floor(d / 60)}m` : d < 86400 ? `${Math.floor(d / 3600)}h` : `${Math.floor(d / 86400)}d`;
            return `<div class="notif-item ${n.read ? '' : 'unread'}" onclick="markNotifRead('${n.id}');this.classList.remove('unread');updateBadge();"><div class="notif-icon" style="background:${t.bg};color:${t.c}"><i class="fas ${t.i}"></i></div><div class="notif-body"><div class="notif-title">${n.title}</div><div class="notif-desc">${n.message}</div><div class="notif-time">${ago} ago</div></div></div>`;
        }).join('');
}
