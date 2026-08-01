import { BloodType } from '../types';

export interface WhatsAppAlertPayload {
  requestId?: string;
  donorId?: string;
  donorName: string;
  donorPhone: string;
  hospitalName: string;
  bloodGroup: BloodType | string;
  unitsRequired: number;
  distance: string;
  urgency: 'Critical' | 'Urgent' | 'Standard' | string;
  secureToken?: string;
  customBaseUrl?: string;
}

export interface WhatsAppMessageLog {
  id: string;
  requestId: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  hospitalName: string;
  bloodGroup: string;
  unitsRequired: number;
  distance: string;
  urgency: string;
  formattedMessage: string;
  secureLink: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'read' | 'accepted' | 'declined';
  responseAt?: string;
  provider: 'Meta WhatsApp Business API' | 'Twilio WhatsApp Sandbox' | 'Simulated Webhook Gateway';
  rawApiResponse?: any;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────
const WHATSAPP_LOGS_STORAGE_KEY = 'redpulse_whatsapp_message_logs';
const WHATSAPP_CREDS_STORAGE_KEY = 'redpulse_whatsapp_credentials';

// ─── Credentials helpers ──────────────────────────────────────────────────────

export interface WhatsAppCredentials {
  metaToken: string;
  metaPhoneId: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioWhatsAppNumber: string;
}

/** Persist runtime credentials entered in the Config tab */
export function saveWhatsAppCredentials(creds: WhatsAppCredentials): void {
  try {
    localStorage.setItem(WHATSAPP_CREDS_STORAGE_KEY, JSON.stringify(creds));
  } catch (err) {
    console.error('Error saving WhatsApp credentials:', err);
  }
}

/** Load previously saved runtime credentials */
export function loadWhatsAppCredentials(): WhatsAppCredentials {
  const defaults: WhatsAppCredentials = {
    metaToken: '',
    metaPhoneId: '',
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioWhatsAppNumber: '+14155238886',
  };
  try {
    const raw = localStorage.getItem(WHATSAPP_CREDS_STORAGE_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

/**
 * Resolve credentials: localStorage > .env vars
 * This allows the Config tab to override env vars at runtime.
 */
function resolveCredentials(): WhatsAppCredentials {
  const saved = loadWhatsAppCredentials();
  return {
    metaToken:
      saved.metaToken ||
      import.meta.env.VITE_META_WHATSAPP_TOKEN ||
      '',
    metaPhoneId:
      saved.metaPhoneId ||
      import.meta.env.VITE_META_PHONE_NUMBER_ID ||
      '',
    twilioAccountSid:
      saved.twilioAccountSid ||
      import.meta.env.VITE_TWILIO_ACCOUNT_SID ||
      '',
    twilioAuthToken:
      saved.twilioAuthToken ||
      import.meta.env.VITE_TWILIO_AUTH_TOKEN ||
      '',
    twilioWhatsAppNumber:
      saved.twilioWhatsAppNumber ||
      import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER ||
      '+14155238886',
  };
}

// ─── Message formatting ───────────────────────────────────────────────────────

/**
 * Generates the required formatted WhatsApp message template
 */
export function formatWhatsAppMessageTemplate(payload: WhatsAppAlertPayload, secureLink: string): string {
  const { hospitalName, bloodGroup, unitsRequired, distance, urgency } = payload;

  return `🩸 REDPULSE AI ALERT

Emergency Blood Requirement

Hospital:
${hospitalName}

Blood Group:
${bloodGroup}

Units Required:
${unitsRequired} ${unitsRequired === 1 ? 'Unit' : 'Units'}

Distance:
${distance}

Urgency:
${urgency}

Can you donate?

Tap below:
👉 ${secureLink}

[Accept] [Decline]`;
}

// ─── Log helpers ──────────────────────────────────────────────────────────────

/** Reads stored WhatsApp message logs from localStorage */
export function getWhatsAppLogs(): WhatsAppMessageLog[] {
  try {
    const data = localStorage.getItem(WHATSAPP_LOGS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error reading WhatsApp logs:', err);
    return [];
  }
}

/** Saves or updates a WhatsApp message log */
export function saveWhatsAppLog(log: WhatsAppMessageLog): void {
  try {
    const logs = getWhatsAppLogs();
    const existingIndex = logs.findIndex((item) => item.id === log.id);
    if (existingIndex >= 0) {
      logs[existingIndex] = log;
    } else {
      logs.unshift(log);
    }
    localStorage.setItem(WHATSAPP_LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('Error saving WhatsApp log:', err);
  }
}

// ─── Send via server-side proxy ───────────────────────────────────────────────

/**
 * Calls the /api/whatsapp/send Express proxy which handles Meta / Twilio server-side.
 * Falls back to simulation if the proxy is unreachable (e.g., no gateway running).
 */
async function callWhatsAppProxy(
  to: string,
  messageBody: string,
  creds: WhatsAppCredentials
): Promise<{ success: boolean; provider: WhatsAppMessageLog['provider']; rawApiResponse: any }> {
  try {
    // Force use of Baileys since it's our free service
    const provider = 'baileys';
    
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        messageBody,
        provider,
        metaToken: creds.metaToken,
        metaPhoneId: creds.metaPhoneId,
        twilioAccountSid: creds.twilioAccountSid,
        twilioAuthToken: creds.twilioAuthToken,
        twilioWhatsAppNumber: creds.twilioWhatsAppNumber,
      }),
    });

    const data = await response.json();

    return {
      success: response.ok && data.success,
      provider: (data.provider as WhatsAppMessageLog['provider']) || 'Simulated Webhook Gateway',
      rawApiResponse: data,
    };
  } catch (err: any) {
    // Proxy unreachable — fall back to simulation
    console.warn('WhatsApp gateway proxy unreachable, running in simulation mode:', err.message);
    return {
      success: true,
      provider: 'Simulated Webhook Gateway',
      rawApiResponse: { note: 'Gateway server not running. Start with: npx tsx server.ts', sandbox: true },
    };
  }
}

// ─── Main send function ───────────────────────────────────────────────────────

/**
 * Send WhatsApp emergency alert.
 * Routes through the /api/whatsapp/send proxy to avoid CORS.
 * Falls back gracefully to local simulation when the server is unavailable.
 */
export async function sendWhatsAppEmergencyAlert(
  payload: WhatsAppAlertPayload
): Promise<{ success: boolean; log: WhatsAppMessageLog; message: string }> {
  const requestId = payload.requestId || `sos-${Date.now()}`;
  const donorId = payload.donorId || `donor-${Math.floor(Math.random() * 1000)}`;
  const secureToken = payload.secureToken || Math.random().toString(36).substring(2, 12);

  const baseUrl =
    payload.customBaseUrl ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://redpulse.app');
  const secureLink = `${baseUrl}/?action=respond_sos&req=${requestId}&donor=${donorId}&token=${secureToken}`;

  const messageText = formatWhatsAppMessageTemplate(payload, secureLink);
  const creds = resolveCredentials();

  const { success, provider, rawApiResponse } = await callWhatsAppProxy(
    payload.donorPhone,
    messageText,
    creds
  );

  const logRecord: WhatsAppMessageLog = {
    id: `wa-msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    requestId,
    donorId,
    donorName: payload.donorName,
    donorPhone: payload.donorPhone,
    hospitalName: payload.hospitalName,
    bloodGroup: String(payload.bloodGroup),
    unitsRequired: payload.unitsRequired,
    distance: payload.distance,
    urgency: payload.urgency,
    formattedMessage: messageText,
    secureLink,
    sentAt: new Date().toISOString(),
    status: 'sent',
    provider,
    rawApiResponse,
  };

  saveWhatsAppLog(logRecord);

  return {
    success,
    log: logRecord,
    message: `WhatsApp message dispatched via ${provider}`,
  };
}

// ─── Donor response ───────────────────────────────────────────────────────────

/** Updates donor response to a WhatsApp alert (Accept / Decline) */
export function updateWhatsAppDonorResponse(
  logIdOrRequestId: string,
  donorResponse: 'accepted' | 'declined'
): { success: boolean; log?: WhatsAppMessageLog; message: string } {
  const logs = getWhatsAppLogs();
  const targetLog = logs.find(
    (l) =>
      l.id === logIdOrRequestId ||
      l.requestId === logIdOrRequestId ||
      l.secureLink.includes(logIdOrRequestId)
  );

  if (!targetLog) {
    return { success: false, message: 'WhatsApp message record not found.' };
  }

  targetLog.status = donorResponse;
  targetLog.responseAt = new Date().toISOString();

  saveWhatsAppLog(targetLog);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('whatsapp_response_updated', {
        detail: { log: targetLog, response: donorResponse },
      })
    );
  }

  return {
    success: true,
    log: targetLog,
    message: `Donor status updated to ${donorResponse.toUpperCase()}`,
  };
}

// ─── Seed helpers ─────────────────────────────────────────────────────────────

/** Seed initial sample WhatsApp logs if empty */
export function seedInitialWhatsAppLogs(
  userPhone = '+91-9876543210',
  userName = 'Registered Donor'
): void {
  const existing = getWhatsAppLogs();
  if (existing.length > 0) return;

  const samplePayloads: WhatsAppAlertPayload[] = [
    {
      requestId: 'sos-1001',
      donorId: 'd-101',
      donorName: userName,
      donorPhone: userPhone,
      hospitalName: 'City General Hospital ICU',
      bloodGroup: 'O-',
      unitsRequired: 2,
      distance: '2.4 km away',
      urgency: 'Critical',
    },
    {
      requestId: 'sos-1002',
      donorId: 'd-102',
      donorName: 'Rahul Sharma',
      donorPhone: '+91-9812345678',
      hospitalName: 'St. Jude Trauma Care Center',
      bloodGroup: 'A+',
      unitsRequired: 3,
      distance: '4.1 km away',
      urgency: 'Urgent',
    },
  ];

  samplePayloads.forEach((payload) => {
    sendWhatsAppEmergencyAlert(payload);
  });
}
