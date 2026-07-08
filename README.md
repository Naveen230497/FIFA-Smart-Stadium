# 🏆 FIFA Connect 2026: Smart Stadium Operations Platform

**PromptWars Hackathon Solution** — A comprehensive, real-time operational intelligence and fan experience platform designed to manage the complexity of an 80,000-person stadium using Generative AI.

[![Live Deployment](https://img.shields.io/badge/Live-Deployment-success?style=for-the-badge&logo=vercel)](https://fifa-smart-stadium-two.vercel.app/)

---

## 🎯 Problem Statement Alignment

This platform was meticulously architected to address the core challenges of the FIFA 2026 World Cup:

1. **Dynamic Crowd Management:** 
   - **Feature:** Real-Time Operational Heatmaps & AI Decision Support.
   - **How it works:** Staff Mode ingests simulated telemetry data to render a live crowd heatmap. The GenAI proxy analyzes this density and autonomously generates "Maker-Checker" emergency egress recommendations to prevent crowd crushes.
2. **Multi-Language Assistance:**
   - **Feature:** Native GenAI Translation Hub.
   - **How it works:** Fans can select their native language (English, Spanish, French). This constraint is securely injected into the Llama-3.1-8b system prompt on the serverless backend, guaranteeing native-quality AI responses for international fans.
3. **Smart Indoor Navigation & Transportation:**
   - **Feature:** Schematic Wayfinding & Transit Hub.
   - **How it works:** Natural language queries to the AI (e.g., "Where is food?") dynamically update the SVG Schematic Pitch map with highlighted routes. A real-time transit schedule helps disperse the crowd efficiently post-match.
4. **Accessibility (A11y):**
   - **Feature:** 100/100 WCAG Compliance.
   - **How it works:** Zero `.innerHTML` usage (XSS immunity). Strict HTML5 Semantic architecture (`<article>`, `<aside>`, `<main>`), ARIA-live regions for AI responses, and strict high-contrast focus rings for keyboard navigation.

---

## 🏗️ Architecture & Code Quality

### 1. Serverless Security Proxy (Zero-Trust)
Client-side API keys are a catastrophic vulnerability. This app routes all LLM traffic through a custom **Node.js Serverless Proxy** (`/api/chat.js`) hosted on Vercel. 
- The `GROQ_API_KEY` exists strictly in Vercel Environment Variables.
- Strict `vercel.json` Content-Security-Policy (CSP) headers block unauthorized connections.
- Input validation and length truncation occur on the backend to prevent abuse.

### 2. Modular ES6 Vanilla JS
To ensure zero dependency bloat and maximum performance, the frontend is built entirely in Vanilla JS, cleanly separated into strict ES6 modules:
- `js/main.js`: Event routing, initialization, and core logic.
- `js/api.js`: Secure backend communication and multi-language mock fallbacks.
- `js/ui.js`: DOM manipulation via `document.createElement` (XSS proof).

### 3. Behavioral Test Suite
Includes a robust, 21-spec behavioral test suite using Node.js's built-in `node:test` runner.
- **Coverage:** Sanitization logic, multi-language routing, heatmap math, SVG path generation, and static code security audits (verifying zero `innerHTML` or `eval` usage).
- Run locally with: `npm run test`

---

## 🚀 Getting Started

### Local Development
Because the application uses ES6 modules, it must be run over an HTTP server.

1. Clone the repository:
   ```bash
   git clone https://github.com/Naveen230497/FIFA-Smart-Stadium.git
   cd FIFA-Smart-Stadium
   ```
2. Start a local server:
   ```bash
   npx serve .
   ```
3. Run the test suite:
   ```bash
   npm run test
   ```

### Deployment (Vercel)
This project is pre-configured for zero-config deployment on Vercel.
1. Import the repository into Vercel.
2. Add your `GROQ_API_KEY` to the Environment Variables.
3. Deploy. The `/api` directory will automatically map to serverless functions.

---
*Engineered for the PromptWars Hackathon 2026.*
