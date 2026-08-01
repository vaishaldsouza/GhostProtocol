import React, { useState } from 'react';
import { RedPulseLogo } from './RedPulseLogo';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Building2, Heart, ArrowLeft, Sun, Moon } from 'lucide-react';
import { UserRole } from '../types';

interface SignInViewProps {
  onSignInSuccess: (role: UserRole) => void;
  onGoToRegister: () => void;
  onGoHome: () => void;
  isDarkMode?: boolean;
  setIsDarkMode?: (dark: boolean) => void;
}

export const SignInView: React.FC<SignInViewProps> = ({
  onSignInSuccess,
  onGoToRegister,
  onGoHome,
  isDarkMode = false,
  setIsDarkMode,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password');
      return;
    }
    // Default sign in as donor or inferred from email
    if (email.includes('admin')) {
      onSignInSuccess('admin');
    } else if (email.includes('hospital')) {
      onSignInSuccess('hospital');
    } else {
      onSignInSuccess('donor');
    }
  };

  const handleQuickDemo = (role: UserRole) => {
    onSignInSuccess(role);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-red-50/50 via-pink-50/30 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      
      {/* Background Floating Waveforms & Blood Drop Accents (from Image 1) */}
      <div className="absolute top-1/2 -left-12 -translate-y-1/2 w-80 h-80 pointer-events-none opacity-40 dark:opacity-20">
        <svg viewBox="0 0 200 200" className="w-full h-full text-red-300 dark:text-red-900 stroke-current fill-none stroke-[2]">
          <path d="M 0 100 L 40 100 L 50 70 L 60 130 L 70 50 L 80 140 L 90 90 L 100 100 L 140 100" />
          <path d="M 120 100 C 120 80, 140 70, 150 85 C 160 70, 180 80, 180 100 C 180 120, 150 140, 150 140 C 150 140, 120 120, 120 100 Z" fill="#FECDD3" opacity="0.5" />
        </svg>
      </div>

      <div className="absolute top-1/3 -right-12 w-96 h-96 pointer-events-none opacity-30 dark:opacity-15">
        <svg viewBox="0 0 200 200" className="w-full h-full text-red-400 fill-red-200/50 dark:fill-red-900/30">
          <path d="M 120 40 C 120 40, 70 110, 70 150 A 50 50 0 0 0 170 150 C 170 110, 120 40, 120 40 Z" />
          <path d="M 170 120 C 170 120, 145 155, 145 175 A 25 25 0 0 0 195 175 C 195 155, 170 120, 170 120 Z" />
        </svg>
      </div>

      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Theme Toggle Button */}
      {setIsDarkMode && (
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        
        {/* Logo and Subtitle */}
        <div className="text-center mb-8">
          <RedPulseLogo size="lg" />
          <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
            Sign in to RedPulse AI
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white dark:bg-slate-800/95 py-8 px-6 sm:px-8 shadow-xl shadow-red-500/5 rounded-3xl border border-slate-100 dark:border-slate-700/80">
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* Email Field */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Email
              </label>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 p-1.5 rounded-lg text-red-500 dark:text-red-400">
                    <Mail className="w-4 h-4" />
                  </div>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="block w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium bg-slate-50/50 dark:bg-slate-900/50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Password
              </label>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 p-1.5 rounded-lg text-red-500 dark:text-red-400">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full pl-12 pr-10 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium bg-slate-50/50 dark:bg-slate-900/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">{errorMsg}</p>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 border border-transparent rounded-2xl shadow-md shadow-red-500/25 text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:scale-98 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mt-2"
            >
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white dark:bg-slate-800 text-slate-400 font-semibold">
                or
              </span>
            </div>
          </div>

          {/* Quick Demo Login Section (From Image 1) */}
          <div className="space-y-3">
            <p className="text-center text-xs font-bold text-slate-700 dark:text-slate-300">
              Quick Demo Login
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              
              {/* Admin Demo Button */}
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-500 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-red-50/50 dark:hover:bg-red-950/40 transition-all text-center group"
              >
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-400 mb-1 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Admin</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">System Access</span>
              </button>

              {/* Hospital Demo Button */}
              <button
                type="button"
                onClick={() => handleQuickDemo('hospital')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-500 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-red-50/50 dark:hover:bg-red-950/40 transition-all text-center group"
              >
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-400 mb-1 group-hover:scale-110 transition-transform">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Hospital</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Manage &amp; Request</span>
              </button>

              {/* Donor Demo Button */}
              <button
                type="button"
                onClick={() => handleQuickDemo('donor')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-500 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-red-50/50 dark:hover:bg-red-950/40 transition-all text-center group"
              >
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-400 mb-1 group-hover:scale-110 transition-transform">
                  <Heart className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Donor</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Donate Blood</span>
              </button>

            </div>
          </div>

        </div>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
          Don't have an account?{' '}
          <button
            onClick={onGoToRegister}
            className="font-bold text-red-600 hover:text-red-700 dark:text-red-400 underline underline-offset-2"
          >
            Register
          </button>
        </p>

      </div>
    </div>
  );
};
