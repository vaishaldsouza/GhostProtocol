import React, { useState } from 'react';
import {
  History,
  Calendar,
  Clock,
  Building2,
  Award,
  Download,
  Plus,
  Search,
  CheckCircle2,
  Heart,
  Droplet,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Activity,
  Filter,
  X,
  Sparkles,
} from 'lucide-react';
import { DonationRecord, User } from '../types';

interface DonationHistorySectionProps {
  user?: User;
  onViewCertificate?: (record: DonationRecord) => void;
}

export const DEFAULT_DONATION_RECORDS: DonationRecord[] = [
  {
    id: 'DON-2026-001',
    certificateId: 'CERT-2026-RP-8842',
    donorName: 'Melria Smith',
    hospitalName: 'City General Emergency Hospital',
    location: 'Central Trauma Building, Sector 4',
    date: '2026-06-12',
    time: '10:30 AM',
    bloodType: 'O+',
    unitsDonated: 1,
    donationType: 'Whole Blood',
    status: 'completed',
    hemoglobinLevelGdl: 14.2,
    bloodPressure: '120/78 mmHg',
    pulseBpm: 72,
    attendingMedicalOfficer: 'Dr. Rajesh Sharma, MD (Transfusion Medicine)',
    livesImpactedEstimate: 3,
    notes: 'Voluntary blood donation during emergency hospital shortage surge.',
  },
  {
    id: 'DON-2026-002',
    certificateId: 'CERT-2026-RP-7120',
    donorName: 'Melria Smith',
    hospitalName: 'Metropolitan Red Cross Blood Center',
    location: 'Connaught Place Main Circle',
    date: '2026-02-18',
    time: '02:15 PM',
    bloodType: 'O+',
    unitsDonated: 1,
    donationType: 'Whole Blood',
    status: 'completed',
    hemoglobinLevelGdl: 13.8,
    bloodPressure: '118/76 mmHg',
    pulseBpm: 68,
    attendingMedicalOfficer: 'Dr. Ananya Roy, Blood Bank Lead',
    livesImpactedEstimate: 3,
    notes: 'Routine quarterly donation. Hemoglobin excellent.',
  },
  {
    id: 'DON-2025-003',
    certificateId: 'CERT-2025-RP-4391',
    donorName: 'Melria Smith',
    hospitalName: 'Apex Trauma & Healthcare Center',
    location: 'IT Corridor Phase 1 Wing B',
    date: '2025-10-05',
    time: '11:00 AM',
    bloodType: 'O+',
    unitsDonated: 2,
    donationType: 'Platelets',
    status: 'completed',
    hemoglobinLevelGdl: 14.0,
    bloodPressure: '122/80 mmHg',
    pulseBpm: 74,
    attendingMedicalOfficer: 'Dr. Vikramaditya Singh',
    livesImpactedEstimate: 4,
    notes: 'Single Donor Platelet (SDP) apheresis donation for pediatric oncology patient.',
  },
  {
    id: 'DON-2025-004',
    certificateId: 'CERT-2025-RP-1902',
    donorName: 'Melria Smith',
    hospitalName: 'Suburban Community Health Center',
    location: 'Rohini Sector 11 West',
    date: '2025-05-22',
    time: '09:45 AM',
    bloodType: 'O+',
    unitsDonated: 1,
    donationType: 'Whole Blood',
    status: 'completed',
    hemoglobinLevelGdl: 13.5,
    bloodPressure: '116/74 mmHg',
    pulseBpm: 70,
    attendingMedicalOfficer: 'Dr. S. K. Gupta',
    livesImpactedEstimate: 3,
    notes: 'Voluntary drive participation.',
  },
];

export const DEFAULT_PATIENT_RECEIVED_RECORDS: DonationRecord[] = [
  {
    id: 'RCV-2026-001',
    certificateId: 'REF-SOS-RP-882',
    donorName: 'Sarah Jenkins',
    hospitalName: 'City General Emergency Hospital',
    location: 'ICU Trauma Bay 3, Central Wing',
    date: '2026-07-28',
    time: '02:45 PM',
    bloodType: 'A+',
    unitsDonated: 2,
    donationType: 'Whole Blood Transfusion',
    status: 'completed',
    hemoglobinLevelGdl: 11.5,
    bloodPressure: '118/75 mmHg',
    pulseBpm: 76,
    attendingMedicalOfficer: 'Dr. Rajesh Sharma, MD (Trauma Lead)',
    livesImpactedEstimate: 1,
    notes: 'Emergency blood transfusion received during acute trauma procedure. Post-transfusion recovery normal.',
  },
  {
    id: 'RCV-2026-002',
    certificateId: 'REF-SOS-RP-512',
    donorName: 'Sarah Jenkins',
    hospitalName: 'Metropolitan Healthcare & Trauma Center',
    location: 'Emergency Red Room, Sector 4',
    date: '2026-05-14',
    time: '11:15 AM',
    bloodType: 'A+',
    unitsDonated: 2,
    donationType: 'Platelets Transfusion',
    status: 'completed',
    hemoglobinLevelGdl: 12.0,
    bloodPressure: '120/78 mmHg',
    pulseBpm: 72,
    attendingMedicalOfficer: 'Dr. Ananya Roy, Chief Hematologist',
    livesImpactedEstimate: 1,
    notes: 'Platelet count restoration transfusion completed successfully.',
  },
  {
    id: 'RCV-2025-003',
    certificateId: 'REF-SOS-RP-109',
    donorName: 'Sarah Jenkins',
    hospitalName: 'Apex Medical Specialty Center',
    location: 'Daycare Transfusion Unit, Wing B',
    date: '2025-11-02',
    time: '09:30 AM',
    bloodType: 'A+',
    unitsDonated: 1,
    donationType: 'Whole Blood Transfusion',
    status: 'completed',
    hemoglobinLevelGdl: 11.8,
    bloodPressure: '115/72 mmHg',
    pulseBpm: 70,
    attendingMedicalOfficer: 'Dr. Vikramaditya Singh',
    livesImpactedEstimate: 1,
    notes: 'Therapeutic blood transfusion administered under hospital observation.',
  },
];

export const DonationHistorySection: React.FC<DonationHistorySectionProps> = ({
  user,
  onViewCertificate,
}) => {
  const isPatient = user?.role === 'patient' || user?.role === 'recipient';

  const [records, setRecords] = useState<DonationRecord[]>(() => {
    return isPatient ? DEFAULT_PATIENT_RECEIVED_RECORDS : DEFAULT_DONATION_RECORDS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<DonationRecord | null>(null);

  // New record form state
  const [newRecordForm, setNewRecordForm] = useState({
    hospitalName: 'City General Emergency Hospital',
    location: 'Main Blood Bank Center',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    unitsDonated: 1,
    donationType: 'Whole Blood' as const,
    hemoglobinLevelGdl: 14.0,
    bloodPressure: '120/80 mmHg',
    pulseBpm: 72,
    attendingMedicalOfficer: 'Dr. Transfusion Officer',
    notes: '',
  });

  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.certificateId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.attendingMedicalOfficer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || rec.donationType.toLowerCase().includes(filterType.toLowerCase());
    return matchesSearch && matchesType;
  });

  const totalDonations = records.length;
  const totalUnits = records.reduce((sum, r) => sum + r.unitsDonated, 0);
  const totalLivesSaved = records.reduce((sum, r) => sum + r.livesImpactedEstimate, 0);

  const handleAddRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: DonationRecord = {
      id: `DON-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      certificateId: `CERT-${new Date().getFullYear()}-RP-${Math.floor(1000 + Math.random() * 9000)}`,
      donorName: user?.name || user?.fullName || 'Melria Smith',
      hospitalName: newRecordForm.hospitalName,
      location: newRecordForm.location,
      date: newRecordForm.date,
      time: newRecordForm.time,
      bloodType: user?.bloodGroup || user?.bloodType || 'O+',
      unitsDonated: Number(newRecordForm.unitsDonated),
      donationType: newRecordForm.donationType,
      status: 'completed',
      hemoglobinLevelGdl: Number(newRecordForm.hemoglobinLevelGdl),
      bloodPressure: newRecordForm.bloodPressure,
      pulseBpm: Number(newRecordForm.pulseBpm),
      attendingMedicalOfficer: newRecordForm.attendingMedicalOfficer,
      livesImpactedEstimate: Number(newRecordForm.unitsDonated) * 3,
      notes: newRecordForm.notes || 'Off-site verified donation record.',
    };

    setRecords([newEntry, ...records]);
    setIsAddModalOpen(false);
    alert(`Success! Donation record added. Certificate generated with ID ${newEntry.certificateId}.`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Stats */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[11px] font-black uppercase tracking-wider border border-red-500/30">
                {isPatient ? 'Verified Hospital Transfusions' : 'Verified Medical History'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                ● 100% Verified
              </span>
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
              <History className="w-7 h-7 text-red-500" />
              <span>{isPatient ? 'Blood Received History' : 'Blood Donation History'}</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              {isPatient
                ? 'Complete log of blood units received, hospital names, exact dates, times, and attending transfusion specialists.'
                : 'Complete chronological audit trail of your voluntary blood, platelet, and plasma donations. Track vital signs, medical officers, and view official digital appreciation certificates.'}
            </p>
          </div>

          {!isPatient && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-2xl shadow-md flex items-center gap-2 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Log Off-site Donation</span>
            </button>
          )}
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/60 text-xs">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">
              {isPatient ? 'Total Transfusions Received' : 'Total Lifetime Donations'}
            </div>
            <div className="text-2xl font-black text-white mt-0.5 flex items-center gap-1.5">
              <span>{totalDonations} Times</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">
              {isPatient ? 'Total Units Received' : 'Total Blood Collected'}
            </div>
            <div className="text-2xl font-black text-red-400 mt-0.5 flex items-center gap-1.5">
              <Droplet className="w-5 h-5 fill-red-500" />
              <span>{totalUnits} Units</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">
              {isPatient ? 'Patient Blood Group' : 'Estimated Lives Saved'}
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <Heart className="w-5 h-5 fill-emerald-500" />
              <span>{isPatient ? `Type ${user?.bloodGroup || user?.bloodType || 'A+'}` : `~${totalLivesSaved} Lives`}</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">
              {isPatient ? 'Primary Hospital' : 'Next Eligible Donation'}
            </div>
            <div className="text-xs sm:text-sm font-black text-amber-300 mt-0.5 truncate">
              {isPatient ? (records[0]?.hospitalName || 'City General Emergency Hospital') : 'Eligible Now'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isPatient ? "Search by hospital, doctor, or reference ID..." : "Search by hospital, location, or cert ID..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">{isPatient ? "All Transfusion Types" : "All Donation Types"}</option>
            <option value="Whole Blood">Whole Blood</option>
            <option value="Platelets">Platelets</option>
            <option value="Plasma">Plasma</option>
          </select>
        </div>
      </div>

      {/* Donation Timeline History List */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <History className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {isPatient ? 'No matching blood received records found' : 'No matching donation records found'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Try resetting your search filter.</p>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div
              key={record.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-black text-lg shrink-0 border border-red-200 dark:border-red-900/50">
                    <Droplet className="w-6 h-6 fill-red-600 dark:fill-red-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{isPatient ? 'Transfusion Completed' : 'Completed & Verified'}</span>
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                        {isPatient ? `Ref #${record.certificateId}` : `Cert #${record.certificateId}`}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                      {record.hospitalName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{record.location}</span>
                    </p>
                  </div>
                </div>

                {/* Clear Blood Received Time & Date Badge */}
                <div className="flex flex-col items-end shrink-0 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-2xl border border-red-100 dark:border-red-900/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-0.5">
                    {isPatient ? 'Blood Received Date & Time' : 'Donation Timestamp'}
                  </span>
                  <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-red-600" />
                    <span>{record.date}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-red-500" />
                    <span>{record.time}</span>
                  </div>
                </div>
              </div>

              {/* Details grid highlighting Hospital, Time, Date, Blood Group */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <div className="text-slate-400 text-[11px] font-medium">
                    {isPatient ? 'Hospital Name' : 'Donation Type'}
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                    {record.hospitalName}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-[11px] font-medium">
                    {isPatient ? 'Blood Received Details' : 'Blood Group'}
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {record.donationType} ({record.unitsDonated} {record.unitsDonated === 1 ? 'Unit' : 'Units'})
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-[11px] font-medium">Blood Group</div>
                  <div className="font-black text-red-600 dark:text-red-400 mt-0.5">
                    Type {record.bloodType}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-[11px] font-medium">Attending Doctor</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                    {record.attendingMedicalOfficer}
                  </div>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {isPatient
                      ? `Transfusion Notes: ${record.notes}`
                      : `Impact: Saved approx ~${record.livesImpactedEstimate} hospital patients`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedRecordForDetails(record)}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition shadow-xs"
                  >
                    View Transfusion Details
                  </button>

                  {!isPatient && onViewCertificate && (
                    <button
                      onClick={() => onViewCertificate(record)}
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition transform active:scale-95"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-300" />
                      <span>View Official Certificate</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* MODAL: ADD OFF-SITE DONATION RECORD */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Log Past Blood Donation
                </h3>
                <p className="text-xs text-slate-500">Record an off-site or external hospital donation into your profile.</p>
              </div>
            </div>

            <form onSubmit={handleAddRecordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Hospital / Blood Center Name *</label>
                <input
                  type="text"
                  required
                  value={newRecordForm.hospitalName}
                  onChange={(e) => setNewRecordForm({ ...newRecordForm, hospitalName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Location / District</label>
                <input
                  type="text"
                  value={newRecordForm.location}
                  onChange={(e) => setNewRecordForm({ ...newRecordForm, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date of Donation</label>
                  <input
                    type="date"
                    required
                    value={newRecordForm.date}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Donation Type</label>
                  <select
                    value={newRecordForm.donationType}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, donationType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="Whole Blood">Whole Blood</option>
                    <option value="Platelets">Platelets</option>
                    <option value="Plasma">Plasma</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Units (450ml)</label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={newRecordForm.unitsDonated}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, unitsDonated: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Hemoglobin (g/dL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRecordForm.hemoglobinLevelGdl}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, hemoglobinLevelGdl: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Blood Pressure</label>
                  <input
                    type="text"
                    value={newRecordForm.bloodPressure}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, bloodPressure: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Attending Medical Officer</label>
                <input
                  type="text"
                  value={newRecordForm.attendingMedicalOfficer}
                  onChange={(e) => setNewRecordForm({ ...newRecordForm, attendingMedicalOfficer: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-md transition"
                >
                  Save &amp; Generate Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW DETAILED RECORD BREAKDOWN */}
      {selectedRecordForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedRecordForDetails(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 mb-4">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 rounded-full mx-auto flex items-center justify-center">
                <FileCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {isPatient ? 'Blood Transfusion Record' : 'Donation Record Audit Summary'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {isPatient ? `Ref ID: ${selectedRecordForDetails.certificateId}` : `Record ID: ${selectedRecordForDetails.id}`}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl text-xs space-y-2.5 border border-slate-100 dark:border-slate-700">
              <div className="p-2.5 bg-red-50 dark:bg-red-950/50 rounded-xl border border-red-100 dark:border-red-900/40 text-red-900 dark:text-red-200 font-bold flex items-center justify-between">
                <span>Received Date &amp; Time:</span>
                <span className="font-black">{selectedRecordForDetails.date} @ {selectedRecordForDetails.time}</span>
              </div>
              <div><strong>Hospital Name:</strong> {selectedRecordForDetails.hospitalName}</div>
              <div><strong>Location / Ward:</strong> {selectedRecordForDetails.location}</div>
              <div><strong>{isPatient ? 'Patient Name:' : 'Donor:'}</strong> {isPatient ? (user?.name || user?.fullName || 'Sarah Jenkins') : selectedRecordForDetails.donorName}</div>
              <div><strong>Blood Group Received:</strong> Type {selectedRecordForDetails.bloodType}</div>
              <div><strong>Units Received:</strong> {selectedRecordForDetails.unitsDonated} Unit(s) ({selectedRecordForDetails.donationType})</div>
              <div><strong>Attending Medical Officer:</strong> {selectedRecordForDetails.attendingMedicalOfficer}</div>
              <div><strong>Clinical Notes:</strong> {selectedRecordForDetails.notes}</div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setSelectedRecordForDetails(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Close Record
              </button>
              {!isPatient && onViewCertificate && (
                <button
                  onClick={() => {
                    const record = selectedRecordForDetails;
                    setSelectedRecordForDetails(null);
                    onViewCertificate(record);
                  }}
                  className="w-full py-3 bg-red-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>Open Certificate</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
