import React, { useEffect, useState } from 'react';
import { User, BloodType } from '../types';
import { calculateAge } from '../utils/age';
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Heart,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Ban,
} from 'lucide-react';

interface UserProfileSectionProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
    { headers: { Accept: 'application/json' } },
  );
  if (!response.ok) throw new Error('Reverse geocoding failed');

  const data = await response.json();
  const address = data.address ?? {};
  const place = [
    address.suburb || address.neighbourhood || address.village,
    address.city || address.town || address.county,
    address.state,
    address.country,
  ].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index);

  return place.join(', ') || data.display_name || '';
};

export const UserProfileSection: React.FC<UserProfileSectionProps> = ({
  user,
  onUpdateUser,
}) => {
  const [formData, setFormData] = useState<User>({ ...user });
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    setFormData({ ...user });
  }, [user]);

  const bloodGroups: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];

  const currentAge = calculateAge(formData.dob);
  const hasDateOfBirth = Boolean(formData.dob);
  const isUnder18 = hasDateOfBirth && currentAge < 18;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      onUpdateUser(formData);
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3500);
    }, 400);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Location services are not supported by this browser. Please enter your location manually.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Requesting your permission to access the current location…');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          setLocationStatus('Finding the place name from your current coordinates…');
          const placeName = await reverseGeocode(coords.latitude, coords.longitude);
          if (!placeName) throw new Error('No place name returned');
          setFormData((current) => ({ ...current, location: placeName }));
          setLocationStatus('Current place name added. You can refine it before saving.');
        } catch {
          setLocationStatus('We could not resolve a place name. Please enter your location manually.');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. You can enter your location manually.'
          : 'Could not determine your location. Please try again or enter it manually.';
        setLocationStatus(message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg">
              {formData.bloodGroup || 'O+'}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="capitalize">{formData.role} Profile</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {formData.fullName || formData.name || 'User Profile'}
              </h2>
              <p className="text-xs sm:text-sm text-red-100 mt-1">
                Manage your official details, medical parameters, and contact info.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="px-4 py-2 bg-black/20 backdrop-blur-md rounded-2xl border border-white/20 text-xs font-medium text-red-100">
              Age: <span className="font-bold text-white">{hasDateOfBirth ? `${currentAge} years old` : 'not set'}</span>
            </div>

            {/* Donation Status Badge */}
            {formData.role === 'donor' && (
              isUnder18 ? (
                <div className="px-3 py-1 bg-red-900/80 border border-red-300 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm">
                  <Ban className="w-3.5 h-3.5" />
                  <span>cant donate (under 18)</span>
                </div>
              ) : (
                <div className="px-3 py-1 bg-emerald-500/30 border border-emerald-300 text-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Eligible to Donate</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Prominent Under-18 Warning Banner */}
      {isUnder18 && (
        <div className="p-4 sm:p-5 bg-red-50 dark:bg-red-950/80 border-2 border-red-500/50 rounded-2xl text-red-900 dark:text-red-100 flex items-start gap-3.5 shadow-md">
          <div className="p-2 bg-red-600 text-white rounded-xl flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base font-black flex items-center gap-2 text-red-700 dark:text-red-400">
              <span>cant donate</span>
              <span className="px-2 py-0.5 bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-100 text-xs font-bold rounded-md">
                Age: {currentAge} years
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold mt-1 leading-relaxed">
              Medical safety guidelines state that blood donors must be at least 18 years old. Since your registered date of birth calculates to <span className="font-bold underline">{currentAge} years old</span>, your status is set to <span className="font-extrabold uppercase text-red-600 dark:text-red-300">cant donate</span>. You can still maintain your profile for future eligibility or emergency patient assistance.
            </p>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {isSaved && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 flex items-center gap-3 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <p className="text-xs sm:text-sm font-semibold">
            Profile details updated successfully! Your AI donor/patient matching record has been refreshed with valid data.
          </p>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        
        {/* Personal Details */}
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            Personal Details
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your personal identity information and contact details.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.fullName || formData.name || ''}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value, name: e.target.value })}
              placeholder="Enter full name"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Phone Number
            </label>
            <input
              type="text"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91-9876543210"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Emergency Contact Phone
            </label>
            <input
              type="text"
              value={formData.emergencyContact || ''}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              placeholder="+91-9123456789 (Kin / Guardian)"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

        </div>

        {/* Medical & Additional Details Section */}
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 pt-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
            Medical &amp; Additional Information
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Health metrics used by hospitals and matching algorithms for compatibility checks.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Blood Group */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Blood Group *
            </label>
            <select
              value={formData.bloodGroup || 'O+'}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as BloodType })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {bloodGroups.map((bg) => (
                <option key={bg} value={bg}>
                  {bg} Blood Type
                </option>
              ))}
            </select>
          </div>

          {/* Date of Birth (dob) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Date of Birth (DOB) *</span>
              <span className="text-[11px] text-slate-500">Age: {hasDateOfBirth ? `${currentAge} yrs` : 'required'}</span>
            </label>
            <input
              type="date"
              required
              value={formData.dob || ''}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Gender
            </label>
            <select
              value={formData.gender || 'Prefer not to say'}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {genders.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Location / Address */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Location / City / Area Address
            </label>
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 disabled:opacity-60"
            >
              <MapPin className="w-3.5 h-3.5" />
              {isLocating ? 'Locating…' : 'Use current location'}
            </button>
          </div>
          <input
            type="text"
            value={formData.location || ''}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g. Central District, Sector 4, Metro Hospital Road"
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            {locationStatus || 'Choosing current location will ask for browser permission and send coordinates to OpenStreetMap to find a place name. Nothing is saved until you save this profile.'}
          </p>
        </div>

        {/* Medical Notes / Allergies */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Medical Notes &amp; Health Comments
          </label>
          <textarea
            rows={3}
            value={formData.medicalNotes || ''}
            onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
            placeholder="Mention any allergies, recent blood pressure levels, or availability preferences..."
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Action Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-md shadow-red-500/20 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Profile...' : 'Save Profile Details'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
