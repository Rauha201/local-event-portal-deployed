// Shared behaviour used across pages: mobile nav toggle, loading real
// events from the API, reflecting login state on BOTH the desktop and
// mobile nav (see the Part 4 bug fix note below), timezone-safe
// date/time formatting, and a friendly (non-sending) contact form.

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// These take the "YYYY-MM-DD" string straight from the API and read
// the numbers directly, instead of building a `new Date(dateString)`
// and formatting it with something timezone-aware. That combination
// used to be able to shift a date backward by a day depending on the
// visitor's timezone — see config/db.js for the matching server-side
// fix (Part 3).
function formatDateLabel(dateStr) {
  const [, month, day] = String(dateStr).slice(0, 10).split('-').map(Number);
  return `${MONTH_SHORT[month - 1]} ${day}`;
}

function formatDateLong(dateStr) {
  const [year, month, day] = String(dateStr).slice(0, 10).split('-').map(Number);
  return `${MONTH_LONG[month - 1]} ${day}, ${year}`;
}

function formatTime(timeStr) {
  const [h, m] = String(timeStr).slice(0, 5).split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

// Builds one event card. The "seam" div + two small circles are the
// ticket-stub effect: the circles are colored to match the page
// background behind the card, so they read as punched-out notches.
// Cards link to the details page when there's a real event_id (i.e.
// not the static SAMPLE_EVENTS fallback, which has none).
function createEventCard(event) {
  const price = Number(event.ticket_price);
  const priceLabel = price === 0 ? 'Free' : `$${price}`;
  const dateLabel = formatDateLabel(event.event_date);
  const imageUrl = `/images/${event.image || 'event-placeholder-1.jpg'}`;
  const rating = Number(event.rating);
  const ratingLabel = rating > 0 ? `&#9733; ${rating.toFixed(1)}` : 'New';

  const inner = `
    <div class="h-36 bg-moss-100 bg-cover bg-center" style="background-image:url('${imageUrl}')"></div>
    <div class="px-4 pt-4 pb-3">
      <span class="font-stub text-[11px] tracking-widest uppercase text-moss bg-moss-100 px-2 py-1 rounded">
        ${event.category}
      </span>
      <h3 class="font-display font-semibold text-ink text-lg mt-2 leading-snug line-clamp-2">${event.title}</h3>
      <p class="text-sm text-ink/60 mt-1">${event.location} &middot; ${dateLabel}</p>
    </div>
    <div class="relative border-t-2 border-dashed border-ink/15 mx-4">
      <span class="absolute -left-6 -top-3 w-6 h-6 rounded-full bg-cloth"></span>
      <span class="absolute -right-6 -top-3 w-6 h-6 rounded-full bg-cloth"></span>
    </div>
    <div class="flex items-center justify-between px-4 py-3 font-stub text-sm">
      <span class="text-ember font-bold">${priceLabel}</span>
      <span class="text-marigold">${ratingLabel}</span>
    </div>`;

  const cardClasses = 'block bg-paper rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden';

  return event.event_id
    ? `<a href="/event.html?id=${event.event_id}" class="${cardClasses}">${inner}</a>`
    : `<div class="${cardClasses}">${inner}</div>`;
}

function renderEmptyState(container, message) {
  container.innerHTML = `<p class="col-span-full text-center text-ink/60 py-10">${message}</p>`;
}

// Tries the real API first. Falls back to placeholder data only if
// the request itself fails — not if it succeeds with zero events,
// which gets its own honest empty state instead.
async function fetchEvents() {
  try {
    const response = await fetch('/api/events');
    if (!response.ok) throw new Error('Request failed');
    return await response.json();
  } catch (err) {
    console.warn('Could not load events from the API, showing sample data instead.', err);
    return SAMPLE_EVENTS;
  }
}

async function renderEventSections() {
  const featuredEl = document.getElementById('featured-events');
  const upcomingEl = document.getElementById('upcoming-events');
  if (!featuredEl && !upcomingEl) return; // not on this page

  const events = await fetchEvents();

  if (events.length === 0) {
    const message = 'No events posted yet — <a href="/register.html" class="text-ember underline">register as a manager</a> and be the first!';
    if (featuredEl) renderEmptyState(featuredEl, message);
    if (upcomingEl) renderEmptyState(upcomingEl, message);
    return;
  }

  const byRating = [...events].sort((a, b) => Number(b.rating) - Number(a.rating));
  const byDate = [...events].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

  if (featuredEl) featuredEl.innerHTML = byRating.slice(0, 3).map(createEventCard).join('');
  if (upcomingEl) upcomingEl.innerHTML = byDate.slice(0, 3).map(createEventCard).join('');
}

// CODE OPTIMIZATION (Part 4): every page used to carry its own copy
// of this nav markup (~40 lines each, duplicated across 7 files).
// That duplication is *why* the mobile-menu auth-state bug above was
// able to exist in the first place — the fix could be written once,
// but had no way to reach five separate hardcoded copies. Generating
// it from one function means there is now only one copy to keep
// correct. Each page just needs `<div id="site-header"></div>`
// (or `data-variant="minimal"` for the login/register pages).
function renderSiteHeader() {
  const container = document.getElementById('site-header');
  if (!container) return;

  if (container.dataset.variant === 'minimal') {
    container.innerHTML = `
      <header class="px-5 py-6 text-center">
        <a href="/index.html" class="font-display font-bold text-xl text-cloth">LocalLoop</a>
      </header>`;
    return;
  }

  container.innerHTML = `
    <header class="sticky top-0 z-50 bg-cloth/90 backdrop-blur border-b border-ink/10">
      <nav class="max-w-6xl mx-auto flex items-center justify-between px-5 py-4">
        <a href="/index.html" class="font-display font-bold text-xl text-ember">LocalLoop</a>

        <div class="hidden md:flex items-center gap-8 font-medium text-sm">
          <a href="/index.html" class="hover:text-ember transition-colors">Home</a>
          <a href="/events.html" class="hover:text-ember transition-colors">Events</a>
          <a href="/index.html#about" class="hover:text-ember transition-colors">About</a>
          <a href="/index.html#contact" class="hover:text-ember transition-colors">Contact</a>
        </div>

        <div id="guest-links" class="hidden items-center gap-3">
          <a href="/login.html" class="px-4 py-2 text-sm font-medium hover:text-ember transition-colors">Log In</a>
          <a href="/register.html" class="px-4 py-2 text-sm rounded-full bg-ember text-white font-medium hover:bg-ember-600 transition-colors">Register</a>
        </div>

        <div id="user-links" class="hidden items-center gap-3 text-sm">
          <a id="nav-dashboard-link" href="/dashboard.html" class="hidden font-semibold text-ember">Dashboard</a>
          <a id="nav-registrations-link" href="/registrations.html" class="hidden font-semibold text-ember">My Registrations</a>
          <span>Hi, <span id="nav-user-name" class="font-semibold"></span></span>
          <button id="logout-btn" class="px-4 py-2 rounded-full bg-ink text-white font-medium hover:bg-black transition-colors">Log Out</button>
        </div>

        <button id="mobile-menu-btn" class="md:hidden p-2" aria-label="Toggle menu">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </nav>

      <div id="mobile-menu" class="hidden md:hidden px-5 pb-4 flex flex-col gap-3 font-medium text-sm">
        <a href="/index.html">Home</a>
        <a href="/events.html">Events</a>
        <a href="/index.html#about">About</a>
        <a href="/index.html#contact">Contact</a>

        <div id="mobile-guest-links" class="flex flex-col gap-3">
          <a href="/login.html">Log In</a>
          <a href="/register.html" class="px-4 py-2 rounded-full bg-ember text-white text-center">Register</a>
        </div>

        <div id="mobile-user-links" class="hidden flex-col gap-3">
          <a id="mobile-nav-dashboard-link" href="/dashboard.html" class="hidden font-semibold text-ember">Dashboard</a>
          <a id="mobile-nav-registrations-link" href="/registrations.html" class="hidden font-semibold text-ember">My Registrations</a>
          <span>Hi, <span id="mobile-nav-user-name" class="font-semibold"></span></span>
          <button id="mobile-logout-btn" class="px-4 py-2 rounded-full bg-ink text-white font-medium text-center">Log Out</button>
        </div>
      </div>
    </header>`;
}

// BUG FIX (Part 4): the mobile menu used to be a static list that
// never reflected login state at all — on a phone, there was no way
// to see "Dashboard", "My Registrations", or even Log Out, because
// those links only existed in the desktop nav. This updates both the
// desktop AND mobile copies together.
//
// BUG FIX (Admin System follow-up): the desktop containers used to
// carry a permanent `md:flex` class, e.g. class="hidden md:flex ...".
// That utility forces display:flex at md+ viewports regardless of
// whatever `hidden` is toggled to by JS, since Tailwind emits
// responsive variants after the base utility with equal specificity —
// so at desktop widths #guest-links and #user-links were BOTH always
// visible no matter the login state ("Hi, / Log Out" next to "Log In
// / Register" at the same time). `md:flex` is no longer static on
// either element; it's toggled here in lockstep with `hidden`, so
// only one set of links is ever visible, on any screen size.
function reflectAuthState() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const fullName = localStorage.getItem('fullName') || 'Account';

  const guestLinks = document.getElementById('guest-links');
  const userLinks = document.getElementById('user-links');
  const mobileGuestLinks = document.getElementById('mobile-guest-links');
  const mobileUserLinks = document.getElementById('mobile-user-links');
  if (!guestLinks && !mobileGuestLinks) return; // not on a page with nav auth state (e.g. login.html)

  const loggedIn = Boolean(token);

  if (guestLinks) {
    guestLinks.classList.toggle('hidden', loggedIn);
    guestLinks.classList.toggle('md:flex', !loggedIn);
  }
  if (userLinks) {
    userLinks.classList.toggle('hidden', !loggedIn);
    userLinks.classList.toggle('md:flex', loggedIn);
  }
  if (mobileGuestLinks) mobileGuestLinks.classList.toggle('hidden', loggedIn);
  if (mobileUserLinks) {
    mobileUserLinks.classList.toggle('hidden', !loggedIn);
    mobileUserLinks.classList.toggle('flex', loggedIn);
  }

  if (!loggedIn) return;

  document.querySelectorAll('#nav-user-name, #mobile-nav-user-name').forEach((el) => {
    el.textContent = fullName;
  });
  document.querySelectorAll('#nav-dashboard-link, #mobile-nav-dashboard-link').forEach((el) => {
    el.classList.toggle('hidden', role !== 'manager');
  });
  document.querySelectorAll('#nav-registrations-link, #mobile-nav-registrations-link').forEach((el) => {
    el.classList.toggle('hidden', role !== 'user');
  });

  // BUG FIX: the homepage's "Post an Event" button (index.html) used
  // to hardcode href="/register.html" — so a logged-in manager
  // clicking it was sent to create a brand-new account instead of
  // their own dashboard where posting actually happens. It now points
  // a logged-in manager straight to /dashboard.html. A logged-in user
  // or admin (roles that don't post events) still goes to
  // /register.html to register as a manager, same as a signed-out
  // visitor always did.
  const postEventLink = document.getElementById('post-event-link');
  if (postEventLink && role === 'manager') {
    postEventLink.href = '/dashboard.html';
    postEventLink.textContent = 'Post an Event';
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('fullName');
  window.location.href = '/index.html';
}

function setupMobileNav() {
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (btn && menu) btn.addEventListener('click', () => menu.classList.toggle('hidden'));
}

// The contact form has no backend endpoint on purpose — email
// notifications are outside this project's scope.
function setupContactForm() {
  const form = document.getElementById('contact-form');
  const message = document.getElementById('contact-message');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.reset();
    message.textContent = "Thanks — this demo form doesn't send messages yet, but the UI is ready for a real endpoint later.";
    message.classList.remove('hidden');
  });
}

// Guarded so this file can also be `require()`d from a plain Node
// test (tests/unit.test.js) without `document` existing — see the
// module.exports guard at the bottom for the same reason.
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    renderSiteHeader();
    setupMobileNav();
    reflectAuthState();
    renderEventSections();
    setupContactForm();

    document.querySelectorAll('#logout-btn, #mobile-logout-btn').forEach((btn) => {
      btn.addEventListener('click', logout);
    });

    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });
}

// Exposed for Node-based unit tests only — has no effect in the
// browser, since `module` doesn't exist there for a plain <script>.
if (typeof module !== 'undefined') {
  module.exports = { formatDateLabel, formatDateLong, formatTime };
}
