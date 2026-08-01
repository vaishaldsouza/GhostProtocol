import React, { useState, useRef } from 'react';
import {
  Award,
  Download,
  Printer,
  Share2,
  CheckCircle2,
  Droplet,
  ShieldCheck,
  QrCode,
  Sparkles,
  Calendar,
  Building2,
  UserCheck,
  ChevronDown,
  Heart,
} from 'lucide-react';
import { DonationRecord, User } from '../types';
import { DEFAULT_DONATION_RECORDS } from './DonationHistorySection';

interface DonationCertificateSectionProps {
  user?: User;
  selectedRecord?: DonationRecord | null;
}

export const DonationCertificateSection: React.FC<DonationCertificateSectionProps> = ({
  user,
  selectedRecord: initialRecord,
}) => {
  const [records] = useState<DonationRecord[]>(DEFAULT_DONATION_RECORDS);
  const [activeRecord, setActiveRecord] = useState<DonationRecord>(
    initialRecord || DEFAULT_DONATION_RECORDS[0]
  );
  const certificateRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    alert(`Downloading Official Certificate Pass #${activeRecord.certificateId} as high-res PDF...`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Blood Donation Honor Certificate',
        text: `I donated blood at ${activeRecord.hospitalName} and helped save lives! Certificate ID: ${activeRecord.certificateId}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`Proud donor certificate #${activeRecord.certificateId} — RedPulse AI`);
      alert('Certificate verification link copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Bar Header & Certificate Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 text-[11px] font-black uppercase tracking-wider flex items-center gap-1 border border-amber-300 dark:border-amber-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Official Lifesaver Recognition</span>
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            <span>Certificate of Appreciation</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified digital credential issued under national blood donation standards.
          </p>
        </div>

        {/* Certificate Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Dropdown if multiple donations */}
          <div className="relative">
            <select
              value={activeRecord.id}
              onChange={(e) => {
                const found = records.find((r) => r.id === e.target.value);
                if (found) setActiveRecord(found);
              }}
              className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {records.map((rec) => (
                <option key={rec.id} value={rec.id}>
                  {rec.date} — {rec.hospitalName} ({rec.certificateId})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-2xl shadow-xs flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl transition"
            title="Print Certificate"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={handleShare}
            className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl transition"
            title="Share Honor Pass"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PRINTABLE OFFICIAL CERTIFICATE FRAME CANVAS */}
      <div className="flex justify-center">
        <div
          ref={certificateRef}
          className="w-full max-w-4xl bg-gradient-to-b from-amber-50/60 via-white to-red-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-12 border-amber-500/80 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden my-2"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.08) 0%, transparent 70%)`,
          }}
        >
          {/* Certificate Inner Double Fine Border Frame */}
          <div className="border-2 border-amber-600/30 p-6 sm:p-10 rounded-2xl relative">
            
            {/* Watermark Logo Background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <Droplet className="w-96 h-96 text-red-600 fill-red-600" />
            </div>

            {/* Corner Decorative Ornaments */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-amber-600/80" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-amber-600/80" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-amber-600/80" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-amber-600/80" />

            {/* Certificate Header Emblem & Title */}
            <div className="text-center space-y-3 relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg mb-1 ring-4 ring-amber-200 dark:ring-amber-900">
                <Award className="w-9 h-9" />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
                  National Voluntary Blood Transfusion Service
                </p>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-wide mt-1 uppercase">
                  Certificate of Appreciation
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  Presented for Extraordinary Voluntary Lifesaving Blood Donation
                </p>
              </div>
            </div>

            {/* Recipient Citation Block */}
            <div className="text-center my-8 space-y-4 relative z-10">
              <p className="text-xs font-serif uppercase tracking-widest text-slate-500 dark:text-slate-400">
                This official credential is honorably awarded to
              </p>

              <div className="py-2 border-b-2 border-amber-500/40 inline-block px-8">
                <span className="text-2xl sm:text-4xl font-black text-red-600 dark:text-red-500 font-serif tracking-wide">
                  {activeRecord.donorName || user?.name || user?.fullName || 'Melria Smith'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mt-2">
                In profound recognition and sincere gratitude for your noble, unselfish gesture of donating{' '}
                <strong className="text-slate-900 dark:text-white">{activeRecord.unitsDonated} unit(s) of {activeRecord.donationType}</strong> (Type{' '}
                <strong className="text-red-600 dark:text-red-400">{activeRecord.bloodType}</strong>) on{' '}
                <strong className="text-slate-900 dark:text-white">{activeRecord.date}</strong> at{' '}
                <strong className="text-slate-900 dark:text-white">{activeRecord.hospitalName}</strong>.
              </p>
            </div>

            {/* Key Metrics Strip inside Certificate */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 p-4 bg-amber-50/80 dark:bg-slate-800/80 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 text-center relative z-10">
              <div>
                <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider block">
                  Donation Date
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">
                  {activeRecord.date}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider block">
                  Blood Group
                </span>
                <span className="text-xs font-black text-red-600 dark:text-red-400 mt-0.5 block">
                  {activeRecord.bloodType} ({activeRecord.donationType})
                </span>
              </div>

              <div>
                <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider block">
                  Certificate ID
                </span>
                <span className="text-xs font-mono font-black text-slate-900 dark:text-white mt-0.5 block">
                  {activeRecord.certificateId}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider block">
                  Estimated Impact
                </span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  ~{activeRecord.livesImpactedEstimate} Patient Lives
                </span>
              </div>
            </div>

            {/* Official Signatures & Seal Footer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 relative z-10">
              
              {/* Left Signature Block */}
              <div className="text-center sm:text-left">
                <div className="font-serif italic text-sm text-slate-800 dark:text-slate-200 font-bold border-b border-slate-400 dark:border-slate-600 pb-1 inline-block">
                  Dr. Rajesh Sharma, MD
                </div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
                  Director of Blood Transfusion
                </p>
                <p className="text-[10px] text-slate-400">{activeRecord.hospitalName}</p>
              </div>

              {/* Center Official Gold Seal Emblem */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-900 flex items-center justify-center font-black text-[10px] mx-auto shadow-md border-2 border-white ring-2 ring-amber-400 uppercase tracking-tighter">
                  <div className="text-center leading-none">
                    <ShieldCheck className="w-5 h-5 mx-auto mb-0.5 text-slate-900" />
                    <span>VERIFIED</span>
                  </div>
                </div>
                <p className="text-[9px] text-amber-800 dark:text-amber-300 font-bold mt-1 uppercase">
                  RedPulse AI Official Seal
                </p>
              </div>

              {/* Right QR Code Digital Verification */}
              <div className="text-center sm:text-right flex flex-col items-center sm:items-end">
                <div className="p-1.5 bg-white rounded-xl border border-slate-300 shadow-2xs mb-1">
                  <QrCode className="w-12 h-12 text-slate-900" />
                </div>
                <span className="text-[9px] text-slate-400 font-mono">
                  Scan to Verify Authenticity
                </span>
              </div>

            </div>

          </div>
        </div>
      </div>

    </div>
  );
};
