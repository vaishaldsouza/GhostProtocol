import React, { useState, useEffect, useRef } from 'react';
import {
  X, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, HelpCircle,
  RefreshCw, Send, ChevronDown, ChevronUp, Activity, Droplets,
  Clock, User as UserIcon, Info, Sparkles,
} from 'lucide-react';
import { User, EligibilityResult, EligibilityCheck, EligibilityStatus } from '../types';
import {
  fetchAndScreenDonor, screenDonor, answerEligibilityQuestion, QAAnswer, DonorProfile,
} from '../utils/eligibilityEngine';

// ── prop types ────────────────────────────────────────────────────────────────

interface EligibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pass the logged-in donor's User object for auto-screen */
  user?: User;
}

// ── status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<EligibilityStatus, {
  icon: React.ReactNode; bg: string; border: string;
  badge: string; text: string; headline: string;
}> = {
  eligible: {
    icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
    bg:     'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    badge:  'bg-emerald-600 text-white',
    text:   'text-emerald-700 dark:text-emerald-300',
    headline: 'Cleared to Donate',
  },
  needs_review: {
    icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
    bg:     'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    badge:  'bg-amber-500 text-white',
    text:   'text-amber-700 dark:text-amber-300',
    headline: 'Eligible with Advisory',
  },
  deferred: {
    icon: <Clock className="w-6 h-6 text-red-500" />,
    bg:     'bg-red-50 dark:bg-red-950/40',
    border: 'border-red-200 dark:border-red-800',
    badge:  'bg-red-500 text-white',
    text:   'text-red-700 dark:text-red-300',
    headline: 'Temporarily Deferred',
  },
  ineligible: {
    icon: <XCircle className="w-6 h-6 text-slate-500" />,
    bg:     'bg-slate-50 dark:bg-slate-900/60',
    border: 'border-slate-200 dark:border-slate-700',
    badge:  'bg-slate-600 text-white',
    text:   'text-slate-600 dark:text-slate-400',
    headline: 'Permanently Ineligible',
  },
};

const CHECK_STATUS_CFG = {
  pass:    { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
  fail:    { icon: <XCircle      className="w-4 h-4 text-red-500" />,     text: 'text-red-700 dark:text-red-300',         bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800' },
  warn:    { icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,  text: 'text-amber-700 dark:text-amber-300',     bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  unknown: { icon: <HelpCircle   className="w-4 h-4 text-slate-400" />,   text: 'text-slate-500 dark:text-slate-400',     bg: 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700' },
};

// ── sub-components ────────────────────────────────────────────────────────────

function ScoreRing({ score, status }: { score: number; status: EligibilityStatus }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const strokeColor =
    status === 'eligible'     ? '#10b981' :
    status === 'needs_review' ? '#f59e0b' :
    status === 'deferred'     ? '#ef4444' : '#64748b';

  return (
    <div className="relative w-20 h-20">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor"
          strokeWidth="5" className="text-slate-200 dark:text-slate-700" />
        <circle cx="36" cy="36" r={r} fill="none"
          strokeWidth="5"
          strokeDasharray={`${fill} ${circ}`}
          stroke={strokeColor}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{score}</span>
        <span className="text-[9px] font-bold text-slate-400 leading-none mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

function CheckRow({ check }: { check: EligibilityCheck; key?: React.Key }) {
  const [open, setOpen] = useState(check.status !== 'pass');
  const cfg = CHECK_STATUS_CFG[check.status];

  return (
    <div className={`rounded-xl border ${cfg.bg}`}>
      <button
        className="w-full px-3 py-2.5 flex items-center gap-2.5 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <span className="shrink-0">{cfg.icon}</span>
        <span className={`flex-1 text-xs font-bold ${cfg.text}`}>{check.label}</span>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
          check.status === 'pass'    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
          check.status === 'fail'    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
          check.status === 'warn'    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                                       'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
        }`}>
          {check.status}
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
               : <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-3 pb-2.5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed space-y-1">
          <p>{check.detail}</p>
          {check.deferralDuration && (
            <p className="font-semibold">
              Deferral: {check.deferralDuration.replace(/_/g, ' ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ComponentBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold ${
      ok ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
         : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 line-through'
    }`}>
      {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {label}
    </div>
  );
}

// ── Auto-screen tab ───────────────────────────────────────────────────────────

function AutoScreenTab({ user }: { user?: User }) {
  const [result, setResult]   = useState<EligibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  // manual override fields when no user is passed
  const [dob,      setDob]    = useState(user?.dob ?? '');
  const [weight,   setWeight] = useState(user?.weightKg ? String(user.weightKg) : '');
  const [lastDon,  setLastDon]= useState('');
  const [notes,    setNotes]  = useState(user?.medicalNotes ?? '');
  const [gender,   setGender] = useState(user?.gender ?? '');

  const run = async () => {
    setLoading(true);
    let res: EligibilityResult;
    if (user) {
      res = await fetchAndScreenDonor(user);
    } else {
      const profile: DonorProfile = {
        dob:              dob || undefined,
        weightKg:         weight ? parseFloat(weight) : undefined,
        gender:           gender || undefined,
        lastDonationDate: lastDon || undefined,
        medicalNotes:     notes || undefined,
      };
      res = screenDonor(profile);
    }
    setResult(res);
    setLoading(false);
  };

  // Auto-run when user is provided
  useEffect(() => { if (user) run(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const cfg = result ? STATUS_CFG[result.status] : null;

  return (
    <div className="space-y-4">
      {/* Manual input form — only shown if no user passed */}
      {!user && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Enter your details for instant screening
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date of Birth</label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Weight (kg)</label>
              <input type="number" placeholder="e.g. 65" value={weight} onChange={e => setWeight(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Last Donation Date</label>
              <input type="date" value={lastDon} onChange={e => setLastDon(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Medical notes (optional)</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. diabetes, recent tattoo, pregnancy…"
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
          </div>
          <button onClick={run} disabled={loading}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-red-500/20 disabled:opacity-60">
            {loading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Screening…</> : <><ShieldCheck className="w-3.5 h-3.5" /> Run Eligibility Screen</>}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-red-100 dark:border-red-900 border-t-red-600 animate-spin" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Running eligibility screen…</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Checking age · weight · donation timing · medical history</p>
        </div>
      )}

      {/* Re-run button for user mode */}
      {user && !loading && (
        <button onClick={run}
          className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition font-medium">
          <RefreshCw className="w-3.5 h-3.5" /> Re-run screen
        </button>
      )}

      {/* Result */}
      {!loading && result && cfg && (
        <div className="space-y-4 animate-fadeIn">
          {/* Hero result card */}
          <div className={`p-4 rounded-2xl border ${cfg.bg} ${cfg.border} flex items-center gap-4`}>
            <ScoreRing score={result.overallScore} status={result.status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
                  {cfg.headline}
                </span>
                <span className={`text-[10px] font-bold ${cfg.text}`}>
                  Score {result.overallScore}/100
                </span>
              </div>
              <p className={`text-xs font-semibold leading-relaxed ${cfg.text}`}>{result.summary}</p>
              {result.nextEligibleDate && (
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Next eligible: {result.nextEligibleDate}
                  {result.daysUntilEligible !== undefined && ` (${result.daysUntilEligible} days)`}
                </p>
              )}
            </div>
          </div>

          {/* Component eligibility */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
              Donation types
            </p>
            <div className="flex flex-wrap gap-2">
              <ComponentBadge label="Whole Blood" ok={result.canDonateWhole} />
              <ComponentBadge label="Platelets"   ok={result.canDonatePlatelets} />
              <ComponentBadge label="Plasma"      ok={result.canDonatePlasma} />
            </div>
          </div>

          {/* Checks */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
              Screening checks ({result.checks.length})
            </p>
            <div className="space-y-1.5">
              {result.checks.map(c => <CheckRow key={c.id} check={c} />)}
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl">
              <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-1.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Recommendations
              </p>
              <ul className="space-y-1">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                    <span className="text-blue-500 mt-0.5 shrink-0">•</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[10px] text-slate-400 dark:text-slate-600 text-center">
            Screened at {new Date(result.screenedAt).toLocaleString()} · Based on WHO / AABB guidelines
          </p>
        </div>
      )}
    </div>
  );
}

// ── Q&A tab ───────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  text: string;
  answer?: QAAnswer;
}

const PRESET_QUESTIONS = [
  'Can I donate after a COVID vaccine?',
  'I got a tattoo 3 months ago — can I donate?',
  'How often can I donate whole blood?',
  'Can I donate if I am pregnant?',
  'What is the minimum weight to donate?',
  'I have diabetes — am I eligible?',
  'I have had malaria. Can I donate?',
];

function QATab() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    text: 'Ask me anything about blood donation eligibility — I\'ll give you a clear rules-based answer.',
  }]);
  const [input,     setInput]   = useState('');
  const [thinking,  setThinking]= useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const ask = (question: string) => {
    if (!question.trim() || thinking) return;
    const userMsg: Message = { role: 'user', text: question };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setThinking(true);

    // Simulate slight delay for UX realism
    setTimeout(() => {
      const answer  = answerEligibilityQuestion(question);
      const reply   = `**${answer.headline}**\n\n${answer.body}${
        answer.deferralDuration
          ? `\n\n⏱ Deferral period: ${answer.deferralDuration.replace(/_/g, ' ')}`
          : ''
      }\n\n📚 Sources: ${answer.sources.join(', ')}`;
      setMessages(m => [...m, { role: 'assistant', text: reply, answer }]);
      setThinking(false);
    }, 450);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Presets */}
      <div className="flex gap-1.5 flex-wrap">
        {PRESET_QUESTIONS.map(q => (
          <button key={q} onClick={() => ask(q)}
            className="text-[10px] px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium rounded-full border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition truncate max-w-[180px]">
            {q}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[220px] max-h-[340px]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center shrink-0 mt-0.5 mr-2">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            )}
            <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-red-600 text-white rounded-tr-sm font-medium'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'
            } ${
              msg.answer?.eligible === false ? 'border border-red-200 dark:border-red-800' :
              msg.answer?.eligible === true  ? 'border border-emerald-200 dark:border-emerald-800' : ''
            }`}>
              {/* Eligibility pill for assistant messages */}
              {msg.answer && (
                <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 ${
                  msg.answer.eligible === true  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                  msg.answer.eligible === false ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
                                                  'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                }`}>
                  {msg.answer.eligible === true  ? <><CheckCircle2 className="w-3 h-3" /> Eligible</> :
                   msg.answer.eligible === false ? <><XCircle className="w-3 h-3" /> Deferred</> :
                                                   <><AlertTriangle className="w-3 h-3" /> Consult staff</>}
                </div>
              )}
              {msg.text}
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5 ml-2">
                <UserIcon className="w-3 h-3 text-slate-600 dark:text-slate-300" />
              </div>
            )}
          </div>
        ))}
        {thinking && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div className="flex gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm">
              {[0, 150, 300].map(d => (
                <div key={d} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={e => { e.preventDefault(); ask(input); }}
        className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about eligibility, deferral, medications…"
          className="flex-1 px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium" />
        <button type="submit" disabled={!input.trim() || thinking}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-2xl flex items-center gap-1.5 shadow-sm shadow-red-500/20 disabled:opacity-50 transition">
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export const EligibilityAiModal: React.FC<EligibilityModalProps> = ({
  isOpen, onClose, user,
}) => {
  const [tab, setTab] = useState<'screen' | 'qa'>('screen');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-red-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Donation Eligibility AI</h3>
              <p className="text-xs text-red-100">
                {user ? `Screening ${user.name ?? user.fullName}` : 'Health & timing auto-screener'} · WHO / AABB guidelines
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <button onClick={() => setTab('screen')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
              tab === 'screen'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}>
            <Activity className="w-3.5 h-3.5" />
            Auto-Screen
            {user && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" />}
          </button>
          <button onClick={() => setTab('qa')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
              tab === 'qa'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}>
            <Sparkles className="w-3.5 h-3.5" />
            Ask AI
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {tab === 'screen' ? <AutoScreenTab user={user} /> : <QATab />}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <p className="text-[10px] text-slate-400 dark:text-slate-600">
            For medical advice, always consult a qualified healthcare professional.
          </p>
          <button onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition">
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
