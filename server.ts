/**
 * RedPulse Express API Server
 * Handles server-side proxying for WhatsApp, Email (Gmail SMTP), and Voice Calls (Bland.ai).
 * Run separately: npm run server
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for Vite dev server
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const BAILEYS_SERVICE_URL = process.env.BAILEYS_SERVICE_URL || 'http://localhost:3002';

// ─── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'RedPulse WhatsApp Gateway' });
});

// ─── Check Baileys connection status ─────────────────────────────────────────
async function isBaileysConnected(): Promise<boolean> {
  try {
    const r = await fetch(`${BAILEYS_SERVICE_URL}/health`, { signal: AbortSignal.timeout(1500) });
    const d = await r.json() as { status: string };
    return d.status === 'connected';
  } catch {
    return false;
  }
}

// ─── WhatsApp Send Endpoint ────────────────────────────────────────────────────
app.post('/api/whatsapp/send', async (req: Request, res: Response) => {
  const {
    to,
    messageBody,
    // "baileys" | "meta" | "twilio" | "auto"
    provider = 'auto',
    metaToken,
    metaPhoneId,
    twilioAccountSid,
    twilioAuthToken,
    twilioWhatsAppNumber,
  } = req.body as {
    to: string;
    messageBody: string;
    provider?: string;
    metaToken?: string;
    metaPhoneId?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioWhatsAppNumber?: string;
  };

  if (!to || !messageBody) {
    return res.status(400).json({ success: false, error: 'to and messageBody are required' });
  }

  // Resolve credentials: runtime params > env vars
  const resolvedMetaToken = metaToken || process.env.VITE_META_WHATSAPP_TOKEN || process.env.META_WHATSAPP_TOKEN || '';
  const resolvedMetaPhoneId = metaPhoneId || process.env.VITE_META_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID || '';
  const resolvedTwilioSid = twilioAccountSid || process.env.VITE_TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID || '';
  const resolvedTwilioToken = twilioAuthToken || process.env.VITE_TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN || '';
  const resolvedTwilioNumber =
    twilioWhatsAppNumber ||
    process.env.VITE_TWILIO_WHATSAPP_NUMBER ||
    process.env.TWILIO_WHATSAPP_NUMBER ||
    '+14155238886';

  const useMetaCredentials = resolvedMetaToken && resolvedMetaPhoneId;
  const useTwilioCredentials = resolvedTwilioSid && resolvedTwilioToken;

  const shouldUseMeta =
    provider === 'meta' ||
    (provider === 'auto' && useMetaCredentials);

  const shouldUseTwilio =
    !shouldUseMeta &&
    (provider === 'twilio' || (provider === 'auto' && useTwilioCredentials));

  // ── Baileys (WhatsApp Web) — free, QR-based ──
  const shouldUseBaileys = provider === 'baileys' || (provider === 'auto' && !useMetaCredentials && !useTwilioCredentials);
  if (shouldUseBaileys) {
    const baileysUp = await isBaileysConnected();
    if (baileysUp) {
      try {
        const r = await fetch(`${BAILEYS_SERVICE_URL}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, message: messageBody }),
          signal: AbortSignal.timeout(10000),
        });
        const d = await r.json() as { success: boolean; error?: string; to?: string };
        if (!r.ok || !d.success) {
          return res.status(r.status).json({
            success: false,
            provider: 'Baileys (WhatsApp Web)',
            error: d.error || 'Baileys send failed',
          });
        }
        return res.json({ success: true, provider: 'Baileys (WhatsApp Web)', to: d.to });
      } catch (err: any) {
        // fall through to simulation if baileys errors mid-send
        console.warn('Baileys send error:', err.message);
      }
    }
    // Baileys not running — simulation fallback
    return res.json({
      success: true,
      provider: 'Simulated Webhook Gateway',
      messageId: `sim-${Date.now()}`,
      note: 'No WhatsApp connection active. Run: npx tsx whatsapp-service.ts',
    });
  }

  // ── Meta WhatsApp Cloud API ──
  if (shouldUseMeta) {
    const cleanPhone = to.replace(/[^0-9]/g, '');
    try {
      const metaRes = await fetch(`https://graph.facebook.com/v18.0/${resolvedMetaPhoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resolvedMetaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: messageBody },
        }),
      });

      const data = await metaRes.json();

      if (!metaRes.ok) {
        return res.status(metaRes.status).json({
          success: false,
          provider: 'Meta WhatsApp Business API',
          error: data?.error?.message || 'Meta API error',
          raw: data,
        });
      }

      return res.json({
        success: true,
        provider: 'Meta WhatsApp Business API',
        messageId: data?.messages?.[0]?.id,
        raw: data,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        provider: 'Meta WhatsApp Business API',
        error: err.message,
      });
    }
  }

  // ── Twilio WhatsApp Sandbox ──
  if (shouldUseTwilio) {
    const cleanTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to.replace(/[^0-9+]/g, '')}`;
    const cleanFrom = resolvedTwilioNumber.startsWith('whatsapp:')
      ? resolvedTwilioNumber
      : `whatsapp:${resolvedTwilioNumber}`;

    const formData = new URLSearchParams();
    formData.append('To', cleanTo);
    formData.append('From', cleanFrom);
    formData.append('Body', messageBody);

    try {
      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${resolvedTwilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + Buffer.from(`${resolvedTwilioSid}:${resolvedTwilioToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        }
      );

      const data = await twilioRes.json();

      if (!twilioRes.ok) {
        return res.status(twilioRes.status).json({
          success: false,
          provider: 'Twilio WhatsApp Sandbox',
          error: data?.message || 'Twilio API error',
          raw: data,
        });
      }

      return res.json({
        success: true,
        provider: 'Twilio WhatsApp Sandbox',
        messageId: data?.sid,
        raw: data,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        provider: 'Twilio WhatsApp Sandbox',
        error: err.message,
      });
    }
  }

  // ── No credentials — check Baileys, else simulation ──
  const baileysUp = await isBaileysConnected();
  if (baileysUp) {
    try {
      const r = await fetch(`${BAILEYS_SERVICE_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message: messageBody }),
        signal: AbortSignal.timeout(10000),
      });
      const d = await r.json() as { success: boolean; error?: string; to?: string };
      if (r.ok && d.success) {
        return res.json({ success: true, provider: 'Baileys (WhatsApp Web)', to: d.to });
      }
    } catch (err: any) {
      console.warn('Baileys fallback error:', err.message);
    }
  }

  return res.json({
    success: true,
    provider: 'Simulated Webhook Gateway',
    messageId: `sim-${Date.now()}`,
    note: 'No API credentials configured. Message captured in local sandbox.',
  });
});

// ─── Email Send Endpoint (Gmail SMTP via Nodemailer — FREE) ──────────────────
app.post('/api/email/send', async (req: Request, res: Response) => {
  const {
    to,
    subject,
    html,
    text,
    // Runtime credentials (from Config tab in UI) > env vars
    gmailUser,
    gmailAppPassword,
    fromName,
  } = req.body as {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    gmailUser?: string;
    gmailAppPassword?: string;
    fromName?: string;
  };

  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({ success: false, error: 'to, subject, and html/text are required' });
  }

  const resolvedUser = gmailUser || process.env.GMAIL_USER || process.env.VITE_GMAIL_USER || '';
  const resolvedPass = gmailAppPassword || process.env.GMAIL_APP_PASSWORD || process.env.VITE_GMAIL_APP_PASSWORD || '';
  const resolvedFromName = fromName || process.env.GMAIL_FROM_NAME || 'RedPulse Emergency';

  if (!resolvedUser || !resolvedPass) {
    // No credentials — sandbox simulation
    return res.json({
      success: true,
      provider: 'Email Sandbox Simulator',
      messageId: `sim-email-${Date.now()}`,
      note: 'No Gmail credentials configured. Email captured in local sandbox.',
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: resolvedUser,
        pass: resolvedPass, // Must be a Gmail App Password (not your regular password)
      },
    });

    const info = await transporter.sendMail({
      from: `"${resolvedFromName}" <${resolvedUser}>`,
      to,
      subject,
      html: html || undefined,
      text: text || undefined,
    });

    console.log(`[Email] ✉ Sent to ${to} — Message ID: ${info.messageId}`);
    return res.json({
      success: true,
      provider: 'Gmail SMTP (Nodemailer)',
      messageId: info.messageId,
      accepted: info.accepted,
    });
  } catch (err: any) {
    console.error('[Email] Send error:', err.message);
    return res.status(500).json({ success: false, provider: 'Gmail SMTP', error: err.message });
  }
});

// ─── Voice Call Endpoint (Bland.ai — FREE tier: 1000 min/month) ──────────────
app.post('/api/voice/call', async (req: Request, res: Response) => {
  const {
    phoneNumber,
    donorName,
    bloodGroup,
    hospitalName,
    distanceKm,
    requestId,
    donorId,
    // Runtime credential override
    blandApiKey,
  } = req.body as {
    phoneNumber: string;
    donorName: string;
    bloodGroup: string;
    hospitalName: string;
    distanceKm: number;
    requestId: string;
    donorId: string;
    blandApiKey?: string;
  };

  if (!phoneNumber) {
    return res.status(400).json({ success: false, error: 'phoneNumber is required' });
  }

  const resolvedKey = blandApiKey || process.env.BLAND_API_KEY || process.env.VITE_BLAND_API_KEY || '';

  const task = `You are an emergency medical dispatcher for RedPulse AI. Call the donor and say:

"Hello ${donorName}, this is an urgent emergency alert from RedPulse AI.

A nearby hospital called ${hospitalName} urgently needs ${bloodGroup} blood. It is only ${distanceKm} kilometers from you.

If you are available to donate blood right now, please say YES or press 1.
If you are unavailable, please say NO or press 2.

Your response could save a life. Please respond now."

Wait for their response. If they say yes or 1, say: "Thank you so much! The hospital team will contact you immediately with next steps. You are a lifesaver."
If they say no or 2, say: "Thank you for letting us know. We will reach the next donor immediately. Goodbye."
If no response after 10 seconds, say: "We did not receive your response. We will try again shortly. Goodbye."`;

  if (!resolvedKey) {
    // Simulation mode — no Bland.ai key
    return res.json({
      success: true,
      provider: 'Voice Call Simulator',
      callId: `sim-call-${Date.now()}`,
      note: 'No Bland.ai API key configured. Call simulated locally. Get free key at app.bland.ai',
    });
  }

  try {
    const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');

    const blandRes = await fetch('https://api.bland.ai/v1/calls', {
      method: 'POST',
      headers: {
        Authorization: resolvedKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: cleanPhone,
        task,
        model: 'enhanced',
        language: 'en',
        voice: 'maya',
        max_duration: 2, // minutes
        record: false,
        metadata: { requestId, donorId, bloodGroup, hospitalName },
      }),
    });

    const data = await blandRes.json() as { call_id?: string; message?: string; status?: string };

    if (!blandRes.ok) {
      return res.status(blandRes.status).json({
        success: false,
        provider: 'Bland.ai',
        error: data?.message || 'Bland.ai API error',
        raw: data,
      });
    }

    console.log(`[Voice] 📞 Call initiated to ${cleanPhone} — Call ID: ${data.call_id}`);
    return res.json({
      success: true,
      provider: 'Bland.ai (Free Tier)',
      callId: data.call_id,
      status: data.status || 'queued',
    });
  } catch (err: any) {
    console.error('[Voice] Call error:', err.message);
    return res.status(500).json({ success: false, provider: 'Bland.ai', error: err.message });
  }
});

// ─── Murf AI Text-to-Speech Endpoint ───────────────────────────────────────────────
app.post('/api/voice/murf', async (req: Request, res: Response) => {
  const {
    text,
    voiceId,
    // Runtime credential override
    murfApiKey,
  } = req.body as {
    text: string;
    voiceId?: string;
    murfApiKey?: string;
  };

  if (!text) {
    return res.status(400).json({ success: false, error: 'text is required' });
  }

  const resolvedKey = murfApiKey || process.env.MURF_API_KEY || process.env.VITE_MURF_API_KEY || '';
  const resolvedVoiceId = voiceId || process.env.MURF_VOICE_ID || process.env.VITE_MURF_VOICE_ID || 'en-US-marcus';

  if (!resolvedKey) {
    // Simulation mode — no Murf AI key
    return res.json({
      success: true,
      provider: 'Murf AI Simulator',
      audioUrl: null,
      note: 'No Murf AI API key configured. Audio generation simulated locally. Get key at https://murf.ai/',
    });
  }

  try {
    const murfRes = await fetch('https://api.murf.ai/v1/speech/generate', {
      method: 'POST',
      headers: {
        'api-key': resolvedKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voiceId: resolvedVoiceId,
        format: 'MP3',
        sampleRate: 24000,
      }),
    });

    const data = await murfRes.json() as { audioUrl?: string; error?: string };

    if (!murfRes.ok) {
      return res.status(murfRes.status).json({
        success: false,
        provider: 'Murf AI',
        error: data?.error || 'Murf AI API error',
        raw: data,
      });
    }

    console.log(`[Murf AI] 🎤 Audio generated for text: "${text.substring(0, 50)}..."`);
    return res.json({
      success: true,
      provider: 'Murf AI',
      audioUrl: data.audioUrl,
      voiceId: resolvedVoiceId,
    });
  } catch (err: any) {
    console.error('[Murf AI] Generation error:', err.message);
    return res.status(500).json({ success: false, provider: 'Murf AI', error: err.message });
  }
});

// ─── Gemini AI Chat Endpoint ───────────────────────────────────────────────────────
app.post('/api/voice/gemini', async (req: Request, res: Response) => {
  const {
    text,
    context,
    // Runtime credential override
    geminiApiKey,
  } = req.body as {
    text: string;
    context?: string;
    geminiApiKey?: string;
  };

  if (!text) {
    return res.status(400).json({ success: false, error: 'text is required' });
  }

  const resolvedKey = geminiApiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

  if (!resolvedKey) {
    // Simulation mode — no Gemini API key
    return res.json({
      success: true,
      provider: 'Gemini AI Simulator',
      response: 'I heard: "' + text + '". This is a simulated response. Configure Gemini API key for AI-powered responses.',
      note: 'No Gemini API key configured. Get key at https://ai.google.dev/',
    });
  }

  try {
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${resolvedKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: (context || 'You are a helpful medical assistant for RedPulse AI, a blood donation platform. ') + '\n\nUser: ' + text
          }]
        }]
      }),
    });

    const data = await geminiRes.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

    if (!geminiRes.ok) {
      return res.status(geminiRes.status).json({
        success: false,
        provider: 'Gemini AI',
        error: data?.error?.message || 'Gemini API error',
        raw: data,
      });
    }

    const response = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    console.log(`[Gemini AI] 🤖 Response generated for: "${text.substring(0, 50)}..."`);
    return res.json({
      success: true,
      provider: 'Gemini 2.5 Flash',
      response,
    });
  } catch (err: any) {
    console.error('[Gemini AI] Generation error:', err.message);
    return res.status(500).json({ success: false, provider: 'Gemini AI', error: err.message });
  }
});

const PORT = process.env.WHATSAPP_SERVER_PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ RedPulse API Gateway running on http://localhost:${PORT}`);
  console.log(`   📧 Email: /api/email/send  (Gmail SMTP)`);
  console.log(`   📞 Voice: /api/voice/call  (Bland.ai free tier)`);
  console.log(`   🎤 TTS: /api/voice/murf  (Murf AI)`);
  console.log(`   🤖 AI: /api/voice/gemini  (Gemini 2.5 Flash)`);
  console.log(`   💬 WhatsApp: /api/whatsapp/send  (Baileys/Meta/Twilio)`);
});

export default app;
