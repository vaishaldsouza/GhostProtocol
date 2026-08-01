// ── Browser API shim ──────────────────────────────────────────────────────────
const SpeechRecognitionAPI =
  (window as any).SpeechRecognition ||
  (window as any).webkitSpeechRecognition ||
  null;

export const isSpeechRecognitionSupported = (): boolean =>
  SpeechRecognitionAPI !== null;

export const isSpeechSynthesisSupported = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

// ── Voice command types ───────────────────────────────────────────────────────

export type VoiceCommandId =
  | 'open_emergency'
  | 'open_eligibility'
  | 'open_shortage'
  | 'open_priority_queue'
  | 'check_eligibility_question'
  | 'find_donors'
  | 'read_priority'
  | 'help'
  | 'stop'
  | 'unknown';

export interface VoiceCommand {
  id: VoiceCommandId;
  transcript: string;
  confidence: number;
  /** Extracted parameters from the utterance */
  params: Record<string, string>;
  matchedAt: number; // Date.now()
}

export interface VoiceResponse {
  text: string;          // what the assistant says back
  action?: VoiceCommandId;
  params?: Record<string, string>;
}

// ── Command pattern registry ──────────────────────────────────────────────────

interface CommandPattern {
  id: VoiceCommandId;
  patterns: RegExp[];
  extract?: (transcript: string) => Record<string, string>;
  response: (params: Record<string, string>) => string;
}

const BLOOD_TYPE_REGEX =
  /\b([AaBbOo][AaBb]?[\s-]?(positive|negative|plus|minus|\+|-)?)\b/;

function extractBloodType(text: string): string {
  const match = text.match(BLOOD_TYPE_REGEX);
  if (!match) return '';
  let bt = match[1].replace(/\s/g, '').replace(/positive|plus/i, '+').replace(/negative|minus/i, '-').toUpperCase();
  // normalise e.g. "A POSITIVE" → "A+"
  if (!/[+-]$/.test(bt)) bt += '+';
  return bt;
}

function extractUnits(text: string): string {
  const match = text.match(/(\d+)\s*(unit|units|pint|pints|bag|bags)?/i);
  return match ? match[1] : '1';
}

function extractHospital(text: string): string {
  const match = text.match(/(?:at|for|to)\s+([A-Z][a-zA-Z\s]+(?:hospital|clinic|centre|center|medical))/i);
  return match ? match[1].trim() : '';
}

export const COMMAND_PATTERNS: CommandPattern[] = [
  // ── Emergency / blood request ─────────────────────────────────────────────
  {
    id: 'open_emergency',
    patterns: [
      /\b(emergency|urgent|sos|critical|blood\s*request|request\s*blood|need\s*blood|blood\s*needed)\b/i,
      /\b(find\s*donors?|match\s*donors?|donor\s*search)\b/i,
    ],
    extract: (t) => ({
      bloodType: extractBloodType(t),
      units:     extractUnits(t),
      hospital:  extractHospital(t),
    }),
    response: (p) =>
      p.bloodType
        ? `Opening emergency assistant. I heard you need ${p.units} unit${+p.units !== 1 ? 's' : ''} of ${p.bloodType} blood${p.hospital ? ' at ' + p.hospital : ''}. Filling in the details now.`
        : 'Opening the AI emergency assistant. Please describe the blood request.',
  },

  // ── Eligibility ───────────────────────────────────────────────────────────
  {
    id: 'open_eligibility',
    patterns: [
      /\b(eligib|can\s*i\s*donate|am\s*i\s*eligible|check\s*eligib|donation\s*status)\b/i,
    ],
    extract: () => ({}),
    response: () =>
      'Opening the donation eligibility screen. I will run an auto-screen of your profile right away.',
  },
  {
    id: 'check_eligibility_question',
    patterns: [
      /\b(can\s*i\s*donate\s*(if|after|with|when)|eligible\s*(if|after|with|when)|donate\s*(after|with|if))\b/i,
    ],
    extract: (t) => ({ question: t }),
    response: (p) => {
      // answer inline via eligibilityEngine
      try {
        const { answerEligibilityQuestion } = require('./eligibilityEngine');
        const ans = answerEligibilityQuestion(p.question ?? '');
        return `${ans.headline}. ${ans.body.slice(0, 200)}`;
      } catch {
        return 'Let me open the eligibility assistant for you.';
      }
    },
  },

  // ── Shortage prediction ───────────────────────────────────────────────────
  {
    id: 'open_shortage',
    patterns: [
      /\b(shortage|predict|forecast|blood\s*supply|inventory\s*status|blood\s*stock)\b/i,
    ],
    extract: () => ({}),
    response: () =>
      'Opening the shortage prediction dashboard. I will load the latest AI forecast now.',
  },

  // ── Priority queue ────────────────────────────────────────────────────────
  {
    id: 'open_priority_queue',
    patterns: [
      /\b(priority\s*queue|ranked\s*requests?|critical\s*requests?|p1\s*requests?|top\s*requests?)\b/i,
    ],
    extract: () => ({}),
    response: () =>
      'Here is the current emergency priority queue. I will read the top requests.',
  },
  {
    id: 'read_priority',
    patterns: [
      /\b(read\s*(priority|queue|requests?)|what\s*(are|is)\s*the\s*(top|critical|urgent)\s*requests?|any\s*critical)\b/i,
    ],
    extract: () => ({}),
    response: () => 'Fetching the current priority queue and reading critical items.',
  },

  // ── Help ──────────────────────────────────────────────────────────────────
  {
    id: 'help',
    patterns: [
      /\b(help|what\s*can\s*you\s*do|commands?|what\s*do\s*you\s*(know|support)|assistant)\b/i,
    ],
    extract: () => ({}),
    response: () =>
      'I can help you with the following voice commands: ' +
      '"Request blood" to open the emergency assistant, ' +
      '"Check eligibility" to screen your donation status, ' +
      '"Show shortage" to see blood supply forecasts, ' +
      '"Priority queue" to view ranked emergency requests, ' +
      'or ask any eligibility question like "Can I donate after a vaccine?".',
  },

  // ── Stop ──────────────────────────────────────────────────────────────────
  {
    id: 'stop',
    patterns: [
      /\b(stop|cancel|close|dismiss|never\s*mind|that'?s?\s*all|exit)\b/i,
    ],
    extract: () => ({}),
    response: () => 'Voice assistant stopped. Tap the microphone to speak again.',
  },
];

// ── Command parser ────────────────────────────────────────────────────────────

export function parseCommand(transcript: string): VoiceCommand {
  const lower = transcript.toLowerCase().trim();

  for (const cp of COMMAND_PATTERNS) {
    for (const pattern of cp.patterns) {
      if (pattern.test(lower)) {
        const params = cp.extract ? cp.extract(transcript) : {};
        return {
          id:         cp.id,
          transcript,
          confidence: 0.9,
          params,
          matchedAt:  Date.now(),
        };
      }
    }
  }

  return {
    id:         'unknown',
    transcript,
    confidence: 0,
    params:     {},
    matchedAt:  Date.now(),
  };
}

export function buildResponse(cmd: VoiceCommand): string {
  if (cmd.id === 'unknown') {
    return `I heard: "${cmd.transcript}". I'm not sure what to do with that. Say "help" for available commands.`;
  }
  const cp = COMMAND_PATTERNS.find((p) => p.id === cmd.id);
  return cp ? cp.response(cmd.params) : "I'll take care of that.";
}

// ── TTS engine ────────────────────────────────────────────────────────────────

export interface SpeakOptions {
  lang?: string;
  rate?: number;   // 0.1 – 10
  pitch?: number;  // 0 – 2
  volume?: number; // 0 – 1
  onEnd?: () => void;
}

const LANG_MAP: Record<string, string> = {
  english: 'en-IN',
  hindi:   'hi-IN',
  tamil:   'ta-IN',
  telugu:  'te-IN',
  bengali: 'bn-IN',
  marathi: 'mr-IN',
};

export function speak(text: string, options: SpeakOptions = {}): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();

  const utt       = new SpeechSynthesisUtterance(text);
  utt.lang        = options.lang ?? 'en-IN';
  utt.rate        = options.rate  ?? 0.95;
  utt.pitch       = options.pitch ?? 1.0;
  utt.volume      = options.volume ?? 1.0;
  if (options.onEnd) utt.onend = options.onEnd;

  window.speechSynthesis.speak(utt);
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices();
}

// ── SpeechRecognition session manager ─────────────────────────────────────────

export type RecognitionStatus =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error'
  | 'unsupported';

export interface RecognitionCallbacks {
  onStart?:       () => void;
  onTranscript?:  (interim: string, isFinal: boolean) => void;
  onCommand?:     (cmd: VoiceCommand, response: string) => void;
  onError?:       (error: string) => void;
  onEnd?:         () => void;
}

export class VoiceSession {
  private recognition: any = null;
  private callbacks: RecognitionCallbacks = {};
  private _lang: string = 'en-IN';
  private _continuous: boolean = false;

  constructor(lang = 'en-IN', continuous = false) {
    this._lang       = lang;
    this._continuous = continuous;
  }

  get isSupported(): boolean { return isSpeechRecognitionSupported(); }

  setCallbacks(cb: RecognitionCallbacks): void {
    this.callbacks = cb;
  }

  setLang(lang: string): void {
    this._lang = LANG_MAP[lang.toLowerCase()] ?? lang;
  }

  start(): void {
    if (!this.isSupported) {
      this.callbacks.onError?.('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    this.stop(); // clean up any previous session

    this.recognition                   = new SpeechRecognitionAPI();
    this.recognition.lang              = this._lang;
    this.recognition.continuous        = this._continuous;
    this.recognition.interimResults    = true;
    this.recognition.maxAlternatives   = 1;

    this.recognition.onstart = () => this.callbacks.onStart?.();

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript   = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (interimTranscript) {
        this.callbacks.onTranscript?.(interimTranscript, false);
      }

      if (finalTranscript) {
        this.callbacks.onTranscript?.(finalTranscript, true);
        const cmd      = parseCommand(finalTranscript);
        const response = buildResponse(cmd);
        this.callbacks.onCommand?.(cmd, response);
      }
    };

    this.recognition.onerror = (event: any) => {
      const msg =
        event.error === 'not-allowed'
          ? 'Microphone access was denied. Please allow microphone permissions in your browser.'
          : event.error === 'no-speech'
          ? 'No speech detected. Please speak clearly and try again.'
          : event.error === 'network'
          ? 'Network error during speech recognition. Please check your connection.'
          : `Speech recognition error: ${event.error}`;
      this.callbacks.onError?.(msg);
    };

    this.recognition.onend = () => this.callbacks.onEnd?.();

    this.recognition.start();
  }

  stop(): void {
    if (this.recognition) {
      try { this.recognition.stop(); } catch { /* ignore */ }
      this.recognition = null;
    }
  }
}

// ── Singleton session factory ─────────────────────────────────────────────────

let _session: VoiceSession | null = null;

export function getVoiceSession(lang = 'en-IN'): VoiceSession {
  if (!_session) _session = new VoiceSession(lang);
  return _session;
}

// ── Language helpers ──────────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', label: 'English',         nativeLabel: 'English' },
  { code: 'hi-IN', label: 'Hindi',           nativeLabel: 'हिंदी' },
  { code: 'ta-IN', label: 'Tamil',           nativeLabel: 'தமிழ்' },
  { code: 'te-IN', label: 'Telugu',          nativeLabel: 'తెలుగు' },
  { code: 'bn-IN', label: 'Bengali',         nativeLabel: 'বাংলা' },
  { code: 'mr-IN', label: 'Marathi',         nativeLabel: 'मराठी' },
];

// ── Waveform sample data generator (for UI animation) ─────────────────────────

export function generateWaveformBars(count = 20, active = false): number[] {
  return Array.from({ length: count }, () =>
    active ? Math.random() * 80 + 20 : Math.random() * 15 + 5,
  );
}
