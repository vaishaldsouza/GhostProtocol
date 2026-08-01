/**
 * RedPulse WhatsApp Service (Baileys)
 * ─────────────────────────────────────
 * Runs a lightweight WhatsApp Web session using Baileys.
 * On first launch it prints a QR code — scan it once with WhatsApp.
 * After that the session is saved to ./wa_session/ and auto-reconnects.
 *
 * Exposes a REST endpoint:
 *   POST http://localhost:3002/send
 *   Body: { to: "+919108920911", message: "Hello from RedPulse" }
 *
 * Run: npx tsx whatsapp-service.ts
 */

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import express from 'express';
import pino from 'pino';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

const AUTH_DIR = path.resolve('./wa_session');
const PORT = 3002;

if (!existsSync(AUTH_DIR)) mkdirSync(AUTH_DIR, { recursive: true });

const logger = pino({ level: 'silent' }); // suppress verbose baileys logs

let sock: ReturnType<typeof makeWASocket> | null = null;
let isConnected = false;
let qrDisplayed = false;

// ─── WhatsApp connection ──────────────────────────────────────────────────────

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: false, // we handle QR ourselves for cleaner output
    browser: ['RedPulse', 'Chrome', '1.0.0'],
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      if (!qrDisplayed) {
        console.log('\n\n══════════════════════════════════════════════');
        console.log('  📱 SCAN THIS QR CODE WITH YOUR WHATSAPP');
        console.log('  WhatsApp → Menu → Linked Devices → Link a Device');
        console.log('══════════════════════════════════════════════\n');
        qrcode.generate(qr, { small: true });
        console.log('\n══════════════════════════════════════════════\n');
        qrDisplayed = true;
      }
    }

    if (connection === 'close') {
      isConnected = false;
      const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;
      console.log(`[WhatsApp] Connection closed (reason: ${reason}). Reconnecting: ${shouldReconnect}`);
      if (shouldReconnect) {
        qrDisplayed = false;
        setTimeout(connectToWhatsApp, 3000);
      } else {
        console.log('[WhatsApp] Logged out. Delete ./wa_session/ and restart to re-scan QR.');
      }
    }

    if (connection === 'open') {
      isConnected = true;
      qrDisplayed = false;
      const user = sock?.user;
      console.log(`\n✅ WhatsApp connected as ${user?.name || 'Unknown'} (${user?.id})`);
      console.log(`📡 WhatsApp service ready on http://localhost:${PORT}\n`);
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

// ─── Express API ──────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: isConnected ? 'connected' : 'disconnected', service: 'RedPulse WhatsApp (Baileys)' });
});

app.post('/send', async (req, res) => {
  const { to, message } = req.body as { to: string; message: string };

  if (!to || !message) {
    return res.status(400).json({ success: false, error: '`to` and `message` are required' });
  }

  if (!isConnected || !sock) {
    return res.status(503).json({
      success: false,
      error: 'WhatsApp not connected yet. Scan the QR code first.',
    });
  }

  try {
    // Normalise phone: strip non-digits except leading +, convert to JID format
    const cleanNumber = to.replace(/\D/g, ''); // e.g. "919108920911"
    const jid = `${cleanNumber}@s.whatsapp.net`;

    await sock.sendMessage(jid, { text: message });

    console.log(`[WhatsApp] ✉ Sent to ${jid}`);
    return res.json({ success: true, to: jid, provider: 'Baileys (WhatsApp Web)' });
  } catch (err: any) {
    console.error('[WhatsApp] Send error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Boot ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 RedPulse WhatsApp Service starting on port ${PORT}...`);
  console.log('   Connecting to WhatsApp...\n');
});

connectToWhatsApp();
