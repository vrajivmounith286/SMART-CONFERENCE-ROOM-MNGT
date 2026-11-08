// ===== SIDEBAR NAVIGATION =====
import { getCurrentUser, hasPermission, isAdmin, isManager } from '../auth.js';
import { navigate, getCurrentRoute } from '../router.js';

export function renderSidebar() {
    const nav = document.getElementById('sidebar-nav');
    const user = getCurrentUser();
    if (!nav || !user) return;

    const items = [
        {
            section: 'Main', items: [
                { path: '/dashboard', icon: 'fa-th-large', label: 'Dashboard' },
                { path: '/booking', icon: 'fa-calendar-plus', label: 'Book Room' },
                { path: '/calendar', icon: 'fa-calendar-alt', label: 'Calendar' },
                { path: '/rooms', icon: 'fa-door-open', label: 'Rooms' },
            ]
        },
        {
            section: 'Activity', items: [
                { path: '/checkin', icon: 'fa-user-check', label: 'Check-in' },
                { path: '/signage', icon: 'fa-tv', label: 'Digital Signage' },
            ]
        },
    ];

    if (isManager()) {
        items.push({
            section: 'Insights', items: [
                { path: '/analytics', icon: 'fa-chart-bar', label: 'Analytics', permission: 'view_analytics' },
            ]
        });
    }

    if (isAdmin()) {
        items.push({
            section: 'Administration', items: [
                { path: '/admin', icon: 'fa-cog', label: 'Admin Panel', permission: 'manage_settings' },
            ]
        });
    }

    const currentPath = getCurrentRoute() || '/dashboard';

    nav.innerHTML = items.map(section => `
    <div class="nav-section">
      <div class="nav-section-title">${section.section}</div>
      ${section.items.filter(i => !i.permission || hasPermission(i.permission)).map(item => `
        <button class="nav-item ${currentPath === item.path ? 'active' : ''}" data-path="${item.path}">
          <i class="fas ${item.icon}"></i>
          <span>${item.label}</span>
        </button>
      `).join('')}
    </div>
  `).join('');

    // Update user info
    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');
    const userAvatarEl = document.getElementById('user-avatar');
    if (userNameEl) userNameEl.textContent = user.name;
    if (userRoleEl) userRoleEl.textContent = user.role;
    if (userAvatarEl) userAvatarEl.textContent = user.initials;

    // Wire up navigation
    nav.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            navigate(btn.dataset.path);
            // Close mobile sidebar
            document.getElementById('sidebar')?.classList.remove('open');
        });
    });
}
