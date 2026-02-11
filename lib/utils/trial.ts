// Trial period configuration and helpers

export const TRIAL_DURATION_DAYS = 7;

/**
 * Calculate the trial end date from now
 */
export function getTrialEndDate(): string {
    const now = new Date();
    now.setDate(now.getDate() + TRIAL_DURATION_DAYS);
    return now.toISOString();
}

/**
 * Check if a trial is currently active
 */
export function isTrialActive(trialEndsAt: string | null | undefined): boolean {
    if (!trialEndsAt) return false;
    return new Date(trialEndsAt) > new Date();
}

/**
 * Get remaining trial days (0 if expired)
 */
export function getTrialDaysRemaining(trialEndsAt: string | null | undefined): number {
    if (!trialEndsAt) return 0;
    const end = new Date(trialEndsAt);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if a business has an active subscription (paid or trial)
 */
export function hasActiveAccess(business: {
    subscription_status: string;
    trial_ends_at?: string | null;
    subscription_end?: string | null;
}): boolean {
    // Active paid subscription
    if (business.subscription_status === 'active') return true;

    // Active trial
    if (isTrialActive(business.trial_ends_at)) return true;

    return false;
}
