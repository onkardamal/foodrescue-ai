import { FoodSafetyReport, ReportReason, TrustTier, UserTrustProfile } from '../types';

const STORAGE_KEY = 'savebite_reports';

const STRIKE_THRESHOLDS: Record<TrustTier, number> = {
  trusted: 0,
  warning: 1,
  suspended: 3,
  blacklisted: 5,
};

const SUSPENSION_DAYS = 7;

function tierFromStrikes(strikes: number): TrustTier {
  if (strikes >= STRIKE_THRESHOLDS.blacklisted) return 'blacklisted';
  if (strikes >= STRIKE_THRESHOLDS.suspended) return 'suspended';
  if (strikes >= STRIKE_THRESHOLDS.warning) return 'warning';
  return 'trusted';
}

function loadAllReports(): FoodSafetyReport[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAllReports(reports: FoodSafetyReport[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function getReportsForUser(userId: string): FoodSafetyReport[] {
  return loadAllReports().filter(r => r.reportedUserId === userId);
}

export function getReportsByReporter(reporterUserId: string): FoodSafetyReport[] {
  return loadAllReports().filter(r => r.reporterUserId === reporterUserId);
}

export function buildTrustProfile(userId: string): UserTrustProfile {
  const reports = getReportsForUser(userId);
  const strikes = reports.length;
  const tier = tierFromStrikes(strikes);

  let suspendedAt: string | undefined;
  let suspensionExpiresAt: string | undefined;

  if (tier === 'suspended') {
    const latestReport = reports[reports.length - 1];
    suspendedAt = latestReport?.date;
    if (suspendedAt) {
      const expires = new Date(suspendedAt);
      expires.setDate(expires.getDate() + SUSPENSION_DAYS);
      suspensionExpiresAt = expires.toISOString();
    }
  }

  return { strikes, tier, reports, suspendedAt, suspensionExpiresAt };
}

export function submitReport(
  reporterUserId: string,
  reporterName: string,
  reportedUserId: string,
  reason: ReportReason,
  details: string,
  donationId?: string
): { report: FoodSafetyReport; updatedTrust: UserTrustProfile } {
  const report: FoodSafetyReport = {
    id: `rpt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    reporterUserId,
    reporterName,
    reportedUserId,
    reason,
    details,
    donationId,
    date: new Date().toISOString(),
  };

  const all = loadAllReports();
  all.push(report);
  saveAllReports(all);

  return { report, updatedTrust: buildTrustProfile(reportedUserId) };
}

export function canUserDonate(trust?: UserTrustProfile): { allowed: boolean; reason?: string } {
  if (!trust) return { allowed: true };

  if (trust.tier === 'blacklisted') {
    return {
      allowed: false,
      reason: `Your account has been blacklisted due to ${trust.strikes} food safety violations. You can no longer make donations.`,
    };
  }

  if (trust.tier === 'suspended' && trust.suspensionExpiresAt) {
    const now = new Date();
    const expires = new Date(trust.suspensionExpiresAt);
    if (now < expires) {
      const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        allowed: false,
        reason: `Your account is suspended for ${daysLeft} day${daysLeft !== 1 ? 's' : ''} due to food safety reports. You cannot donate until the suspension is lifted.`,
      };
    }
  }

  return { allowed: true };
}

export function getTrustColor(tier: TrustTier): string {
  switch (tier) {
    case 'trusted': return '#16a34a';
    case 'warning': return '#f59e0b';
    case 'suspended': return '#f97316';
    case 'blacklisted': return '#dc2626';
  }
}

export function getTrustLabel(tier: TrustTier): string {
  switch (tier) {
    case 'trusted': return 'Trusted';
    case 'warning': return 'Under Review';
    case 'suspended': return 'Suspended';
    case 'blacklisted': return 'Blacklisted';
  }
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  expired_food: 'Donated expired food',
  spoiled_food: 'Food was spoiled / rotten',
  contaminated: 'Food was contaminated',
  misleading_description: 'Misleading item description',
  unsafe_packaging: 'Unsafe or damaged packaging',
  other: 'Other safety concern',
};
