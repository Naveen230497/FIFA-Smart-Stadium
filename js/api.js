/**
 * @module api
 * @description API communication and mock data layer for the FIFA 2026 Smart Stadium app.
 * Handles all external API calls and provides multi-language mock responses for demo mode.
 */

/**
 * Securely calls the serverless proxy API to get an AI response.
 * @param {string} prompt - The prompt payload to send to the AI.
 * @param {string} [mode='fan'] - The mode of the AI ('fan' or 'staff').
 * @param {string} [lang='en'] - The language of the response.
 * @returns {Promise<string>} The AI response text content.
 * @throws {Error} If the proxy API returns a non-OK status.
 */
export async function callProxyAPI(prompt, mode = 'fan', lang = 'en') {
  const url = '/api/chat';
  const payload = { prompt, mode, lang };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    let errText = '';
    try {
      const errJson = await res.json();
      errText = errJson.error || errJson.message;
    } catch (e) {
      console.warn('Could not parse JSON error response', e);
      errText = await res.text();
    }
    throw new Error(`Proxy API returned ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

/**
 * Multi-language mock response lookup table.
 * Each key is a language code; each value contains keyword-based response maps.
 * @type {Object<string, {food: string, gate: string, default: string}>}
 */
const MOCK_RESPONSES = {
  en: {
    food: 'There are fantastic food concessions located at the East Gate. Please refer to the Schematic Wayfinding map on your screen to see the route!',
    gate: 'The nearest egress point is the West Gate. Check the Schematic Wayfinding map for a highlighted route to safety.',
    default: 'Welcome to the FIFA 2026 Smart Stadium! I can help you find food, navigate to your seats, or locate the nearest gates. How can I assist you?'
  },
  es: {
    food: 'Hay fantásticos puestos de comida en la Puerta Este. ¡Consulta el mapa de orientación en tu pantalla para ver la ruta!',
    gate: 'El punto de salida más cercano es la Puerta Oeste. Consulta el mapa de orientación para ver la ruta segura.',
    default: '¡Bienvenido al Estadio Inteligente FIFA 2026! Puedo ayudarte a encontrar comida, navegar a tu asiento o localizar las puertas más cercanas.'
  },
  fr: {
    food: 'Il y a de fantastiques stands de restauration à la Porte Est. Consultez la carte de navigation sur votre écran pour voir le chemin !',
    gate: 'Le point de sortie le plus proche est la Porte Ouest. Consultez la carte de navigation pour voir l\'itinéraire sécurisé.',
    default: 'Bienvenue au Stade Intelligent FIFA 2026 ! Je peux vous aider à trouver de la nourriture, naviguer vers votre siège ou localiser les portes les plus proches.'
  }
};

/**
 * Returns a mock AI response for Fan mode based on keyword matching.
 * Supports multiple languages: English ('en'), Spanish ('es'), and French ('fr').
 * @param {string} text - The user's query text.
 * @param {string} [lang='en'] - Language code ('en', 'es', or 'fr').
 * @returns {string} The simulated AI response in the requested language.
 */
export function getMockFanResponse(text, lang = 'en') {
  const lower = text.toLowerCase();
  const responses = MOCK_RESPONSES[lang] || MOCK_RESPONSES.en;

  if (lower.includes('food') || lower.includes('eat') || lower.includes('hungry')) {
    return responses.food;
  }
  if (lower.includes('gate') || lower.includes('exit') || lower.includes('leave')) {
    return responses.gate;
  }
  return responses.default;
}

/**
 * Returns a hardcoded operational alert string for Staff mode demo.
 * @returns {string} A mock staff alert recommendation.
 */
export function getMockStaffAlert() {
  return 'Sector 4 is nearing capacity; recommend opening emergency egress Gate B to relieve congestion immediately.';
}
