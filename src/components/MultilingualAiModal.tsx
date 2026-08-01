import React, { useState, useCallback } from 'react';
import {
  X, Languages, ChevronDown, ChevronUp, Volume2,
  CheckCircle2, AlertTriangle, Siren, Droplets,
  MessageSquare, BookOpen, Heart, RefreshCw,
} from 'lucide-react';
import { User } from '../types';
import {
  LANGUAGES, EMERGENCY_PHRASES, ELIGIBILITY_QA,
  t, getLanguage, Language, TranslationKey,
} from '../utils/i18n';
import { speak, isSpeechSynthesisSupported } from '../utils/voiceAssistant';

// ── Props ─────────────────────────────────────────────────────────────────────

interface MultilingualAiModalProps {
  isOpen:  boolean;
  onClose: () => void;
  user?:   User;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type TabId = 'phrases' | 'eligibility' | 'faq' | 'translator';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'phrases',    label: 'Emergency',   icon: <Siren       className="w-3.5 h-3.5" /> },
  { id: 'eligibility',label: 'Eligibility', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { id: 'faq',        label: 'FAQ',         icon: <BookOpen    className="w-3.5 h-3.5" /> },
  { id: 'translator', label: 'Translator',  icon: <MessageSquare className="w-3.5 h-3.5" /> },
];

function speakText(text: string, langCode: string) {
  if (isSpeechSynthesisSupported()) speak(text, { lang: langCode });
}

// ── Language selector ─────────────────────────────────────────────────────────

function LanguageSelector({
  selected, onChange,
}: { selected: string; onChange: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const lang = getLanguage(selected);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-red-400 transition min-w-[140px] justify-between"
      >
        <span className="flex items-center gap-1.5">
          <span>{lang.flag}</span>
          <span>{lang.native}</span>
          <span className="text-slate-400 font-normal">({lang.label})</span>
        </span>
        {open ? <ChevronUp className="w-3 h-3 text-slate-400 shrink-0" />
               : <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden min-w-[180px]">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => { onChange(l.code); setOpen(false); }}
              className={`w-full px-4 py-2.5 flex items-center gap-2.5 text-xs hover:bg-red-50 dark:hover:bg-red-950/40 transition text-left ${
                l.code === selected
                  ? 'bg-red-50 dark:bg-red-950/40 font-bold text-red-600 dark:text-red-400'
                  : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span className="font-bold">{l.native}</span>
              <span className="text-slate-400 font-normal ml-auto">{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Emergency phrases tab ─────────────────────────────────────────────────────

function PhrasesTab({ lang }: { lang: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        Tap a phrase to see all translations. Press <Volume2 className="w-3 h-3 inline" /> to hear it spoken.
      </p>
      {EMERGENCY_PHRASES.map(phrase => {
        const isOpen = expanded === phrase.id;
        const primaryText = phrase.phrases[lang] ?? phrase.phrases['en-IN'];

        return (
          <div key={phrase.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 overflow-hidden">
            {/* Primary language row */}
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={() => setExpanded(isOpen ? null : phrase.id)}
                className="flex-1 text-left"
              >
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{primaryText}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                  {getLanguage(lang).label}
                </p>
              </button>
              <button
                onClick={() => speakText(primaryText, lang)}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition shrink-0"
                title="Listen"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setExpanded(isOpen ? null : phrase.id)}
                className="p-1.5 text-slate-400 shrink-0"
              >
                {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* All language translations */}
            {isOpen && (
              <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                {LANGUAGES.filter(l => l.code !== lang).map(l => (
                  <div key={l.code} className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-base shrink-0">{l.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug">
                        {phrase.phrases[l.code]}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{l.native} · {l.label}</p>
                    </div>
                    <button
                      onClick={() => speakText(phrase.phrases[l.code] ?? '', l.code)}
                      className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-400 transition shrink-0"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Eligibility Q&A tab ───────────────────────────────────────────────────────

function EligibilityTab({ lang }: { lang: string }) {
  const [expanded, setExpanded] = useState<number | null>(0);
  const qas = ELIGIBILITY_QA[lang] ?? ELIGIBILITY_QA['en-IN'];

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        Common donation eligibility questions answered in {getLanguage(lang).label}.
      </p>
      {qas.map((qa, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="w-full px-4 py-3 flex items-center gap-2 text-left"
          >
            <span className="flex-1 text-xs font-bold text-slate-800 dark:text-slate-200">{qa.question}</span>
            {expanded === i
              ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              : <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          </button>
          {expanded === i && (
            <div className="px-4 pb-3 border-t border-slate-100 dark:border-slate-800 pt-2">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{qa.answer}</p>
              <button
                onClick={() => speakText(qa.answer, lang)}
                className="mt-2 flex items-center gap-1 text-[11px] text-red-500 hover:text-red-700 transition font-medium"
              >
                <Volume2 className="w-3 h-3" /> Listen
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── FAQ tab ───────────────────────────────────────────────────────────────────

const FAQ_KEYS: { key: TranslationKey; icon: React.ReactNode }[] = [
  { key: 'faq_how_long',  icon: <RefreshCw  className="w-3.5 h-3.5 text-blue-500" /> },
  { key: 'faq_pain',      icon: <Heart      className="w-3.5 h-3.5 text-red-500" /> },
  { key: 'faq_recovery',  icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> },
  { key: 'faq_diet',      icon: <Droplets   className="w-3.5 h-3.5 text-cyan-500" /> },
  { key: 'faq_frequency', icon: <RefreshCw  className="w-3.5 h-3.5 text-amber-500" /> },
  { key: 'universal_donor',     icon: <Droplets className="w-3.5 h-3.5 text-red-600" /> },
  { key: 'universal_recipient', icon: <Droplets className="w-3.5 h-3.5 text-purple-500" /> },
];

function FaqTab({ lang }: { lang: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        Key blood donation facts in {getLanguage(lang).label}.
      </p>
      {FAQ_KEYS.map(({ key, icon }) => {
        const text = t(key, lang);
        return (
          <div key={key}
            className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
            <span className="mt-0.5 shrink-0">{icon}</span>
            <p className="flex-1 text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{text}</p>
            <button
              onClick={() => speakText(text, lang)}
              className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-400 transition shrink-0"
            >
              <Volume2 className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Live translator tab ───────────────────────────────────────────────────────

const TRANSLATE_SAMPLES = [
  'I need blood urgently.',
  'What is your blood type?',
  'Please come to the hospital.',
  'Thank you for saving my life.',
  'Are you available to donate now?',
  'The donation centre is open today.',
  'You are eligible to donate blood.',
];

function TranslatorTab({ fromLang, toLang }: { fromLang: string; toLang: string }) {
  const [input, setInput]   = useState('');
  const [result, setResult] = useState('');

  // Lookup-based "translation": find a phrase that matches input in fromLang, return toLang version
  const handleTranslate = useCallback(() => {
    const lower = input.toLowerCase().trim();
    if (!lower) return;

    // Search EMERGENCY_PHRASES first
    for (const ep of EMERGENCY_PHRASES) {
      const src = (ep.phrases[fromLang] ?? ep.phrases['en-IN']).toLowerCase();
      if (src.includes(lower) || lower.includes(src.slice(0, 10))) {
        setResult(ep.phrases[toLang] ?? ep.phrases['en-IN']);
        return;
      }
    }

    // Search ELIGIBILITY_QA answers
    const qas = ELIGIBILITY_QA[fromLang] ?? ELIGIBILITY_QA['en-IN'];
    const targetQas = ELIGIBILITY_QA[toLang] ?? ELIGIBILITY_QA['en-IN'];
    for (let i = 0; i < qas.length; i++) {
      if (qas[i].question.toLowerCase().includes(lower) || lower.includes(qas[i].question.toLowerCase().slice(0, 10))) {
        setResult(targetQas[i]?.answer ?? qas[i].answer);
        return;
      }
    }

    setResult(`[Translation from ${getLanguage(fromLang).label} → ${getLanguage(toLang).label} not found in offline dictionary. Connect to a translation API for full coverage.]`);
  }, [input, fromLang, toLang]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Translate emergency phrases between languages using the offline dictionary.
      </p>

      {/* Sample phrases */}
      <div className="flex flex-wrap gap-1.5">
        {TRANSLATE_SAMPLES.map(s => (
          <button key={s} onClick={() => { setInput(s); setResult(''); }}
            className="text-[10px] px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700 hover:border-red-400 hover:text-red-600 transition font-medium">
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1 block">
          Input ({getLanguage(fromLang).label})
        </label>
        <textarea
          rows={3}
          value={input}
          onChange={e => { setInput(e.target.value); setResult(''); }}
          placeholder={`Type in ${getLanguage(fromLang).label}…`}
          className="w-full px-3 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none font-medium"
        />
      </div>

      <button onClick={handleTranslate} disabled={!input.trim()}
        className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition shadow-sm shadow-red-500/20">
        <Languages className="w-3.5 h-3.5" />
        Translate to {getLanguage(toLang).label}
      </button>

      {/* Result */}
      {result && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
              {getLanguage(toLang).native} · {getLanguage(toLang).label}
            </span>
            <button onClick={() => speakText(result, toLang)}
              className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 transition font-medium">
              <Volume2 className="w-3 h-3" /> Listen
            </button>
          </div>
          <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200 leading-relaxed">{result}</p>
        </div>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export const MultilingualAiModal: React.FC<MultilingualAiModalProps> = ({
  isOpen, onClose, user,
}) => {
  const [lang,    setLang]    = useState(user?.preferredLanguage ?? 'en-IN');
  const [toLang,  setToLang]  = useState('hi-IN');
  const [tab,     setTab]     = useState<TabId>('phrases');

  if (!isOpen) return null;

  const langMeta = getLanguage(lang);
  const greeting = t('tagline', lang);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Languages className="w-5 h-5 text-red-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Multilingual AI</h3>
              <p className="text-xs text-red-100">
                Serving patients &amp; donors in {langMeta.native} · {langMeta.label}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Tagline banner ── */}
        <div className="px-6 py-3 bg-slate-900 dark:bg-slate-950 flex items-center justify-between gap-4 shrink-0">
          <p className="text-sm font-bold text-white truncate">{greeting}</p>
          <button
            onClick={() => speakText(greeting, lang)}
            className="shrink-0 flex items-center gap-1 text-[10px] text-red-300 hover:text-white transition font-medium"
          >
            <Volume2 className="w-3.5 h-3.5" /> Listen
          </button>
        </div>

        {/* ── Language controls ── */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wide">Language:</span>
            <LanguageSelector selected={lang} onChange={setLang} />
          </div>
          {tab === 'translator' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wide">→ To:</span>
              <LanguageSelector selected={toLang} onChange={setToLang} />
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 shrink-0 overflow-x-auto">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition ${
                tab === id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'phrases'     && <PhrasesTab    lang={lang} />}
          {tab === 'eligibility' && <EligibilityTab lang={lang} />}
          {tab === 'faq'         && <FaqTab         lang={lang} />}
          {tab === 'translator'  && <TranslatorTab  fromLang={lang} toLang={toLang} />}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`text-base transition hover:scale-110 ${lang === l.code ? 'opacity-100 scale-110' : 'opacity-40 hover:opacity-80'}`}
                title={`${l.native} (${l.label})`}
              >
                {l.flag}
              </button>
            ))}
          </div>
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
