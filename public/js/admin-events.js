// Admin > Events: list/search/view/delete. Unlike a manager deleting
// their own event (controllers/eventController.js), the admin delete
// route has no ownership check — an admin can remove any event.

let allEvents = [];

function renderEventsTable(events) {
  const tbody = document.getElementById('events-table-body');
  const emptyState = document.getElementById('empty-state');

  if (!events.length) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  tbody.innerHTML = events.map((e) => `
    <tr class="border-b border-ink/5 last:border-0">
      <td class="px-4 py-3 font-medium">${escapeHtml(e.title)}</td>
      <td class="px-4 py-3 text-ink/70">${escapeHtml(e.category)}</td>
      <td class="px-4 py-3 text-ink/70">${formatDateTime(e.event_date)}</td>
      <td class="px-4 py-3 text-ink/70">${escapeHtml(e.manager_name)}</td>
      <td class="px-4 py-3 text-right whitespace-nowrap">
        <button data-view="${e.event_id}" class="px-3 py-1.5 text-xs rounded-full border-2 border-moss text-moss hover:bg-moss hover:text-white transition-colors">View</button>
        <button data-delete="${e.event_id}" class="ml-2 px-3 py-1.5 text-xs rounded-full border-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white transition-colors">Delete</button>
      </td>
    </tr>`).join('');
}

async function loadEvents(search) {
  const errorEl = document.getElementById('error-message');
  errorEl.classList.add('hidden');
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    allEvents = await adminFetch(`/events${query}`);
    renderEventsTable(allEvents);
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
}

function openEventDetail(event) {
  const price = Number(event.ticket_price);
  document.getElementById('detail-content').innerHTML = `
    <p><span class="font-medium">Title:</span> ${escapeHtml(event.title)}</p>
    <p><span class="font-medium">Category:</span> ${escapeHtml(event.category)}</p>
    <p><span class="font-medium">Date:</span> ${formatDateTime(event.event_date)} at ${escapeHtml(String(event.event_time).slice(0, 5))}</p>
    <p><span class="font-medium">Location:</span> ${escapeHtml(event.location)}</p>
    <p><span class="font-medium">Organizer:</span> ${escapeHtml(event.organizer)}</p>
    <p><span class="font-medium">Manager:</span> ${escapeHtml(event.manager_name)}</p>
    <p><span class="font-medium">Price:</span> ${price === 0 ? 'Free' : `$${price}`}</p>
    <p><span class="font-medium">Capacity:</span> ${event.registered_count ?? 0} / ${event.max_participants}</p>
    <p><span class="font-medium">Description:</span> ${escapeHtml(event.description || '—')}</p>`;
  document.getElementById('detail-modal').classList.remove('hidden');
}

async function deleteEvent(eventId) {
  if (!confirm('Delete this event? This also removes all of its registrations.')) return;
  try {
    await adminFetch(`/events/${eventId}`, { method: 'DELETE' });
    allEvents = allEvents.filter((e) => e.event_id !== Number(eventId));
    renderEventsTable(allEvents);
  } catch (err) {
    document.getElementById('error-message').textContent = err.message;
    document.getElementById('error-message').classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderAdminNav('/admin-events.html');
  loadEvents();

  let searchTimer;
  document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadEvents(e.target.value.trim()), 300);
  });

  document.getElementById('events-table-body').addEventListener('click', async (e) => {
    const viewId = e.target.dataset.view;
    const deleteId = e.target.dataset.delete;
    if (viewId) {
      try {
        const event = await adminFetch(`/events/${viewId}`);
        openEventDetail(event);
      } catch (err) {
        document.getElementById('error-message').textContent = err.message;
        document.getElementById('error-message').classList.remove('hidden');
      }
    }
    if (deleteId) deleteEvent(deleteId);
  });

  document.getElementById('detail-close-btn').addEventListener('click', () => {
    document.getElementById('detail-modal').classList.add('hidden');
  });
});
