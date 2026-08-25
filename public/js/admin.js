// Shared by every admin-*.html page: the login guard, the sidebar
// nav, and small fetch/formatting helpers. Kept separate from
// public/js/main.js on purpose — main.js drives the public site's
// header/footer for User and Manager pages, and admin pages have
// their own layout (a sidebar, not a top nav), so reusing main.js
// here would mean fighting its DOM assumptions instead of just
// writing a matching pair of files.

const ADMIN_API = '/api/admins';

const adminToken = localStorage.getItem('token');
const adminRole = localStorage.getItem('role');

// Same caveat as dashboard.js: this redirect only improves the
// experience. The real security boundary is authorize('admin') on
// the server, which verifies the JWT itself.
if (!adminToken || adminRole !== 'admin') {
  window.location.href = '/login.html';
}

function adminAuthHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };
}

// Every admin page injects user-supplied text (names, emails, event
// titles) into innerHTML for tables — this keeps that safe.
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str === null || str === undefined ? '' : String(str);
  return div.innerHTML;
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

async function adminFetch(path, options = {}) {
  const response = await fetch(`${ADMIN_API}${path}`, {
    ...options,
    headers: adminAuthHeaders()
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
}

function adminLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('fullName');
  window.location.href = '/login.html';
}

const ADMIN_NAV_LINKS = [
  { href: '/admin-dashboard.html', label: 'Dashboard' },
  { href: '/admin-users.html', label: 'Users' },
  { href: '/admin-managers.html', label: 'Managers' },
  { href: '/admin-events.html', label: 'Events' },
  { href: '/admin-registrations.html', label: 'Registrations' }
];

// Called once by each page's own script, passing its own path so the
// current section highlights in the sidebar. Renders into every
// element with class="admin-nav-slot" — each page has one for the
// desktop sidebar and one for the mobile dropdown, sharing markup
// without duplicating element IDs.
function renderAdminNav(activeHref) {
  const containers = document.querySelectorAll('.admin-nav-slot');
  if (!containers.length) return;

  const fullName = localStorage.getItem('fullName') || 'Admin';

  const links = ADMIN_NAV_LINKS.map((item) => {
    const isActive = item.href === activeHref;
    const classes = isActive
      ? 'block px-4 py-2 rounded-full bg-ember text-white font-medium text-sm transition-colors'
      : 'block px-4 py-2 rounded-full text-sm font-medium text-cloth/80 hover:bg-cloth/10 transition-colors';
    return `<a href="${item.href}" class="${classes}">${item.label}</a>`;
  }).join('');

  const markup = `
    <a href="/admin-dashboard.html" class="block px-4 pb-4 mb-3 border-b border-cloth/10">
      <p class="font-stub text-[11px] tracking-[0.2em] uppercase text-marigold">Admin Panel</p>
      <p class="font-display font-semibold text-cloth mt-1 truncate">${escapeHtml(fullName)}</p>
    </a>
    <nav class="flex flex-col gap-1 px-2">${links}</nav>
    <div class="px-2 mt-4 mb-2">
      <button class="admin-logout-btn w-full text-left px-4 py-2 rounded-full text-sm font-medium text-cloth/80 hover:bg-cloth/10 transition-colors">
        Logout
      </button>
    </div>`;

  containers.forEach((el) => { el.innerHTML = markup; });

  document.querySelectorAll('.admin-logout-btn').forEach((btn) => {
    btn.addEventListener('click', adminLogout);
  });

  const mobileBtn = document.getElementById('admin-mobile-menu-btn');
  const mobileNav = document.getElementById('admin-nav-mobile-wrap');
  if (mobileBtn && mobileNav) {
    mobileBtn.addEventListener('click', () => mobileNav.classList.toggle('hidden'));
  }
}
