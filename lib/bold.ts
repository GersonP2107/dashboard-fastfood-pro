import crypto from 'crypto';

/**
 * Generates the integrity signature required by Bold.
 * Formula: SHA256(orderId + amount + currency + secret)
 */
export function generateBoldSignature(
    orderId: string,
    amount: string,
    currency: string,
    secretKey: string
): string {
    const content = `${orderId}${amount}${currency}${secretKey}`;
    return crypto.createHash('sha256').update(content).digest('hex');
}
