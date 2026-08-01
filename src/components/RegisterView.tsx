import React, { useState } from 'react';
import { RedPulseLogo } from './RedPulseLogo';
import { User as UserIcon, Mail, Phone, Lock, Eye, EyeOff, Check, Building2, UserCheck, ArrowLeft, HeartHandshake, Sun, Moon } from 'lucide-react';
import { UserRole } from '../types';

interface RegisterViewProps {
  onRegisterSuccess: (role: UserRole) => void;
  onGoToSignIn: () => void;
  onGoHome: () => void;
  isDarkMode?: boolean;
  setIsDarkMode?: (dark: boolean) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  onRegisterSuccess,
  onGoToSignIn,
  onGoHome,
  isDarkMode = false,
  setIsDarkMode,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('donor');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setErrorMsg('Please fill in all required fields');
      return;
    }
    onRegisterSuccess(selectedRole);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-red-50/50 via-pink-50/30 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      
      {/* Background Floating Waveforms & Blood Drop Accents (from Image 2) */}
      <div className="absolute top-1/2 -left-12 -translate-y-1/2 w-80 h-80 pointer-events-none opacity-30 dark:opacity-15">
        <svg viewBox="0 0 200 200" className="w-full h-full text-red-300 stroke-current fill-none stroke-[2]">
          <path d="M 0 100 L 40 100 L 50 70 L 60 130 L 70 50 L 80 140 L 90 90 L 100 100 L 140 100" />
        </svg>
      </div>

      <div className="absolute top-1/4 -right-12 w-96 h-96 pointer-events-none opacity-25 dark:opacity-10">
        <svg viewBox="0 0 200 200" className="w-full h-full fill-red-200 dark:fill-red-900">
          <path d="M 120 40 C 120 40, 70 110, 70 150 A 50 50 0 0 0 170 150 C 170 110, 120 40, 120 40 Z" />
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

      <div className="sm:mx-auto sm:w-full sm:max-w-xl z-10">
        
        {/* Logo and Subtitle */}
        <div className="text-center mb-6">
          <RedPulseLogo size="lg" />
          <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
            Join the RedPulse AI community and help save lives
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-800/95 py-8 px-6 sm:px-8 shadow-xl shadow-red-500/5 rounded-3xl border border-slate-100 dark:border-slate-700/80">
          <form className="space-y-4" onSubmit={handleSubmit}>
            
            {/* Full Name */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                Full Name
              </label>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 p-1.5 rounded-lg text-red-500 dark:text-red-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="block w-full pl-12 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium bg-slate-50/50 dark:bg-slate-900/50"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
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
                  placeholder="Enter your email address"
                  className="block w-full pl-12 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium bg-slate-50/50 dark:bg-slate-900/50"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                Phone
              </label>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 p-1.5 rounded-lg text-red-500 dark:text-red-400">
                    <Phone className="w-4 h-4" />
                  </div>
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91-XXXXXXXXXX"
                  className="block w-full pl-12 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium bg-slate-50/50 dark:bg-slate-900/50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
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
                  placeholder="Create a strong password"
                  className="block w-full pl-12 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium bg-slate-50/50 dark:bg-slate-900/50"
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

            {/* I am a Role Selector (from Image 2) */}
            <div className="pt-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                I am a
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Option 1: Donor */}
                <div
                  onClick={() => setSelectedRole('donor')}
                  className={`relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center ${
                    selectedRole === 'donor'
                      ? 'border-red-500 bg-red-50/60 dark:bg-red-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-50/30'
                  }`}
                >
                  {selectedRole === 'donor' && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-2">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Donor</span>
                  <span className="text-[11px] text-red-600 dark:text-red-400 font-semibold mt-0.5">
                    Register to donate blood
                  </span>
                </div>

                {/* Option 2: Hospital */}
                <div
                  onClick={() => setSelectedRole('hospital')}
                  className={`relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center ${
                    selectedRole === 'hospital'
                      ? 'border-red-500 bg-red-50/60 dark:bg-red-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-50/30'
                  }`}
                >
                  {selectedRole === 'hospital' && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-2">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Hospital</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Manage inventory &amp; requests
                  </span>
                </div>

                {/* Option 3: Patient */}
                <div
                  onClick={() => setSelectedRole('patient')}
                  className={`relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center ${
                    selectedRole === 'patient'
                      ? 'border-red-500 bg-red-50/60 dark:bg-red-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-50/30'
                  }`}
                >
                  {selectedRole === 'patient' && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-2">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Patient</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Request blood in emergencies
                  </span>
                </div>

              </div>
            </div>

            {errorMsg && (
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">{errorMsg}</p>
            )}

            {/* Create Account Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 border border-transparent rounded-2xl shadow-md shadow-red-500/25 text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:scale-98 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mt-4"
            >
              Create Account
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <button
            onClick={onGoToSignIn}
            className="font-bold text-red-600 hover:text-red-700 dark:text-red-400 underline underline-offset-2"
          >
            Sign In
          </button>
        </p>

      </div>
    </div>
  );
};
