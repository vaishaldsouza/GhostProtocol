import React, { useState } from 'react';
import { UserRole, BloodType } from '../types';
import { Shield, Building2, Heart, LogOut, Bell, Search, Plus, MapPin, Activity, CheckCircle, AlertCircle, PhoneCall, Sun, Moon } from 'lucide-react';

interface RoleDashboardsProps {
  role: UserRole;
  onLogout: () => void;
  onOpenEmergencyModal: () => void;
  isDarkMode?: boolean;
  setIsDarkMode?: (dark: boolean) => void;
}

export const RoleDashboards: React.FC<RoleDashboardsProps> = ({
  role,
  onLogout,
  onOpenEmergencyModal,
  isDarkMode = false,
  setIsDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const roleTitles = {
    admin: 'System Administrator Portal',
    hospital: 'Hospital Blood Inventory & SOS Hub',
    donor: 'Donor Portal & Digital Donor Pass',
    patient: 'Patient Emergency Portal',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      
      {/* Top Bar for Logged-In User */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-red-500/20">
              RP
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {roleTitles[role]}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">Logged in as {role}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {setIsDarkMode && (
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </button>
            )}

            <button
              onClick={onOpenEmergencyModal}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>AI SOS Dispatch</span>
            </button>

            <button
              onClick={onLogout}
              className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* HOSPITALS DASHBOARD VIEW */}
        {role === 'hospital' && (
          <div className="space-y-6">
            
            {/* Action Bar */}
            <div className="p-6 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">City General Emergency Hospital</h2>
                <p className="text-xs text-red-100 mt-1">Live AI inventory sync &amp; instant matching engine</p>
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
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold">
                  ✓ Eligible to Donate Now
                </span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-red-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
                  O+
                </div>
                <div>
                  <h2 className="text-xl font-extrabold">Melria Smith</h2>
                  <p className="text-xs text-slate-400">Donor ID: #RP-884920 • 4 Successful Donations</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800 text-xs">
                <div>
                  <div className="text-slate-400">Last Donated</div>
                  <div className="font-bold text-white text-sm mt-0.5">112 days ago</div>
                </div>
                <div>
                  <div className="text-slate-400">Lives Saved</div>
                  <div className="font-bold text-red-400 text-sm mt-0.5">12 Lives</div>
                </div>
                <div>
                  <div className="text-slate-400">AI Response Score</div>
                  <div className="font-bold text-emerald-400 text-sm mt-0.5">98% Match</div>
                </div>
                <div>
                  <div className="text-slate-400">Next Eligible Date</div>
                  <div className="font-bold text-white text-sm mt-0.5">Today</div>
                </div>
              </div>
            </div>

            {/* Nearby Emergency Requests */}
            <div>
              <h3 className="text-base font-bold mb-3">Urgent Nearby Blood Needs</h3>
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-black text-lg flex items-center justify-center border border-red-200 dark:border-red-800">
                    O+
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Metropolitan Hospital (2.3 km away)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Needs 2 units of O+ for accident emergency • Posted 12 mins ago
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => alert('Response confirmed! Navigation map sent to your phone.')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Accept &amp; Donate
                </button>
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
          </div>
        )}

      </main>
    </div>
  );
};
