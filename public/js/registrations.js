// My Registrations page — user-only. Same "UX guard, not security
// boundary" pattern as dashboard.js: the real check is
// authorize('user') on GET /api/registrations/mine.

const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

if (!token || role !== 'user') {
  window.location.href = '/login.html';
}

// Downloads use fetch + blob (not a plain <a href>) because the
// receipt route requires a JWT — the same pattern main.js and
// event-details.js already use for the .ics calendar file, just with
// an Authorization header added since this endpoint isn't public.
async function downloadReceipt(registrationId, btn) {
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

function createRegistrationRow(reg) {
  const price = Number(reg.ticket_price);
  const priceLabel = price === 0 ? 'Free' : `$${price}`;
  return `
    <div class="bg-paper rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
      <a href="/event.html?id=${reg.event_id}" class="block">
        <span class="font-stub text-[11px] uppercase tracking-widest text-moss">${reg.category}</span>
        <h3 class="font-display font-semibold text-lg leading-snug">${reg.title}</h3>
        <p class="text-sm text-ink/60">${reg.location} &middot; ${formatDateLong(reg.event_date)} &middot; ${priceLabel}</p>
        <span class="inline-block mt-1 text-xs font-stub uppercase tracking-wide text-moss">Payment: ${reg.payment_status}</span>
      </a>
      <button data-receipt="${reg.registration_id}" class="mt-3 px-4 py-2 text-sm rounded-full border-2 border-ink text-ink font-medium hover:bg-ink hover:text-white transition-colors">
        Download Receipt (PDF)
      </button>
    </div>`;
}

async function loadRegistrations() {
  const listEl = document.getElementById('registrations-list');
  const emptyEl = document.getElementById('empty-state');

  try {
    const res = await fetch('/api/registrations/mine', { headers: { Authorization: `Bearer ${token}` } });
    const registrations = await res.json();
    if (!res.ok) throw new Error(registrations.message || 'Could not load your registrations');

    if (registrations.length === 0) {
      listEl.innerHTML = '';
      emptyEl.classList.remove('hidden');
    } else {
      emptyEl.classList.add('hidden');
      listEl.innerHTML = registrations.map(createRegistrationRow).join('');
    }
  } catch (err) {
    listEl.innerHTML = `<p class="text-red-600 text-center py-8">${err.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', loadRegistrations);

document.getElementById('registrations-list').addEventListener('click', (e) => {
  const registrationId = e.target.dataset.receipt;
  if (registrationId) downloadReceipt(registrationId, e.target);
});
