# RedPulse AI - Automated Twilio Voice Calling System (FastAPI Backend)

Production-ready FastAPI microservice for automated IVR emergency blood donation phone calls using the Twilio Voice API, TwiML `<Gather>` DTMF keypad responses, and Supabase database synchronization.

## Features

- **Automated Outbound Voice Calls**: Triggers Twilio Voice calls to top compatible blood donors in real-time.
- **TwiML & IVR Keypad Integration**:
  - Speaks emergency alert message using Polly text-to-speech.
  - Captures DTMF keypad input using `<Gather>` (Press `1` = Accept, Press `2` = Decline).
- **Automated Response Processing**:
  - **Press 1 (Accepted)**: Updates donor status to `ACCEPTED` in Supabase, stops notifying remaining donors, and updates hospital dashboard in real-time.
  - **Press 2 (Declined)**: Marks donor `DECLINED` and automatically triggers call cascade to the next eligible donor.
- **Supabase Call Logging**: Stores full call history in `call_logs` table (Call SID, Donor ID, Request ID, status, duration, DTMF response, timestamps).
- **Asynchronous Background Tasks**: Non-blocking call cascade scheduler with automatic retry logic for failed calls.
- **Webhook Security**: Validates incoming `X-Twilio-Signature` HTTP headers to prevent unauthorized webhook spoofing.

## Quick Start

1. Install Python dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

2. Environment Variables (`.env`):
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=+18005550199
   TWILIO_WEBHOOK_URL=https://your-domain.com/api/v1/twilio
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. Run FastAPI Server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. API Endpoints:
   - `POST /api/v1/emergency/dispatch-calls`: Trigger automated call cascade for an emergency blood request.
   - `POST /api/v1/twilio/voice`: Twilio voice webhook (returns initial TwiML with `<Gather>`).
   - `POST /api/v1/twilio/gather`: Twilio gather webhook (processes DTMF key press `1` or `2`).
   - `POST /api/v1/twilio/status`: Call status callback for logging duration and completions.
   - `GET /api/v1/call-logs`: Query historical call logs.
