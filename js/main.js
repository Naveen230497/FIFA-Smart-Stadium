/**
 * @module main
 * @description Entry point and event routing for the FIFA 2026 Smart Stadium app.
 * Imports the API and UI modules, caches DOM elements, binds events,
 * and orchestrates all user interactions including multi-language support.
 */

import { callProxyAPI, getMockFanResponse, getMockStaffAlert } from './api.js';
import { UIController } from './ui.js';
import { i18n } from './i18n.js';

const ui = new UIController();

/**
 * Cached DOM element references for the entire application.
 * @type {Object<string, HTMLElement>}
 */
const els = {
  btnFan: document.getElementById('btn-mode-fan'),
  btnStaff: document.getElementById('btn-mode-staff'),
  btnSettings: document.getElementById('btn-settings'),
  fanMode: document.getElementById('fan-mode'),
  staffMode: document.getElementById('staff-mode'),

  chatForm: document.getElementById('chat-form'),
  chatInput: document.getElementById('chat-input'),
  chatMessages: document.getElementById('chat-messages'),
  routePath: document.getElementById('route-path'),

  heatmapGrid: document.getElementById('heatmap-grid'),
  btnSimAlert: document.getElementById('btn-sim-alert'),
  alertsList: document.getElementById('alerts-list'),

  modalConfirm: document.getElementById('modal-confirm'),
  confirmMessage: document.getElementById('confirm-message'),
  btnCancelAction: document.getElementById('btn-cancel-action'),
  btnConfirmAction: document.getElementById('btn-confirm-action'),

  langSelect: document.getElementById('lang-select'),
  csvUpload: document.getElementById('csv-upload')
};

/**
 * Stores the currently uploaded custom telemetry data.
 * @type {Array<{sector: string, level: number}>|null}
 */
let currentTelemetryData = null;

/**
 * Stores the callback for the currently pending confirmation action.
 * @type {Function|null}
 */
let activeActionCallback = null;

/**
 * When true, the app uses local mock responses instead of calling the proxy API.
 * @type {boolean}
 */
const useMock = false;



/**
 * Initializes the application: binds events, renders initial UI, and sets fan mode active.
 * @returns {void}
 */
function init() {
  bindEvents();
  ui.renderHeatmap(els.heatmapGrid, currentTelemetryData);
  switchMode('fan');
  if (els.langSelect) {
    updateUITranslation(els.langSelect.value);
  }
}

/**
 * Binds all DOM event listeners for mode switching, chat, alerts, and confirmation modal.
 * @returns {void}
 */
function bindEvents() {
  els.btnFan.addEventListener('click', () => switchMode('fan'));
  els.btnStaff.addEventListener('click', () => switchMode('staff'));

  els.btnSettings.addEventListener('click', () => {
    alert('API Configuration is now managed securely on the server via Environment Variables (Vercel/Node).');
  });

  if (els.csvUpload) {
    els.csvUpload.addEventListener('change', handleCsvUpload);
  }

  if (els.langSelect) {
    els.langSelect.addEventListener('change', (e) => {
      updateUITranslation(e.target.value);
    });
  }

  els.chatForm.addEventListener('submit', handleChatSubmit);
  els.btnSimAlert.addEventListener('click', generateAIAlert);

  els.btnCancelAction.addEventListener('click', () => {
    els.modalConfirm.classList.add('hidden');
    activeActionCallback = null;
  });

  els.btnConfirmAction.addEventListener('click', () => {
    if (activeActionCallback) { activeActionCallback(); }
    els.modalConfirm.classList.add('hidden');
    activeActionCallback = null;
  });
}

/**
 * Switches the UI between Fan and Staff modes.
 * @param {string} mode - The mode to switch to ('fan' or 'staff').
 * @returns {void}
 */
function switchMode(mode) {
  if (mode === 'fan') {
    els.fanMode.classList.add('active');
    els.fanMode.classList.remove('hidden');
    els.staffMode.classList.remove('active');
    els.staffMode.classList.add('hidden');
  } else {
    els.staffMode.classList.add('active');
    els.staffMode.classList.remove('hidden');
    els.fanMode.classList.remove('active');
    els.fanMode.classList.add('hidden');
  }
  updateHeaderMode(mode);
}

/**
 * Updates static UI elements based on the selected language.
 * Uses direct DOM selectors (IDs and CSS classes) for maximum compatibility.
 * @param {string} lang - The language code (e.g., 'en', 'es', 'fr').
 */
function updateUITranslation(lang) {
  const dict = i18n[lang] || i18n.en;

  // Header
  const appTitle = document.querySelector('.header-logo h1');
  if (appTitle) { appTitle.textContent = dict.appTitle; }
  if (els.btnFan) { els.btnFan.textContent = dict.btnFan; }
  if (els.btnStaff) { els.btnStaff.textContent = dict.btnStaff; }
  if (els.btnSettings) { els.btnSettings.textContent = dict.btnSettings; }

  // Chat section
  const chatTitle = document.getElementById('chat-title');
  if (chatTitle) { chatTitle.textContent = dict.chatTitle; }
  const chatSubtitle = document.querySelector('#chat-title + .subtitle, .chat-container .subtitle');
  if (chatSubtitle) { chatSubtitle.textContent = dict.chatSubtitle; }
  if (els.chatInput) { els.chatInput.placeholder = dict.chatPlaceholder; }
  const sendBtn = document.querySelector('#chat-form button[type="submit"]');
  if (sendBtn) { sendBtn.textContent = dict.btnSend; }

  // Wayfinding section
  const wayfindingTitle = document.getElementById('wayfinding-title');
  if (wayfindingTitle) { wayfindingTitle.textContent = dict.wayfindingTitle; }
  const wayfindingSub = document.querySelector('.map-container .subtitle');
  if (wayfindingSub) { wayfindingSub.textContent = dict.wayfindingSubtitle; }

  // Map zones
  const zoneMap = { N: 'zoneNorth', S: 'zoneSouth', E: 'zoneEast', W: 'zoneWest' };
  document.querySelectorAll('.map-zone').forEach(zone => {
    const key = zoneMap[zone.getAttribute('data-zone')];
    if (key && dict[key]) { zone.textContent = dict[key]; }
  });

  // Transit section
  const transitTitle = document.getElementById('transit-title');
  if (transitTitle) { transitTitle.textContent = dict.transitTitle; }
  const transitSub = document.querySelector('.transit-container .subtitle');
  if (transitSub) { transitSub.textContent = dict.transitSubtitle; }

  // Transit items
  const routes = document.querySelectorAll('.transit-route');
  const dests = document.querySelectorAll('.transit-dest');
  const times = document.querySelectorAll('.transit-time');
  if (routes[0]) { routes[0].textContent = dict.routeRed; }
  if (dests[0]) { dests[0].textContent = dict.destCity; }
  if (routes[1]) { routes[1].textContent = dict.routeBlue; }
  if (dests[1]) { dests[1].textContent = dict.destStation; }
  if (routes[2]) { routes[2].textContent = dict.routeGreen; }
  if (dests[2]) { dests[2].textContent = dict.destWestGate; }
  if (times[2]) { times[2].textContent = dict.timeActive; }
}

/**
 * Updates the header button styles to reflect the currently active mode.
 * @param {string} mode - The active mode ('fan' or 'staff').
 * @returns {void}
 */
function updateHeaderMode(mode) {
  if (mode === 'fan') {
    els.btnFan.classList.remove('btn-outline');
    els.btnFan.classList.add('btn-primary');
    els.btnStaff.classList.remove('btn-primary');
    els.btnStaff.classList.add('btn-outline');
  } else {
    els.btnStaff.classList.remove('btn-outline');
    els.btnStaff.classList.add('btn-primary');
    els.btnFan.classList.remove('btn-primary');
    els.btnFan.classList.add('btn-outline');
  }
}

/**
 * Sanitizes user input by stripping dangerous characters and truncating length.
 * @param {string} str - The raw input string.
 * @returns {string} The sanitized string, max 500 characters.
 */
function sanitizeInput(str) {
  return String(str).replace(/[<>"'`&\\]/g, '').trim().slice(0, 500);
}

/**
 * Parses uploaded CSV telemetry data and updates the heatmap.
 * @param {Event} e - The file input change event.
 */
function handleCsvUpload(e) {
  const file = e.target.files[0];
  if (!file) { return; }
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      const parsedData = [];
      lines.forEach((line, index) => {
        if (index === 0 && line.toLowerCase().includes('sector')) { return; } // skip header
        const parts = line.split(',');
        if (parts.length >= 2) {
          parsedData.push({ sector: sanitizeInput(parts[0]), level: parseInt(parts[1].trim(), 10) || 1 });
        }
      });
      if (parsedData.length > 0) {
        currentTelemetryData = parsedData;
        ui.renderHeatmap(els.heatmapGrid, currentTelemetryData);
      }
    } catch (err) {
      console.error('Error parsing CSV', err);
    }
  };
  reader.readAsText(file);
}

/**
 * Escapes HTML entities in a string to prevent injection.
 * @param {string} str - The raw input string.
 * @returns {string} The escaped string with HTML entities replaced.
 */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Handles user chat form submission. Sends the query to the AI (or mock)
 * and updates the chat and schematic map with the response.
 * Supports multi-language responses via the language selector.
 * @param {Event} e - The form submit event.
 * @returns {Promise<void>}
 */
async function handleChatSubmit(e) {
  e.preventDefault();
  const text = sanitizeInput(els.chatInput.value);
  if (!text) { return; }

  ui.appendMessage(els.chatMessages, 'user', text);
  els.chatInput.value = '';

  const loaderId = ui.appendMessage(
    els.chatMessages,
    'ai',
    useMock ? 'Demo Mode Active. Simulating AI...' : 'Thinking...'
  );
  ui.updateSchematicMap(els.routePath, text);

  const lang = els.langSelect ? els.langSelect.value : 'en';

  try {
    let response;
    if (useMock) {
      response = getMockFanResponse(text, lang);
      await new Promise(r => setTimeout(r, 800));
    } else {
      response = await callProxyAPI(text, 'fan', lang);
    }
    ui.updateMessage(loaderId, response);
  } catch (err) {
    ui.updateMessage(loaderId, `Error communicating with AI: ${err.message}`);
  }
}

/**
 * Triggers the GenAI Decision Support pipeline in Staff Mode.
 * Refreshes the heatmap, fetches an AI alert (or mock), and renders
 * an actionable alert item with a confirmation flow.
 * @returns {Promise<void>}
 */
async function generateAIAlert() {
  ui.renderHeatmap(els.heatmapGrid, currentTelemetryData);
  els.alertsList.textContent = '';

  const loadingState = document.createElement('div');
  loadingState.className = 'alert-item empty-state';
  loadingState.textContent = useMock
    ? 'Demo Mode: Analyzing stadium telemetry...'
    : 'Analyzing stadium telemetry...';
  els.alertsList.appendChild(loadingState);

  try {
    let response;
    if (useMock) {
      response = getMockStaffAlert();
      await new Promise(r => setTimeout(r, 1000));
    } else {
      // In staff mode, the prompt payload is empty because the backend handles the generation
      response = await callProxyAPI('Generate operational alert.', 'staff', 'en');
    }

    els.alertsList.textContent = '';

    const { container, button } = ui.createAlertItem(response);
    els.alertsList.appendChild(container);

    button.addEventListener('click', () => {
      requireConfirmation(response, () => {
        button.textContent = 'Action Executed';
        button.disabled = true;
        button.classList.replace('btn-danger', 'btn-outline');
      });
    });
  } catch (err) {
    els.alertsList.textContent = '';
    const errorState = document.createElement('div');
    errorState.className = 'alert-item empty-state';
    errorState.style.color = 'red';
    errorState.textContent = `AI Error: ${err.message}`;
    els.alertsList.appendChild(errorState);
  }
}

/**
 * Initiates the Maker-Checker safety confirmation flow.
 * Shows a modal asking the user to confirm an operational command.
 * @param {string} actionContext - The context string describing the action.
 * @param {Function} callback - The function to execute if the user confirms.
 * @returns {void}
 */
function requireConfirmation(actionContext, callback) {
  activeActionCallback = callback;
  ui.showConfirmModal(
    els.modalConfirm,
    els.confirmMessage,
    `Are you absolutely sure you want to execute the following operational command?\n\n"${actionContext}"`
  );
}

document.addEventListener('DOMContentLoaded', init);
