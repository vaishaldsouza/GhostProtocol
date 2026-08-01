import React, { useState } from 'react';
import { Droplet, ArrowRight, ShieldCheck, Info, Check, Sparkles } from 'lucide-react';

export interface CompatibilityInfo {
  bloodGroup: string;
  canDonateTo: string[];
  canDonateToText: string;
  canReceiveFrom: string[];
  canReceiveFromText: string;
  badge?: string;
  description: string;
}

export const BLOOD_COMPATIBILITY_MAP: Record<string, CompatibilityInfo> = {
  'O-': {
    bloodGroup: 'O-',
    canDonateTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    canDonateToText: 'O−, O+, A−, A+, B−, B+, AB−, AB+ (Everyone)',
    canReceiveFrom: ['O-'],
    canReceiveFromText: 'O− only',
    badge: 'Universal Donor',
    description: 'Universal red cell donor. Can save lives across any blood group in emergency transfusions.',
  },
  'O+': {
    bloodGroup: 'O+',
    canDonateTo: ['O+', 'A+', 'B+', 'AB+'],
    canDonateToText: 'O+, A+, B+, AB+',
    canReceiveFrom: ['O-', 'O+'],
    canReceiveFromText: 'O−, O+',
    description: 'Most common blood group. High emergency demand for Rh-positive patients.',
  },
  'A-': {
    bloodGroup: 'A-',
    canDonateTo: ['A-', 'A+', 'AB-', 'AB+'],
    canDonateToText: 'A−, A+, AB−, AB+',
    canReceiveFrom: ['O-', 'A-'],
    canReceiveFromText: 'O−, A−',
    description: 'Rare Rh-negative blood type. Essential for A-negative and AB-negative recipients.',
  },
  'A+': {
    bloodGroup: 'A+',
    canDonateTo: ['A+', 'AB+'],
    canDonateToText: 'A+, AB+',
    canReceiveFrom: ['O-', 'O+', 'A-', 'A+'],
    canReceiveFromText: 'O−, O+, A−, A+',
    description: 'Common blood type with wide donor availability from O and A blood groups.',
  },
  'B-': {
    bloodGroup: 'B-',
    canDonateTo: ['B-', 'B+', 'AB-', 'AB+'],
    canDonateToText: 'B−, B+, AB−, AB+',
    canReceiveFrom: ['O-', 'B-'],
    canReceiveFromText: 'O−, B−',
    description: 'Uncommon blood type. Highly sought after by blood banks and emergency ICUs.',
  },
  'B+': {
    bloodGroup: 'B+',
    canDonateTo: ['B+', 'AB+'],
    canDonateToText: 'B+, AB+',
    canReceiveFrom: ['O-', 'O+', 'B-', 'B+'],
    canReceiveFromText: 'O−, O+, B−, B+',
    description: 'Compatible with B+ and AB+ recipients, receiving from O and B donors.',
  },
  'AB-': {
    bloodGroup: 'AB-',
    canDonateTo: ['AB-', 'AB+'],
    canDonateToText: 'AB−, AB+',
    canReceiveFrom: ['O-', 'A-', 'B-', 'AB-'],
    canReceiveFromText: 'O−, A−, B−, AB−',
    badge: 'Universal Plasma',
    description: 'Rarest blood group in the general population (~1%). Universal plasma donor.',
  },
  'AB+': {
    bloodGroup: 'AB+',
    canDonateTo: ['AB+'],
    canDonateToText: 'AB+ only',
    canReceiveFrom: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    canReceiveFromText: 'All blood groups (Universal Recipient)',
    badge: 'Universal Recipient',
    description: 'Universal red cell recipient. Can safely receive red blood cells from any blood type!',
  },
};

const ALL_BLOOD_GROUPS = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

interface BloodCompatibilityWidgetProps {
  userBloodGroup?: string;
  onSelectGroup?: (group: string) => void;
}

export const BloodCompatibilityWidget: React.FC<BloodCompatibilityWidgetProps> = ({
  userBloodGroup = 'A+',
  onSelectGroup,
}) => {
  const normalizedUserGroup = ALL_BLOOD_GROUPS.includes(userBloodGroup) ? userBloodGroup : 'A+';
  const [selectedGroup, setSelectedGroup] = useState<string>(normalizedUserGroup);

  const activeInfo = BLOOD_COMPATIBILITY_MAP[selectedGroup] || BLOOD_COMPATIBILITY_MAP['A+'];

  const handleGroupClick = (group: string) => {
    setSelectedGroup(group);
    if (onSelectGroup) onSelectGroup(group);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider border border-red-200 dark:border-red-900/50">
              Clinical Transfusion Guidelines
            </span>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Standard Medical Matrix
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Droplet className="w-5 h-5 text-red-600 fill-red-600" />
            <span>Blood Group Compatibility Matrix</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click any blood group to inspect donor compatibility, recipient match rules, and universal status.
          </p>
        </div>

        {/* Quick User Badge */}
        {normalizedUserGroup && (
          <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 px-3.5 py-2 rounded-2xl flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
              {normalizedUserGroup}
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400">Your Blood Group</div>
              <div className="text-xs font-black text-slate-900 dark:text-white">
                Can receive from {BLOOD_COMPATIBILITY_MAP[normalizedUserGroup]?.canReceiveFrom.length} types
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Blood Selector Bar */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
          Select Blood Type to inspect:
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {ALL_BLOOD_GROUPS.map((group) => {
            const isSelected = selectedGroup === group;
            const isUserGroup = normalizedUserGroup === group;
            const info = BLOOD_COMPATIBILITY_MAP[group];

            return (
              <button
                key={group}
                onClick={() => handleGroupClick(group)}
                className={`relative py-3 px-2 rounded-2xl font-black text-sm transition-all flex flex-col items-center justify-center gap-1 border ${
                  isSelected
                    ? 'bg-red-600 text-white border-red-600 shadow-md scale-102 ring-2 ring-red-400/30 z-10'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800'
                }`}
              >
                {isUserGroup && (
                  <span className={`absolute -top-2 px-1.5 py-0.2 text-[9px] font-extrabold rounded-full ${
                    isSelected ? 'bg-amber-400 text-slate-950' : 'bg-red-600 text-white'
                  }`}>
                    YOU
                  </span>
                )}
                <span>{group}</span>
                {info?.badge && (
                  <span className={`text-[9px] font-bold leading-none truncate max-w-full px-1 ${
                    isSelected ? 'text-red-100' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {info.badge === 'Universal Donor' ? 'Donor' : info.badge === 'Universal Recipient' ? 'Recipient' : info.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Inspector Highlight Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white mb-6 shadow-md border border-slate-700 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-700/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-red-500/30">
              {activeInfo.bloodGroup}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-black text-white">Blood Group {activeInfo.bloodGroup}</h4>
                {activeInfo.badge && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                    ★ {activeInfo.badge}
                  </span>
                )}
                {selectedGroup === normalizedUserGroup && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/30 text-red-300 border border-red-400/40 text-[10px] font-bold">
                    Your Assigned Type
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{activeInfo.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Can Receive From */}
          <div className="p-3.5 rounded-xl bg-slate-800/90 border border-emerald-500/30">
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold uppercase tracking-wider text-emerald-400 text-[11px] flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                Can Receive From (Transfusion Source)
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {activeInfo.canReceiveFrom.length} Group(s)
              </span>
            </div>
            <p className="text-sm font-black text-white mt-1">
              {activeInfo.canReceiveFromText}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {activeInfo.canReceiveFrom.map((grp) => (
                <span
                  key={grp}
                  className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-black text-xs rounded-lg"
                >
                  ✓ {grp}
                </span>
              ))}
            </div>
          </div>

          {/* Can Donate To */}
          <div className="p-3.5 rounded-xl bg-slate-800/90 border border-blue-500/30">
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold uppercase tracking-wider text-blue-400 text-[11px] flex items-center gap-1.5">
                <ArrowRight className="w-4 h-4 text-blue-400" />
                Can Donate To (Recipient Groups)
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {activeInfo.canDonateTo.length} Group(s)
              </span>
            </div>
            <p className="text-sm font-black text-white mt-1">
              {activeInfo.canDonateToText}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {activeInfo.canDonateTo.map((grp) => (
                <span
                  key={grp}
                  className="px-2.5 py-1 bg-blue-950 text-blue-300 border border-blue-700/60 font-black text-xs rounded-lg"
                >
                  ➔ {grp}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Complete Blood Group Compatibility Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-red-500" />
            Complete Clinical Compatibility Chart
          </h4>
          <span className="text-[11px] font-medium text-slate-500">
            Official Red Cross &amp; WHO Transfusion Protocol
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-extrabold border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-4 w-28">Blood Group</th>
                <th className="py-3 px-4">Can Donate To</th>
                <th className="py-3 px-4">Can Receive From</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
              {ALL_BLOOD_GROUPS.map((grp) => {
                const row = BLOOD_COMPATIBILITY_MAP[grp];
                const isSelectedRow = selectedGroup === grp;
                const isUserRow = normalizedUserGroup === grp;

                return (
                  <tr
                    key={grp}
                    onClick={() => handleGroupClick(grp)}
                    className={`cursor-pointer transition-colors ${
                      isSelectedRow
                        ? 'bg-red-50/80 dark:bg-red-950/40 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="py-3 px-4 font-black">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center border ${
                          isSelectedRow
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700'
                        }`}>
                          {grp}
                        </span>
                        {isUserRow && (
                          <span className="px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-extrabold">
                            YOU
                          </span>
                        )}
                        {row.badge && !isUserRow && (
                          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[9px] font-extrabold">
                            {row.badge}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">
                      {grp === 'O-' ? (
                        <span className="font-bold text-red-600 dark:text-red-400">
                          {row.canDonateToText}
                        </span>
                      ) : grp === 'AB+' ? (
                        <span className="font-bold text-slate-600 dark:text-slate-400">
                          {row.canDonateToText}
                        </span>
                      ) : (
                        row.canDonateToText
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">
                      {grp === 'AB+' ? (
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          {row.canReceiveFromText}
                        </span>
                      ) : grp === 'O-' ? (
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {row.canReceiveFromText}
                        </span>
                      ) : (
                        row.canReceiveFromText
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
