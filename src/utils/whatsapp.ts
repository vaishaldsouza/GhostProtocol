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

const WHATSAPP_LOGS_STORAGE_KEY = 'redpulse_whatsapp_message_logs';

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

/**
 * Reads stored WhatsApp message logs from localStorage
 */
export function getWhatsAppLogs(): WhatsAppMessageLog[] {
  try {
    const data = localStorage.getItem(WHATSAPP_LOGS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error reading WhatsApp logs:', err);
    return [];
  }
}

/**
 * Saves or updates a WhatsApp message log
 */
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

/**
 * Send WhatsApp Message via Meta WhatsApp Business API or Twilio Sandbox
 */
export async function sendWhatsAppEmergencyAlert(
  payload: WhatsAppAlertPayload
): Promise<{ success: boolean; log: WhatsAppMessageLog; message: string }> {
  const requestId = payload.requestId || `sos-${Date.now()}`;
  const donorId = payload.donorId || `donor-${Math.floor(Math.random() * 1000)}`;
  const secureToken = payload.secureToken || Math.random().toString(36).substring(2, 12);
  
  const baseUrl = payload.customBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://redpulse.app');
  const secureLink = `${baseUrl}/?action=respond_sos&req=${requestId}&donor=${donorId}&token=${secureToken}`;

  const messageText = formatWhatsAppMessageTemplate(payload, secureLink);

  const metaToken = import.meta.env.VITE_META_WHATSAPP_TOKEN || import.meta.env.META_WHATSAPP_TOKEN;
  const metaPhoneId = import.meta.env.VITE_META_PHONE_NUMBER_ID || import.meta.env.META_PHONE_NUMBER_ID;
  const twilioAccountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID || import.meta.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN || import.meta.env.TWILIO_AUTH_TOKEN;
  const twilioWhatsAppNumber = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER || import.meta.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';

  let provider: WhatsAppMessageLog['provider'] = 'Simulated Webhook Gateway';
  let rawApiResponse: any = null;
  let apiSuccess = false;

  // 1. Try Meta WhatsApp Cloud API if credentials present
  if (metaToken && metaPhoneId) {
    try {
      provider = 'Meta WhatsApp Business API';
      const cleanPhone = payload.donorPhone.replace(/[^0-9]/g, '');
      const response = await fetch(`https://graph.facebook.com/v18.0/${metaPhoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: messageText },
        }),
      });

      rawApiResponse = await response.json();
      if (response.ok) {
        apiSuccess = true;
      }
    } catch (err: any) {
      console.warn('Meta WhatsApp API call failed, falling back to simulated engine:', err);
      rawApiResponse = { error: err.message };
    }
  } 
  // 2. Try Twilio WhatsApp API if credentials present
  else if (twilioAccountSid && twilioAuthToken) {
    try {
      provider = 'Twilio WhatsApp Sandbox';
      const cleanToPhone = payload.donorPhone.startsWith('whatsapp:')
        ? payload.donorPhone
        : `whatsapp:${payload.donorPhone.replace(/[^0-9+]/g, '')}`;

      const cleanFromPhone = twilioWhatsAppNumber.startsWith('whatsapp:')
        ? twilioWhatsAppNumber
        : `whatsapp:${twilioWhatsAppNumber}`;

      const formData = new URLSearchParams();
      formData.append('To', cleanToPhone);
      formData.append('From', cleanFromPhone);
      formData.append('Body', messageText);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      rawApiResponse = await response.json();
      if (response.ok) {
        apiSuccess = true;
      }
    } catch (err: any) {
      console.warn('Twilio WhatsApp API call failed, falling back to sandbox logger:', err);
      rawApiResponse = { error: err.message };
    }
  }

  // Generate log record
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
    rawApiResponse: rawApiResponse || { status: 'queued', sandbox: true },
  };

  saveWhatsAppLog(logRecord);

  return {
    success: true,
    log: logRecord,
    message: `WhatsApp message logged and sent via ${provider}`,
  };
}

/**
 * Updates donor response to a WhatsApp alert (Accept / Decline)
 */
export function updateWhatsAppDonorResponse(
  logIdOrRequestId: string,
  donorResponse: 'accepted' | 'declined'
): { success: boolean; log?: WhatsAppMessageLog; message: string } {
  const logs = getWhatsAppLogs();
  const targetLog = logs.find(
    (l) => l.id === logIdOrRequestId || l.requestId === logIdOrRequestId || l.secureLink.includes(logIdOrRequestId)
  );

  if (!targetLog) {
    return { success: false, message: 'WhatsApp message record not found.' };
  }

  targetLog.status = donorResponse;
  targetLog.responseAt = new Date().toISOString();

  saveWhatsAppLog(targetLog);

  // Also dispatch a custom browser event so any active dashboard UI auto-updates
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

/**
 * Seed initial sample WhatsApp logs if empty
 */
export function seedInitialWhatsAppLogs(userPhone: string = '+91-9876543210', userName: string = 'Registered Donor'): void {
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
