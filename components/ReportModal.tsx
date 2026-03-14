import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, Send } from 'lucide-react';
import { ReportReason } from '../types';
import { submitReport, REPORT_REASON_LABELS, buildTrustProfile } from '../utils/blacklist';

interface ReportModalProps {
  reporterUserId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  donationId?: string;
  onClose: () => void;
  onReported?: () => void;
}

const REASONS: ReportReason[] = [
  'expired_food',
  'spoiled_food',
  'contaminated',
  'misleading_description',
  'unsafe_packaging',
  'other',
];

const ReportModal: React.FC<ReportModalProps> = ({
  reporterUserId,
  reporterName,
  reportedUserId,
  reportedUserName,
  donationId,
  onClose,
  onReported,
}) => {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resultTier, setResultTier] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    const { updatedTrust } = submitReport(
      reporterUserId,
      reporterName,
      reportedUserId,
      reason,
      details,
      donationId
    );

    setResultTier(updatedTrust.tier);
    setSubmitted(true);
    onReported?.();
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true">
        <div className="glass-panel-strong w-full max-w-md rounded-3xl overflow-hidden border border-white/40 dark:border-white/10 animate-scale-in">
          <div className="bg-red-600 px-6 py-4 flex justify-between items-center">
            <h2 className="text-white text-lg font-bold flex items-center gap-2">
              <ShieldAlert size={20} /> Report Submitted
            </h2>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors" aria-label="Close">
              <X size={24} />
            </button>
          </div>
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={32} className="text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-[#212121] dark:text-white mb-2">Thank you for reporting</h3>
            <p className="text-sm text-[#757575] dark:text-slate-400 mb-4">
              Your report against <strong>{reportedUserName}</strong> has been recorded. We take food safety very seriously.
            </p>
            {resultTier && resultTier !== 'trusted' && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 mb-4">
                <p className="text-xs text-red-700 dark:text-red-300">
                  {resultTier === 'warning' && 'This user has been flagged and is now under review.'}
                  {resultTier === 'suspended' && 'This user has been temporarily suspended from making donations.'}
                  {resultTier === 'blacklisted' && 'This user has been blacklisted and can no longer donate.'}
                </p>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full h-12 bg-[#212121] dark:bg-white text-white dark:text-[#212121] rounded-xl font-bold shadow-lg hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true">
      <div className="glass-panel-strong w-full max-w-md rounded-3xl overflow-hidden border border-white/40 dark:border-white/10 animate-scale-in max-h-[90vh] flex flex-col">
        <div className="bg-red-600 px-6 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-white text-lg font-bold flex items-center gap-2">
            <AlertTriangle size={20} /> Report Unsafe Donation
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors" aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
            <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
              Reporting <strong>{reportedUserName}</strong> for sharing unsafe food. False reports may affect your own trust score.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#212121] dark:text-white mb-2">What happened?</label>
            <div className="space-y-2">
              {REASONS.map(r => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    reason === r
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 ring-2 ring-red-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-[#212121] dark:text-white">{REPORT_REASON_LABELS[r]}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#212121] dark:text-white mb-2">
              Additional details <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Describe what you received and why it was unsafe..."
              className="w-full h-24 p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all text-sm resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!reason}
              className="w-full py-3.5 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
