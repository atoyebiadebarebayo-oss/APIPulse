let history = JSON.parse(localStorage.getItem('apiPulseHistory')) || [];

// Tab Switcher
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// Render Request History
function renderHistory() {
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';

  history.slice(0, 10).forEach(item => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML = `
      <span class="method-tag method-${item.method}">${item.method}</span>
      <span class="history-url">${item.url}</span>
    `;
    li.addEventListener('click', () => {
      document.getElementById('httpMethod').value = item.method;
      document.getElementById('apiUrl').value = item.url;
    });
    historyList.appendChild(li);
  });
}

// Clear History
document.getElementById('clearHistoryBtn').addEventListener('click', () => {
  history = [];
  localStorage.removeItem('apiPulseHistory');
  renderHistory();
});

// Send API Request
document.getElementById('apiForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const method = document.getElementById('httpMethod').value;
  const url = document.getElementById('apiUrl').value.trim();
  const rawHeaders = document.getElementById('requestHeaders').value.trim();
  const rawBody = document.getElementById('requestBody').value.trim();

  const responseOutput = document.getElementById('responseOutput');
  const statusBadge = document.getElementById('statusBadge');
  const timeBadge = document.getElementById('timeBadge');

  responseOutput.textContent = 'Sending request...';
  statusBadge.textContent = 'Status: Sending...';
  statusBadge.className = 'status-badge';

  let headers = {};
  if (rawHeaders) {
    try {
      headers = JSON.parse(rawHeaders);
    } catch (err) {
      alert('Invalid JSON format in Headers input.');
      return;
    }
  }

  const options = { method, headers };

  if (['POST', 'PUT', 'PATCH'].includes(method) && rawBody) {
    try {
      options.body = JSON.stringify(JSON.parse(rawBody));
      if (!headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
      }
    } catch (err) {
      alert('Invalid JSON format in Request Body.');
      return;
    }
  }

  const startTime = performance.now();

  try {
    const res = await fetch(url, options);
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    const statusText = `${res.status} ${res.statusText}`;
    statusBadge.textContent = `Status: ${statusText}`;
    statusBadge.className = `status-badge ${res.ok ? 'status-success' : 'status-error'}`;
    timeBadge.textContent = `Time: ${duration} ms`;

    const contentType = res.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
      responseOutput.textContent = JSON.stringify(data, null, 2);
    } else {
      data = await res.text();
      responseOutput.textContent = data;
    }

    // Save to history
    history.unshift({ method, url });
    localStorage.setItem('apiPulseHistory', JSON.stringify(history));
    renderHistory();

  } catch (error) {
    const endTime = performance.now();
    statusBadge.textContent = 'Status: Error';
    statusBadge.className = 'status-badge status-error';
    timeBadge.textContent = `Time: ${Math.round(endTime - startTime)} ms`;
    responseOutput.textContent = `Fetch Error: ${error.message}\n\nNote: If testing cross-origin APIs, ensure CORS is enabled on the target server.`;
  }
});

// Initial Load
window.addEventListener('DOMContentLoaded', () => {
  renderHistory();
});