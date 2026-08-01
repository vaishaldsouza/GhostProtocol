# 🩸 RedPulse AI — Emergency Blood Donation Platform

> An AI-powered emergency blood donation platform that connects hospitals with compatible donors in real-time using smart donor prediction, multi-channel alerts (WhatsApp, Email, Voice), and blood shortage forecasting.

---

## ✨ Features

| Feature | Status |
|---|---|
| 🧠 AI Smart Donor Prediction | ✅ Live (Supabase + 5-factor scoring) |
| 📊 Blood Shortage Forecasting | ✅ Live (Supabase demand analytics) |
| 💬 WhatsApp Emergency Alerts | ✅ Free (Baileys / Twilio) |
| 📧 Transactional Email | ✅ Free (Gmail SMTP via Nodemailer) |
| 📞 AI Voice Calls to Donors | ✅ Free (Bland.ai — 1000 min/month) |
| 🔐 Auth & Role Dashboards | ✅ Supabase Auth |
| 🗺️ Distance-based Ranking | ✅ Haversine formula |
| 🤖 AI Eligibility Checker | ✅ Google Gemini |
| 🌐 Multilingual AI Assistant | ✅ Gemini |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A Supabase project (free at [supabase.com](https://supabase.com))
- Gmail account (for free email sending)
- Bland.ai account (for free voice calls — [app.bland.ai](https://app.bland.ai))

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

Fill in your credentials in `.env` (see [Credentials Setup](#credentials-setup) below).

### 3. Set Up Supabase Database

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor
2. Run the full setup script:

```
supabase/setup_with_seed.sql
```

This creates all tables, sets RLS policies, and seeds 10 sample donors + 15 emergency requests.

### 4. Run the App

Open **3 terminals**:

```bash
# Terminal 1 — Vite frontend (http://localhost:3000)
npm run dev

# Terminal 2 — Express API gateway (email, voice, WhatsApp proxy)
npm run server

# Terminal 3 — WhatsApp service (scan QR once to connect)
npm run whatsapp
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Credentials Setup

### Supabase (Required)
1. Create a free project at [supabase.com](https://supabase.com)
2. Copy **Project URL** and **anon key** from Settings → API
3. Add to `.env`: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Gmail SMTP (Free Email)
1. Enable 2FA on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate an App Password for "Mail"
4. Add to `.env`: `GMAIL_USER` and `GMAIL_APP_PASSWORD`

### Bland.ai (Free Voice Calls — 1000 min/month)
1. Sign up at [app.bland.ai](https://app.bland.ai)
2. Go to API Keys → Create Key
3. Add to `.env`: `BLAND_API_KEY`

### WhatsApp via Baileys (Free — no API fees)
1. Run `npm run whatsapp`
2. Scan the QR code with WhatsApp → Menu → Linked Devices → Link a Device
3. Session saved in `wa_session/` — only scan once

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           React Frontend (Vite)          │
│  - Role dashboards (Admin/Hospital/      │
│    Donor/Patient)                        │
│  - AI Prediction Modal                   │
│  - Shortage Forecasting Modal            │
│  - WhatsApp / Email / Voice dispatch     │
└──────────────┬──────────────────────────┘
               │ /api/* proxy
┌──────────────▼──────────────────────────┐
│        Express Gateway (server.ts)       │
│  POST /api/whatsapp/send  → Baileys/Meta │
│  POST /api/email/send     → Gmail SMTP   │
│  POST /api/voice/call     → Bland.ai     │
└──────┬──────────────┬───────────────────┘
       │              │
┌──────▼──────┐  ┌────▼────────────────────┐
│  Baileys    │  │      Supabase            │
│  WhatsApp   │  │  - profiles (donors)     │
│  Service    │  │  - emergency_requests    │
│  (:3002)    │  │  - donor_availability    │
└─────────────┘  │  - call_logs             │
                 └─────────────────────────┘
```

### AI Prediction Formula

```
Final Score = 0.40 × Distance Score
            + 0.20 × Eligibility Score
            + 0.20 × Acceptance Rate Score
            + 0.10 × Availability Score
            + 0.10 × Blood Match Score
```

---

## 📁 Project Structure

```
GhostProtocol/
├── src/
│   ├── components/          # React UI components
│   │   ├── SmartDonorPredictionModal.tsx
│   │   ├── ShortagePredictionModal.tsx
│   │   ├── WhatsAppDispatchModal.tsx
│   │   ├── ResendDispatchModal.tsx
│   │   └── TwilioVoiceDispatchModal.tsx
│   └── utils/
│       ├── predictionEngine.ts   # AI donor ranking (Supabase-backed)
│       ├── shortagePrediction.ts # Blood shortage forecasting
│       ├── whatsapp.ts           # WhatsApp message dispatch
│       ├── resendEmail.ts        # Email via Gmail SMTP
│       ├── twilioVoice.ts        # Voice calls via Bland.ai
│       └── supabase.ts           # Supabase client
├── server.ts                # Express API gateway
├── whatsapp-service.ts      # Baileys WhatsApp Web service
├── supabase/
│   ├── schema.sql           # Original schema
│   └── setup_with_seed.sql  # Full setup + sample data
└── backend/                 # Python FastAPI (optional voice backend)
```

---

## 🐍 Python Backend (Optional)

For advanced Twilio voice calling with IVR:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Requires Twilio credentials in `.env`.

---

## 📄 License

MIT — built for the AI Studio Hackathon.
