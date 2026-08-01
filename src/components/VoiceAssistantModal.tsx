import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Mic, MicOff, Volume2, VolumeX, ChevronRight,
  HelpCircle, AlertTriangle, CheckCircle2, Activity,
  BarChart3, Siren, ShieldCheck, Globe, History, Trash2,
} from 'lucide-react';
import {
  VoiceSession, VoiceCommand, RecognitionStatus,
  speak, stopSpeaking, isSpeechRecognitionSupported, isSpeechSynthesisSupported,
  SUPPORTED_LANGUAGES, generateWaveformBars, COMMAND_PATTERNS,
  askAiVoiceAssistant, stopMurfAudio, playMurfAudio, askGeminiAI
} from '../utils/voiceAssistant';

// ── Types ────────────────────────────────────────────────────────────────────

export interface VoiceActionHandlers {
  onOpenEmergency:   () => void;
  onOpenEligibility: () => void;
  onOpenShortage:    () => void;
  onClose:           () => void;
}

interface VoiceAssistantModalProps {
  isOpen:   boolean;
  onClose:  () => void;
  handlers: VoiceActionHandlers;
}

interface HistoryEntry {
  id:         string;
  role:       'user' | 'assistant';
  text:       string;
  commandId?: string;
  timestamp:  number;
}

// ── Command icon map ─────────────────────────────────────────────────────────

const COMMAND_ICONS: Record<string, React.ReactNode> = {
  open_emergency:             <Siren        className="w-4 h-4" />,
  open_eligibility:           <ShieldCheck  className="w-4 h-4" />,
  check_eligibility_question: <ShieldCheck  className="w-4 h-4" />,
  open_shortage:              <BarChart3    className="w-4 h-4" />,
  open_priority_queue:        <Siren        className="w-4 h-4" />,
  read_priority:              <Activity     className="w-4 h-4" />,
  help:                       <HelpCircle   className="w-4 h-4" />,
  stop:                       <MicOff       className="w-4 h-4" />,
  unknown:                    <AlertTriangle className="w-4 h-4" />,
};

const COMMAND_COLORS: Record<string, string> = {
  open_emergency:             'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50',
  open_eligibility:           'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50',
  check_eligibility_question: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50',
  open_shortage:              'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50',
  open_priority_queue:        'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50',
  read_priority:              'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50',
  help:                       'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
  stop:                       'text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-800',
  unknown:                    'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50',
};

// ── Animated waveform ────────────────────────────────────────────────────────

function Waveform({ active }: { active: boolean }) {
  const [bars, setBars] = useState(() => generateWaveformBars(28, false));

  useEffect(() => {
    if (!active) {
      setBars(generateWaveformBars(28, false));
      return;
    }
    const id = setInterval(() => setBars(generateWaveformBars(28, true)), 120);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className="flex items-end justify-center gap-0.5 h-12 w-full">
      {bars.map((h, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-100 ${
            active ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'
          }`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RecognitionStatus }) {
  const cfg: Record<RecognitionStatus, { label: string; dot: string; text: string }> = {
    idle:        { label: 'Ready',      dot: 'bg-slate-400',   text: 'text-slate-500 dark:text-slate-400' },
    listening:   { label: 'Listening',  dot: 'bg-red-500 animate-ping', text: 'text-red-600 dark:text-red-400 font-bold' },
    processing:  { label: 'Processing', dot: 'bg-amber-500 animate-pulse', text: 'text-amber-600 dark:text-amber-400' },
    speaking:    { label: 'Speaking',   dot: 'bg-blue-500 animate-pulse', text: 'text-blue-600 dark:text-blue-400' },
    error:       { label: 'Error',      dot: 'bg-red-600',     text: 'text-red-600 dark:text-red-400' },
    unsupported: { label: 'Unsupported',dot: 'bg-slate-400',   text: 'text-slate-500' },
  };
  const c = cfg[status];
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      <span className={`text-xs font-semibold ${c.text}`}>{c.label}</span>
    </div>
  );
}

// ── History message bubble ────────────────────────────────────────────────────

function MessageBubble({ entry }: { entry: HistoryEntry; key?: React.Key }) {
  const isUser = entry.role === 'user';
  const colorClass = entry.commandId
    ? COMMAND_COLORS[entry.commandId] ?? COMMAND_COLORS.unknown
    : '';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center shrink-0 mt-0.5">
          <Mic className="w-3 h-3 text-white" />
        </div>
      )}
      <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
        isUser
          ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tr-sm'
          : `rounded-tl-sm border ${
              entry.commandId && entry.commandId !== 'unknown'
                ? colorClass + ' border-current/20'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
            }`
      }`}>
        {!isUser && entry.commandId && entry.commandId !== 'unknown' && (
          <div className="flex items-center gap-1.5 mb-1.5 opacity-80">
            {COMMAND_ICONS[entry.commandId]}
            <span className="text-[10px] font-bold uppercase tracking-wide">
              {entry.commandId.replace(/_/g, ' ')}
            </span>
          </div>
        )}
        <p className="font-medium">{entry.text}</p>
        <p className="text-[10px] opacity-40 mt-1 text-right">
          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {isUser && (
        <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">U</span>
        </div>
      )}
    </div>
  );
}

// ── Command shortcut pill ─────────────────────────────────────────────────────

function CommandPill({ label, example, onClick }: {
  label: string; example: string; onClick: () => void; key?: React.Key;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 transition group"
      title={`Say: "${example}"`}
    >
      <ChevronRight className="w-3 h-3 opacity-50 group-hover:opacity-100" />
      {label}
    </button>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  handlers,
}) => {
  const [status,          setStatus]          = useState<RecognitionStatus>('idle');
  const [interimText,     setInterimText]      = useState('');
  const [history,         setHistory]          = useState<HistoryEntry[]>([]);
  const [muteAudio,       setMuteAudio]        = useState(false);
  const [selectedLang,    setSelectedLang]     = useState('en-IN');
  const [showLangPicker,  setShowLangPicker]   = useState(false);
  const [errorMsg,        setErrorMsg]         = useState('');
  const [isSupported,     setIsSupported]      = useState(true);
  const [showShortcuts,   setShowShortcuts]    = useState(true);
  const [useMurfAI,       setUseMurfAI]        = useState(false);
  const [useGeminiAI,     setUseGeminiAI]      = useState(false);
  const [murfVoiceId,     setMurfVoiceId]      = useState('');
  const [isAiSpeaking,    setIsAiSpeaking]     = useState(false);

  const sessionRef  = useRef<VoiceSession | null>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  // ── Check support on mount ──────────────────────────────────────────────
  useEffect(() => {
    const supported = isSpeechRecognitionSupported();
    setIsSupported(supported);
    if (!supported) setStatus('unsupported');
  }, []);

  // ── Scroll history to bottom ─────────────────────────────────────────────
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, interimText]);

  // ── Cleanup on close ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      sessionRef.current?.stop();
      stopSpeaking();
      stopMurfAudio();
      setStatus('idle');
      setInterimText('');
      setIsAiSpeaking(false);
    }
  }, [isOpen]);

  // ── Speak helper (respects mute and AI integration) ───────────────────────
  const say = useCallback(async (text: string, onEnd?: () => void) => {
    if (muteAudio || !isSpeechSynthesisSupported()) {
      onEnd?.();
      return;
    }
    
    setStatus('speaking');
    setIsAiSpeaking(true);

    try {
      if (useMurfAI) {
        // Use Murf AI for professional voice
        await playMurfAudio(text, { voiceId: murfVoiceId || undefined });
      } else {
        // Use browser TTS
        speak(text, {
          lang: selectedLang,
          onEnd: () => {
            setStatus('idle');
            setIsAiSpeaking(false);
            onEnd?.();
          },
        });
      }
    } catch (error) {
      console.error('Error speaking:', error);
      // Fallback to browser TTS
      speak(text, {
        lang: selectedLang,
        onEnd: () => {
          setStatus('idle');
          setIsAiSpeaking(false);
          onEnd?.();
        },
      });
    }
  }, [muteAudio, selectedLang, useMurfAI, murfVoiceId]);

  // ── Execute voice command action ──────────────────────────────────────────
  const executeAction = useCallback((cmd: VoiceCommand) => {
    switch (cmd.id) {
      case 'open_emergency':
        say('Opening the AI emergency assistant.', () => {
          handlers.onOpenEmergency();
          onClose();
        });
        break;
      case 'open_eligibility':
      case 'check_eligibility_question':
        say('Opening eligibility screen.', () => {
          handlers.onOpenEligibility();
          onClose();
        });
        break;
      case 'open_shortage':
        say('Opening shortage prediction.', () => {
          handlers.onOpenShortage();
          onClose();
        });
        break;
      case 'open_priority_queue':
      case 'read_priority':
        say('Opening the emergency priority queue.', () => {
          handlers.onOpenEmergency();
          onClose();
        });
        break;
      case 'stop':
        sessionRef.current?.stop();
        stopSpeaking();
        stopMurfAudio();
        setStatus('idle');
        setIsAiSpeaking(false);
        say('Voice assistant stopped.');
        break;
      default:
        break;
    }
  }, [say, handlers, onClose]);

  // ── Start listening ───────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!isSupported) return;

    const session = new VoiceSession(selectedLang, false);
    sessionRef.current = session;

    session.setCallbacks({
      onStart: () => {
        setStatus('listening');
        setInterimText('');
        setErrorMsg('');
        setShowShortcuts(false);
      },
      onTranscript: (text, isFinal) => {
        if (isFinal) {
          setInterimText('');
        } else {
          setInterimText(text);
        }
      },
      onCommand: async (cmd, response) => {
        setStatus('processing');
        setInterimText('');

        // Add user message
        setHistory(h => [...h, {
          id:        `u-${Date.now()}`,
          role:      'user',
          text:      cmd.transcript,
          timestamp: Date.now(),
        }]);

        // If unknown command and Gemini AI is enabled, use AI to generate response
        let finalResponse = response;
        if (cmd.id === 'unknown' && useGeminiAI) {
          try {
            const geminiResult = await askGeminiAI(cmd.transcript, {
              context: 'You are a helpful medical assistant for RedPulse AI, a blood donation platform. Help users with their questions about blood donation, eligibility, and emergency requests.'
            });
            if (geminiResult.success && geminiResult.response) {
              finalResponse = geminiResult.response;
            }
          } catch (error) {
            console.error('Gemini AI error:', error);
            // Keep original response
          }
        }

        // Short processing delay for UX
        setTimeout(() => {
          // Add assistant response
          setHistory(h => [...h, {
            id:        `a-${Date.now()}`,
            role:      'assistant',
            text:      finalResponse,
            commandId: cmd.id,
            timestamp: Date.now(),
          }]);

          say(finalResponse, () => executeAction(cmd));
        }, 300);
      },
      onError: (err) => {
        setErrorMsg(err);
        setStatus('error');
        setInterimText('');
      },
      onEnd: () => {
        if (status === 'listening') setStatus('idle');
      },
    });

    session.start();
  }, [isSupported, selectedLang, say, executeAction, status, useGeminiAI]);

  // ── Stop listening ────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    stopSpeaking();
    stopMurfAudio();
    setStatus('idle');
    setIsAiSpeaking(false);
    setInterimText('');
  }, []);

  // ── Simulate a command (shortcut pills) ──────────────────────────────────
  const simulateCommand = useCallback((phrase: string) => {
    const { parseCommand, buildResponse } = require('../utils/voiceAssistant');
    const cmd      = parseCommand(phrase) as VoiceCommand;
    const response = buildResponse(cmd) as string;

    setHistory(h => [...h, {
      id: `u-${Date.now()}`, role: 'user', text: phrase, timestamp: Date.now(),
    }]);
    setTimeout(() => {
      setHistory(h => [...h, {
        id: `a-${Date.now()}`, role: 'assistant', text: response, commandId: cmd.id, timestamp: Date.now(),
      }]);
      say(response, () => executeAction(cmd));
    }, 300);
  }, [say, executeAction]);

  if (!isOpen) return null;

  const isListening = status === 'listening';
  const isBusy      = status === 'processing' || status === 'speaking';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className={`px-6 py-4 flex items-center justify-between shrink-0 transition-colors duration-500 ${
          isListening
            ? 'bg-gradient-to-r from-red-600 to-red-700'
            : 'bg-gradient-to-r from-slate-800 to-slate-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isListening ? 'bg-white/15' : 'bg-white/10'}`}>
              <Mic className={`w-5 h-5 ${isListening ? 'text-white animate-pulse' : 'text-slate-300'}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Voice Assistant</h3>
              <p className="text-xs text-slate-300">Hands-free emergency coordination</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mute toggle */}
            <button
              onClick={() => { setMuteAudio(v => !v); stopSpeaking(); }}
              className="p-1.5 rounded-full hover:bg-white/20 text-slate-300 transition"
              title={muteAudio ? 'Unmute' : 'Mute voice'}
            >
              {muteAudio
                ? <VolumeX className="w-4 h-4 text-amber-400" />
                : <Volume2 className="w-4 h-4" />}
            </button>
            {/* Language picker toggle */}
            <button
              onClick={() => setShowLangPicker(v => !v)}
              className="p-1.5 rounded-full hover:bg-white/20 text-slate-300 transition"
              title="Language"
            >
              <Globe className="w-4 h-4" />
            </button>
            {/* Murf AI toggle */}
            <button
              onClick={() => setUseMurfAI(v => !v)}
              className={`p-1.5 rounded-full hover:bg-white/20 transition ${useMurfAI ? 'text-purple-400' : 'text-slate-300'}`}
              title="Toggle Murf AI Voice"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            {/* Gemini AI toggle */}
            <button
              onClick={() => setUseGeminiAI(v => !v)}
              className={`p-1.5 rounded-full hover:bg-white/20 transition ${useGeminiAI ? 'text-green-400' : 'text-slate-300'}`}
              title="Toggle Gemini AI Responses"
            >
              <Activity className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-slate-300 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Language picker ── */}
        {showLangPicker && (
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5 shrink-0">
            {SUPPORTED_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => { setSelectedLang(lang.code); setShowLangPicker(false); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                  selectedLang === lang.code
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-red-400'
                }`}
              >
                {lang.nativeLabel} <span className="opacity-60 font-normal ml-1">{lang.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
          
          {/* AI Settings */}
          {(useMurfAI || useGeminiAI) && (
            <div className="px-4 py-2 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-200 dark:border-purple-800 flex items-center gap-2 shrink-0">
              <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-bold text-purple-800 dark:text-purple-300">
                AI Enhanced: {useMurfAI && 'Murf Voice'} {useMurfAI && useGeminiAI && '+'} {useGeminiAI && 'Gemini Responses'}
              </span>
            </div>
          )}

          {/* Unsupported warning */}
          {!isSupported && (
            <div className="m-4 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Browser not supported</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Speech recognition requires Chrome, Edge, or Safari. You can still use the command shortcuts below.
                </p>
              </div>
            </div>
          )}

          {/* Error message */}
          {errorMsg && (
            <div className="mx-4 mt-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-300 font-medium">{errorMsg}</p>
            </div>
          )}

          {/* Waveform + status area */}
          <div className="px-6 pt-5 pb-3 shrink-0">
            <Waveform active={isListening} />
            <div className="flex items-center justify-between mt-2">
              <StatusBadge status={status} />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {SUPPORTED_LANGUAGES.find(l => l.code === selectedLang)?.label ?? 'English'}
                </span>
                {useMurfAI && (
                  <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[9px] font-bold rounded-full">
                    Murf AI
                  </span>
                )}
                {useGeminiAI && (
                  <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-[9px] font-bold rounded-full">
                    Gemini AI
                  </span>
                )}
              </div>
            </div>
            {/* Interim transcript */}
            {interimText && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic text-center animate-pulse">
                "{interimText}…"
              </p>
            )}
          </div>

          {/* Mic button */}
          <div className="flex justify-center py-3 shrink-0">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isBusy || !isSupported}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-500/40'
                  : 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 shadow-slate-500/20'
              }`}
              aria-label={isListening ? 'Stop listening' : 'Start listening'}
            >
              {isListening && (
                <span className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-30" />
              )}
              {isListening
                ? <MicOff className="w-8 h-8 text-white" />
                : <Mic    className="w-8 h-8 text-white" />}
            </button>
          </div>

          <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 pb-3">
            {isListening ? 'Tap to stop · Speak your command clearly' : 'Tap to speak · or use shortcuts below'}
          </p>

          {/* Conversation history */}
          {history.length > 0 && (
            <div className="px-4 pb-3 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <History className="w-3 h-3" /> Conversation
                </span>
                <button
                  onClick={() => setHistory([])}
                  className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>
              {history.map(entry => <MessageBubble key={entry.id} entry={entry} />)}
              <div ref={historyEndRef} />
            </div>
          )}

          {/* Command shortcuts */}
          <div className="px-4 pb-5 shrink-0">
            <button
              onClick={() => setShowShortcuts(v => !v)}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition mb-2"
            >
              <ChevronRight className={`w-3 h-3 transition-transform ${showShortcuts ? 'rotate-90' : ''}`} />
              Command shortcuts
            </button>
            {showShortcuts && (
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Request Blood',      example: 'Emergency blood request' },
                  { label: 'Check Eligibility',  example: 'Can I donate blood?' },
                  { label: 'Blood Shortage',     example: 'Show shortage prediction' },
                  { label: 'Priority Queue',     example: 'Show priority queue' },
                  { label: 'Vaccine question',   example: 'Can I donate after a vaccine?' },
                  { label: 'Help',               example: 'Help' },
                ].map(({ label, example }) => (
                  <CommandPill
                    key={label}
                    label={label}
                    example={example}
                    onClick={() => simulateCommand(example)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <p className="text-[10px] text-slate-400 dark:text-slate-600">
            Powered by Web Speech API · WHO / AABB guidelines
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
