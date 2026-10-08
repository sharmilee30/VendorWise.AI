# VendorWise AI — AI-Powered Vendor Selection & Procurement Recommender

> **Enterprise Decision-Support Platform for Manufacturing Procurement Teams**  
> Fictional Enterprise Context: **Nova Manufacturing Ltd.** (RFQ-2026-MFG-048: Precision Machined Assemblies)

---

## 🌟 Executive Overview

**VendorWise AI** is a decision-support application designed for procurement managers, supply chain directors, and strategic sourcing committees. It enables manufacturing enterprises to evaluate, score, and rank multiple vendors against five weighted operational dimensions, explore sensitivity across shifting business priorities, and review AI-generated strategic recommendations.

> **Decision-Support Architecture:** This application is strictly an advisory decision-support system, not an autonomous procurement engine. Deterministic mathematics governs all scores and rankings; the generative AI layer interprets results to provide strategic rationales, risk mitigations, and dual-sourcing guidance.

---

## 🗺️ Multi-Page Application Architecture

The application is structured into four dedicated pages accessible via a persistent 240px navigation sidebar:

1. **Dashboard (`/dashboard`)**:
   - Concise executive overview answering: *"Who is the recommended vendor and what is the current decision?"*
   - Standardized 4 KPI cards (Recommended Vendor, Highest Score, Active Candidates, Weight Allocation).
   - Executive decision briefing banner.
   - Top 5 vendor ranking table.
   - Visual comparative scores bar chart.
   - Active criteria weighting distribution summary.

2. **Vendor Evaluation (`/evaluation`)**:
   - Answers: *"What data and criteria are being used to evaluate suppliers?"*
   - **Evaluation Criteria & Weights**: Cost, Quality, Delivery, Reliability, Sustainability with sliders, presets, and 100% total validation.
   - **Vendor Master Evaluation Matrix**: Complete CRUD table (Add Supplier, Edit, Delete, Reset Sample Data) with numeric 0–100 validation.
   - **Calculate & View Results**: a sticky action bar shows the live leader under your current weights and takes you to the Analysis page (disabled until the weights total exactly 100%).

3. **Analysis & Scenarios (`/analysis`)**:
   - Answers: *"How robust is the vendor recommendation under different business priorities?"*
   - **Deterministic Vendor Ranking**: Full matrix with composite scores, contribution breakdown mini-bars, and lead gaps.
   - **Scenario Sensitivity Tracker**: Real-time shift detection banner (*e.g., "Recommendation changed from..."*), weight delta pills, and saved scenario snapshots.
   - **Visual Comparative Analytics**: Chart.js Bar Chart, 5-Axis Spider/Radar Chart, and Stacked Contribution Breakdown.

4. **AI Recommendation (`/ai`)**:
   - Answers: *"What is the strategic AI rationale and procurement advice?"*
   - **Ground-Truth Mathematical Context Bar**: Synchronized score and weight metrics.
   - **AI Executive Briefing**: Why it ranked highest, operational strengths, supply chain risk mitigations, dual-sourcing strategy, and weight sensitivity.
   - **Offline Deterministic Fallback**: Automatic rule engine fallback when no API key is provided.

---

## 🔄 State Management

All pages share a **single, unified application state**:
- Adjusting criteria weights or editing vendor metrics in **Vendor Evaluation** immediately updates the **Dashboard**, **Analysis & Scenarios**, and **AI Recommendation** pages.
- Data persists across browser sessions via `localStorage`.

---

## 📐 Deterministic Scoring Methodology

The scoring engine executes deterministic application logic without delegating numerical calculations to AI:

$$\text{Weighted Vendor Score} = \sum (\text{Criterion Score} \times \text{Criterion Weight})$$

$$\begin{aligned}
\text{Weighted Vendor Score} = & \; (\text{Cost Score} \times \text{Cost Weight}) \\
& + (\text{Quality Score} \times \text{Quality Weight}) \\
& + (\text{Delivery Score} \times \text{Delivery Weight}) \\
& + (\text{Reliability Score} \times \text{Reliability Weight}) \\
& + (\text{Sustainability Score} \times \text{Sustainability Weight})
\end{aligned}$$

Final scores are reported on a **0 to 100** composite scale rounded to two decimal places.

### Default Baseline Weights:
- **Cost:** `30%` (0.30)
- **Quality:** `30%` (0.30)
- **Delivery:** `20%` (0.20)
- **Reliability:** `15%` (0.15)
- **Sustainability:** `5%` (0.05)
- **Sum:** **`100%` (Strictly enforced)**

---

## 🏭 Preloaded Sample Vendors (Baseline Ranking)

Under default baseline weights, the deterministic engine ranks the 5 preloaded suppliers as follows:

| Rank | Vendor | Overall Score | Cost (30%) | Quality (30%) | Delivery (20%) | Reliability (15%) | ESG (5%) | Status |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| **#1** | **Delta Components** | **88.80** | 85 | 88 | 95 | 89 | 91 | **Recommended Vendor** |
| **#2** | **Beta Industrial** | **87.90** | 80 | 94 | 88 | 92 | 86 | **Primary Alternative** |
| **#3** | **Epsilon Manufacturing** | **84.00** | 76 | 90 | 82 | 87 | 95 | Qualified Supplier |
| **#4** | **Gamma Materials** | **81.75** | 96 | 82 | 68 | 75 | 70 | Qualified Supplier |
| **#5** | **Alpha Supplies** | **81.15** | 92 | 78 | 72 | 80 | 75 | Qualified Supplier |

*Lead Margin: Delta Components leads Beta Industrial by **+0.90 points**.*

---

## 🏁 Quick Start Guide

### Installation
```bash
npm install
cp .env.example .env     # optional: add GEMINI_API_KEY for live AI briefings
```
The app works **without** an API key: the AI Recommendation page then uses the built-in rule-based
engine and says so. With a key from https://aistudio.google.com/, it uses Gemini instead.

### Running the Application

#### Option A: Fullstack Development
```bash
npm run dev
```
- Frontend: `http://localhost:3000` (proxies `/api` to port 5001)
- Backend: `http://localhost:5001`

#### Option B: Standalone Production Mode
```bash
npm run build
npm start
```
- Access the complete application at `http://localhost:5001`.

---

## 🔒 Privacy & Data Sharing

- To write the AI briefing, the **vendor names, their scores and the criteria weights** shown in the app are sent to **Google's Gemini API**. Supplier notes, scenario titles and your API key are not sent, and the app collects no personal data.
- Saved suppliers, weights, scenarios and the last AI result are stored only in **your own browser** (`localStorage`). The server has no database; its logs contain request IDs, timings and the winning supplier's name, not scores or weights.
- Do not enter confidential or personal information. On Google's free Gemini tier, submitted content may be used to improve Google's products (check Google's current terms). The sample suppliers in this project are fictional.
- If no API key is configured, nothing is sent anywhere and the built-in rule-based explanation is used.

## 🔒 Data & Privacy

- To write the AI briefing, **vendor names, scores and weights are sent to Google's Gemini API**
  (plus the fixed company name and RFQ number). Supplier notes and scenario titles are never sent.
  Do not enter confidential or personal information. Under Google's free-tier terms, content may be
  used to improve Google's products; check the current terms.
- The app has no database or user accounts. Suppliers, weights, scenarios and the last AI briefing
  are stored only in your own browser.
- The AI only **explains** the ranking. The recommended and backup vendors shown always come from
  the app's own deterministic ranking, never from the AI's text, and the AI's reply is type-checked
  and length-limited before it is shown.

## ☁️ Deployment (Render, free tier)

The app is a single Node service: Express serves the built React app *and* the API, so only one
service is needed.

1. Push the project to a GitHub repository (`.env` is git-ignored, so your key is not uploaded).
2. On https://render.com choose **New + → Web Service** and connect the repository.
3. Use these settings:

| Setting | Value |
|---|---|
| Runtime | Node |
| Build Command | `npm install --include=dev && npm run build` |
| Start Command | `npm start` |

4. Add environment variables (Render supplies `PORT` itself):

| Variable | Value |
|---|---|
| `TRUST_PROXY` | `1` (so rate limiting sees each visitor's real IP) |
| `GEMINI_API_KEY` | your key (optional; without it the rule-based engine is used) |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` |

5. Deploy. Verify `https://<your-app>.onrender.com/api/health` returns `{"status":"ok",...}`.

Notes: on the free tier the service sleeps after ~15 minutes idle, so the first visit afterwards can
take about a minute to wake up. Other hosts (Railway, Fly.io) work the same way with the same
build/start commands and variables.

## 🐞 Debugging Guide

### Commands
```bash
npm run typecheck   # type-checks src/, server/ and tests/
npm test            # scoring, input validation, storage helpers, Gemini fallback
```

### Server logs
Every line looks like `time LEVEL [scope] message {meta}`. API keys are redacted automatically.
- Set `LOG_LEVEL=debug` in `.env` for more detail (`info` is the default).
- Each API call has a request id: the browser's Network tab shows it in the `X-Request-Id`
  response header, and the same id appears as `requestId` (or in the `[server:ai:<id>]` scope) in the server log.

### Browser console
Open DevTools and filter by `VendorWise`. Warnings and errors always print; `debug`/`info`
lines print automatically under `npm run dev`. In a production build, open the app with `?debug`
(remembered) and use `?nodebug` to turn it off.

### Common problems
| Symptom | Where to look |
|---|---|
| "AI explanation is temporarily unavailable" banner | Server log: `Gemini request failed` line shows the HTTP status. `404` = model retired (change `GEMINI_MODEL`), `429` = quota or the app's own rate limit, `503` = Google overloaded, `400` = bad key |
| Requests to `/api/...` return `ECONNREFUSED` | Backend isn't running on `PORT` (default 5001). Check `.env` and the `server` terminal output |
| Page crashes or shows "Something went wrong" | Console `[VendorWise:ui]` line has the component stack. "Reset saved data" clears the app's saved browser data |
| App shows default data after reload | Console `[VendorWise:storage]` warnings explain which saved item was invalid |
| AI briefing didn't re-run on reload | Intended: unchanged inputs reuse the saved briefing. Click **Re-analyze Decision** to force a new call |

## 🧪 Automated Test Suite

```bash
npm test            # runs all four suites below
npm run typecheck   # TypeScript check of src/, server/ and tests/
```

| Suite | Covers |
|---|---|
| `tests/scoringEngine.test.ts` | Weighted scoring, validation rules, scenario-shift detection, rule-based fallback |
| `tests/validation.test.ts` | Server-side input validation and sanitising of the AI request |
| `tests/storage.test.ts` | Safe handling of corrupted or invalid saved browser data |
| `tests/geminiService.test.ts` | Graceful fallback when the key is missing or invalid |
