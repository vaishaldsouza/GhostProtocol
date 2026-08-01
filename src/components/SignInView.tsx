import React, { useState } from 'react';
import { RedPulseLogo } from './RedPulseLogo';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Building2, Heart, ArrowLeft, Sun, Moon, UserCheck, Loader2, KeyRound, Database, Store } from 'lucide-react';
import { UserRole, User } from '../types';
import { signIn } from '../utils/auth';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { SupabaseSchemaModal } from './SupabaseSchemaModal';

interface SignInViewProps {
  onSignInSuccess: (role: UserRole, user?: User) => void;
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
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSchemaModal, setShowSchemaModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const result = await signIn(email, password);

    if (result.success && result.user) {
      onSignInSuccess(result.user.role, result.user);
    } else {
      setErrorMsg(result.error?.message || 'Sign in failed');
    }

    setIsLoading(false);
  };

  const handleQuickDemo = (role: UserRole) => {
    const demoUsers: Record<UserRole, User> = {
      donor: {
        id: 'usr-donor-101',
        fullName: 'Melria Smith',
        name: 'Melria Smith',
        email: 'melria.smith@example.com',
        phone: '+91-9876543210',
        role: 'donor',
        bloodGroup: 'O+',
        dob: '1998-05-15',
        gender: 'Female',
        location: 'Central Metro District, Zone 4',
        emergencyContact: '+91-9123456789',
        medicalNotes: 'Regular voluntary blood donor. No allergies.',
      },
      recipient: {
        id: 'usr-recipient-202',
        fullName: 'Sarah Jenkins',
        name: 'Sarah Jenkins',
        email: 'sarah.j@example.com',
        phone: '+91-9765432109',
        role: 'recipient',
        bloodGroup: 'A+',
        dob: '1995-04-20',
        gender: 'Female',
        location: 'City General Hospital ICU',
        emergencyContact: '+91-9812345678',
        medicalNotes: 'Emergency blood requirement for scheduled surgery.',
      },
      patient: {
        id: 'usr-patient-202',
        fullName: 'Sarah Jenkins',
        name: 'Sarah Jenkins',
        email: 'sarah.j@example.com',
        phone: '+91-9765432109',
        role: 'patient',
        bloodGroup: 'A+',
        dob: '1995-04-20',
        gender: 'Female',
        location: 'City General Hospital ICU',
        emergencyContact: '+91-9812345678',
        medicalNotes: 'Emergency blood requirement for scheduled surgery.',
      },
      hospital: {
        id: 'usr-hospital-303',
        fullName: 'City General Emergency Hospital',
        name: 'City General Emergency Hospital',
        email: 'contact@cityhospital.org',
        phone: '+91-1123456789',
        role: 'hospital',
        bloodGroup: 'O+',
        dob: '1980-01-01',
        gender: 'Prefer not to say',
        location: 'Sector 12, Medical Corridor',
        emergencyContact: '+91-1123456780',
        medicalNotes: 'Level-1 Emergency Trauma Care Facility.',
      },
      blood_bank: {
        id: 'usr-bloodbank-505',
        fullName: 'Central RedPulse Regional Blood Bank',
        name: 'Central RedPulse Regional Blood Bank',
        email: 'stock@redpulsebloodbank.org',
        phone: '+91-1144556677',
        role: 'blood_bank',
        bloodGroup: 'O-',
        location: 'Central Medical Square, Block B',
        emergencyContact: '+91-1144556678',
        medicalNotes: 'Central regional cold storage and blood bank repository.',
      },
      admin: {
        id: 'usr-admin-404',
        fullName: 'System Operations Lead',
        name: 'System Operations Lead',
        email: 'admin@redpulse.ai',
        phone: '+91-1100001100',
        role: 'admin',
        bloodGroup: 'AB+',
        dob: '1988-10-10',
        gender: 'Prefer not to say',
        location: 'National RedPulse Command Center',
        emergencyContact: '+91-1100001101',
        medicalNotes: 'System Admin Access.',
      }
    };

    onSignInSuccess(role, demoUsers[role]);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-red-50/50 via-pink-50/30 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      
      {/* Background Floating Waveforms & Accents */}
      <div className="absolute top-1/2 -left-12 -translate-y-1/2 w-80 h-80 pointer-events-none opacity-40 dark:opacity-20">
        <svg viewBox="0 0 200 200" className="w-full h-full text-red-300 dark:text-red-900 stroke-current fill-none stroke-[2]">
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

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        
        {/* Logo and Subtitle */}
        <div className="text-center mb-8">
          <RedPulseLogo size="lg" />
          <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
            Sign in to access your RedPulse AI Portal
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white dark:bg-slate-800/95 py-8 px-6 sm:px-8 shadow-xl shadow-red-500/5 rounded-3xl border border-slate-100 dark:border-slate-700/80">
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                Email Address
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
                  placeholder="Enter your email address"
                  className="block w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium bg-slate-50/50 dark:bg-slate-900/50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-red-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium bg-slate-50/50 dark:bg-slate-900/50"
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
              disabled={isLoading}
              className="w-full py-3.5 px-4 border border-transparent rounded-2xl shadow-md shadow-red-500/25 text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:scale-98 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  Signing in with Supabase Auth...
                </>
              ) : (
                'Sign In with Supabase Auth'
              )}
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center mb-3">
              Or Quick Sign-In As:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleQuickDemo('donor')}
                className="p-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex flex-col items-center gap-1 transition"
              >
                <Heart className="w-4 h-4 text-red-500" />
                <span>Donor</span>
              </button>

              <button
                onClick={() => handleQuickDemo('patient')}
                className="p-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex flex-col items-center gap-1 transition"
              >
                <UserCheck className="w-4 h-4 text-blue-500" />
                <span>Recipient</span>
              </button>

              <button
                onClick={() => handleQuickDemo('hospital')}
                className="p-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex flex-col items-center gap-1 transition"
              >
                <Building2 className="w-4 h-4 text-emerald-500" />
                <span>Hospital</span>
              </button>

              <button
                onClick={() => handleQuickDemo('admin')}
                className="p-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex flex-col items-center gap-1 transition"
              >
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                <span>Admin</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/80 flex justify-center">
              <button
                type="button"
                onClick={() => setShowSchemaModal(true)}
                className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1.5 transition px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                <span>View Supabase SQL DB Schema (8 Tables)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
          Don&apos;t have an account?{' '}
          <button
            onClick={onGoToRegister}
            className="font-bold text-red-600 hover:text-red-700 dark:text-red-400 underline underline-offset-2"
          >
            Create Account
          </button>
        </p>

      </div>

      {/* Modals */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        defaultEmail={email}
      />

      <SupabaseSchemaModal
        isOpen={showSchemaModal}
        onClose={() => setShowSchemaModal(false)}
      />
    </div>
  );
};
