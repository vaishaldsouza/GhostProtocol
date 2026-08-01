import React from 'react';
import { RedPulseLogo } from './RedPulseLogo';
import { PhoneCall, Mail, MapPin, Heart, Shield, Sparkles } from 'lucide-react';

interface FooterProps {
  onGoHome: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenEmergency: () => void;
  onNavigateTab?: (tabId: string) => void;
}

export const FooterSection: React.FC<FooterProps> = ({
  onGoHome,
  onOpenLogin,
  onOpenRegister,
  onOpenEmergency,
  onNavigateTab,
}) => {
  const scrollToSection = (id: string) => {
    if (onNavigateTab) {
      onNavigateTab(id);
    }
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <RedPulseLogo size="md" onClick={onGoHome} className="items-start" />
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed font-normal">
              RedPulse AI is an intelligent healthcare platform predicting blood shortages, managing hospital inventory, and dispatching emergency donors in seconds.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-950/80 border border-red-800/60 rounded-xl text-xs font-semibold text-red-400">
              <PhoneCall className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>24/7 AI Emergency Helpline: 1800-RED-PULSE</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li><button onClick={() => scrollToSection('features')} className="hover:text-red-400 transition text-left">AI Smart Matching</button></li>
              <li><button onClick={() => scrollToSection('features')} className="hover:text-red-400 transition text-left">Shortage Predictor</button></li>
              <li><button onClick={onOpenEmergency} className="hover:text-red-400 transition text-left">Emergency Assistant</button></li>
              <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-red-400 transition text-left">How It Works</button></li>
              <li><button onClick={() => scrollToSection('about')} className="hover:text-red-400 transition text-left">About Us</button></li>
              <li><button onClick={() => scrollToSection('contact')} className="hover:text-red-400 transition text-left">Contact & Support</button></li>
            </ul>
          </div>

          {/* Roles Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Portals</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li><button onClick={onOpenLogin} className="hover:text-red-400 transition text-left">Donor Portal</button></li>
              <li><button onClick={onOpenLogin} className="hover:text-red-400 transition text-left">Hospital Network</button></li>
              <li><button onClick={onOpenLogin} className="hover:text-red-400 transition text-left">Admin Dashboard</button></li>
              <li><button onClick={onOpenRegister} className="hover:text-red-400 transition text-left">Register as Donor</button></li>
            </ul>
          </div>

          {/* Contact Col */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Contact &amp; Support</h4>
            <div className="space-y-2 text-xs font-normal text-slate-400">
              <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-red-500" /> emergency@redpulse.ai</p>
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-red-500" /> AI Healthcare HQ, Innovation Tower</p>
            </div>
          </div>

        </div>

        {/* Bottom Credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} RedPulse AI Inc. All rights reserved. Saving Lives with AI.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer">Medical Guidelines</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
