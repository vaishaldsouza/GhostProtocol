import React, { useState } from 'react';
import { X, Sparkles, AlertTriangle, Send, PhoneCall, MapPin, CheckCircle, ShieldAlert, Clock, Navigation, Activity, AlertCircle, Save, Star, TrendingUp, Award, Users, Target, MessageSquare, Mail } from 'lucide-react';
import { BloodType, DonorCard } from '../types';
import { findMatchingDonors, createEmergencyRequest, AIAnalysis, EmergencyRequest } from '../utils/emergency';
import { RankedDonor, selectOptimalDonors, ExtendedDonorInfo } from '../utils/donorRanking';
import { sendWhatsAppEmergencyAlert } from '../utils/whatsapp';
import { sendResendTransactionalEmail } from '../utils/resendEmail';
import { initiateTwilioVoiceCall } from '../utils/twilioVoice';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyAssistantModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  const [naturalQuery, setNaturalQuery] = useState(
    'Urgent need for 2 units of O- Negative blood at St. Jude Hospital for emergency heart surgery in 45 minutes.'
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'analysis' | 'guidance' | 'results'>('input');
  const [matchResults, setMatchResults] = useState<{
    bloodGroup: BloodType;
    units: number;
    hospital: string;
    urgency: string;
    surgeryType?: string;
    timeframe?: string;
    donors: DonorCard[];
    rankedDonors?: RankedDonor[];
    aiAnalysis?: AIAnalysis;
    summary?: any;
  } | null>(null);
  const [guidanceSteps, setGuidanceSteps] = useState<string[]>([]);
  const [currentGuidanceIndex, setCurrentGuidanceIndex] = useState(0);
  const [isSavingRequest, setIsSavingRequest] = useState(false);
  const [requestSaved, setRequestSaved] = useState(false);
  const [savedRequestId, setSavedRequestId] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [showRankingDetails, setShowRankingDetails] = useState(false);

  if (!isOpen) return null;

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAnalyzing(true);
    setCurrentStep('analysis');

    // Extract information using AI (simulated - in production, use Gemini API)
    const aiAnalysis = extractEmergencyDetails(naturalQuery);
    
    // Generate decision guidance based on analysis
    const guidance = generateDecisionGuidance(aiAnalysis);
    setGuidanceSteps(guidance);
    setCurrentGuidanceIndex(0);

    // Find matching donors from Supabase with smart ranking
    const donorResult = await findMatchingDonors(
      aiAnalysis.extractedBloodType,
      aiAnalysis.extractedHospital,
      aiAnalysis.extractedUnits,
      aiAnalysis.extractedUrgency as 'critical' | 'urgent' | 'standard'
    );

    if (donorResult.success && donorResult.donors) {
      const optimalDonors = donorResult.rankedDonors ? 
        selectOptimalDonors(donorResult.rankedDonors, aiAnalysis.extractedUnits) : 
        { primary: [], backup: [], emergency: [] };

      setMatchResults({
        bloodGroup: aiAnalysis.extractedBloodType,
        units: aiAnalysis.extractedUnits,
        hospital: aiAnalysis.extractedHospital,
        urgency: aiAnalysis.extractedUrgency,
        surgeryType: aiAnalysis.extractedSurgeryType,
        timeframe: aiAnalysis.extractedTimeframe,
        donors: donorResult.donors,
        rankedDonors: donorResult.rankedDonors,
        aiAnalysis: aiAnalysis,
        summary: donorResult.summary,
      });
    } else {
      // Fallback to mock data if Supabase query fails
      const mockDonors: ExtendedDonorInfo[] = [
        {
          id: 'd1',
          name: 'Dr. Rahul Sharma',
          bloodGroup: aiAnalysis.extractedBloodType,
          phone: '+91 98765 43210',
          location: '2 mins away (Green Avenue)',
          distanceKm: 1.8,
          lastDonatedDaysAgo: 120,
          responseRatePct: 98,
          responseTimeMinutes: 15,
          isAvailable: true,
          canTravelDistanceKm: 50,
          preferredDonationTime: 'any',
          successfulDonations: 15,
          failedDonations: 1,
          averageResponseTime: 15,
          lastResponseTime: 12,
          emergencyResponseCount: 8,
        },
        {
          id: 'd2',
          name: 'Priya Patel',
          bloodGroup: aiAnalysis.extractedBloodType,
          phone: '+91 98123 45678',
          location: '5 mins away (Civil Lines)',
          distanceKm: 3.4,
          lastDonatedDaysAgo: 95,
          responseRatePct: 94,
          responseTimeMinutes: 20,
          isAvailable: true,
          canTravelDistanceKm: 40,
          preferredDonationTime: 'any',
          successfulDonations: 12,
          failedDonations: 2,
          averageResponseTime: 20,
          lastResponseTime: 18,
          emergencyResponseCount: 5,
        },
        {
          id: 'd3',
          name: 'Anish Varma',
          bloodGroup: aiAnalysis.extractedBloodType,
          phone: '+91 99887 76655',
          location: '10 mins away (Lake District)',
          distanceKm: 5.1,
          lastDonatedDaysAgo: 110,
          responseRatePct: 89,
          responseTimeMinutes: 25,
          isAvailable: true,
          canTravelDistanceKm: 60,
          preferredDonationTime: 'any',
          successfulDonations: 8,
          failedDonations: 0,
          averageResponseTime: 25,
          lastResponseTime: 22,
          emergencyResponseCount: 3,
        },
      ];

      const { rankDonors, selectOptimalDonors, generateRankingSummary } = await import('../utils/donorRanking');
      const rankedDonors = rankDonors(
        mockDonors,
        aiAnalysis.extractedBloodType,
        aiAnalysis.extractedUrgency as 'critical' | 'urgent' | 'standard',
        aiAnalysis.extractedHospital
      );

      const optimalDonors = selectOptimalDonors(rankedDonors, aiAnalysis.extractedUnits);
      const summary = generateRankingSummary(rankedDonors, aiAnalysis.extractedUnits);

      const donorsList: DonorCard[] = rankedDonors.map(donor => ({
        id: donor.id,
        name: donor.name,
        bloodGroup: donor.bloodGroup,
        distanceKm: donor.distanceKm,
        lastDonatedDaysAgo: donor.lastDonatedDaysAgo,
        responseRatePct: donor.responseRatePct,
        matchScorePct: donor.matchScorePct,
        status: donor.status,
        phone: donor.phone,
        location: donor.location,
      }));

      setMatchResults({
        bloodGroup: aiAnalysis.extractedBloodType,
        units: aiAnalysis.extractedUnits,
        hospital: aiAnalysis.extractedHospital,
        urgency: aiAnalysis.extractedUrgency,
        surgeryType: aiAnalysis.extractedSurgeryType,
        timeframe: aiAnalysis.extractedTimeframe,
        donors: donorsList,
        rankedDonors,
        aiAnalysis: aiAnalysis,
        summary,
      });
    }

    setIsAnalyzing(false);
    setCurrentStep('guidance');
  };

  // Simulated AI extraction (in production, use Gemini API)
  const extractEmergencyDetails = (query: string): AIAnalysis => {
    const lowerQuery = query.toLowerCase();
    
    // Extract blood type
    const bloodTypePattern = /([AaBbOo][ABab]?[+-])/;
    const bloodTypeMatch = query.match(bloodTypePattern);
    const bloodType = bloodTypeMatch ? bloodTypeMatch[1].toUpperCase() as BloodType : 'O+';

    // Extract units
    const unitsPattern = /(\d+)\s*(unit|units)/;
    const unitsMatch = query.match(unitsPattern);
    const units = unitsMatch ? parseInt(unitsMatch[1]) : 1;

    // Extract hospital/location
    const locationPatterns = [
      /at\s+([A-Z][a-zA-Z\s]+Hospital)/i,
      /at\s+([A-Z][a-zA-Z\s]+)/i,
    ];
    let hospital = 'Unknown Hospital';
    for (const pattern of locationPatterns) {
      const match = query.match(pattern);
      if (match) {
        hospital = match[1].trim();
        break;
      }
    }

    // Determine urgency
    let urgency = 'standard';
    if (lowerQuery.includes('critical') || lowerQuery.includes('emergency') || lowerQuery.includes('life-threatening')) {
      urgency = 'critical';
    } else if (lowerQuery.includes('urgent') || lowerQuery.includes('asap') || lowerQuery.includes('immediately')) {
      urgency = 'urgent';
    }

    // Extract surgery type
    const surgeryPatterns = [
      /(heart|cardiac|bypass)\s*surgery/i,
      /(organ|kidney|liver)\s*transplant/i,
      /(accident|trauma|emergency)/i,
    ];
    let surgeryType;
    for (const pattern of surgeryPatterns) {
      const match = query.match(pattern);
      if (match) {
        surgeryType = match[0];
        break;
      }
    }

    // Extract timeframe
    const timePatterns = [
      /(\d+)\s*minutes/i,
      /(\d+)\s*hours/i,
      /(\d+)\s*days/i,
    ];
    let timeframe;
    for (const pattern of timePatterns) {
      const match = query.match(pattern);
      if (match) {
        timeframe = match[0];
        break;
      }
    }

    // Generate suggested actions
    const suggestedActions = [
      'Contact top-ranked donors immediately',
      'Prepare blood transfusion equipment',
      'Verify donor compatibility and eligibility',
      'Arrange emergency transport if needed',
      'Document all communications and decisions',
    ];

    return {
      extractedBloodType: bloodType,
      extractedUnits: units,
      extractedHospital: hospital,
      extractedUrgency: urgency,
      extractedSurgeryType: surgeryType,
      extractedTimeframe: timeframe,
      confidence: 0.85,
      suggestedActions,
    };
  };

  // Generate decision guidance based on AI analysis
  const generateDecisionGuidance = (analysis: AIAnalysis): string[] => {
    const steps: string[] = [];

    // Step 1: Immediate assessment
    steps.push(`CRITICAL ASSESSMENT: ${analysis.extractedUnits} units of ${analysis.extractedBloodType} blood needed at ${analysis.extractedHospital}`);
    
    // Step 2: Urgency evaluation
    if (analysis.extractedUrgency === 'critical') {
      steps.push('URGENCY LEVEL: CRITICAL - Initiate emergency protocol immediately. Patient life at risk.');
    } else if (analysis.extractedUrgency === 'urgent') {
      steps.push('URGENCY LEVEL: URGENT - Prioritize donor contact and preparation.');
    } else {
      steps.push('URGENCY LEVEL: STANDARD - Schedule within available timeframe.');
    }

    // Step 3: Time-sensitive actions
    if (analysis.extractedTimeframe) {
      steps.push(`TIME CONSTRAINT: ${analysis.extractedTimeframe} - Factor this into donor selection and transport planning.`);
    }

    // Step 4: Medical considerations
    if (analysis.extractedSurgeryType) {
      steps.push(`MEDICAL CONTEXT: ${analysis.extractedSurgeryType} - Ensure proper blood compatibility and cross-matching.`);
    }

    // Step 5: Donor selection criteria
    steps.push('DONOR SELECTION: Prioritize by proximity, response time, and eligibility. Consider backup donors.');

    // Step 6: Emergency protocol
    steps.push('EMERGENCY PROTOCOL: Contact hospital blood bank, prepare transfusion set, alert surgical team.');

    // Step 7: Documentation
    steps.push('DOCUMENTATION: Log all actions, timestamps, and communications for medical records and compliance.');

    return steps;
  };

  const handleNextGuidance = () => {
    if (currentGuidanceIndex < guidanceSteps.length - 1) {
      setCurrentGuidanceIndex(currentGuidanceIndex + 1);
    } else {
      setCurrentStep('results');
    }
  };

  const handleSkipGuidance = () => {
    setCurrentStep('results');
  };

  const handleSaveEmergencyRequest = async () => {
    if (!matchResults || !matchResults.aiAnalysis) return;

    setIsSavingRequest(true);
    setRequestError(null);

    const emergencyRequest: EmergencyRequest = {
      bloodType: matchResults.bloodGroup,
      unitsNeeded: matchResults.units,
      hospitalName: matchResults.hospital,
      hospitalLocation: matchResults.hospital, // Using hospital name as location for now
      urgency: matchResults.aiAnalysis.extractedUrgency as 'critical' | 'urgent' | 'standard',
      surgeryType: matchResults.surgeryType,
      notes: naturalQuery,
    };

    const result = await createEmergencyRequest(emergencyRequest, matchResults.aiAnalysis);

    if (result.success && result.data) {
      setRequestSaved(true);
      setSavedRequestId(result.data.id);
    } else {
      setRequestError(result.error || 'Unable to save the emergency request. Please try again.');
    }

    setIsSavingRequest(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-red-200 fill-red-100" />
            </div>
            <div>
              <h3 className="text-lg font-bold">AI Emergency Assistant</h3>
              <p className="text-xs text-red-100">Natural language details extraction &amp; instant donor dispatch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Query Box */}
          {currentStep === 'input' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                Describe Emergency Request
              </label>
              <form onSubmit={handleAnalyze} className="relative">
                <textarea
                  rows={3}
                  value={naturalQuery}
                  onChange={(e) => setNaturalQuery(e.target.value)}
                  placeholder="E.g., Urgent need for 3 units of B+ blood at City Hospital..."
                  className="w-full p-4 pr-12 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium resize-none"
                />
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="absolute bottom-3 right-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-red-500/20 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>AI Match</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Analysis Loading State */}
          {currentStep === 'analysis' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <Activity className="w-8 h-8 text-red-600 dark:text-red-400 animate-pulse" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                AI Emergency Analysis
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Extracting critical information and identifying optimal donors...
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {/* Decision Guidance Steps */}
          {currentStep === 'guidance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Critical Decision Guidance
                </h4>
                <button
                  onClick={handleSkipGuidance}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Skip to results →
                </button>
              </div>

              <div className="space-y-3">
                {guidanceSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-2xl border transition-all ${
                      index === currentGuidanceIndex
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60 shadow-sm'
                        : index < currentGuidanceIndex
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/80 opacity-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === currentGuidanceIndex
                          ? 'bg-red-600 text-white'
                          : index < currentGuidanceIndex
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {index < currentGuidanceIndex ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {step}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={() => setCurrentGuidanceIndex(Math.max(0, currentGuidanceIndex - 1))}
                  disabled={currentGuidanceIndex === 0}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <button
                  onClick={handleNextGuidance}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md shadow-red-500/20"
                >
                  {currentGuidanceIndex === guidanceSteps.length - 1 ? (
                    <>
                      <Navigation className="w-4 h-4" />
                      View Donor Matches
                    </>
                  ) : (
                    <>
                      Next Step
                      <Navigation className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* AI Extracted Output */}
          {currentStep === 'results' && matchResults && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Emergency Summary Badge */}
              <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
                    {matchResults.bloodGroup}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Extracted Request: {matchResults.units} Units needed
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Location: {matchResults.hospital} • Urgency: <span className="text-red-600 font-bold">{matchResults.urgency}</span>
                    </p>
                    {(matchResults.surgeryType || matchResults.timeframe) && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {matchResults.surgeryType && <span className="mr-2">Procedure: {matchResults.surgeryType}</span>}
                        {matchResults.timeframe && <span>Timeframe: {matchResults.timeframe}</span>}
                      </p>
                    )}
                  </div>
                </div>
                <div className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  High Priority Match
                </div>
              </div>

              {/* AI Confidence and Recommendations */}
              {matchResults.aiAnalysis && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        AI Analysis Confidence: {Math.round(matchResults.aiAnalysis.confidence * 100)}%
                      </h4>
                    </div>
                    {!requestSaved ? (
                      <button
                        onClick={handleSaveEmergencyRequest}
                        disabled={isSavingRequest}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-50 transition"
                      >
                        {isSavingRequest ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            Log Request
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Saved
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {requestSaved && (
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        Emergency request logged successfully. Reference: {savedRequestId}
                      </p>
                    )}
                    {requestError && (
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400">{requestError}</p>
                    )}
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      <strong>Recommended Actions:</strong>
                    </p>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 ml-4">
                      {matchResults.aiAnalysis.suggestedActions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-600 dark:text-blue-400">•</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Donor Rank Results */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Smart Donor Ranking
                  </h4>
                  <button
                    onClick={() => setShowRankingDetails(!showRankingDetails)}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium flex items-center gap-1"
                  >
                    {showRankingDetails ? 'Hide Details' : 'Show Ranking Details'}
                    <Target className="w-3 h-3" />
                  </button>
                </div>

                {/* Ranking Summary */}
                {matchResults.summary && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                        Ranking Summary
                      </h5>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                        <span className="text-slate-600 dark:text-slate-300">
                          {matchResults.summary.totalDonors} matched donors
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                        <span className="text-slate-600 dark:text-slate-300">
                          {matchResults.summary.averageScore}% avg score
                        </span>
                      </div>
                    </div>
                    {matchResults.summary.recommendations.map((rec: string, idx: number) => (
                      <p key={idx} className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {rec}
                      </p>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  {matchResults.donors.map((donor, idx) => {
                    const rankedDonor = matchResults.rankedDonors?.[idx];
                    const factors = rankedDonor?.rankingFactors;
                    
                    return (
                      <div
                        key={donor.id}
                        className={`p-4 bg-white dark:bg-slate-900 border rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xs hover:border-red-400 transition ${
                          rankedDonor?.backupStatus === 'primary' 
                            ? 'border-emerald-200 dark:border-emerald-800/60 ring-1 ring-emerald-500/20' 
                            : rankedDonor?.backupStatus === 'backup'
                            ? 'border-amber-200 dark:border-amber-800/60'
                            : 'border-slate-200 dark:border-slate-700/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center ${
                            rankedDonor?.backupStatus === 'primary'
                              ? 'bg-emerald-600 text-white'
                              : rankedDonor?.backupStatus === 'backup'
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {rankedDonor?.backupStatus === 'primary' ? (
                              <Star className="w-4 h-4" />
                            ) : (
                              `#${idx + 1}`
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                                {donor.name}
                              </h5>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                rankedDonor?.backupStatus === 'primary'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                  : rankedDonor?.backupStatus === 'backup'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {rankedDonor?.backupStatus === 'primary' ? 'Primary' : 
                                 rankedDonor?.backupStatus === 'backup' ? 'Backup' : 'Emergency'}
                              </span>
                              <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full">
                                {donor.matchScorePct}% Score
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-red-500" />
                              {donor.location} ({donor.distanceKm} km away)
                              {rankedDonor?.estimatedArrivalTime && (
                                <span className="ml-2">• ETA: {rankedDonor.estimatedArrivalTime}</span>
                              )}
                            </p>
                            {rankedDonor?.compatibilityReason && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {rankedDonor.compatibilityReason}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {showRankingDetails && factors && (
                            <div className="hidden md:flex items-center gap-3 mr-2">
                              <div className="text-center">
                                <p className="text-[9px] text-slate-500 dark:text-slate-400">Distance</p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{factors.distanceScore}%</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[9px] text-slate-500 dark:text-slate-400">Response</p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{factors.responseTimeScore}%</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[9px] text-slate-500 dark:text-slate-400">Match</p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{factors.bloodMatchScore}%</p>
                              </div>
                            </div>
                          )}
                          <div className="text-right">
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Last donated</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {donor.lastDonatedDaysAgo} days ago
                            </p>
                          </div>
                          <a
                            href={`tel:${donor.phone}`}
                            className="px-3.5 py-2 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-1.5 transition"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </a>
                          <button
                            onClick={async () => {
                              const res = await sendWhatsAppEmergencyAlert({
                                donorName: donor.name,
                                donorPhone: donor.phone || '+91-9876543210',
                                hospitalName: matchResults.hospital || 'City General Hospital ICU',
                                bloodGroup: matchResults.bloodGroup || 'O-',
                                unitsRequired: matchResults.units || 2,
                                distance: `${donor.distanceKm} km away`,
                                urgency: matchResults.urgency || 'Critical',
                              });
                              alert(`🩸 WhatsApp Emergency Alert sent to ${donor.name} (${donor.phone})!\n\nLogged ID: ${res.log.id}\nProvider: ${res.log.provider}`);
                            }}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>
                          <button
                            onClick={async () => {
                              const res = await initiateTwilioVoiceCall({
                                phoneNumber: donor.phone,
                                donorId: donor.id,
                                donorName: donor.name,
                                requestId: `REQ-${Date.now().toString().slice(-6)}`,
                                bloodGroup: matchResults.bloodGroup || 'O-',
                                hospitalName: matchResults.hospital || 'City General Hospital ICU',
                                distanceKm: donor.distanceKm,
                              });
                              alert(`📞 Automated Twilio Voice Call initiated for ${donor.name} (${donor.phone})!\n\nCall SID: ${res.callSid}\nTwiML <Gather> active: Press 1 to ACCEPT, 2 to DECLINE.`);
                            }}
                            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Twilio Call</span>
                          </button>
                          <button
                            onClick={async () => {
                              const donorEmail = `${donor.name.toLowerCase().replace(/[^a-z]/g, '.')}@redpulse.health`;
                              const res = await sendResendTransactionalEmail({
                                donorName: donor.name,
                                donorEmail,
                                hospitalName: matchResults.hospital || 'City General Hospital ICU',
                                bloodGroup: matchResults.bloodGroup || 'O-',
                                unitsRequired: matchResults.units || 2,
                                distance: `${donor.distanceKm} km away`,
                                urgency: matchResults.urgency || 'Critical',
                              });
                              alert(`📧 Resend Transactional Email sent to ${donor.name} (${donorEmail})!\n\nSubject: 🚨 Emergency Blood Donation Needed\nLog ID: ${res.log.id}\nProvider: ${res.log.provider}`);
                            }}
                            className="px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Resend Email</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* Emergency Protocol Quick Reference */}
          {currentStep === 'results' && matchResults && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Emergency Protocol Checklist
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded text-red-600" />
                  <span className="text-slate-600 dark:text-slate-300">Contact top donors</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded text-red-600" />
                  <span className="text-slate-600 dark:text-slate-300">Alert blood bank</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded text-red-600" />
                  <span className="text-slate-600 dark:text-slate-300">Prepare equipment</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded text-red-600" />
                  <span className="text-slate-600 dark:text-slate-300">Document timeline</span>
                </div>
              </div>
            </div>
          )}

          {/* Reset Button */}
          {currentStep !== 'input' && (
            <button
              onClick={() => {
                setCurrentStep('input');
                setMatchResults(null);
                setGuidanceSteps([]);
                setCurrentGuidanceIndex(0);
                setShowRankingDetails(false);
                setRequestSaved(false);
                setSavedRequestId(null);
                setRequestError(null);
              }}
              className="w-full py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              ← Start New Emergency Request
            </button>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-300 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
