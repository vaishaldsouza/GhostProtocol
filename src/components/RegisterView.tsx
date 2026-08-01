import React, { useState } from 'react';
import { RedPulseLogo } from './RedPulseLogo';
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Check,
  Building2,
  UserCheck,
  ArrowLeft,
  Sun,
  Moon,
  Heart,
  Info,
  Loader2,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { UserRole, User } from '../types';
import { signUp } from '../utils/auth';
import { EmailVerificationNotice } from './EmailVerificationNotice';

interface RegisterViewProps {
  onRegisterSuccess: (user: User) => void;
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
  const [isLoading, setIsLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMsg('Please fill in all required fields (Full Name, Email Address, and Password).');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const result = await signUp(
      email.trim(),
      password,
      fullName.trim(),
      selectedRole,
      phone.trim() || undefined,
      undefined, // bloodType - can be set in profile
      undefined  // location - can be set in profile
    );

    if (result.success && result.user) {
      setVerificationEmail(email.trim());
      onRegisterSuccess(result.user);
    } else {
      setErrorMsg(result.error?.message || 'Registration failed');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-red-50/50 via-pink-50/30 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      
      {/* Background Floating Waveforms & Accents */}
      <div className="absolute top-1/2 -left-12 -translate-y-1/2 w-80 h-80 pointer-events-none opacity-30 dark:opacity-15">
        <svg viewBox="0 0 200 200" className="w-full h-full text-red-300 stroke-current fill-none stroke-[2]">
          <path d="M 0 100 L 40 100 L 50 70 L 60 130 L 70 50 L 80 140 L 90 90 L 100 100 L 140 100" />
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

      <div className="sm:mx-auto sm:w-full sm:max-w-xl z-10 my-6">
        
        {/* Logo and Subtitle */}
        <div className="text-center mb-6">
          <RedPulseLogo size="lg" />
          <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
            Create your account as a Donor, Patient, or Hospital
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white dark:bg-slate-800/95 py-8 px-6 sm:px-8 shadow-xl shadow-red-500/5 rounded-3xl border border-slate-100 dark:border-slate-700/80">
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* Account Role Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                I am registering as a: *
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                
                {/* Donor */}
                <div
                  onClick={() => setSelectedRole('donor')}
                  className={`relative p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center ${
                    selectedRole === 'donor'
                      ? 'border-red-500 bg-red-50/60 dark:bg-red-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-50/30'
                  }`}
                >
                  {selectedRole === 'donor' && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}

                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-1.5">
                    <Heart className="w-4 h-4 fill-current" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Donor</span>
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">
                    Save Lives
                  </span>
                </div>

                {/* Recipient */}
                <div
                  onClick={() => setSelectedRole('recipient')}
                  className={`relative p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center ${
                    selectedRole === 'recipient' || selectedRole === 'patient'
                      ? 'border-red-500 bg-red-50/60 dark:bg-red-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-50/30'
                  }`}
                >
                  {(selectedRole === 'recipient' || selectedRole === 'patient') && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}

                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Recipient</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Request Blood
                  </span>
                </div>

                {/* Hospital */}
                <div
                  onClick={() => setSelectedRole('hospital')}
                  className={`relative p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center ${
                    selectedRole === 'hospital'
                      ? 'border-red-500 bg-red-50/60 dark:bg-red-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-50/30'
                  }`}
                >
                  {selectedRole === 'hospital' && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}

                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Hospital</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Emergency Unit
                  </span>
                </div>

                {/* Blood Bank */}
                <div
                  onClick={() => setSelectedRole('blood_bank')}
                  className={`relative p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center ${
                    selectedRole === 'blood_bank'
                      ? 'border-red-500 bg-red-50/60 dark:bg-red-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-50/30'
                  }`}
                >
                  {selectedRole === 'blood_bank' && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}

                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1.5">
                    <Store className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Blood Bank</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Stock Manager
                  </span>
                </div>

                {/* Admin */}
                <div
                  onClick={() => setSelectedRole('admin')}
                  className={`relative p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center ${
                    selectedRole === 'admin'
                      ? 'border-red-500 bg-red-50/60 dark:bg-red-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-50/30'
                  }`}
                >
                  {selectedRole === 'admin' && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}

                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Admin</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    System Control
                  </span>
                </div>

              </div>
            </div>

            {/* Registration Fields: Full Name, Email, Phone, Password */}
            <div className="space-y-4 pt-1">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Full Name *
                </label>
                <div className="relative rounded-2xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <UserIcon className="w-4 h-4 text-red-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="block w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium bg-slate-50/50 dark:bg-slate-900/50"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Email Address *
                </label>
                <div className="relative rounded-2xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-red-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="block w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium bg-slate-50/50 dark:bg-slate-900/50"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Phone Number
                </label>
                <div className="relative rounded-2xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Phone className="w-4 h-4 text-red-500" />
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91-9876543210"
                    className="block w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium bg-slate-50/50 dark:bg-slate-900/50"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Password *
                </label>
                <div className="relative rounded-2xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-red-500" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password"
                    className="block w-full pl-10 pr-10 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium bg-slate-50/50 dark:bg-slate-900/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

            </div>

            {/* Note regarding Profile editing */}
            <div className="p-3 bg-red-50/70 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/60 rounded-2xl text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>
                You can edit rest of your profile details (Blood Group, Date of Birth, Gender, Location, Medical Notes) anytime in your <strong>Profile Dashboard</strong> after registration.
              </span>
            </div>

            {errorMsg && (
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">{errorMsg}</p>
            )}

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 border border-transparent rounded-2xl shadow-md shadow-red-500/25 text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:scale-98 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  Creating account...
                </>
              ) : (
                'Complete Registration & Open Dashboard'
              )}
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
