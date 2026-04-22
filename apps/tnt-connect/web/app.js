/**
 * TheNextTrade Connect — Frontend Logic
 * Communicates with Python backend via pywebview JS API bridge.
 */

let currentPeriodAccount = null;

// ─── Init ───
window.addEventListener('pywebviewready', async () => {
    const config = await pywebview.api.get_config();
    const version = await pywebview.api.get_version();

    document.getElementById('version').textContent = `v${version}`;
    document.getElementById('footerText').textContent = `v${version} • TheNextTrade.com`;

    if (config.api_key) {
        document.getElementById('apiKey').value = config.api_key;
    }
    if (config.api_base_url) {
        document.getElementById('settingsUrl').value = config.api_base_url;
    }
    if (config.mt5_path) {
        document.getElementById('settingsMt5Path').value = config.mt5_path;
    }
    if (config.sync_interval) {
        document.getElementById('settingsInterval').value = config.sync_interval;
    }

    // Auto-connect if key exists
    if (config.api_key) {
        handleConnect();
    }

    // Check for updates in background
    setTimeout(async () => {
        try { await pywebview.api.check_for_updates(); } catch(e) {}
    }, 3000);
});

// ─── Event Listeners ───
window.addEventListener('onStatusChanged', (e) => {
    const { status, message } = e.detail;
    updateStatus(status, message);
});

window.addEventListener('onAccountsUpdated', (e) => {
    const data = e.detail;
    renderAccounts(data.accounts, data.mt5Account, data.pausedAccounts || []);
});

window.addEventListener('onLog', (e) => {
    addLogEntry(e.detail.message);
});

window.addEventListener('onDisconnected', () => {
    document.getElementById('accountsList').innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📡</div>
            <p class="empty-title">Connect to see your accounts</p>
            <p class="empty-desc">Enter your API key and click Connect</p>
        </div>`;
    document.getElementById('accountsTitle').textContent = 'TRADING ACCOUNTS';
    updateConnectBtn('idle');
});

// ─── Update Events ───
window.addEventListener('onUpdateAvailable', (e) => {
    const { latestVersion, changelog } = e.detail;
    showUpdateBanner(latestVersion, changelog);
});

window.addEventListener('onUpdateProgress', (e) => {
    const bar = document.getElementById('updateProgressBar');
    if (bar) bar.style.width = `${e.detail.progress}%`;
    const pct = document.getElementById('updatePct');
    if (pct) pct.textContent = `${e.detail.progress}%`;
});

window.addEventListener('onUpdateComplete', (e) => {
    const banner = document.getElementById('updateBanner');
    if (!banner) return;
    if (e.detail.success) {
        banner.innerHTML = `<span class="update-text">✅ Update installed — restarting...</span>`;
    } else {
        banner.innerHTML = `<span class="update-text">❌ Update failed: ${e.detail.message}</span>`;
    }
});

function showUpdateBanner(version, changelog) {
    const existing = document.getElementById('updateBanner');
    if (existing) return; // already showing

    const banner = document.createElement('div');
    banner.id = 'updateBanner';
    banner.className = 'update-banner';
    banner.innerHTML = `
        <div class="update-info">
            <span class="update-text">🚀 v${version} available</span>
            <span class="update-changelog">${changelog}</span>
        </div>
        <div class="update-actions">
            <button class="update-btn" onclick="installUpdate()">Update</button>
            <button class="update-dismiss" onclick="this.closest('.update-banner').remove()">✕</button>
        </div>
    `;

    // Insert after topbar
    const topbar = document.querySelector('.topbar');
    topbar.insertAdjacentElement('afterend', banner);
}

async function installUpdate() {
    const btn = document.querySelector('.update-btn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Downloading...';
    }
    // Show progress bar
    const banner = document.getElementById('updateBanner');
    if (banner) {
        const actions = banner.querySelector('.update-actions');
        if (actions) {
            actions.innerHTML = `
                <div class="update-progress-wrap">
                    <div class="update-progress-track">
                        <div class="update-progress-bar" id="updateProgressBar"></div>
                    </div>
                    <span class="update-pct" id="updatePct">0%</span>
                </div>
            `;
        }
    }
    await pywebview.api.install_update();
}

// ─── Connection ───
async function handleConnect() {
    const key = document.getElementById('apiKey').value.trim();
    if (!key) { updateStatus('error', 'Enter your API Key first'); return; }

    const url = document.getElementById('settingsUrl')?.value || 'https://thenexttrade.com';
    updateConnectBtn('connecting');
    updateStatus('connecting', 'Detecting MT5 terminals...');

    // Step 1: Detect MT5 installations
    const mt5Info = await pywebview.api.detect_mt5();
    const installations = mt5Info.installations || [];
    const savedPath = mt5Info.savedPath || '';

    if (installations.length === 0) {
        updateStatus('error', 'No MT5 terminal found on this PC');
        updateConnectBtn('idle');
        return;
    }

    if (installations.length === 1) {
        // Only 1 MT5 → auto-connect
        await pywebview.api.connect(key, url, installations[0].path);
        return;
    }

    // 2+ MT5 → check if saved path still exists
    if (savedPath && installations.some(i => i.path === savedPath)) {
        await pywebview.api.connect(key, url, savedPath);
        return;
    }

    // Show selection modal
    showMt5SelectionModal(installations, key, url);
}

function showMt5SelectionModal(installations, apiKey, apiUrl) {
    updateConnectBtn('idle');
    updateStatus('warning', 'Multiple MT5 terminals found — please select one');

    const list = installations.map((inst, i) => `
        <label class="mt5-option">
            <input type="radio" name="mt5Selection" value="${inst.path}" ${i === 0 ? 'checked' : ''}>
            <div class="mt5-option-info">
                <span class="mt5-option-name">${inst.name}</span>
                <span class="mt5-option-path">${inst.path}</span>
            </div>
        </label>
    `).join('');

    document.getElementById('mt5SelectionList').innerHTML = list;
    document.getElementById('mt5SelectionModal').style.display = 'flex';

    // Store for the confirm handler
    window._mt5ConnectApiKey = apiKey;
    window._mt5ConnectApiUrl = apiUrl;
}

async function confirmMt5Selection() {
    const selected = document.querySelector('input[name="mt5Selection"]:checked');
    if (!selected) return;

    document.getElementById('mt5SelectionModal').style.display = 'none';
    updateConnectBtn('connecting');
    updateStatus('connecting', 'Connecting...');

    await pywebview.api.connect(window._mt5ConnectApiKey, window._mt5ConnectApiUrl, selected.value);
}

function closeMt5Selection() {
    document.getElementById('mt5SelectionModal').style.display = 'none';
    updateConnectBtn('idle');
    updateStatus('disconnected', 'Connection cancelled');
}

async function handleDisconnect() {
    await pywebview.api.disconnect();
}

async function refreshAccounts() {
    const btn = document.getElementById('refreshBtn');
    const svgIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0115.4-6.3L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 01-15.4 6.3L3 16"/></svg>`;
    btn.innerHTML = `⏳ Refreshing...`;
    btn.disabled = true;
    await pywebview.api.refresh_accounts();
    setTimeout(() => { btn.innerHTML = `${svgIcon} Refresh`; btn.disabled = false; }, 1000);
}

function updateConnectBtn(state) {
    const btn = document.getElementById('connectBtn');
    if (state === 'connecting') {
        btn.className = 'connect-btn connecting';
        btn.innerHTML = '<span class="connect-icon syncing-pulse">⏳</span> Connecting...';
        btn.disabled = true;
    } else if (state === 'connected') {
        btn.className = 'connect-btn connected';
        btn.innerHTML = '<span class="connect-icon">✓</span> Connected';
        btn.disabled = true;
    } else {
        btn.className = 'connect-btn';
        btn.innerHTML = '<span class="connect-icon">⚡</span> Connect';
        btn.disabled = false;
    }
}

function updateStatus(status, message) {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    dot.className = 'status-dot';

    const colorMap = { connected: 'green', synced: 'green', idle: 'green',
        connecting: 'yellow', syncing: 'yellow', warning: 'yellow',
        error: 'red', disconnected: '' };
    const c = colorMap[status] || '';
    if (c) dot.classList.add(c);
    text.textContent = message;
    text.style.color = c === 'green' ? '#00C888' : c === 'yellow' ? '#F59E0B' : c === 'red' ? '#EF4444' : '#6B7280';

    if (['connected', 'synced', 'idle'].includes(status)) updateConnectBtn('connected');
    else if (status === 'connecting') updateConnectBtn('connecting');
    else if (status === 'error') updateConnectBtn('idle');
}

// ─── Account Cards ───
function renderAccounts(accounts, mt5Account, pausedAccounts) {
    const container = document.getElementById('accountsList');
    const title = document.getElementById('accountsTitle');
    const badge = document.getElementById('mt5Badge');

    if (!accounts || accounts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <p class="empty-title">No accounts found</p>
                <p class="empty-desc">Add trading accounts on TheNextTrade web first</p>
            </div>`;
        return;
    }

    title.textContent = `TRADING ACCOUNTS (${accounts.length})`;

    if (mt5Account) {
        badge.style.display = '';
        badge.textContent = `MT5: #${mt5Account}`;
    }

    container.innerHTML = accounts.map(acct => {
        const num = String(acct.accountNumber || '');
        const broker = acct.broker || acct.name || 'Unknown';
        const server = acct.server || '';
        const balance = Number(acct.balance || 0);
        const equity = Number(acct.equity || 0);
        const isActive = num === mt5Account;
        const isPaused = pausedAccounts.includes(num);

        let state, badgeClass, badgeLabel;
        if (isPaused) { state = 'paused'; badgeClass = 'paused'; badgeLabel = 'PAUSED'; }
        else if (isActive) { state = 'active'; badgeClass = 'online'; badgeLabel = 'ONLINE'; }
        else { state = 'offline'; badgeClass = 'offline'; badgeLabel = 'OFFLINE'; }

        let actions = '';
        if (state === 'active') {
            actions = `
                <div class="card-actions">
                    <span class="status-badge ${badgeClass}"><span class="dot" style="background:currentColor"></span> ${badgeLabel}</span>
                    <button class="card-btn outline" onclick="syncAccount('${num}')">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0115.4-6.3L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 01-15.4 6.3L3 16"/></svg>
                        Sync
                    </button>
                    <button class="card-btn outline" onclick="openPeriodModal('${num}')">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        Period
                    </button>
                    <button class="card-btn pause" onclick="pauseAccount('${num}', true)">⏸ Pause</button>
                </div>`;
        } else if (state === 'paused') {
            actions = `
                <div class="card-actions">
                    <span class="status-badge ${badgeClass}"><span class="dot" style="background:currentColor"></span> ${badgeLabel}</span>
                    <button class="card-btn resume" onclick="pauseAccount('${num}', false)">▶ Resume</button>
                </div>`;
        } else {
            actions = `
                <div class="card-actions">
                    <span class="status-badge ${badgeClass}"><span class="dot" style="background:currentColor"></span> ${badgeLabel}</span>
                </div>`;
        }

        return `
            <div class="account-card ${isActive ? 'active' : ''}">
                <div class="card-row1">
                    <div>
                        <span class="card-acct">#${num}</span>
                        <span class="card-broker">${broker}</span>
                    </div>
                </div>
                <div class="card-server">${server}</div>
                <div class="card-stats">
                    <div>
                        <div class="card-stat-label">Balance</div>
                        <div class="card-stat-value">$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                        <div class="card-stat-label">Equity</div>
                        <div class="card-stat-value">$${equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>
                </div>
                ${actions}
            </div>`;
    }).join('');
}

// ─── Account Actions ───
async function syncAccount(num) {
    await pywebview.api.sync_account(num);
}

async function pauseAccount(num, pause) {
    await pywebview.api.pause_account(num, pause);
}

function openPeriodModal(num) {
    currentPeriodAccount = num;
    document.getElementById('periodModal').style.display = 'flex';

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    document.getElementById('periodFrom').value = weekAgo;
    document.getElementById('periodTo').value = today;
}

function closePeriodModal() {
    document.getElementById('periodModal').style.display = 'none';
    currentPeriodAccount = null;
}

async function selectPeriod(period) {
    if (!currentPeriodAccount) return;
    await pywebview.api.sync_period(currentPeriodAccount, period, '', '');
    closePeriodModal();
}

async function selectCustomPeriod() {
    if (!currentPeriodAccount) return;
    const from = document.getElementById('periodFrom').value;
    const to = document.getElementById('periodTo').value;
    if (!from || !to) return;
    await pywebview.api.sync_period(currentPeriodAccount, 'CUSTOM', from, to);
    closePeriodModal();
}

// ─── Sync Log ───
function addLogEntry(message) {
    const panel = document.getElementById('logPanel');
    const empty = panel.querySelector('.log-empty');
    if (empty) empty.remove();

    const line = document.createElement('div');
    line.textContent = message;
    panel.appendChild(line);
    panel.scrollTop = panel.scrollHeight;

    // Keep max 100 lines
    while (panel.children.length > 100) panel.removeChild(panel.firstChild);
}

function clearLog() {
    document.getElementById('logPanel').innerHTML = '<div class="log-empty">Waiting for activity...</div>';
}

// ─── Settings ───
function openSettings() {
    document.getElementById('settingsModal').style.display = 'flex';
}
function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

async function browseMt5() {
    const path = await pywebview.api.browse_mt5_path();
    if (path) document.getElementById('settingsMt5Path').value = path;
}

async function saveSettings() {
    const config = {
        api_base_url: document.getElementById('settingsUrl').value.trim(),
        mt5_path: document.getElementById('settingsMt5Path').value.trim(),
        sync_interval: parseInt(document.getElementById('settingsInterval').value) || 10,
    };
    await pywebview.api.save_config(JSON.stringify(config));
    closeSettings();
}

// ─── Utils ───
function toggleKeyVisibility() {
    const input = document.getElementById('apiKey');
    input.type = input.type === 'password' ? 'text' : 'password';
}

function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    localStorage.setItem('tnt-theme', next);
    updateThemeIcons(next);
}

function updateThemeIcons(theme) {
    const moon = document.querySelector('.icon-moon');
    const sun = document.querySelector('.icon-sun');
    if (moon && sun) {
        moon.style.display = theme === 'light' ? 'none' : '';
        sun.style.display = theme === 'light' ? '' : 'none';
    }
}

// Apply saved theme on load
(function() {
    const saved = localStorage.getItem('tnt-theme') || 'light';
    if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    // Icons will be updated after DOM ready
    document.addEventListener('DOMContentLoaded', () => updateThemeIcons(saved));
})();

async function openDashboard() {
    await pywebview.api.open_dashboard();
}

async function minimizeToTray() {
    await pywebview.api.minimize_to_tray();
}

// Close modals on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
    }
});
