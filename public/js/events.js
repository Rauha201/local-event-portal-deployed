// Browse Events page. Loads the full event list once (reusing
// fetchEvents() from main.js, which already falls back to sample
// data if the API is unreachable), then filters it client-side —
// simplest possible approach for a dataset this size, and it means
// zero extra network round trips while typing in the search box.

let allEvents = [];

function readCategoryFromURL() {
  return new URLSearchParams(window.location.search).get('category') || '';
}

function applyFilters() {
  const query = document.getElementById('search-input').value.trim().toLowerCase();
  const category = document.getElementById('category-filter').value;

  const filtered = allEvents.filter((event) => {
    const matchesTitle = event.title.toLowerCase().includes(query);
    const matchesCategory = !category || event.category === category;
    return matchesTitle && matchesCategory;
  });

  const resultsEl = document.getElementById('results');
  const countEl = document.getElementById('results-count');

  resultsEl.innerHTML = filtered.length === 0
    ? '<p class="col-span-full text-center text-ink/60 py-12">No events match your search.</p>'
    : filtered.map(createEventCard).join('');

  countEl.textContent = `${filtered.length} event${filtered.length === 1 ? '' : 's'} found`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const categoryFromURL = readCategoryFromURL();
  if (categoryFromURL) document.getElementById('category-filter').value = categoryFromURL;

  allEvents = await fetchEvents();
  applyFilters();

  document.getElementById('search-input').addEventListener('input', applyFilters);
  document.getElementById('category-filter').addEventListener('change', applyFilters);
});
