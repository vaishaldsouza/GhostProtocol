import React, { useState, useEffect } from 'react';
import {
  X, MessageSquare, Send, CheckCircle2, XCircle, Clock, ExternalLink,
  ShieldAlert, RefreshCw, Key, Copy, Check, Sparkles, Filter, Smartphone, AlertTriangle
} from 'lucide-react';
import {
  sendWhatsAppEmergencyAlert,
  getWhatsAppLogs,
  updateWhatsAppDonorResponse,
  seedInitialWhatsAppLogs,
  saveWhatsAppCredentials,
  loadWhatsAppCredentials,
  WhatsAppMessageLog,
  WhatsAppAlertPayload,
  formatWhatsAppMessageTemplate
} from '../utils/whatsapp';
import { BloodType } from '../types';

interface WhatsAppDispatchModalProps {
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
    donorPhone?: string;
  };
}

export const WhatsAppDispatchModal: React.FC<WhatsAppDispatchModalProps> = ({
  isOpen,
  onClose,
  prefillRequest,
}) => {
  const [activeTab, setActiveTab] = useState<'send' | 'logs' | 'config'>('send');

  // Form State
  const [donorName, setDonorName] = useState(prefillRequest?.donorName || 'Dr. Rahul Sharma');
  const [donorPhone, setDonorPhone] = useState(prefillRequest?.donorPhone || '+91-9876543210');
  const [hospitalName, setHospitalName] = useState(prefillRequest?.hospitalName || 'City General Hospital ICU');
  const [bloodGroup, setBloodGroup] = useState<string>(prefillRequest?.bloodGroup || 'O-');
  const [unitsRequired, setUnitsRequired] = useState<number>(prefillRequest?.unitsRequired || 2);
  const [distance, setDistance] = useState(prefillRequest?.distance || '2.4 km away');
  const [urgency, setUrgency] = useState<string>(prefillRequest?.urgency || 'Critical');
  const [requestId, setRequestId] = useState(prefillRequest?.requestId || `sos-${Date.now()}`);

  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);

  // Message Logs State
  const [logs, setLogs] = useState<WhatsAppMessageLog[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  // Config State — loaded from localStorage on mount
  const [metaToken, setMetaToken] = useState('');
  const [metaPhoneId, setMetaPhoneId] = useState('');
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioNumber, setTwilioNumber] = useState('+14155238886');
  const [configSaved, setConfigSaved] = useState(false);

  // Load persisted credentials when modal opens
  useEffect(() => {
    if (isOpen) {
      const creds = loadWhatsAppCredentials();
      setMetaToken(creds.metaToken);
      setMetaPhoneId(creds.metaPhoneId);
      setTwilioAccountSid(creds.twilioAccountSid);
      setTwilioAuthToken(creds.twilioAuthToken);
      setTwilioNumber(creds.twilioWhatsAppNumber);
    }
  }, [isOpen]);

  const handleSaveCredentials = () => {
    saveWhatsAppCredentials({
      metaToken,
      metaPhoneId,
      twilioAccountSid,
      twilioAuthToken,
      twilioWhatsAppNumber: twilioNumber,
    });
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  const hasMetaCreds = Boolean(metaToken && metaPhoneId);
  const hasTwilioCreds = Boolean(twilioAccountSid && twilioAuthToken);
  const activeProvider = hasMetaCreds
    ? 'Meta WhatsApp Business API'
    : hasTwilioCreds
    ? 'Twilio WhatsApp Sandbox'
    : 'Simulation Mode';

  const refreshLogs = () => {
    seedInitialWhatsAppLogs(donorPhone, donorName);
    setLogs(getWhatsAppLogs());
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
        if (prefillRequest.donorPhone) setDonorPhone(prefillRequest.donorPhone);
      }
    }
  }, [isOpen, prefillRequest]);

  useEffect(() => {
    const handleUpdate = () => {
      setLogs(getWhatsAppLogs());
    };
    window.addEventListener('whatsapp_response_updated', handleUpdate);
    return () => window.removeEventListener('whatsapp_response_updated', handleUpdate);
  }, []);

  if (!isOpen) return null;

  // Generate live sample link
  const sampleLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://redpulse.app'}/?action=respond_sos&req=${requestId}`;

  const currentPayload: WhatsAppAlertPayload = {
    requestId,
    donorName,
    donorPhone,
    hospitalName,
    bloodGroup,
    unitsRequired,
    distance,
    urgency,
  };

  const liveFormattedTemplate = formatWhatsAppMessageTemplate(currentPayload, sampleLink);

  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setSendSuccessMessage(null);

    const res = await sendWhatsAppEmergencyAlert(currentPayload);

    setIsSending(false);
    if (res.success) {
      setSendSuccessMessage(`✅ WhatsApp Alert successfully dispatched to ${donorPhone}! Logged ID: ${res.log.id}`);
      refreshLogs();
      setTimeout(() => {
        setActiveTab('logs');
      }, 1200);
    }
  };

  const handleSimulateResponse = (logId: string, response: 'accepted' | 'declined') => {
    updateWhatsAppDonorResponse(logId, response);
    refreshLogs();
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLogId(id);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    if (statusFilter === 'all') return true;
    return log.status === statusFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
              <MessageSquare className="w-6 h-6 text-emerald-200 fill-emerald-200/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  hasMetaCreds
                    ? 'bg-emerald-400 text-slate-950'
                    : hasTwilioCreds
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-500 text-white'
                }`}>
                  {activeProvider}
                </span>
                <span className="text-xs text-emerald-100 hidden sm:inline">
                  {hasMetaCreds || hasTwilioCreds ? 'Live Mode Active' : 'Sandbox Mode'}
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight mt-0.5">
                RedPulse WhatsApp Emergency Dispatcher
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
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('send')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-2xl border-b-2 transition flex items-center gap-2 ${
              activeTab === 'send'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch SOS Alert</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('logs');
              refreshLogs();
            }}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-2xl border-b-2 transition flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Message Dispatch Logs</span>
            <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] rounded-full font-black">
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-2xl border-b-2 transition flex items-center gap-2 ${
              activeTab === 'config'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Gateway Config</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: SEND WHATSAPP SOS ALERT */}
          {activeTab === 'send' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Form Inputs */}
              <form onSubmit={handleSendAlert} className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Donor &amp; Emergency Details
                  </h4>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    Official WhatsApp Template Compliant
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Recipient Donor Name
                    </label>
                    <input
                      type="text"
                      required
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      WhatsApp Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      placeholder="+91-9876543210"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Blood Group Required
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value as BloodType)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Urgency
                    </label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    {isSending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Dispatching WhatsApp Alert...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send WhatsApp Emergency Alert Now</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Right Column: Exact Mobile Template Live Preview */}
              <div className="lg:col-span-5 bg-slate-100 dark:bg-slate-950 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                  Live WhatsApp Mobile Preview
                </div>

                {/* Simulated Smartphone Screen */}
                <div className="w-full max-w-xs bg-slate-800 dark:bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl border-4 border-slate-700 relative">
                  {/* Phone Notch */}
                  <div className="w-20 h-3.5 bg-slate-900 rounded-b-xl mx-auto mb-2" />

                  {/* WhatsApp Chat Header */}
                  <div className="bg-emerald-700 text-white p-2.5 rounded-t-2xl flex items-center gap-2 text-xs">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center">
                      RP
                    </div>
                    <div>
                      <div className="font-bold leading-none">RedPulse Emergency AI</div>
                      <div className="text-[9px] text-emerald-200">Official Business Account ✓</div>
                    </div>
                  </div>

                  {/* WhatsApp Chat Bubble */}
                  <div className="bg-[#DCF8C6] dark:bg-emerald-950 text-slate-900 dark:text-emerald-50 p-3.5 rounded-2xl my-2 text-xs font-mono whitespace-pre-wrap shadow-xs leading-snug border border-emerald-200 dark:border-emerald-800">
                    {liveFormattedTemplate}
                  </div>

                  {/* Interactive Button Mockups */}
                  <div className="space-y-1.5 pt-1">
                    <div className="bg-white dark:bg-slate-800 hover:bg-emerald-50 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] py-2 rounded-xl text-center shadow-xs border border-slate-200 dark:border-slate-700 cursor-pointer">
                      [Accept] - I Can Donate
                    </div>
                    <div className="bg-white dark:bg-slate-800 hover:bg-red-50 text-red-600 dark:text-red-400 font-extrabold text-[11px] py-2 rounded-xl text-center shadow-xs border border-slate-200 dark:border-slate-700 cursor-pointer">
                      [Decline] - Unavailable
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: WHATSAPP SENT MESSAGE LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Filter Logs:
                  </span>
                  {(['all', 'sent', 'accepted', 'declined'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 text-[11px] font-black rounded-xl capitalize transition ${
                        statusFilter === st
                          ? 'bg-emerald-600 text-white shadow-xs'
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
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Refresh Logs</span>
                </button>
              </div>

              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                  <MessageSquare className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No WhatsApp Message Logs Found
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dispatch a new WhatsApp SOS alert above to track logs and donor responses.
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
                              : 'bg-amber-500 text-white'
                          }`}>
                            ● Status: {log.status}
                          </span>

                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Recipient: {log.donorName} ({log.donorPhone})
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

                      {/* Message Content Body */}
                      <div className="my-3 grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-8 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl text-xs font-mono whitespace-pre-wrap border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 leading-snug">
                          {log.formattedMessage}
                        </div>

                        {/* Interactive Donor Action Simulator */}
                        <div className="md:col-span-4 p-3 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                          <div>
                            <div className="text-[10px] font-black uppercase text-slate-500 mb-1 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-emerald-500" />
                              Interactive Webhook Simulator
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                              Simulate recipient donor tapping buttons on WhatsApp link:
                            </p>
                          </div>

                          <div className="space-y-2 mt-3">
                            <button
                              onClick={() => handleSimulateResponse(log.id, 'accepted')}
                              disabled={log.status === 'accepted'}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Simulate Donor Taps [Accept]</span>
                            </button>

                            <button
                              onClick={() => handleSimulateResponse(log.id, 'declined')}
                              disabled={log.status === 'declined'}
                              className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Simulate Donor Taps [Decline]</span>
                            </button>

                            <button
                              onClick={() => handleCopyMessage(log.formattedMessage, log.id)}
                              className="w-full py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] rounded-lg flex items-center justify-center gap-1 hover:bg-slate-50 transition"
                            >
                              {copiedLogId === log.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span>Copied Message!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Message Text</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Log Footer Info */}
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
                        <div>
                          Hospital: <strong className="text-slate-800 dark:text-slate-200">{log.hospitalName}</strong> • Blood Group: <strong className="text-red-600">{log.bloodGroup}</strong> ({log.unitsRequired} Units)
                        </div>
                        <a
                          href={log.secureLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <span>Secure Response Endpoint Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: API GATEWAY CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  <h5 className="font-extrabold text-slate-900 dark:text-white text-sm mb-1">
                    Meta WhatsApp Business API &amp; Twilio Integration Mode
                  </h5>
                  <p>
                    RedPulse includes native integration for both <strong>Meta WhatsApp Cloud API</strong> and <strong>Twilio WhatsApp Sandbox</strong>.
                  </p>
                  <p className="mt-1">
                    When API keys are defined in your environment, production requests are routed via Meta/Twilio. When operating in local preview, all outgoing messages are safely captured in our live interactive Sandbox logger below.
                  </p>
                </div>
              </div>

              {/* Meta WhatsApp Section */}
              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Meta WhatsApp Business Cloud API Settings
                  </h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Meta Permanent Token (META_WHATSAPP_TOKEN)
                    </label>
                    <input
                      type="password"
                      placeholder="EAAG..."
                      value={metaToken}
                      onChange={(e) => setMetaToken(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Phone Number ID (META_PHONE_NUMBER_ID)
                    </label>
                    <input
                      type="text"
                      placeholder="1029384756..."
                      value={metaPhoneId}
                      onChange={(e) => setMetaPhoneId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Twilio Section */}
              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Twilio WhatsApp Sandbox Credentials
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Account SID (TWILIO_ACCOUNT_SID)
                    </label>
                    <input
                      type="text"
                      placeholder="AC..."
                      value={twilioAccountSid}
                      onChange={(e) => setTwilioAccountSid(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Auth Token (TWILIO_AUTH_TOKEN)
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={twilioAuthToken}
                      onChange={(e) => setTwilioAuthToken(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Twilio WhatsApp No.
                    </label>
                    <input
                      type="text"
                      value={twilioNumber}
                      onChange={(e) => setTwilioNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Active Provider Status */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      hasMetaCreds
                        ? 'bg-emerald-500'
                        : hasTwilioCreds
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Active Provider:
                  </span>
                  <span
                    className={`font-black ${
                      hasMetaCreds
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : hasTwilioCreds
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {activeProvider}
                  </span>
                </div>

                <button
                  onClick={handleSaveCredentials}
                  className={`px-4 py-2 font-extrabold text-xs rounded-xl flex items-center gap-2 transition shadow-xs ${
                    configSaved
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-100'
                  }`}
                >
                  {configSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Credentials Saved!</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5" />
                      <span>Save &amp; Activate Credentials</span>
                    </>
                  )}
                </button>
              </div>

              {/* Gateway server hint */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>Gateway server required for live sending.</strong> Run{' '}
                  <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded font-mono">npx tsx server.ts</code>{' '}
                  in a separate terminal so the app can proxy messages through the secure backend. Without it, messages are captured locally in sandbox mode.
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
            RedPulse WhatsApp Gateway • Meta Business &amp; Twilio Approved
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
