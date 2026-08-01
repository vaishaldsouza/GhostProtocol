import React, { useState } from 'react';
import { Bot, ChevronDown, MessageCircle, Send, X } from 'lucide-react';

type Message = { sender: 'assistant' | 'user'; text: string };

const getReply = (query: string) => {
  const text = query.toLowerCase();
  if (text.includes('emergency') || text.includes('blood request')) {
    return 'Open AI SOS Dispatch, describe the blood group, units, hospital and urgency, then select Log Request after reviewing the donor matches.';
  }
  if (text.includes('donat') || text.includes('eligible')) {
    return 'Your profile’s date of birth, blood group and health information help determine donation eligibility. Open My Profile & Details to update them.';
  }
  if (text.includes('location') || text.includes('gps')) {
    return 'In My Profile & Details, select Use current location. Your browser will ask permission, then the app converts the GPS position to a readable place name.';
  }
  if (text.includes('register') || text.includes('sign in') || text.includes('login')) {
    return 'Create an account from the registration page, then use the same email and password to sign in. In local demo mode, accounts stay in this browser.';
  }
  return 'I can help with emergency requests, donor eligibility, profile details, location, registration, and sign-in. What would you like to know?';
};

export const SideChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'assistant', text: 'Hi! I’m RedPulse Assistant. Ask me about blood requests, donor eligibility, or your profile.' },
  ]);

  const sendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    const question = draft.trim();
    if (!question) return;
    setMessages((current) => [...current, { sender: 'user', text: question }, { sender: 'assistant', text: getReply(question) }]);
    setDraft('');
  };

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3">
      {isOpen && (
        <section className="w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <header className="flex items-center justify-between bg-red-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2 font-bold text-sm"><Bot className="h-4 w-4" /> RedPulse Assistant</div>
            <button type="button" aria-label="Close assistant" onClick={() => setIsOpen(false)} className="rounded-lg p-1 hover:bg-white/15"><X className="h-4 w-4" /></button>
          </header>
          <div className="max-h-72 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <p key={index} className={`w-fit max-w-[90%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${message.sender === 'user' ? 'ml-auto bg-red-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                {message.text}
              </p>
            ))}
          </div>
          <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-100 p-3 dark:border-slate-800">
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask a question…" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <button type="submit" aria-label="Send question" className="rounded-xl bg-red-600 p-2 text-white hover:bg-red-700"><Send className="h-4 w-4" /></button>
          </form>
        </section>
      )}
      <button type="button" onClick={() => setIsOpen((open) => !open)} className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/30 hover:bg-red-700" aria-expanded={isOpen}>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
        Ask RedPulse
      </button>
    </div>
  );
};
