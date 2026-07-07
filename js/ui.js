'use strict';

/**
 * @module ui
 * @description DOM manipulation module for the FIFA 2026 Smart Stadium app.
 * All DOM mutations use document.createElement and textContent exclusively.
 * Direct HTML string injection is strictly prohibited.
 */

/**
 * Internal message counter used to generate unique message IDs.
 * @type {number}
 */
let msgCounter = 0;

/**
 * UIController provides all DOM manipulation methods for the application.
 * It receives DOM element references via function parameters rather than
 * importing or caching them directly, keeping this module decoupled.
 * @type {Object}
 */
export const UIController = {
  /**
   * Appends a chat message to the given container securely using createElement.
   * @param {HTMLElement} chatContainer - The chat messages container element.
   * @param {string} sender - The message sender type ('user' or 'ai').
   * @param {string} text - The message text content.
   * @returns {string} The unique ID of the appended message div.
   */
  appendMessage(chatContainer, sender, text) {
    const id = 'msg-' + Date.now() + '-' + (++msgCounter);
    const div = document.createElement('div');
    div.className = `msg ${sender}`;
    div.id = id;

    const span = document.createElement('span');
    span.className = 'bubble';
    span.textContent = text;

    div.appendChild(span);
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return id;
  },

  /**
   * Updates an existing chat message's content securely.
   * Clears the element and re-creates the bubble span with new text.
   * @param {string} id - The message container element ID to update.
   * @param {string} text - The new message text content.
   * @returns {void}
   */
  updateMessage(id, text) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = '';
      const span = document.createElement('span');
      span.className = 'bubble';
      span.textContent = text;
      el.appendChild(span);
    }
  },

  /**
   * Updates the SVG schematic wayfinding map route path based on keyword matching.
   * @param {SVGPathElement} routePath - The SVG path element to update.
   * @param {string} query - The user's query text used for keyword matching.
   * @returns {void}
   */
  updateSchematicMap(routePath, query) {
    const text = query.toLowerCase();
    if (text.includes('food') || text.includes('eat')) {
      routePath.setAttribute('d', 'M 50 50 L 90 25');
    } else if (text.includes('gate') || text.includes('leave') || text.includes('exit')) {
      routePath.setAttribute('d', 'M 50 50 L 10 75');
    } else {
      routePath.setAttribute('d', '');
    }
  },

  /**
   * Renders a randomized crowd-density heatmap into the given container.
   * Creates heat-cell divs for each predefined stadium sector.
   * @param {HTMLElement} container - The heatmap grid container element.
   * @returns {void}
   */
  renderHeatmap(container) {
    container.textContent = '';
    const sectors = ['Sec A', 'Sec B', 'Sec C', 'Gate 1', 'Gate 2', 'Gate 3', 'VIP', 'Food E.'];
    sectors.forEach(s => {
      const div = document.createElement('div');
      const lvl = Math.floor(Math.random() * 3) + 1;
      div.className = `heat-cell level-${lvl}`;
      div.textContent = s;
      container.appendChild(div);
    });
  },

  /**
   * Displays the confirmation modal with the given message text.
   * @param {HTMLElement} modal - The modal container element.
   * @param {HTMLElement} messageEl - The element where the confirmation message is displayed.
   * @param {string} text - The confirmation message text to show.
   * @returns {void}
   */
  showConfirmModal(modal, messageEl, text) {
    messageEl.textContent = text;
    modal.classList.remove('hidden');
  },

  /**
   * Creates a styled alert item element with an execute button.
   * @param {string} response - The alert response text from the AI.
   * @returns {{container: HTMLDivElement, button: HTMLButtonElement}} The alert container div and its execute button.
   */
  createAlertItem(response) {
    const container = document.createElement('div');
    container.className = 'alert-item';

    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = 'GenAI Alert: ';
    p.appendChild(strong);
    p.appendChild(document.createTextNode(response));

    const button = document.createElement('button');
    button.className = 'btn btn-sm btn-danger';
    button.textContent = 'Execute Recommendation';

    container.appendChild(p);
    container.appendChild(button);

    return { container, button };
  }
};
