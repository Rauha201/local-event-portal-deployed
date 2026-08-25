// Admin > Registrations: list/search/delete. No "view" modal here —
// user_name/event_title/payment_status/registered_at (from
// RegistrationModel.findAll(), models/registrationModel.js) is
// already everything a row needs, so a table is the whole answer.

let allRegistrations = [];

function renderRegistrationsTable(registrations) {
  const tbody = document.getElementById('registrations-table-body');
  const emptyState = document.getElementById('empty-state');

  if (!registrations.length) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  tbody.innerHTML = registrations.map((r) => `
    <tr class="border-b border-ink/5 last:border-0">
      <td class="px-4 py-3 font-medium">${escapeHtml(r.user_name)}<br><span class="text-xs text-ink/50 font-normal">${escapeHtml(r.user_email)}</span></td>
      <td class="px-4 py-3 text-ink/70">${escapeHtml(r.event_title)}</td>
      <td class="px-4 py-3">
        <span class="inline-block px-2 py-1 rounded-full text-[11px] font-stub uppercase tracking-wide ${r.payment_status === 'paid' ? 'bg-moss-100 text-moss' : 'bg-marigold-100 text-marigold'}">${escapeHtml(r.payment_status)}</span>
      </td>
      <td class="px-4 py-3 text-ink/70">${formatDateTime(r.registered_at)}</td>
      <td class="px-4 py-3 text-right whitespace-nowrap">
        <button data-delete="${r.registration_id}" class="px-3 py-1.5 text-xs rounded-full border-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white transition-colors">Delete</button>
      </td>
    </tr>`).join('');
}

async function loadRegistrations(search) {
  const errorEl = document.getElementById('error-message');
  errorEl.classList.add('hidden');
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    allRegistrations = await adminFetch(`/registrations${query}`);
    renderRegistrationsTable(allRegistrations);
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
}

async function deleteRegistration(registrationId) {
  if (!confirm('Delete this registration?')) return;
  try {
    await adminFetch(`/registrations/${registrationId}`, { method: 'DELETE' });
    allRegistrations = allRegistrations.filter((r) => r.registration_id !== Number(registrationId));
    renderRegistrationsTable(allRegistrations);
  } catch (err) {
    document.getElementById('error-message').textContent = err.message;
    document.getElementById('error-message').classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderAdminNav('/admin-registrations.html');
  loadRegistrations();

  let searchTimer;
  document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadRegistrations(e.target.value.trim()), 300);
  });

  document.getElementById('registrations-table-body').addEventListener('click', (e) => {
    const deleteId = e.target.dataset.delete;
    if (deleteId) deleteRegistration(deleteId);
  });
});
