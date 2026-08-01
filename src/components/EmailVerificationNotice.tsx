import React, { useState } from 'react';
import { MailCheck, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { resendVerificationEmail } from '../utils/auth';

interface EmailVerificationNoticeProps {
  email: string;
  onDismiss?: () => void;
}

export const EmailVerificationNotice: React.FC<EmailVerificationNoticeProps> = ({
  email,
  onDismiss,
}) => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    const result = await resendVerificationEmail(email);
    if (result.success) {
      setSent(true);
    } else {
      setError(result.error?.message || 'Failed to resend email');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 my-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
          <MailCheck className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
            Email Verification Sent
          </h4>
          <p className="text-[11px] text-amber-700 dark:text-amber-300">
            Please check your inbox at <span className="font-semibold">{email}</span> and confirm your email.
          </p>
          {error && <p className="text-[11px] font-semibold text-red-600 mt-1">{error}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        {sent ? (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200">
            <Check className="w-3.5 h-3.5" />
            <span>Link Resent!</span>
          </span>
        ) : (
          <button
            onClick={handleResend}
            disabled={loading}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Resend Link</span>
          </button>
        )}
      </div>
    </div>
  );
};
