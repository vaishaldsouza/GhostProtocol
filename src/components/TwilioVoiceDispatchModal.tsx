import React, { useState, useEffect } from 'react';
import {
  X,
  PhoneCall,
  Phone,
  PhoneOff,
  PhoneIncoming,
  Volume2,
  VolumeX,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Code,
  List,
  Sparkles,
  RefreshCw,
  Send,
  Database,
  ArrowRight,
  UserCheck,
  UserX,
  Play,
  Key,
  Check,
  ShieldAlert
} from 'lucide-react';
import {
  initiateTwilioVoiceCall,
  processDtmfKeypress,
  getStoredCallLogs,
  generateTwimlXml,
  validateTwilioSignatureSimulated,
  saveVoiceCredentials,
  loadVoiceCredentials,
  CallLogEntry
} from '../utils/twilioVoice';

interface TwilioVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const TwilioVoiceDispatchModal: React.FC<TwilioVoiceModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = false
}) => {
  const [activeTab, setActiveTab] = useState<'cascade' | 'simulator' | 'twiml' | 'logs'>('cascade');
  
  // Emergency Request State
  const [selectedHospital, setSelectedHospital] = useState('City General Hospital ICU');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('O-');
  const [unitsNeeded, setUnitsNeeded] = useState(2);
  const [requestId, setRequestId] = useState(`REQ-${Date.now().toString().slice(-6)}`);

  // Target Donors
  const [targetDonors, setTargetDonors] = useState([
    { id: 'd101', name: 'Sarah Connor', phone: '+18005550199', bloodGroup: 'O-', distanceKm: 1.8, responseScore: 98, status: 'idle' },
    { id: 'd102', name: 'Marcus Vance', phone: '+18005550198', bloodGroup: 'O-', distanceKm: 2.4, responseScore: 94, status: 'idle' },
    { id: 'd103', name: 'Elena Rostova', phone: '+18005550197', bloodGroup: 'O-', distanceKm: 3.1, responseScore: 90, status: 'idle' },
    { id: 'd104', name: 'David Kim', phone: '+18005550196', bloodGroup: 'A-', distanceKm: 4.2, responseScore: 88, status: 'idle' },
  ]);

  // Active Call Simulator State
  const [activeCallSid, setActiveCallSid] = useState<string | null>(null);
  const [activeDonor, setActiveDonor] = useState<typeof targetDonors[0] | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'completed' | 'failed'>('idle');
  const [dtmfPressed, setDtmfPressed] = useState<'1' | '2' | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechText, setSpeechText] = useState('');

  // Call Logs State
  const [logs, setLogs] = useState<CallLogEntry[]>([]);
  const [logsFilter, setLogsFilter] = useState('all');

  // Signature Test
  const [testSigHeader, setTestSigHeader] = useState('v1_Twilio_HMAC_SHA1_Signature_Sample_Key_991823');
  const [testSigResult, setTestSigResult] = useState<{ isValid: boolean; details: string } | null>(null);

  // Bland.ai Config
  const [blandApiKey, setBlandApiKey] = useState('');
  const [voiceConfigSaved, setVoiceConfigSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = loadVoiceCredentials();
      setBlandApiKey(creds.blandApiKey);
    }
  }, [isOpen]);

  const handleSaveVoiceCredentials = () => {
    saveVoiceCredentials({ blandApiKey });
    setVoiceConfigSaved(true);
    setTimeout(() => setVoiceConfigSaved(false), 3000);
  };

  const hasBlandKey = Boolean(blandApiKey);

  useEffect(() => {
    if (isOpen) {
      setLogs(getStoredCallLogs());
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: any;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  if (!isOpen) return null;

  // Speak message via Web Speech API
  const speakTwiMLMessage = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Launch Call Cascade
  const startCallingCascade = async () => {
    const newReqId = `REQ-${Date.now().toString().slice(-6)}`;
    setRequestId(newReqId);

    // Reset donor states
    const resetDonors = targetDonors.map(d => ({ ...d, status: 'idle' }));
    setTargetDonors(resetDonors);

    // Select Top Donor
    const donorToCall = resetDonors[0];
    setActiveDonor(donorToCall);
    setCallStatus('calling');
    setActiveTab('simulator');

    // Place call
    const callRes = await initiateTwilioVoiceCall({
      phoneNumber: donorToCall.phone,
      donorId: donorToCall.id,
      donorName: donorToCall.name,
      requestId: newReqId,
      bloodGroup: selectedBloodGroup,
      hospitalName: selectedHospital,
      distanceKm: donorToCall.distanceKm,
    });

    setActiveCallSid(callRes.callSid);

    const spokenPrompt = `Hello. This is an emergency alert from RedPulse AI. A nearby hospital urgently requires ${selectedBloodGroup} blood. Hospital Name: ${selectedHospital}. Distance: ${donorToCall.distanceKm} kilometers. If you are available to donate, press 1. If you are unavailable, press 2. Thank you for helping save lives.`;
    setSpeechText(spokenPrompt);

    // Simulate answering
    setTimeout(() => {
      setCallStatus('connected');
      speakTwiMLMessage(spokenPrompt);
    }, 1500);

    setLogs(getStoredCallLogs());
  };

  // Handle Keypad Press (1 = ACCEPT, 2 = DECLINE)
  const handleKeypadInput = async (digit: '1' | '2') => {
    if (!activeCallSid || !activeDonor) return;
    setDtmfPressed(digit);
    stopSpeech();

    const res = await processDtmfKeypress({
      digits: digit,
      callSid: activeCallSid,
      donorId: activeDonor.id,
      requestId: requestId,
      durationSeconds: callTimer + 3,
    });

    speakTwiMLMessage(res.speechMessage);
    setSpeechText(res.speechMessage);

    // Update target donor status in local state
    setTargetDonors(prev =>
      prev.map(d =>
        d.id === activeDonor.id
          ? { ...d, status: res.action }
          : d
      )
    );

    setCallStatus('completed');
    setLogs(getStoredCallLogs());

    // If declined (press 2), trigger next donor call after 3.5s
    if (digit === '2') {
      const currentIndex = targetDonors.findIndex(d => d.id === activeDonor.id);
      if (currentIndex + 1 < targetDonors.length) {
        const nextDonor = targetDonors[currentIndex + 1];
        setTimeout(async () => {
          setActiveDonor(nextDonor);
          setCallStatus('calling');
          setDtmfPressed(null);

          const nextCallRes = await initiateTwilioVoiceCall({
            phoneNumber: nextDonor.phone,
            donorId: nextDonor.id,
            donorName: nextDonor.name,
            requestId,
            bloodGroup: selectedBloodGroup,
            hospitalName: selectedHospital,
            distanceKm: nextDonor.distanceKm,
          });

          setActiveCallSid(nextCallRes.callSid);
          const nextPrompt = `Hello. This is an emergency alert from RedPulse AI. A nearby hospital urgently requires ${selectedBloodGroup} blood. Hospital Name: ${selectedHospital}. Distance: ${nextDonor.distanceKm} kilometers. If you are available to donate, press 1. If you are unavailable, press 2. Thank you for helping save lives.`;
          setSpeechText(nextPrompt);

          setTimeout(() => {
            setCallStatus('connected');
            speakTwiMLMessage(nextPrompt);
          }, 1500);

          setLogs(getStoredCallLogs());
        }, 3500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-700 via-rose-800 to-red-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
              <PhoneCall className="w-6 h-6 text-red-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Twilio Voice Automated Calling</h2>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-red-500/30 text-red-100 rounded-full border border-red-400/30">
                  FastAPI & TwiML IVR
                </span>
              </div>
              <p className="text-xs text-red-100/80 mt-0.5">
                Automated emergency voice dispatch with DTMF keypad gather & Supabase real-time sync
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopSpeech();
              onClose();
            }}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('cascade')}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'cascade'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-slate-900 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>1. Voice Dispatcher</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-slate-900 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>2. Call & Keypad Simulator</span>
            {callStatus === 'connected' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('twiml')}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'twiml'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-slate-900 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>3. TwiML & Webhook Security</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'logs'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-slate-900 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>4. Supabase Call Logs ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('config' as any)}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === ('config' as any)
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-slate-900 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>5. API Config</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto">
          {/* TAB 1: VOICE DISPATCHER & CASCADE */}
          {activeTab === 'cascade' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Emergency Details Form */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-red-600" />
                    <span>Emergency Request Parameters</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Hospital Name
                    </label>
                    <input
                      type="text"
                      value={selectedHospital}
                      onChange={e => setSelectedHospital(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Blood Group Required
                      </label>
                      <select
                        value={selectedBloodGroup}
                        onChange={e => setSelectedBloodGroup(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
                      >
                        {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Units Required
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={unitsNeeded}
                        onChange={e => setUnitsNeeded(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Generated Request ID
                    </label>
                    <div className="px-3 py-2 text-xs rounded-xl bg-slate-200/70 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono flex items-center justify-between">
                      <span>{requestId}</span>
                      <button
                        onClick={() => setRequestId(`REQ-${Date.now().toString().slice(-6)}`)}
                        className="p-1 hover:text-red-600 transition"
                        title="Generate New ID"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={startCallingCascade}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-red-500/20 flex items-center justify-center gap-2 transition"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Launch Twilio Automated Voice Cascade</span>
                  </button>
                </div>

                {/* Top Compatible Donors Targeted */}
                <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span>Top Supabase Eligible Donors (Sequential Dispatch)</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Calls are placed one by one. If donor presses 1, cascade stops immediately. If 2, moves to next.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-extrabold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full">
                      {targetDonors.length} Donors Queue
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {targetDonors.map((donor, idx) => (
                      <div
                        key={donor.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                          activeDonor?.id === donor.id
                            ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 ring-2 ring-red-500/20'
                            : donor.status === 'ACCEPTED'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                            : donor.status === 'DECLINED'
                            ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            activeDonor?.id === donor.id
                              ? 'bg-red-600 text-white animate-bounce'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            #{idx + 1}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {donor.name}
                              </span>
                              <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-md">
                                {donor.bloodGroup}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-0.5">
                              <span>Phone: {donor.phone}</span>
                              <span>Distance: {donor.distanceKm} km</span>
                              <span>Score: {donor.responseScore}%</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          {donor.status === 'ACCEPTED' ? (
                            <span className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>ACCEPTED (Press 1)</span>
                            </span>
                          ) : donor.status === 'DECLINED' ? (
                            <span className="px-2.5 py-1 text-xs font-bold bg-slate-500 text-white rounded-lg flex items-center gap-1">
                              <UserX className="w-3.5 h-3.5" />
                              <span>DECLINED (Press 2)</span>
                            </span>
                          ) : activeDonor?.id === donor.id && callStatus === 'connected' ? (
                            <span className="px-2.5 py-1 text-xs font-bold bg-amber-500 text-white rounded-lg flex items-center gap-1 animate-pulse">
                              <Phone className="w-3.5 h-3.5 animate-spin" />
                              <span>Calling Now...</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveDonor(donor);
                                startCallingCascade();
                              }}
                              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-red-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call Donor</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE CALL & KEYPAD SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
                {/* Background Pulse Glow */}
                <div className="absolute -top-24 -right-24 w-60 h-60 bg-red-600/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-600/10 rounded-full blur-3xl" />

                {/* Call Header Status */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                  <div className="flex items-center gap-2 text-xs font-mono text-red-400">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span>Twilio Voice Caller SID: {activeCallSid || 'CA_idle_waiting'}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Duration: {Math.floor(callTimer / 60).toString().padStart(2, '0')}:{(callTimer % 60).toString().padStart(2, '0')}
                  </div>
                </div>

                {/* Recipient Details */}
                <div className="text-center py-4">
                  <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-red-500/50 flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <PhoneIncoming className="w-10 h-10 text-red-400 animate-bounce" />
                  </div>
                  <h3 className="text-xl font-extrabold text-white">
                    {activeDonor?.name || 'Emergency Donor Contact'}
                  </h3>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {activeDonor?.phone || '+1 (800) 555-0199'} • {activeDonor?.distanceKm || 1.8} km away
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800 text-xs text-red-200 font-bold">
                    <span>Target Blood Group: {selectedBloodGroup}</span>
                  </div>
                </div>

                {/* Spoken Message Banner */}
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 my-5 text-xs text-slate-300 leading-relaxed space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-red-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                      <span>Twilio Polly Text-to-Speech Output</span>
                    </span>
                    {isSpeaking ? (
                      <button onClick={stopSpeech} className="text-amber-400 hover:underline">Stop Voice</button>
                    ) : (
                      <button onClick={() => speakTwiMLMessage(speechText)} className="text-emerald-400 hover:underline">Replay Voice</button>
                    )}
                  </div>
                  <p className="font-serif italic text-slate-200">
                    "{speechText || 'Click Start Calling to initiate Twilio automated message.'}"
                  </p>
                </div>

                {/* Interactive Keypad DTMF Input (1 = ACCEPT, 2 = DECLINE) */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="text-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Twilio &lt;Gather&gt; DTMF Keypad Controls
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Press 1 to ACCEPT donation request • Press 2 to DECLINE donation request
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-2">
                    <button
                      onClick={() => handleKeypadInput('1')}
                      disabled={callStatus !== 'connected'}
                      className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1 transition shadow-lg ${
                        dtmfPressed === '1'
                          ? 'bg-emerald-600 border-emerald-400 text-white scale-105 ring-4 ring-emerald-500/30'
                          : 'bg-emerald-950/50 border-emerald-800/80 hover:bg-emerald-900 text-emerald-200'
                      } ${callStatus !== 'connected' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="text-2xl font-black">KEY 1</span>
                      <span className="text-[11px] font-extrabold uppercase text-emerald-300">
                        ACCEPT & MATCH
                      </span>
                    </button>

                    <button
                      onClick={() => handleKeypadInput('2')}
                      disabled={callStatus !== 'connected'}
                      className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1 transition shadow-lg ${
                        dtmfPressed === '2'
                          ? 'bg-slate-700 border-slate-500 text-white scale-105 ring-4 ring-slate-500/30'
                          : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                      } ${callStatus !== 'connected' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="text-2xl font-black">KEY 2</span>
                      <span className="text-[11px] font-extrabold uppercase text-slate-400">
                        DECLINE & NEXT
                      </span>
                    </button>
                  </div>

                  {dtmfPressed && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-emerald-400 font-bold flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>DTMF Keypad Response '{dtmfPressed}' logged to Supabase call_logs!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TWIML & WEBHOOK SECURITY */}
          {activeTab === 'twiml' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Code className="w-4 h-4 text-red-600" />
                    <span>Generated TwiML XML Output</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">Content-Type: application/xml</span>
                </div>

                <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed">
{generateTwimlXml({
  bloodGroup: selectedBloodGroup,
  hospitalName: selectedHospital,
  distanceKm: 1.8,
  requestId,
  donorId: 'd101',
})}
                </pre>
              </div>

              {/* Twilio Signature Validator */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Twilio Webhook Request Signature Validation (`X-Twilio-Signature`)</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Incoming X-Twilio-Signature Header
                    </label>
                    <input
                      type="text"
                      value={testSigHeader}
                      onChange={e => setTestSigHeader(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const res = validateTwilioSignatureSimulated(
                        'https://api.redpulse.health/api/v1/twilio/gather',
                        testSigHeader,
                        'sample_auth_token'
                      );
                      setTestSigResult(res);
                    }}
                    className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                  >
                    Validate Signature Header
                  </button>

                  {testSigResult && (
                    <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      testSigResult.isValid
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
                    }`}>
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>{testSigResult.details}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SUPABASE CALL LOGS TABLE */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Database className="w-4 h-4 text-red-600" />
                    <span>Supabase `call_logs` History</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Stores call SID, donor ID, request ID, call status, duration, DTMF responses, and timestamps.
                  </p>
                </div>

                <button
                  onClick={() => setLogs(getStoredCallLogs())}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Table</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Call SID</th>
                      <th className="p-3">Donor Name</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Hospital</th>
                      <th className="p-3">Blood</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">DTMF Input</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {logs.map(log => (
                      <tr key={log.call_sid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {log.call_sid}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                          {log.donor_name || log.donor_id}
                        </td>
                        <td className="p-3">{log.phone_number}</td>
                        <td className="p-3 max-w-[140px] truncate">{log.hospital_name}</td>
                        <td className="p-3">
                          <span className="px-1.5 py-0.5 font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-md">
                            {log.blood_group}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                            log.status === 'completed'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {log.dtmf_response === '1' ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-md">
                              Key 1 (ACCEPTED)
                            </span>
                          ) : log.dtmf_response === '2' ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-600 text-white rounded-md">
                              Key 2 (DECLINED)
                            </span>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>
                        <td className="p-3 font-mono">{log.duration_seconds}s</td>
                        <td className="p-3 text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: BLAND.AI CONFIG */}
          {activeTab === ('config' as any) && (
            <div className="space-y-6">

              <div className="p-4 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  <h5 className="font-extrabold text-slate-900 dark:text-white text-sm mb-1">
                    Free AI Voice Calls via Bland.ai
                  </h5>
                  <p>
                    RedPulse uses <strong>Bland.ai</strong> to make real automated voice calls to donors — completely free to start.
                    Sign up at <strong>app.bland.ai</strong>, copy your API key, and paste it below.
                  </p>
                  <p className="mt-1 text-emerald-700 dark:text-emerald-300 font-bold">
                    Free tier: ~1,000 minutes/month. No credit card required.
                  </p>
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-red-500" />
                  Bland.ai API Key
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    API Key (from app.bland.ai → API Keys)
                  </label>
                  <input
                    type="password"
                    placeholder="org_..."
                    value={blandApiKey}
                    onChange={(e) => setBlandApiKey(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Status + Save */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className={`w-2.5 h-2.5 rounded-full ${hasBlandKey ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <span className="font-bold text-slate-700 dark:text-slate-300">Active Provider:</span>
                  <span className={`font-black ${hasBlandKey ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                    {hasBlandKey ? 'Bland.ai (Live Calls)' : 'Browser Voice Simulator'}
                  </span>
                </div>
                <button
                  onClick={handleSaveVoiceCredentials}
                  className={`px-4 py-2 font-extrabold text-xs rounded-xl flex items-center gap-2 transition shadow-xs ${
                    voiceConfigSaved
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-700'
                  }`}
                >
                  {voiceConfigSaved ? (
                    <><Check className="w-3.5 h-3.5" /><span>Key Saved!</span></>
                  ) : (
                    <><Key className="w-3.5 h-3.5" /><span>Save &amp; Activate Bland.ai</span></>
                  )}
                </button>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>How to get a Bland.ai API key:</strong><br/>
                1. Go to <strong>app.bland.ai</strong> and create a free account<br/>
                2. Navigate to <strong>API Keys</strong> in the dashboard<br/>
                3. Click <strong>Create Key</strong>, copy it, and paste above<br/>
                4. Make sure the <strong>npm run server</strong> gateway is running — it handles the call
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Twilio Voice API Service Operational</span>
          </div>

          <button
            onClick={() => {
              stopSpeech();
              onClose();
            }}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
