// Admin > Users: list/search/view/delete. Search re-queries the
// server (GET /api/admins/users?search=...) rather than filtering
// client-side, so it scales the same way as the rest of the app's
// search (see public/js/events.js).

let allUsers = [];

function renderUsersTable(users) {
  const tbody = document.getElementById('users-table-body');
  const emptyState = document.getElementById('empty-state');

  if (!users.length) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  tbody.innerHTML = users.map((u) => `
    <tr class="border-b border-ink/5 last:border-0">
      <td class="px-4 py-3 font-medium">${escapeHtml(u.full_name)}</td>
      <td class="px-4 py-3 text-ink/70">${escapeHtml(u.email)}</td>
      <td class="px-4 py-3 text-ink/70">${formatDateTime(u.created_at)}</td>
      <td class="px-4 py-3 text-right whitespace-nowrap">
        <button data-view="${u.user_id}" class="px-3 py-1.5 text-xs rounded-full border-2 border-moss text-moss hover:bg-moss hover:text-white transition-colors">View</button>
        <button data-delete="${u.user_id}" class="ml-2 px-3 py-1.5 text-xs rounded-full border-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white transition-colors">Delete</button>
      </td>
    </tr>`).join('');
}

async function loadUsers(search) {
  const errorEl = document.getElementById('error-message');
  errorEl.classList.add('hidden');
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    allUsers = await adminFetch(`/users${query}`);
    renderUsersTable(allUsers);
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
}

function openUserDetail(user) {
  document.getElementById('detail-content').innerHTML = `
    <p><span class="font-medium">Name:</span> ${escapeHtml(user.full_name)}</p>
    <p><span class="font-medium">Email:</span> ${escapeHtml(user.email)}</p>
    <p><span class="font-medium">Joined:</span> ${formatDateTime(user.created_at)}</p>`;
  document.getElementById('detail-modal').classList.remove('hidden');
}

async function deleteUser(userId) {
  if (!confirm('Delete this user? This also removes their event registrations.')) return;
  try {
    await adminFetch(`/users/${userId}`, { method: 'DELETE' });
    allUsers = allUsers.filter((u) => u.user_id !== Number(userId));
    renderUsersTable(allUsers);
  } catch (err) {
    document.getElementById('error-message').textContent = err.message;
    document.getElementById('error-message').classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderAdminNav('/admin-users.html');
  loadUsers();

  let searchTimer;
  document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadUsers(e.target.value.trim()), 300);
  });

  document.getElementById('users-table-body').addEventListener('click', (e) => {
    const viewId = e.target.dataset.view;
    const deleteId = e.target.dataset.delete;
    if (viewId) {
      const user = allUsers.find((u) => u.user_id === Number(viewId));
      if (user) openUserDetail(user);
    }
    if (deleteId) deleteUser(deleteId);
  });

  document.getElementById('detail-close-btn').addEventListener('click', () => {
    document.getElementById('detail-modal').classList.add('hidden');
  });
});
