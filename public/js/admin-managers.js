// Admin > Managers: list/search/view/approve/reject/delete.
// Newly self-registered managers default to 'approved' server-side
// (see database/schema.sql), so Approve/Reject here is a moderation
// tool an admin reaches for, not a gate every manager must pass
// through — nothing about the existing manager register/login flow
// changes because of it.

let allManagers = [];

const STATUS_BADGE = {
  approved: 'bg-moss-100 text-moss',
  pending: 'bg-marigold-100 text-marigold',
  rejected: 'bg-red-100 text-red-600'
};

function renderManagersTable(managers) {
  const tbody = document.getElementById('managers-table-body');
  const emptyState = document.getElementById('empty-state');

  if (!managers.length) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  tbody.innerHTML = managers.map((m) => `
    <tr class="border-b border-ink/5 last:border-0">
      <td class="px-4 py-3 font-medium">${escapeHtml(m.full_name)}</td>
      <td class="px-4 py-3 text-ink/70">${escapeHtml(m.email)}</td>
      <td class="px-4 py-3">
        <span class="inline-block px-2 py-1 rounded-full text-[11px] font-stub uppercase tracking-wide ${STATUS_BADGE[m.status] || 'bg-ink/10'}">${escapeHtml(m.status)}</span>
      </td>
      <td class="px-4 py-3 text-ink/70">${formatDateTime(m.created_at)}</td>
      <td class="px-4 py-3 text-right whitespace-nowrap space-y-1">
        <button data-view="${m.manager_id}" class="px-3 py-1.5 text-xs rounded-full border-2 border-moss text-moss hover:bg-moss hover:text-white transition-colors">View</button>
        <button data-approve="${m.manager_id}" class="px-3 py-1.5 text-xs rounded-full border-2 border-marigold text-marigold hover:bg-marigold hover:text-white transition-colors" ${m.status === 'approved' ? 'disabled style="opacity:.4;cursor:not-allowed"' : ''}>Approve</button>
        <button data-reject="${m.manager_id}" class="px-3 py-1.5 text-xs rounded-full border-2 border-ink text-ink hover:bg-ink hover:text-white transition-colors" ${m.status === 'rejected' ? 'disabled style="opacity:.4;cursor:not-allowed"' : ''}>Reject</button>
        <button data-delete="${m.manager_id}" class="px-3 py-1.5 text-xs rounded-full border-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white transition-colors">Delete</button>
      </td>
    </tr>`).join('');
}

async function loadManagers(search) {
  const errorEl = document.getElementById('error-message');
  errorEl.classList.add('hidden');
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    allManagers = await adminFetch(`/managers${query}`);
    renderManagersTable(allManagers);
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
}

function openManagerDetail(manager) {
  document.getElementById('detail-content').innerHTML = `
    <p><span class="font-medium">Name:</span> ${escapeHtml(manager.full_name)}</p>
    <p><span class="font-medium">Email:</span> ${escapeHtml(manager.email)}</p>
    <p><span class="font-medium">Status:</span> ${escapeHtml(manager.status)}</p>
    <p><span class="font-medium">Joined:</span> ${formatDateTime(manager.created_at)}</p>`;
  document.getElementById('detail-modal').classList.remove('hidden');
}

async function setManagerStatus(managerId, action) {
  const errorEl = document.getElementById('error-message');
  try {
    await adminFetch(`/managers/${managerId}/${action}`, { method: 'PUT' });
    const manager = allManagers.find((m) => m.manager_id === Number(managerId));
    if (manager) manager.status = action === 'approve' ? 'approved' : 'rejected';
    renderManagersTable(allManagers);
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
}

async function deleteManager(managerId) {
  if (!confirm('Delete this manager? This also removes all of their events and those events\' registrations.')) return;
  try {
    await adminFetch(`/managers/${managerId}`, { method: 'DELETE' });
    allManagers = allManagers.filter((m) => m.manager_id !== Number(managerId));
    renderManagersTable(allManagers);
  } catch (err) {
    document.getElementById('error-message').textContent = err.message;
    document.getElementById('error-message').classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderAdminNav('/admin-managers.html');
  loadManagers();

  let searchTimer;
  document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadManagers(e.target.value.trim()), 300);
  });

  document.getElementById('managers-table-body').addEventListener('click', (e) => {
    const viewId = e.target.dataset.view;
    const approveId = e.target.dataset.approve;
    const rejectId = e.target.dataset.reject;
    const deleteId = e.target.dataset.delete;

    if (viewId) {
      const manager = allManagers.find((m) => m.manager_id === Number(viewId));
      if (manager) openManagerDetail(manager);
    }
    if (approveId) setManagerStatus(approveId, 'approve');
    if (rejectId) setManagerStatus(rejectId, 'reject');
    if (deleteId) deleteManager(deleteId);
  });

  document.getElementById('detail-close-btn').addEventListener('click', () => {
    document.getElementById('detail-modal').classList.add('hidden');
  });
});
