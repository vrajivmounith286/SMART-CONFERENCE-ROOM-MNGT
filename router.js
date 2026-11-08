// ===== SPA ROUTER =====
let _routes = {};
let _currentRoute = null;
let _beforeHook = null;

export function registerRoutes(routes) {
    _routes = routes;
}

export function setBeforeNavigate(hook) {
    _beforeHook = hook;
}

export function navigate(path) {
    window.location.hash = path;
}

export function getCurrentRoute() {
    return _currentRoute;
}

export function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}

function handleRoute() {
    const hash = window.location.hash.slice(1) || '/dashboard';
    const route = _routes[hash];

    if (_beforeHook && !_beforeHook(hash)) return;

    if (route) {
        _currentRoute = hash;
        const container = document.getElementById('view-container');
        if (container) {
            container.innerHTML = '';
            container.className = 'view-container fade-in';
            route(container);
        }
    } else {
        navigate('/dashboard');
    }
}
