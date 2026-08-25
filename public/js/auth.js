// Drives both login.html and register.html for either role (user
// or event manager), talking to the JSON API defined in server.js.
// One form, one script — the only thing that changes per role is
// which endpoint gets called.

const API_BASE = '/api';

function getSelectedRole() {
  const active = document.querySelector('.role-tab.active');
  return active ? active.dataset.role : 'user';
}

function setupRoleTabs() {
  const tabs = document.querySelectorAll('.role-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active', 'bg-ember', 'text-white'));
      tab.classList.add('active', 'bg-ember', 'text-white');
    });
  });
}

function showMessage(el, text, isError) {
  el.textContent = text;
  el.classList.remove('hidden');
  el.classList.toggle('text-red-600', isError);
  el.classList.toggle('text-moss', !isError);
}

async function handleAuthSubmit(e, endpointSuffix, buildBody) {
  e.preventDefault();
  const role = getSelectedRole();               // 'user' or 'manager'
  const messageEl = document.getElementById('form-message');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalLabel = submitBtn.textContent;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Please wait...';

  try {
    // role + 's' turns 'user' -> 'users' and 'manager' -> 'managers',
    // matching the two route prefixes mounted in server.js.
    const response = await fetch(`${API_BASE}/${role}s/${endpointSuffix}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildBody())
    });
    const data = await response.json();

    if (!response.ok) {
      showMessage(messageEl, data.message || 'Something went wrong', true);
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('role', role);
    localStorage.setItem('fullName', data.user.fullName);
    // Added for the Admin System: only the destination changes per
    // role. Users and managers still land on '/index.html' exactly
    // as before.
    window.location.href = role === 'admin' ? '/admin-dashboard.html' : '/index.html';
  } catch (err) {
    showMessage(messageEl, 'Could not reach the server. Is it running?', true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupRoleTabs();

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) =>
      handleAuthSubmit(e, 'login', () => ({
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value
      }))
    );
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      const password = document.getElementById('password').value;
      const confirm = document.getElementById('confirm-password').value;
      if (password !== confirm) {
        e.preventDefault();
        showMessage(document.getElementById('form-message'), 'Passwords do not match', true);
        return;
      }
      handleAuthSubmit(e, 'register', () => ({
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        password
      }));
    });
  }
});
