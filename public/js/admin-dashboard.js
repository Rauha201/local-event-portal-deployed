// Admin Dashboard: loads the four stat cards and the recent-activity
// feed from GET /api/admins/stats. The auth guard, sidebar, and fetch
// helper all live in admin.js, loaded before this file.

document.addEventListener('DOMContentLoaded', async () => {
  renderAdminNav('/admin-dashboard.html');

  const errorEl = document.getElementById('error-message');
  const activityList = document.getElementById('activity-list');
  const activityEmpty = document.getElementById('activity-empty');

  const ACTIVITY_DOT = {
    user: 'bg-ember',
    manager: 'bg-moss',
    event: 'bg-marigold',
    registration: 'bg-ink'
  };

  try {
    const stats = await adminFetch('/stats');

    document.getElementById('stat-users').textContent = stats.totalUsers;
    document.getElementById('stat-managers').textContent = stats.totalManagers;
    document.getElementById('stat-events').textContent = stats.totalEvents;
    document.getElementById('stat-registrations').textContent = stats.totalRegistrations;

    if (!stats.recentActivities.length) {
      activityEmpty.classList.remove('hidden');
    } else {
      activityList.innerHTML = stats.recentActivities.map((item) => `
        <div class="flex items-center gap-3 bg-paper rounded-lg shadow-sm px-4 py-3">
          <span class="w-2 h-2 rounded-full flex-shrink-0 ${ACTIVITY_DOT[item.type] || 'bg-ink'}"></span>
          <p class="text-sm flex-1">${escapeHtml(item.message)}</p>
          <span class="text-xs text-ink/50 flex-shrink-0">${formatDateTime(item.at)}</span>
        </div>`).join('');
    }
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
});
