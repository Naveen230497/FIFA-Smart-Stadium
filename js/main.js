'use strict';

/**
 * @module main
 * @description Entry point and event routing for the FIFA 2026 Smart Stadium app.
 * Imports the API and UI modules, caches DOM elements, binds events,
 * and orchestrates all user interactions including multi-language support.
 */

import { callProxyAPI, getMockFanResponse, getMockStaffAlert } from './api.js';
import { UIController } from './ui.js';

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

  langSelect: document.getElementById('lang-select')
};

/**
 * Stores the callback for the currently pending confirmation action.
 * @type {Function|null}
 */
let activeActionCallback = null;

/**
 * When true, the app uses local mock responses instead of calling the proxy API.
 * @type {boolean}
 */
let useMock = false;

/**
 * Maps language codes to their full human-readable names for API prompts.
 * @type {Object<string, string>}
 */
const LANG_NAMES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French'
};

/**
 * Initializes the application: binds events, renders initial UI, and sets fan mode active.
 * @returns {void}
 */
function init() {
  bindEvents();
  UIController.renderHeatmap(els.heatmapGrid);
  switchMode('fan');
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

  UIController.appendMessage(els.chatMessages, 'user', text);
  els.chatInput.value = '';

  const loaderId = UIController.appendMessage(
    els.chatMessages,
    'ai',
    useMock ? 'Demo Mode Active. Simulating AI...' : 'Thinking...'
  );
  UIController.updateSchematicMap(els.routePath, text);

  const lang = els.langSelect ? els.langSelect.value : 'en';
  const langName = LANG_NAMES[lang] || 'English';

  try {
    let response;
    if (useMock) {
      response = getMockFanResponse(text, lang);
      await new Promise(r => setTimeout(r, 800));
    } else {
      response = await callProxyAPI(
        `You are the official FIFA 2026 Smart Stadium Assistant. You MUST respond entirely in ${langName}. If the user asks for directions, food, or gates, tell them to look at the "Schematic Wayfinding" map on their screen. Keep responses under 2 sentences. The user asks: ${text}`
      );
    }
    UIController.updateMessage(loaderId, response);
  } catch (err) {
    UIController.updateMessage(loaderId, `Error communicating with AI: ${err.message}`);
  }
}

/**
 * Triggers the GenAI Decision Support pipeline in Staff Mode.
 * Refreshes the heatmap, fetches an AI alert (or mock), and renders
 * an actionable alert item with a confirmation flow.
 * @returns {Promise<void>}
 */
async function generateAIAlert() {
  UIController.renderHeatmap(els.heatmapGrid);
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
      response = await callProxyAPI(
        'Act as an operational AI for FIFA 2026. Generate a 1-sentence urgent crowd management alert recommending opening a specific emergency gate due to congestion. Format it as an actionable alert.'
      );
    }

    els.alertsList.textContent = '';

    const { container, button } = UIController.createAlertItem(response);
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
  UIController.showConfirmModal(
    els.modalConfirm,
    els.confirmMessage,
    `Are you absolutely sure you want to execute the following operational command?\n\n"${actionContext}"`
  );
}

document.addEventListener('DOMContentLoaded', init);
