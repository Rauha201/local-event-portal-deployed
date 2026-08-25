// Event Details page. Loads one event via GET /api/events/:id
// (public — no login needed just to look), then shows a registration
// flow that adapts to who's looking: guest, user, or manager — plus
// a sandbox payment step for paid events, and calendar export either
// way.

function getEventIdFromURL() {
  return new URLSearchParams(window.location.search).get('id');
}

// Pure "clock calculator": builds calendar timestamps using UTC
// arithmetic purely so hour/day rollover math is correct (e.g. an
// event starting at 11pm ending 2 hours later on the next day). This
// never claims the event happens in UTC — it's the same wall-clock
// number in, wall-clock number out approach as formatDateLabel() in
// main.js, just for a case that also needs to add hours safely.
function calendarTimestamp(dateStr, timeStr, hoursToAdd = 0) {
  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
  const [hh, mm] = String(timeStr).slice(0, 5).split(':').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, hh + hoursToAdd, mm));
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00`;
}

function buildGoogleCalendarUrl(event) {
  const start = calendarTimestamp(event.event_date, event.event_time, 0);
  const end = calendarTimestamp(event.event_date, event.event_time, 2); // assume a 2-hour event
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description || '',
    location: event.location
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildICS(event) {
  const start = calendarTimestamp(event.event_date, event.event_time, 0);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LocalLoop//Event//EN',
    'BEGIN:VEVENT',
    `UID:event-${event.event_id}@localloop`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    'DURATION:PT2H',
    `SUMMARY:${event.title}`,
    `LOCATION:${event.location}`,
    `DESCRIPTION:${(event.description || '').replace(/\r?\n/g, '\\n')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

function downloadICS(event) {
  const blob = new Blob([buildICS(event)], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]/gi, '-')}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function loadEvent() {
  const id = getEventIdFromURL();
  const root = document.getElementById('event-root');
  if (!id) {
    root.innerHTML = '<p class="text-center text-ink/60 py-20">No event specified.</p>';
    return;
  }

  try {
    const res = await fetch(`/api/events/${id}`);
    if (!res.ok) throw new Error('not found');
    renderEvent(await res.json());
  } catch (err) {
    root.innerHTML = '<p class="text-center text-ink/60 py-20">This event could not be found.</p>';
  }
}

function renderEvent(event) {
  document.title = `${event.title} — LocalLoop`;
  const price = Number(event.ticket_price);
  const rating = Number(event.rating);
  const spotsLeft = event.max_participants - Number(event.registered_count || 0);

  document.getElementById('event-image').style.backgroundImage = `url('/images/${event.image || 'event-placeholder-1.jpg'}')`;
  document.getElementById('event-category').textContent = event.category;
  document.getElementById('event-title').textContent = event.title;
  document.getElementById('event-organizer').textContent = `Organized by ${event.organizer}`;
  document.getElementById('event-datetime').textContent = `${formatDateLong(event.event_date)} at ${formatTime(event.event_time)}`;
  document.getElementById('event-location').textContent = event.location;
  document.getElementById('event-description').textContent = event.description || 'No description provided.';
  document.getElementById('event-price').textContent = price === 0 ? 'Free' : `$${price}`;
  document.getElementById('event-rating').textContent = rating > 0 ? `★ ${rating.toFixed(1)}` : 'New';
  document.getElementById('event-capacity').textContent =
    spotsLeft > 0 ? `${spotsLeft} of ${event.max_participants} spots left` : 'Sold out';

  document.getElementById('gcal-link').href = buildGoogleCalendarUrl(event);
  document.getElementById('ics-btn').addEventListener('click', () => downloadICS(event));

  renderRegistrationSection(event, spotsLeft);
}

async function renderRegistrationSection(event, spotsLeft) {
  const section = document.getElementById('registration-section');
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    section.innerHTML = `<p class="text-ink/70">Log in as a user to register. <a href="/login.html" class="text-ember underline">Log in</a></p>`;
    return;
  }
  if (role !== 'user') {
    section.innerHTML = `<p class="text-ink/70">Only user accounts can register for events.</p>`;
    return;
  }
  if (spotsLeft <= 0) {
    section.innerHTML = `<p class="text-ink/70 font-medium">This event is sold out.</p>`;
    return;
  }

  // Has this user already registered? Check before offering the form again.
  try {
    const res = await fetch('/api/registrations/mine', { headers: { Authorization: `Bearer ${token}` } });
    const mine = await res.json();
    const alreadyRegistered = Array.isArray(mine) && mine.some((r) => r.event_id === event.event_id);
    if (alreadyRegistered) {
      section.innerHTML = `<p class="text-moss font-medium">You're registered for this event. See it on your <a href="/registrations.html" class="underline">My Registrations</a> page.</p>`;
      return;
    }
  } catch (err) {
    // fall through and let them try to register anyway
  }

  const price = Number(event.ticket_price);

  if (price === 0) {
    section.innerHTML = `
      <button id="register-btn" class="px-6 py-3 rounded-full bg-ember text-white font-medium hover:bg-ember-600 transition-colors">Register — Free</button>
      <p id="register-message" class="hidden text-sm mt-2 text-red-600"></p>`;
    document.getElementById('register-btn').addEventListener('click', () => submitRegistration(event.event_id));
    return;
  }

  section.innerHTML = `
    <button id="show-payment-btn" class="px-6 py-3 rounded-full bg-ember text-white font-medium hover:bg-ember-600 transition-colors">Register — $${price}</button>
    <div id="payment-form" class="hidden mt-4 bg-cloth rounded-lg p-4 space-y-3 max-w-sm">
      <p class="text-xs font-stub uppercase tracking-widest text-moss">Sandbox payment — no real charge</p>
      <input id="card-name" placeholder="Name on card" class="w-full rounded-md border border-ink/20 px-3 py-2" />
      <input id="card-number" placeholder="4242 4242 4242 4242" maxlength="19" class="w-full rounded-md border border-ink/20 px-3 py-2" />
      <div class="flex gap-3">
        <input id="card-expiry" placeholder="MM/YY" maxlength="5" class="w-1/2 rounded-md border border-ink/20 px-3 py-2" />
        <input id="card-cvc" placeholder="CVC" maxlength="3" class="w-1/2 rounded-md border border-ink/20 px-3 py-2" />
      </div>
      <button id="pay-btn" class="w-full py-2 rounded-full bg-ember text-white font-medium hover:bg-ember-600 transition-colors">Pay $${price} &amp; Register</button>
    </div>
    <p id="register-message" class="hidden text-sm mt-2 text-red-600"></p>`;

  document.getElementById('show-payment-btn').addEventListener('click', () => {
    document.getElementById('payment-form').classList.remove('hidden');
  });

  document.getElementById('pay-btn').addEventListener('click', async () => {
    const messageEl = document.getElementById('register-message');
    const name = document.getElementById('card-name').value.trim();
    const number = document.getElementById('card-number').value.trim();
    if (!name || !number) {
      messageEl.textContent = 'Enter a name and card number (any values work — this is a sandbox).';
      messageEl.classList.remove('hidden');
      return;
    }

    const btn = document.getElementById('pay-btn');
    btn.disabled = true;
    btn.textContent = 'Processing...';
    await new Promise((resolve) => setTimeout(resolve, 800)); // simulate a payment round trip
    submitRegistration(event.event_id);
  });
}

async function submitRegistration(eventId) {
  const token = localStorage.getItem('token');
  const messageEl = document.getElementById('register-message');
  try {
    const res = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ eventId })
    });
    const data = await res.json();
    if (!res.ok) {
      messageEl.textContent = data.message || 'Could not register';
      messageEl.classList.remove('hidden');
      return;
    }
    // Registered successfully — reload to show the "you're registered"
    // state + updated capacity, then drop a receipt download button
    // right where the payment form was, so it's the very next thing
    // the user sees after paying.
    await loadEvent();
    showReceiptDownload(data.registrationId);
  } catch (err) {
    messageEl.textContent = 'Could not reach the server.';
    messageEl.classList.remove('hidden');
  }
}

// Same fetch+blob pattern as the .ics calendar download above, plus
// an Authorization header since GET /api/registrations/:id/receipt
// requires the caller's own JWT (see registrationController.js).
async function downloadReceipt(registrationId, btn) {
  const token = localStorage.getItem('token');
  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Preparing...';
  try {
    const res = await fetch(`/api/registrations/${registrationId}/receipt`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Could not generate receipt');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${registrationId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
}

function showReceiptDownload(registrationId) {
  const section = document.getElementById('registration-section');
  const banner = document.createElement('div');
  banner.className = 'mt-3 flex items-center gap-3 flex-wrap';
  banner.innerHTML = `
    <span class="text-moss font-medium text-sm">Payment successful!</span>
    <button id="receipt-btn" class="px-5 py-2 text-sm rounded-full border-2 border-ink text-ink font-medium hover:bg-ink hover:text-white transition-colors">
      Download Receipt (PDF)
    </button>`;
  section.appendChild(banner);
  document.getElementById('receipt-btn').addEventListener('click', (e) => downloadReceipt(registrationId, e.target));
}

// Guarded the same way as main.js — lets tests/unit.test.js require()
// this file without a `document` existing.
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', loadEvent);
}

// Exposed for Node-based unit tests only — has no effect in the browser.
if (typeof module !== 'undefined') {
  module.exports = { calendarTimestamp, buildICS, buildGoogleCalendarUrl };
}
