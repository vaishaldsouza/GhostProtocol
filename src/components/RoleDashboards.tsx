import React, { useState, useEffect } from 'react';
import { UserRole, BloodType, User, EligibilityResult } from '../types';
import {
  Shield,
  Building2,
  Heart,
  LogOut,
  Bell,
  Search,
  Plus,
  MapPin,
  Activity,
  CheckCircle,
  AlertCircle,
  PhoneCall,
  Sun,
  Moon,
  User as UserIcon,
  LayoutDashboard,
  Calendar,
  Edit3,
  FileText,
  Sparkles,
  AlertTriangle,
  Ban,
  ShieldCheck,
  Mic,
  History,
  Award,
  MessageSquare,
  Mail,
  Brain,
} from 'lucide-react';
import { UserProfileSection } from './UserProfileSection';
import { EmergencyPriorityPanel } from './EmergencyPriorityPanel';
import { BloodDrivesSection } from './BloodDrivesSection';
import { DonationHistorySection } from './DonationHistorySection';
import { DonationCertificateSection } from './DonationCertificateSection';
import { BloodCompatibilityWidget } from './BloodCompatibilityWidget';
import { calculateAge } from '../utils/age';
import { fetchAndScreenDonor } from '../utils/eligibilityEngine';
import { DonationRecord } from '../types';

interface RoleDashboardsProps {
  role: UserRole;
  user?: User;
  onUpdateUser?: (updated: User) => void;
  onLogout: () => void;
  onOpenEmergencyModal: () => void;
  onOpenEligibilityModal?: () => void;
  onOpenVoiceAssistant?: () => void;
  onOpenWhatsAppModal?: () => void;
  onOpenResendModal?: () => void;
  onOpenTwilioVoiceModal?: () => void;
  onOpenPredictionModal?: () => void;
  isDarkMode?: boolean;
  setIsDarkMode?: (dark: boolean) => void;
}

export const RoleDashboards: React.FC<RoleDashboardsProps> = ({
  role,
  user: propUser,
  onUpdateUser,
  onLogout,
  onOpenEmergencyModal,
  onOpenEligibilityModal,
  onOpenVoiceAssistant,
  onOpenWhatsAppModal,
  onOpenResendModal,
  onOpenTwilioVoiceModal,
  onOpenPredictionModal,
  isDarkMode = false,
  setIsDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'drives' | 'history' | 'certificate'>('overview');
  const [selectedCertRecord, setSelectedCertRecord] = useState<DonationRecord | null>(null);

  // Local user state initialized from prop or realistic default
  const [userState, setUserState] = useState<User>(() => {
    if (propUser) return propUser;
    return {
      id: 'usr-101',
      name: role === 'patient' ? 'Sarah Jenkins' : role === 'hospital' ? 'City General Hospital' : 'Melria Smith',
      email: role === 'hospital' ? 'contact@cityhospital.org' : 'melria.smith@example.com',
      phone: '+91-9876543210',
      role: role,
      bloodGroup: 'O+',
      location: 'Central Metro Zone 4',
      dob: '1998-05-15',
      gender: 'Female',
      emergencyContact: '+91-9123456789',
      medicalNotes: 'No major allergies. Voluntary donor.',
    };
  });

  useEffect(() => {
    if (propUser) {
      setUserState(propUser);
    }
  }, [propUser]);

  const roleTitles = {
    admin: 'System Administrator Portal',
    hospital: 'Hospital Blood Bank Operations',
    donor: 'Blood Donor Portal',
    patient: 'Patient Emergency Portal',
  };

  const handleUpdateUser = (updated: User) => {
    setUserState(updated);
    if (onUpdateUser) {
      onUpdateUser(updated);
    }
  };

  // Age calculations
  const userAge = calculateAge(userState.dob);
  const isUnder18 = userAge < 18;

  // Live eligibility screening
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  useEffect(() => {
    if (role === 'donor') {
      fetchAndScreenDonor(userState).then(setEligibility);
    }
  }, [userState, role]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      
      {/* Top Bar Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-red-500/20">
              RP
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {roleTitles[role]}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Logged in as <span className="font-semibold text-slate-900 dark:text-white">{userState.name}</span> ({role})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {setIsDarkMode && (
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Toggle theme"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={onOpenEmergencyModal}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI SOS Dispatch</span>
              <span className="sm:hidden">SOS</span>
            </button>

            <button
              onClick={onOpenWhatsAppModal}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
              title="Meta WhatsApp Business API & Twilio Sandbox Gateway"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp Alerts</span>
              <span className="sm:hidden">WhatsApp</span>
            </button>

            <button
              onClick={onOpenResendModal}
              className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
              title="Resend App Transactional Email API Gateway"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Resend Email</span>
              <span className="sm:hidden">Resend</span>
            </button>

            <button
              onClick={onOpenPredictionModal}
              className="px-3 py-1.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white text-xs font-extrabold rounded-xl shadow-sm flex items-center gap-1.5 transition animate-pulse"
              title="FastAPI + Supabase 5-Factor AI Donor Prediction & Ranking Engine"
            >
              <Brain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Prediction Engine</span>
              <span className="sm:hidden">AI Predict</span>
            </button>

            <button
              onClick={onOpenTwilioVoiceModal}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
              title="Twilio Voice IVR Automated Calling Cascade"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Twilio Voice Call</span>
              <span className="sm:hidden">Voice Call</span>
            </button>

            <button
              onClick={onOpenVoiceAssistant}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition"
              title="Voice Assistant — hands-free coordination"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 py-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>My Profile &amp; Details</span>
          </button>

          <button
            onClick={() => setActiveTab('drives')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'drives'
                ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Blood Drives</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>

          {role !== 'patient' && role !== 'recipient' && (
            <button
              onClick={() => setActiveTab('certificate')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'certificate'
                  ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Certificate</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <DonationHistorySection
            user={userState}
            onViewCertificate={(record) => {
              setSelectedCertRecord(record);
              setActiveTab('certificate');
            }}
          />
        )}

        {/* CERTIFICATE TAB */}
        {activeTab === 'certificate' && role !== 'patient' && role !== 'recipient' && (
          <DonationCertificateSection
            user={userState}
            selectedRecord={selectedCertRecord}
          />
        )}

        {/* BLOOD DRIVES TAB */}
        {activeTab === 'drives' && (
          <BloodDrivesSection
            user={userState}
            onOpenEmergencyModal={onOpenEmergencyModal}
          />
        )}

        {/* PROFILE TAB (Selected for any role) */}
        {activeTab === 'profile' && (
          <UserProfileSection
            user={userState}
            onUpdateUser={handleUpdateUser}
          />
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* HOSPITALS DASHBOARD VIEW */}
            {role === 'hospital' && (
              <div className="space-y-6">
                
                {/* Hospital Header Banner */}
                <div className="p-6 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-red-200 mb-1">
                      Verified Hospital Operations
                    </div>
                    <h2 className="text-xl font-black">{userState.name}</h2>
                    <p className="text-xs text-red-100 mt-0.5">
                      Contact: {userState.phone} • Location: {userState.location || 'Central Corridor'}
                    </p>
                  </div>
                  <button
                    onClick={onOpenEmergencyModal}
                    className="px-5 py-2.5 bg-white text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Blood Emergency Request</span>
                  </button>
                </div>

                {/* Blood Stock Grid */}
                <div>
                  <h3 className="text-base font-bold mb-3">Live Blood Inventory Units</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    {[
                      { type: 'A+', count: 18, risk: 'safe' },
                      { type: 'A-', count: 4, risk: 'low' },
                      { type: 'B+', count: 24, risk: 'safe' },
                      { type: 'B-', count: 6, risk: 'low' },
                      { type: 'AB+', count: 12, risk: 'safe' },
                      { type: 'AB-', count: 2, risk: 'critical' },
                      { type: 'O+', count: 32, risk: 'safe' },
                      { type: 'O-', count: 1, risk: 'critical' },
                    ].map((stock) => (
                      <div
                        key={stock.type}
                        className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                          stock.risk === 'critical'
                            ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-black text-lg">{stock.type}</span>
                          {stock.risk === 'critical' && (
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                          )}
                        </div>
                        <div className="text-2xl font-black mt-2">{stock.count} <span className="text-xs font-normal opacity-70">units</span></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emergency Priority Queue */}
                <EmergencyPriorityPanel />

              </div>
            )}

            {/* DONOR DASHBOARD VIEW */}
            {role === 'donor' && (
              <div className="space-y-6">
                
                {/* Digital Donor Pass */}
                <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl shadow-xl relative overflow-hidden border border-slate-700">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Heart className="w-48 h-48 text-red-500 fill-red-500" />
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                      Digital Blood Donor Card
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab('profile')}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Edit Profile</span>
                      </button>

                      {/* Dynamic Age Eligibility Badge */}
                      {isUnder18 ? (
                        <span className="px-3 py-1 bg-red-600/90 text-white border border-red-400 rounded-full text-xs font-black flex items-center gap-1 shadow-sm">
                          <Ban className="w-3.5 h-3.5" />
                          <span>cant donate (Under 18)</span>
                        </span>
                      ) : eligibility ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-sm border ${
                          eligibility.status === 'eligible'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : eligibility.status === 'needs_review'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-red-600/90 text-white border-red-400'
                        }`}>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {eligibility.status === 'eligible' ? '✓ Cleared to Donate'
                            : eligibility.status === 'needs_review' ? '⚠ Review Required'
                            : eligibility.status === 'deferred' ? '⏱ Temporarily Deferred'
                            : '✕ Ineligible'}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold">
                          ✓ Eligible to Donate Now
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Under-18 Banner Notice inside Donor Card */}
                  {isUnder18 && (
                    <div className="mb-6 p-3.5 bg-red-950/90 border border-red-500/60 rounded-2xl text-xs text-red-200 flex items-center gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <div>
                        <span className="font-extrabold text-white uppercase text-red-400">Alert: cant donate</span>
                        <span className="ml-1.5">You are currently {userAge} years old. Medical regulation requires blood donors to be at least 18 years old.</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-red-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
                      {userState.bloodGroup || 'O+'}
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold">{userState.name}</h2>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Gender: <span className="text-white font-semibold">{userState.gender || 'Female'}</span> • DOB: <span className="text-white font-semibold">{userState.dob || '1998-05-15'}</span> (Age: {userAge} yrs)
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Location: {userState.location || 'Central District'} • Contact: {userState.phone || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800 text-xs">
                    <div>
                      <div className="text-slate-400">Calculated Age</div>
                      <div className={`font-bold text-sm mt-0.5 ${isUnder18 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {userAge} years old
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Donation Status</div>
                      <div className={`font-bold text-sm mt-0.5 ${isUnder18 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isUnder18 ? 'cant donate' : 'Eligible'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Eligibility Score</div>
                      <div className={`font-bold text-sm mt-0.5 ${
                        !eligibility ? 'text-slate-400' :
                        eligibility.status === 'eligible' ? 'text-emerald-400' :
                        eligibility.status === 'needs_review' ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {eligibility ? `${eligibility.overallScore}%` : '…'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Emergency Phone</div>
                      <div className="font-bold text-white text-sm mt-0.5">{userState.emergencyContact || userState.phone}</div>
                    </div>
                  </div>
                </div>

                {/* Eligibility Status Card */}
                {eligibility && (
                  <div className={`rounded-2xl border p-4 flex flex-wrap items-center gap-4 ${
                    eligibility.status === 'eligible'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                      : eligibility.status === 'needs_review'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800'
                  }`}>
                    {/* Score ring */}
                    <div className="relative w-14 h-14 shrink-0">
                      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
                        <circle cx="24" cy="24" r="19" fill="none" stroke="currentColor"
                          strokeWidth="4" className="text-slate-200 dark:text-slate-700" />
                        <circle cx="24" cy="24" r="19" fill="none" strokeWidth="4"
                          strokeDasharray={`${(eligibility.overallScore / 100) * 119.4} 119.4`}
                          stroke={
                            eligibility.status === 'eligible'     ? '#10b981' :
                            eligibility.status === 'needs_review' ? '#f59e0b' : '#ef4444'
                          }
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-900 dark:text-white">
                        {eligibility.overallScore}
                      </span>
                    </div>

                    {/* Summary */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <ShieldCheck className={`w-4 h-4 shrink-0 ${
                          eligibility.status === 'eligible'     ? 'text-emerald-600 dark:text-emerald-400' :
                          eligibility.status === 'needs_review' ? 'text-amber-600 dark:text-amber-400' :
                                                                   'text-red-600 dark:text-red-400'
                        }`} />
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {eligibility.status === 'eligible'     ? 'Cleared to Donate' :
                           eligibility.status === 'needs_review' ? 'Eligible with Advisory' :
                           eligibility.status === 'deferred'     ? 'Temporarily Deferred' :
                                                                    'Ineligible'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          eligibility.status === 'eligible'
                            ? 'bg-emerald-600 text-white'
                            : eligibility.status === 'needs_review'
                            ? 'bg-amber-500 text-white'
                            : 'bg-red-600 text-white'
                        }`}>
                          Score {eligibility.overallScore}/100
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {eligibility.summary}
                      </p>
                      {eligibility.nextEligibleDate && (
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                          Next eligible: {eligibility.nextEligibleDate}
                          {eligibility.daysUntilEligible !== undefined
                            ? ` (${eligibility.daysUntilEligible} days away)`
                            : ''}
                        </p>
                      )}
                    </div>

                    {/* Full screen CTA */}
                    <button
                      onClick={onOpenEligibilityModal}
                      className="shrink-0 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-400 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                    >
                      <Activity className="w-3.5 h-3.5 text-red-500" />
                      Full Screen
                    </button>
                  </div>
                )}

                {/* Nearby Emergency Requests */}
                <div>
                  <h3 className="text-base font-bold mb-3">Urgent Nearby Blood Needs</h3>
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-black text-lg flex items-center justify-center border border-red-200 dark:border-red-800">
                        {userState.bloodGroup || 'O+'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Metropolitan Hospital (2.3 km away)
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Needs 2 units of {userState.bloodGroup || 'O+'} for accident emergency • Posted 12 mins ago
                        </p>
                      </div>
                    </div>

                    {isUnder18 ? (
                      <button
                        onClick={() => alert(`Cannot donate blood: You are ${userAge} years old. Blood donors must be at least 18 years old.`)}
                        className="px-4 py-2 bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed flex items-center gap-1.5"
                      >
                        <Ban className="w-3.5 h-3.5 text-red-500" />
                        <span>cant donate (under 18)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => alert('Response confirmed! Dispatch route navigation sent to your phone.')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        Accept &amp; Donate
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* PATIENT & RECIPIENT DASHBOARD VIEW */}
            {(role === 'patient' || role === 'recipient') && (
              <div className="space-y-6">
                
                {/* Patient Emergency Header Banner Card */}
                <div className="p-6 bg-gradient-to-br from-red-950 via-slate-900 to-slate-800 text-white rounded-3xl shadow-xl relative overflow-hidden border border-red-900/60">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Heart className="w-56 h-56 text-red-500 fill-red-500" />
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                        ● Live Emergency Patient Portal
                      </span>
                      <span className="text-xs font-bold text-red-300 hidden sm:inline">
                        Priority Level: Immediate Medical Support
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveTab('profile')}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit Profile</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-red-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-red-500/30 shrink-0">
                        {userState.bloodGroup || userState.bloodType || 'A+'}
                      </div>
                      <div>
                        <h2 className="text-2xl font-extrabold">{userState.name || userState.fullName}</h2>
                        <p className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-2">
                          <span>Blood Group: <strong className="text-red-400 font-black">{userState.bloodGroup || 'A+'}</strong></span>
                          <span>•</span>
                          <span>Age: {userAge} yrs ({userState.dob || '1995-04-20'})</span>
                          <span>•</span>
                          <span>Gender: {userState.gender || 'Female'}</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span>{userState.location || 'City General Hospital ICU, Ward 3'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={onOpenEmergencyModal}
                        className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-red-600/30 flex items-center gap-2 transition transform active:scale-95"
                      >
                        <Bell className="w-4 h-4 animate-bounce" />
                        <span>Dispatch Emergency Blood SOS</span>
                      </button>

                      {onOpenVoiceAssistant && (
                        <button
                          onClick={onOpenVoiceAssistant}
                          className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl border border-slate-700 flex items-center gap-2 transition"
                        >
                          <Mic className="w-4 h-4 text-amber-400" />
                          <span>Voice AI Coordinator</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="text-slate-300 flex items-center gap-2">
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Emergency Kin Contact: <strong className="text-white">{userState.emergencyContact || userState.phone || '+91-9123456789'}</strong></span>
                    </div>
                    <div className="text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>AI Smart Matching Active: Auto-locating O− / A− / A+ donors within 5 km radius</span>
                    </div>
                  </div>
                </div>

                {/* Patient Portal Key Overview Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
                    <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Active SOS Requests</div>
                    <div className="text-2xl font-black text-red-600 mt-1 flex items-center gap-2">
                      <span>1 Pending</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">SOS #RP-882 in progress</div>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
                    <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Transfusions Received</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      3 Records
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">5 Units Total Verified</div>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
                    <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Assigned Blood Group</div>
                    <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
                      Type {userState.bloodGroup || 'A+'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Rh Positive Donor Compatible</div>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
                    <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Nearby Donors Pool</div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      24 Ready
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">O−, O+, A−, A+ in 5km Zone</div>
                  </div>
                </div>

                {/* Active Emergency SOS Request Live Tracker Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-black text-[10px] uppercase tracking-wider rounded-md">
                          SOS Request #RP-882
                        </span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          3 Compatible Donors Responded
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        Emergency Blood Requirement (2 Units of {userState.bloodGroup || 'A+'})
                      </h3>
                    </div>

                    <button
                      onClick={() => alert('Viewing live GPS donor dispatch route on interactive map...')}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-xs rounded-xl shadow-xs transition"
                    >
                      Track En-Route Donors Live
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <div className="text-slate-400 font-bold uppercase text-[10px]">Patient Location</div>
                      <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {userState.location || 'City General Hospital ICU, Wing B'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-bold uppercase text-[10px]">Estimated Arrival (ETA)</div>
                      <div className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 text-sm">
                        ⏱ ~14 Minutes Remaining
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-bold uppercase text-[10px]">Attending Hospital Officer</div>
                      <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                        Dr. Rajesh Sharma, MD (Trauma)
                      </div>
                    </div>
                  </div>
                </div>

                {/* BLOOD COMPATIBILITY MATRIX WIDGET (Exact Table Requested) */}
                <BloodCompatibilityWidget
                  userBloodGroup={userState.bloodGroup || 'A+'}
                  onSelectGroup={(grp) => {
                    console.log('Selected blood group in compatibility widget:', grp);
                  }}
                />

                {/* Recent Blood Received / Transfusion Activity Preview */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <History className="w-5 h-5 text-red-600" />
                        <span>Recent Transfusions Received</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Recent hospital blood transfusions logged under your medical profile.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('history')}
                      className="px-3.5 py-1.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 font-bold text-xs rounded-xl hover:bg-red-100 transition"
                    >
                      View All Transfusions History →
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-black flex items-center justify-center text-sm shrink-0">
                          2 U
                        </div>
                        <div>
                          <div className="font-black text-slate-900 dark:text-white text-sm">
                            City General Emergency Hospital
                          </div>
                          <div className="text-slate-500 mt-0.5">
                            Whole Blood Transfusion (Type A+) • Dr. Rajesh Sharma
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-slate-900 dark:text-white">
                          2026-07-28
                        </div>
                        <div className="text-red-600 dark:text-red-400 font-bold text-[11px] mt-0.5">
                          Received at 02:45 PM
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-black flex items-center justify-center text-sm shrink-0">
                          2 U
                        </div>
                        <div>
                          <div className="font-black text-slate-900 dark:text-white text-sm">
                            Metropolitan Healthcare &amp; Trauma Center
                          </div>
                          <div className="text-slate-500 mt-0.5">
                            Platelets Transfusion (Type A+) • Dr. Ananya Roy
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-slate-900 dark:text-white">
                          2026-05-14
                        </div>
                        <div className="text-red-600 dark:text-red-400 font-bold text-[11px] mt-0.5">
                          Received at 11:15 AM
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ADMIN DASHBOARD VIEW */}
            {role === 'admin' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <div className="text-xs text-slate-500 font-medium">Total Donors</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">10,482</div>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <div className="text-xs text-slate-500 font-medium">Connected Hospitals</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">142</div>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <div className="text-xs text-slate-500 font-medium">Avg Match Time</div>
                    <div className="text-2xl font-black text-red-600 mt-1">1.8 min</div>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <div className="text-xs text-slate-500 font-medium">AI Match Accuracy</div>
                    <div className="text-2xl font-black text-emerald-600 mt-1">96.4%</div>
                  </div>
                </div>

                {/* System-wide Emergency Priority Queue */}
                <EmergencyPriorityPanel />

              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
};
