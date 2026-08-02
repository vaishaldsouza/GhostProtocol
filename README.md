# 🩸 RedPulse AI

![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![Vite](https://img.shields.io/badge/Vite-6-purple)
![Express](https://img.shields.io/badge/Express-Gateway-black)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E)
![License](https://img.shields.io/badge/License-MIT-yellow)

**AI-powered emergency blood coordination platform connecting donors, hospitals, and blood banks.**

> "Every second matters. RedPulse AI finds the right donor before time runs out."

---

## 📌 Overview

RedPulse AI is a centralized platform that solves a real, life-critical problem: during medical emergencies, finding compatible blood quickly is difficult because donor information is fragmented across phone calls, WhatsApp groups, and manual hospital records.

The platform connects **donors, hospitals, and administrators** through a role-based web application that intelligently ranks suitable donors based on blood-group compatibility, distance, eligibility, and response history — and dispatches alerts over WhatsApp, email, and voice, cutting emergency coordination time from hours to minutes.

---

## 🚨 The Problem

- Hospitals rely on manual donor search — phone calls, WhatsApp groups, personal networks.
- No unified system connects donors and hospitals in real time.
- Rare blood groups are especially hard to locate quickly under time pressure.
- Blood banks have limited visibility into upcoming shortages before they happen.
- Existing donor lists aren't ranked — staff have to guess who to call first.

---

## 💡 The Solution

RedPulse AI provides:

- **Emergency request posting** — hospitals post urgent blood requirements in seconds
- **AI-ranked donor matching** — a 5-factor scoring engine ranks eligible donors by distance, eligibility, acceptance history, availability, and blood-type match
- **Multi-channel dispatch** — donors are reached via WhatsApp, email, and AI voice calls, not just one channel
- **Role-based dashboards** — separate views for Admin, Hospital, and Donor
- **Shortage forecasting** — flags potential blood-group shortages 7–14 days ahead using demand analytics
- **Conversational AI assistants** — Gemini-powered eligibility Q&A, multilingual guidance, and a voice assistant

---

## 🧠 Why AI Instead of Manual Search?

```
Traditional Approach                    RedPulse AI Approach

Emergency Request                       Emergency Request
      │                                       │
      ▼                                       ▼
Search Donor List                      AI Scoring Engine
Manually                                      │
      │                                       ▼
      ▼                              Score & Rank Every
Call One Donor                       Eligible Donor
at a Time                                     │
      │                                       ▼
      ▼                              Multi-Channel Dispatch
   Wait...                           (WhatsApp + Email + Voice)
      │                                       │
      ▼                                       ▼
 Slow Response                         Fast Response
```

Manual filtering doesn't scale under time pressure — ranking and prioritization matter more than simply having a list of donors.

---

## ⚙️ Detailed System Flow

### 1. Request Initiation
- A hospital or admin submits an emergency blood request through the web app.
- Required fields: blood group, units needed, urgency (`critical` / `urgent` / `standard`), hospital name & location, patient name (optional), notes.
- Request is written to the `emergency_requests` table in Supabase with status `open`.

### 2. AI Donor Scoring & Ranking
The **prediction engine** evaluates every eligible donor in the `profiles` + `donor_availability` tables and computes a weighted score:

```
Final Score = 0.40 × Distance Score
            + 0.20 × Eligibility Score
            + 0.20 × Acceptance Rate Score
            + 0.10 × Availability Score
            + 0.10 × Blood Match Score
```

- **Distance Score** — Haversine distance between donor and hospital, exponentially decayed
- **Eligibility Score** — based on last donation date vs. the 3-month minimum interval
- **Acceptance Rate Score** — ratio of accepted vs. declined past requests
- **Availability Score** — donor's current availability toggle + preferred donation time
- **Blood Match Score** — exact match vs. compatible cross-match

Request status updates to `matching`.

### 3. Multi-Channel Dispatch
- Top-ranked donors are notified via **WhatsApp** (Baileys, free), **Email** (Gmail SMTP), and/or **AI voice call** (Bland.ai).
- Each dispatch attempt is logged (`notifications` / `call_logs` tables).
- If a donor declines or doesn't respond, the next-ranked donor can be notified.

### 4. Donor Response & Fulfilment
- Donor accepts → hospital is notified, request can move to `fulfilled`.
- Hospital confirms the donation happened via their dashboard.
- Donor's `total_donations`, `accepted_requests`, and `last_donation_date` update — this feeds back into future eligibility and acceptance-rate scoring.

### 5. Shortage Forecasting
- Historical request/fulfilment data feeds the shortage prediction module, which flags blood groups likely to run short in the next 7–14 days.

```
┌───────────────────────┐
│  Request Initiation    │
└───────────┬────────────┘
            ▼
┌───────────────────────┐
│  AI Donor Scoring &    │
│  Ranking Engine        │
└───────────┬────────────┘
            ▼
┌───────────────────────┐
│  Multi-Channel Dispatch │◄──── Re-notify next donor
│  (WhatsApp/Email/Voice) │        (on decline/timeout)
└───────────┬────────────┘
            ▼
┌───────────────────────┐
│  Donor Response         │
└───────────┬────────────┘
            │ Accepted
            ▼
┌───────────────────────┐
│  Hospital Confirmation  │
└───────────┬────────────┘
            ▼
┌───────────────────────┐
│  History & Shortage     │
│  Forecast Update         │
└───────────────────────┘
```

---

## 🏗️ System Architecture

### High-Level Architecture

```
                              Users
                                │
                                ▼
                     React Frontend (Vite + TS)
                        │                │
                        ▼                ▼
                 Express Gateway     Supabase
                 (server.ts)      (Postgres + Auth + RLS)
        ┌───────────────┼───────────────┐
        ▼                ▼               ▼
   WhatsApp          Email           AI & Voice
   (Baileys)      (Gmail SMTP)   (Gemini, Murf, Bland.ai)
```

### Component Breakdown

**Frontend (React 19 + TypeScript + Tailwind CSS + Vite)**
- Role-based routing: separate dashboard views for Admin, Hospital, Donor
- `predictionEngine.ts` — client-side AI donor ranking logic, Supabase-backed
- `shortagePrediction.ts` — blood shortage forecasting
- Leaflet map integration for donor/hospital location visualization
- Voice assistant with Web Speech API (STT/TTS) + Gemini/Murf AI conversational fallback

**Backend Gateway (Express + tsx, `server.ts`)**
- `POST /api/whatsapp/send` — WhatsApp dispatch via the Baileys service
- `POST /api/email/send` — transactional email via Gmail SMTP (Nodemailer)
- `POST /api/voice/call` — AI voice call dispatch via Bland.ai
- `POST /api/voice/ask` — Gemini + Murf AI conversational voice pipeline

**WhatsApp Service (`whatsapp-service.ts`)**
- Standalone Baileys (WhatsApp Web) service, QR-linked once, session persisted in `wa_session/`

**Database & Auth (Supabase)**
Tables:
- `profiles` — donors, hospitals, admins (role field distinguishes type; includes blood type, location, availability, donation stats)
- `emergency_requests` — blood requests with status, urgency, timestamps
- `donor_availability` — per-donor availability, travel radius, response time, last donation date
- `notifications` — dispatch log per request/donor/channel
- `call_logs` — AI voice call attempts and outcomes

**Optional Python Backend (`backend/`, FastAPI)**
- Advanced Twilio IVR voice-call flow, separate from the main Express gateway

**External Services**
- Google Gemini — eligibility Q&A, multilingual assistant, voice assistant responses
- Murf AI — natural text-to-speech for the voice assistant
- Bland.ai — automated outbound voice calls to donors (1000 free min/month)
- Baileys — free WhatsApp Web integration (no API fees)
- Gmail SMTP (via Nodemailer) — free transactional email

### Data Flow Summary

```
Frontend ──/api/*──► Express Gateway ──► WhatsApp / Email / AI & Voice
   │
   └──HTTP (Supabase client SDK)──► Supabase (Postgres + Auth)
```

---

## 🌟 Key Features

**AI Features**
- Smart donor prediction (5-factor weighted scoring engine)
- Blood shortage forecasting (7–14 day prediction)
- Eligibility AI — Gemini-powered donation eligibility Q&A
- Multilingual AI assistant (English, Hindi, Tamil, Telugu, Bengali, Marathi)
- Voice assistant — Gemini + Murf AI conversational voice
- AI voice calls to donors via Bland.ai

**Platform Features**
- Role-based dashboards (Admin / Hospital / Donor)
- Multi-channel dispatch (WhatsApp, Email, Voice)
- Supabase Auth with Row-Level Security
- Distance-based donor ranking (Haversine formula)
- Donor availability & donation history tracking
- Emergency request lifecycle management

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Leaflet |
| API Gateway | Express.js (Node.js), tsx |
| Optional Backend | FastAPI (Python) — Twilio IVR voice flow |
| Database & Auth | Supabase (PostgreSQL + Auth + RLS) |
| AI / ML | Google Gemini, custom 5-factor scoring engine |
| Voice | Murf AI (text-to-speech), Bland.ai (voice calls), Twilio (IVR) |
| Messaging | Baileys (WhatsApp), Nodemailer (Gmail SMTP) |
| Maps & Geolocation | Leaflet, Haversine distance formula |

---

## 📂 Project Structure

```
GhostProtocol/
├── src/
│   ├── components/              # React UI components & modals
│   │   ├── SmartDonorPredictionModal.tsx
│   │   ├── ShortagePredictionModal.tsx
│   │   ├── EligibilityAiModal.tsx
│   │   ├── MultilingualAiModal.tsx
│   │   ├── VoiceAssistantModal.tsx
│   │   ├── WhatsAppDispatchModal.tsx
│   │   ├── ResendDispatchModal.tsx
│   │   ├── TwilioVoiceDispatchModal.tsx
│   │   └── RoleDashboards.tsx
│   └── utils/
│       ├── predictionEngine.ts   # AI donor ranking
│       ├── shortagePrediction.ts # Blood shortage forecasting
│       ├── voiceAssistant.ts     # STT/TTS + Gemini/Murf pipeline
│       ├── whatsapp.ts
│       ├── resendEmail.ts
│       ├── twilioVoice.ts
│       └── supabase.ts
├── server.ts                     # Express API gateway
├── whatsapp-service.ts            # Baileys WhatsApp Web service
├── supabase/
│   ├── schema.sql
│   └── setup_with_seed.sql        # Full setup + sample data
└── backend/                       # Python FastAPI (optional voice backend)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) project
- Gmail account (for free email sending)
- [Bland.ai](https://app.bland.ai) account (free voice calls, optional)

### 1. Clone & Install
```bash
git clone https://github.com/vaishaldsouza/GhostProtocol.git
cd GhostProtocol
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Fill in `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `BLAND_API_KEY`, and (if using the voice assistant) `GEMINI_API_KEY` and `MURF_API_KEY`.

### 3. Set Up the Database
In Supabase Dashboard → SQL Editor, run `supabase/setup_with_seed.sql`. This creates all tables, RLS policies, and seeds sample donors and emergency requests.

### 4. Run the App
Open 3 terminals:
```bash
# Terminal 1 — Vite frontend (http://localhost:3000)
npm run dev

# Terminal 2 — Express API gateway
npm run server

# Terminal 3 — WhatsApp service (scan QR once to connect)
npm run whatsapp
```
Open [http://localhost:3000](http://localhost:3000)

### 5. Optional: Python Backend
For advanced Twilio IVR voice calling:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## 🔒 Security

- Supabase Auth with Row-Level Security (RLS) on all tables
- Encrypted communication over HTTPS
- Donor contact details never exposed publicly without explicit consent
- WhatsApp session persisted locally, never shared

---

## ✅ Why RedPulse AI?

- Real-world healthcare coordination problem
- AI-ranked donor recommendations, not just a filtered list
- Multi-channel dispatch — WhatsApp, email, and voice, not a single point of failure
- Explainable scoring — every ranking factor is visible in the breakdown
- Honest scope — built and tested features are clearly separated from roadmap items

---

## 🗺️ Roadmap

- [x] AI donor scoring & ranking engine
- [x] WhatsApp, email, and AI voice dispatch
- [x] Role-based dashboards (Admin / Hospital / Donor)
- [x] Blood shortage forecasting (prototype)
- [x] Gemini-powered eligibility & multilingual assistant
- [ ] Offline-first mode for low-connectivity areas
- [ ] SMS/USSD fallback for donors without smartphones
- [ ] Traffic-aware routing for donor transport
- [ ] Blood bank inventory sync
- [ ] Automated eligibility reminders
- [ ] National blood-network / government integration (long-term)

---

## 📚 References

1. World Health Organization (WHO) — *Blood Safety and Availability Fact Sheet*.
   https://www.who.int/news-room/fact-sheets/detail/blood-safety-and-availability
2. Supabase — Postgres database, authentication, and row-level security documentation.
   https://supabase.com/docs
3. React — JavaScript library for building user interfaces.
   https://react.dev
4. Express — Node.js web framework.
   https://expressjs.com
5. Google Gemini — generative AI platform.
   https://ai.google.dev
6. Murf AI — text-to-speech API.
   https://murf.ai
7. Bland.ai — AI voice call platform.
   https://app.bland.ai
8. Baileys — WhatsApp Web API library.
   https://github.com/WhiskeySockets/Baileys

---

## 👥 Team

| Name | Role |
|---|---|
| [Name] | Frontend Development |
| [Name] | Backend & Database |
| [Name] | AI Scoring & Prediction Engine |
| [Name] | UI/UX & Presentation |

---

## 📄 License

This project is licensed under the MIT License.

*"One donation can save three lives. One smart platform can save thousands."*
