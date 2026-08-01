import React, { useState, useEffect } from 'react';
import {
  X, Mail, Send, CheckCircle2, XCircle, Clock, ExternalLink,
  ShieldAlert, RefreshCw, Key, Copy, Check, Sparkles, Filter, Code, Eye, Inbox
} from 'lucide-react';
import {
  sendResendTransactionalEmail,
  getResendEmailLogs,
  updateResendDonorResponse,
  seedInitialResendEmailLogs,
  ResendEmailLog,
  ResendEmailPayload,
  generateResendTransactionalHtml
} from '../utils/resendEmail';
import { BloodType } from '../types';

interface ResendDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillRequest?: {
    requestId?: string;
    hospitalName?: string;
    bloodGroup?: string;
    unitsRequired?: number;
    distance?: string;
    urgency?: string;
    donorName?: string;
    donorEmail?: string;
  };
}

export const ResendDispatchModal: React.FC<ResendDispatchModalProps> = ({
  isOpen,
  onClose,
  prefillRequest,
}) => {
  const [activeTab, setActiveTab] = useState<'send' | 'preview' | 'logs' | 'config'>('send');

  // Form State
  const [donorName, setDonorName] = useState(prefillRequest?.donorName || 'Dr. Rahul Sharma');
  const [donorEmail, setDonorEmail] = useState(prefillRequest?.donorEmail || 'donor.sharma@redpulse.health');
  const [hospitalName, setHospitalName] = useState(prefillRequest?.hospitalName || 'City General Hospital ICU');
  const [bloodGroup, setBloodGroup] = useState<string>(prefillRequest?.bloodGroup || 'O-');
  const [unitsRequired, setUnitsRequired] = useState<number>(prefillRequest?.unitsRequired || 2);
  const [distance, setDistance] = useState(prefillRequest?.distance || '2.4 km away');
  const [urgency, setUrgency] = useState<string>(prefillRequest?.urgency || 'Critical');
  const [requestId, setRequestId] = useState(prefillRequest?.requestId || `sos-${Date.now()}`);

  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);

  // Email Logs State
  const [logs, setLogs] = useState<ResendEmailLog[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  // Config State
  const [resendApiKey, setResendApiKey] = useState('');
  const [resendFromEmail, setResendFromEmail] = useState('onboarding@resend.dev');

  const refreshLogs = () => {
    seedInitialResendEmailLogs(donorEmail, donorName);
    setLogs(getResendEmailLogs());
  };

  useEffect(() => {
    if (isOpen) {
      refreshLogs();
      if (prefillRequest) {
        if (prefillRequest.hospitalName) setHospitalName(prefillRequest.hospitalName);
        if (prefillRequest.bloodGroup) setBloodGroup(prefillRequest.bloodGroup);
        if (prefillRequest.unitsRequired) setUnitsRequired(prefillRequest.unitsRequired);
        if (prefillRequest.distance) setDistance(prefillRequest.distance);
        if (prefillRequest.urgency) setUrgency(prefillRequest.urgency);
        if (prefillRequest.donorName) setDonorName(prefillRequest.donorName);
        if (prefillRequest.donorEmail) setDonorEmail(prefillRequest.donorEmail);
      }
    }
  }, [isOpen, prefillRequest]);

  useEffect(() => {
    const handleUpdate = () => {
      setLogs(getResendEmailLogs());
    };
    window.addEventListener('resend_email_response_updated', handleUpdate);
    return () => window.removeEventListener('resend_email_response_updated', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const currentPayload: ResendEmailPayload = {
    requestId,
    donorName,
    donorEmail,
    hospitalName,
    bloodGroup,
    unitsRequired,
    distance,
    urgency,
  };

  const sampleBase = typeof window !== 'undefined' ? window.location.origin : 'https://redpulse.app';
  const acceptLink = `${sampleBase}/?action=resend_respond&req=${requestId}&donor=d-101&resp=accepted`;
  const declineLink = `${sampleBase}/?action=resend_respond&req=${requestId}&donor=d-101&resp=declined`;

  const generatedHtml = generateResendTransactionalHtml(currentPayload, acceptLink, declineLink);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setSendSuccessMessage(null);

    const res = await sendResendTransactionalEmail(currentPayload);

    setIsSending(false);
    if (res.success) {
      setSendSuccessMessage(`✅ Transactional Email dispatched to ${donorEmail}! Tracking Log ID: ${res.log.id}`);
      refreshLogs();
      setTimeout(() => {
        setActiveTab('logs');
      }, 1200);
    }
  };

  const handleSimulateResponse = (logId: string, response: 'accepted' | 'declined') => {
    updateResendDonorResponse(logId, response);
    refreshLogs();
  };

  const handleCopyHtml = (htmlStr: string, id: string) => {
    navigator.clipboard.writeText(htmlStr);
    setCopiedLogId(id);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    if (statusFilter === 'all') return true;
    return log.status === statusFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-700 via-rose-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
              <Mail className="w-6 h-6 text-red-200 fill-red-200/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-red-400 text-slate-950 text-[10px] font-black uppercase">
                  Resend App Transactional Email API
                </span>
                <span className="text-xs text-red-100 hidden sm:inline">
                  Subject: 🚨 Emergency Blood Donation Needed
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight mt-0.5">
                RedPulse Resend Email Dispatcher &amp; Delivery Tracker
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('send')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-2xl border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'send'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Transactional Email</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-2xl border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'preview'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live HTML Template Preview</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('logs');
              refreshLogs();
            }}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-2xl border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'logs'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Delivery Status Logs</span>
            <span className="px-2 py-0.2 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-[10px] rounded-full font-black">
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-2xl border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'config'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Resend API Key</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: SEND FORM */}
          {activeTab === 'send' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <form onSubmit={handleSendEmail} className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Donor Email Dispatch Fields
                  </h4>
                  <span className="text-[11px] text-red-600 dark:text-red-400 font-bold">
                    Resend Transactional Template
                  </span>
                </div>

                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Subject line preset:</span>
                  <span className="px-2.5 py-1 bg-red-600 text-white rounded-xl text-[11px] font-black">
                    🚨 Emergency Blood Donation Needed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Donor Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Donor Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      placeholder="donor@example.com"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Hospital Name
                    </label>
                    <input
                      type="text"
                      required
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Blood Group Required
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value as BloodType)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Units Required
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={unitsRequired}
                      onChange={(e) => setUnitsRequired(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Distance
                    </label>
                    <input
                      type="text"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Urgency
                    </label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="Critical">Critical</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Standard">Standard</option>
                    </select>
                  </div>
                </div>

                {sendSuccessMessage && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{sendSuccessMessage}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full py-3.5 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    {isSending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending via Resend API...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Transactional Email via Resend App</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* HTML Email Summary Box */}
              <div className="lg:col-span-5 bg-slate-900 p-5 rounded-3xl border border-slate-800 text-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-red-500" />
                      Email Payload Summary
                    </span>
                    <button
                      onClick={() => setActiveTab('preview')}
                      className="text-xs text-amber-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Full HTML View →
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="text-slate-400 font-bold uppercase text-[10px]">Subject</div>
                      <div className="font-extrabold text-white mt-0.5">
                        🚨 Emergency Blood Donation Needed
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                      <div>
                        <div className="text-slate-400 text-[10px] font-bold">Hospital</div>
                        <div className="font-bold text-white text-xs truncate">{hospitalName}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px] font-bold">Blood Group</div>
                        <div className="font-black text-red-400 text-sm">{bloodGroup}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px] font-bold">Distance</div>
                        <div className="font-bold text-blue-400 text-xs">{distance}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px] font-bold">Units</div>
                        <div className="font-bold text-amber-400 text-xs">{unitsRequired} Units</div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="p-2 bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-center font-black text-xs rounded-xl">
                        [Accept Donation] Button Included
                      </div>
                      <div className="p-2 bg-slate-800 border border-slate-700 text-slate-300 text-center font-black text-xs rounded-xl">
                        [Decline] Button Included
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 text-center">
                  Powered by Resend Email Infrastructure • 100% Deliverability
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: LIVE HTML PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-red-500" />
                  <span>Rendered Transactional Email Preview (Resend HTML Template)</span>
                </div>
                <button
                  onClick={() => handleCopyHtml(generatedHtml, 'preview')}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-slate-50 transition"
                >
                  {copiedLogId === 'preview' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied HTML!</span>
                    </>
                  ) : (
                    <>
                      <Code className="w-3.5 h-3.5 text-red-500" />
                      <span>Copy Full Raw HTML</span>
                    </>
                  )}
                </button>
              </div>

              {/* Rendered HTML iFrame */}
              <div className="w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-inner min-h-[480px]">
                <iframe
                  title="Resend Transactional Email Preview"
                  srcDoc={generatedHtml}
                  className="w-full h-[520px] border-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: SENT EMAIL LOGS & DELIVERY TRACKING */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Filter Delivery Status:
                  </span>
                  {(['all', 'sent', 'delivered', 'accepted', 'declined'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 text-[11px] font-black rounded-xl capitalize transition ${
                        statusFilter === st
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button
                  onClick={refreshLogs}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-slate-100 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-red-500" />
                  <span>Refresh Delivery Logs</span>
                </button>
              </div>

              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                  <Inbox className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No Email Delivery Logs Recorded
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Send a transactional email above to track delivery events and donor responses.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs transition-all ${
                        log.status === 'accepted'
                          ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20'
                          : log.status === 'declined'
                          ? 'border-red-200 dark:border-red-900 bg-red-50/20 dark:bg-red-950/20'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {/* Log Row Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            log.status === 'accepted'
                              ? 'bg-emerald-600 text-white'
                              : log.status === 'declined'
                              ? 'bg-red-600 text-white'
                              : log.status === 'delivered'
                              ? 'bg-blue-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}>
                            ● Delivery Status: {log.status}
                          </span>

                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Recipient: {log.donorName} ({log.donorEmail})
                          </span>

                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md font-mono">
                            {log.provider}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Sent {new Date(log.sentAt).toLocaleTimeString()}</span>
                          {log.responseAt && (
                            <span className="text-emerald-600 font-bold ml-1">
                              • Responded {new Date(log.responseAt).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details & Actions */}
                      <div className="my-3 grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-8 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs space-y-2 border border-slate-200 dark:border-slate-700/80">
                          <div>
                            <span className="text-slate-400 font-bold uppercase text-[10px]">Subject Line:</span>
                            <div className="font-extrabold text-slate-900 dark:text-white">{log.subject}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                            <div>Hospital: <strong className="text-slate-800 dark:text-slate-200">{log.hospitalName}</strong></div>
                            <div>Blood Group: <strong className="text-red-600">{log.bloodGroup}</strong> ({log.unitsRequired} Units)</div>
                            <div>Distance: <strong className="text-blue-600">{log.distance}</strong></div>
                            <div>Urgency: <strong className="text-amber-600">{log.urgency}</strong></div>
                          </div>
                        </div>

                        {/* Interactive Donor Action Simulator */}
                        <div className="md:col-span-4 p-3 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                          <div>
                            <div className="text-[10px] font-black uppercase text-slate-500 mb-1 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-red-500" />
                              Recipient Action Simulator
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                              Simulate donor opening email &amp; clicking action buttons:
                            </p>
                          </div>

                          <div className="space-y-2 mt-3">
                            <button
                              onClick={() => handleSimulateResponse(log.id, 'accepted')}
                              disabled={log.status === 'accepted'}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Click [Accept Donation]</span>
                            </button>

                            <button
                              onClick={() => handleSimulateResponse(log.id, 'declined')}
                              disabled={log.status === 'declined'}
                              className="w-full py-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Click [Decline]</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span>Resend Email ID: {log.resendEmailId || 'resend_sandbox_id'}</span>
                        <a
                          href={log.acceptLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-600 dark:text-red-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <span>Secure Accept Endpoint Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 4: RESEND API KEY CONFIG */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  <h5 className="font-extrabold text-slate-900 dark:text-white text-sm mb-1">
                    Resend App API Configuration Guide
                  </h5>
                  <p>
                    RedPulse uses the <strong>Resend REST API</strong> to dispatch transactional HTML emails directly to donors.
                  </p>
                  <p className="mt-1">
                    To send emails to live inboxes, add your Resend key to <code>.env.example</code> or paste it below. In preview mode without a key, all emails are cleanly rendered in our live interactive preview tab.
                  </p>
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-red-500" />
                  Resend API Key &amp; Sender Domain Settings
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Resend API Key (VITE_RESEND_API_KEY)
                    </label>
                    <input
                      type="password"
                      placeholder="re_123456789..."
                      value={resendApiKey}
                      onChange={(e) => setResendApiKey(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Sender Email (VITE_RESEND_FROM_EMAIL)
                    </label>
                    <input
                      type="text"
                      placeholder="onboarding@resend.dev"
                      value={resendFromEmail}
                      onChange={(e) => setResendFromEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
            RedPulse Transactional Email Infrastructure • Powered by Resend App API
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-xs transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
